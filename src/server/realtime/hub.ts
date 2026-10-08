import { DurableObject } from "cloudflare:workers";

type Attachment = { channels: string[] };

// One hub for the app. Sockets are tagged with their channels (fixed by the server at
// upgrade time) and hibernate between messages, so idle connections cost nothing.
export class RealtimeHub extends DurableObject<CloudflareEnv> {
  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env);
    // Answered by the runtime without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const channels = JSON.parse(request.headers.get("X-Realtime-Channels") || "[]") as string[];
      if (!channels.length) return new Response("Sem canais", { status: 403 });
      const { 0: client, 1: server } = new WebSocketPair();
      this.ctx.acceptWebSocket(server, channels.slice(0, 10));
      server.serializeAttachment({ channels } satisfies Attachment);
      return new Response(null, { status: 101, webSocket: client });
    }
    if (request.method === "POST") {
      const { channels } = (await request.json()) as { channels: string[] };
      return Response.json({ delivered: this.broadcast(channels) });
    }
    return new Response("Not found", { status: 404 });
  }

  broadcast(channels: string[]) {
    const sockets = new Set<WebSocket>();
    if (channels.includes("*")) this.ctx.getWebSockets().forEach((ws) => sockets.add(ws));
    else
      for (const channel of channels)
        this.ctx.getWebSockets(channel).forEach((ws) => sockets.add(ws));
    for (const ws of sockets) {
      const { channels: own } = (ws.deserializeAttachment() as Attachment | null) ?? {
        channels: [],
      };
      const scope = channels.find((c) => own.includes(c)) ?? "*";
      try {
        ws.send(JSON.stringify({ type: "changed", scope }));
      } catch {
        /* Socket closing; the client reconnects and the 15 s refresh covers the gap. */
      }
    }
    return sockets.size;
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (message === "ping") ws.send("pong");
  }

  async webSocketClose(ws: WebSocket, code: number) {
    try {
      ws.close(code === 1005 ? 1000 : code, "closed");
    } catch {
      /* Already closed. */
    }
  }
}
