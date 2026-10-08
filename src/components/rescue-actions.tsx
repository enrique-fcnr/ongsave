"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { callApi } from "@/lib/api-client";
import { driverActions, tokenSchema, type RescueStatus } from "@/lib/domain";
export function ReserveButton({
  batchId,
  weight,
  deadline,
}: {
  batchId: string;
  weight: number;
  deadline: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <div className="stack" style={{ gap: 14 }}>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <Button
        disabled={busy}
        onClick={async () => {
          if (
            !window.confirm(
              `Sua instituição consegue receber aproximadamente ${weight} kg até ${deadline}?`,
            )
          )
            return;
          setBusy(true);
          setError("");
          try {
            const { id } = await callApi<{ id: string }>(`/api/batches/${batchId}/reserve`);
            router.push(`/rescue/${id}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "A doação não está mais disponível.");
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <LoaderCircle className="spin" size={18} /> : "Aceitar doação"}
      </Button>
    </div>
  );
}
export function RescueActions({
  id,
  status,
  role,
}: {
  id: string;
  status: RescueStatus;
  role: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();
  async function act() {
    setBusy(true);
    setError("");
    try {
      if (status === "WAITING_DRIVER") {
        await callApi(`/api/rescues/${id}/accept`);
      } else {
        const next = status === "AT_DESTINATION" ? "DELIVERED" : driverActions[status]?.next;
        if (!next) return;
        if (next === "DELIVERED") tokenSchema.parse(token);
        const { ok } = await callApi<{ ok: boolean }>(`/api/rescues/${id}/advance`, {
          status: next,
          token: next === "DELIVERED" ? token : null,
        });
        if (ok !== true)
          throw new Error("Código incorreto. Confira os quatro dígitos com a instituição.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack" style={{ gap: 15 }}>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {role === "DRIVER" && status !== "DELIVERED" && status !== "CANCELLED" && (
        <>
          {status === "AT_DESTINATION" && (
            <label className="field">
              Digite o código da instituição
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                autoComplete="off"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="0000"
                style={{ fontSize: 24, letterSpacing: 10, textAlign: "center" }}
              />
            </label>
          )}
          <Button
            disabled={busy || (status === "AT_DESTINATION" && token.length !== 4)}
            onClick={() => void act()}
          >
            {busy ? (
              <LoaderCircle size={18} className="spin" />
            ) : status === "WAITING_DRIVER" ? (
              "Aceitar missão"
            ) : status === "AT_DESTINATION" ? (
              "Confirmar entrega"
            ) : (
              driverActions[status]?.label || "Aguardar atualização"
            )}
          </Button>
        </>
      )}
      {role === "NGO" && status === "AT_DESTINATION" && (
        <>
          {code ? (
            <div className="notice">
              <p className="small">Compartilhe este código com o motorista</p>
              <div className="token">{code}</div>
            </div>
          ) : (
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const { token } = await callApi<{ token: string }>(`/api/rescues/${id}/token`);
                  setCode(token);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Não foi possível consultar o código.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Mostrar código de recebimento
            </Button>
          )}
          <p className="small muted">Confira os alimentos recebidos antes de informar o código.</p>
        </>
      )}
    </div>
  );
}
