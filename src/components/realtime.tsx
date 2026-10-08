"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Temporário até a etapa do Durable Object: sem canal ao vivo, só o refresh de segurança.
export function Realtime() {
  const router = useRouter();
  const [connected] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };
    // Reconnect/focus recovery and fallback if a project has realtime disabled.
    const poll = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [router]);
  return (
    <span className="connection">
      <i className={connected ? "online" : ""} />
      {connected ? "Atualizações ao vivo" : "Sincronizando"}
    </span>
  );
}
