"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, RotateCcw, Store, Truck } from "lucide-react";
import { Button } from "./ui/button";
import { browserClient } from "@/lib/supabase/client";
const accounts = [
  { name: "Mercado Paulista", role: "supermercado", email: "mercado@ongsave.demo", Icon: Store },
  { name: "Instituto Esperança", role: "ONG", email: "ong@ongsave.demo", Icon: HeartHandshake },
  { name: "Lucas Almeida", role: "motorista", email: "motorista@ongsave.demo", Icon: Truck },
];
export function DemoControls({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <div className="stack">
      {accounts.map((a) => (
        <div key={a.email} className="panel stack" style={{ gap: 18 }}>
          <div className="row">
            <span className="avatar">
              <a.Icon size={19} />
            </span>
            <div>
              <h3>{a.name}</h3>
              <p className="small muted">{a.email}</p>
            </div>
          </div>
          <Button
            disabled={!configured || !!busy}
            onClick={async () => {
              setBusy(a.email);
              setMessage("");
              try {
                const { error } = await browserClient().auth.signInWithPassword({
                  email: a.email,
                  password: "demo123",
                });
                if (error) throw error;
                router.push("/home");
                router.refresh();
              } catch {
                setMessage(
                  "Não foi possível entrar. Configure o Supabase e execute npm run demo:users.",
                );
              } finally {
                setBusy("");
              }
            }}
          >
            Entrar como {a.role}
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        disabled={!configured || !!busy}
        onClick={async () => {
          if (
            !window.confirm(
              "Resetar os lotes da demonstração? O histórico inicial será preservado.",
            )
          )
            return;
          setBusy("reset");
          setMessage("");
          try {
            const response = await fetch("/api/demo/reset", { method: "POST" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setMessage(data.warning || "Demonstração resetada. Tudo pronto para um novo resgate.");
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Falha ao resetar.");
          } finally {
            setBusy("");
          }
        }}
      >
        <RotateCcw size={16} />
        Resetar demonstração
      </Button>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <p className="small muted">
        Para resetar, entre antes com a conta oficial Mercado Paulista. Senha de todas as contas:
        demo123.
      </p>
    </div>
  );
}
