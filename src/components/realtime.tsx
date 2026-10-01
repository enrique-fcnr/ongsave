"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
export function Realtime() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const client = browserClient();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };
    let channel = client.channel("ongsave-feed", {
      config: { postgres_changes_options: { wait: true } },
    });
    for (const table of [
      "surplus_batches",
      "donation_reservations",
      "rescues",
      "rescue_events",
      "impact_metrics",
      "notifications",
    ])
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    let disposed = false;
    // Finish cookie-session initialization before joining a channel. Otherwise
    // a fresh page can join as anon while the authenticated session is loading.
    void (async () => {
      const {
        data: { session },
      } = await client.auth.getSession();
      if (disposed || !session) return;
      await client.realtime.setAuth(session.access_token);
      if (!disposed) channel.subscribe((status) => setConnected(status === "SUBSCRIBED"));
    })().catch(() => {
      if (!disposed) setConnected(false);
    });
    // Reconnect/focus recovery and fallback if a project has realtime disabled.
    const poll = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearInterval(poll);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      void client.removeChannel(channel);
    };
  }, [router]);
  return (
    <span className="connection">
      <i className={connected ? "online" : ""} />
      {connected ? "Atualizações ao vivo" : "Sincronizando"}
    </span>
  );
}
