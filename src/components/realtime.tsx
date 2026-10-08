"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function Realtime() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };
    // The hub only says "something changed"; the refresh re-reads through the server,
    // which applies the permissions. Channels are chosen by the server from the session.
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let attempts = 0;
    let disposed = false;
    const connect = () => {
      if (disposed) return;
      const url = new URL("/api/realtime", window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      socket.onopen = () => {
        attempts = 0;
        setConnected(true);
        // Catch up on anything missed while disconnected.
        refresh();
        heartbeat = setInterval(() => socket?.readyState === 1 && socket.send("ping"), 25000);
      };
      socket.onmessage = (message) => {
        if (message.data !== "pong") refresh();
      };
      socket.onclose = () => {
        clearInterval(heartbeat);
        setConnected(false);
        if (disposed) return;
        // Exponential backoff with jitter: 1 s, 2 s, 4 s... up to 30 s.
        const delay = Math.min(30000, 1000 * 2 ** attempts++) * (0.75 + Math.random() / 2);
        retry = setTimeout(connect, delay);
      };
      socket.onerror = () => socket?.close();
    };
    connect();
    // Reconnect/focus recovery and fallback if the realtime hub is unreachable.
    const poll = setInterval(refresh, 15000);
    const online = () => {
      refresh();
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        clearTimeout(retry);
        attempts = 0;
        connect();
      }
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", online);
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(retry);
      clearInterval(poll);
      clearInterval(heartbeat);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", online);
      socket?.close();
    };
  }, [router]);
  return (
    <span className="connection">
      <i className={connected ? "online" : ""} />
      {connected ? "Atualizações ao vivo" : "Sincronizando"}
    </span>
  );
}
