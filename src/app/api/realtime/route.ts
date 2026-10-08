import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { getAuth } from "@/server/auth";
import { loadActor } from "@/server/permissions";
import { channelsFor } from "@/server/realtime/channels";
// worker.ts calls this before upgrading /api/realtime to a WebSocket: the session decides
// the channels, the browser never chooses them.
export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  const actor = session && (await loadActor(getDb(), session.user.id));
  if (!actor) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  return NextResponse.json({ channels: channelsFor(actor) });
}
