"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Save } from "lucide-react";
import { browserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import styles from "./contracts.module.css";

export function ContractActions({ contractId, status }: { contractId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function activate() {
    setBusy(true);
    setError("");
    const { error: updateError } = await browserClient()
      .from("supermarket_contracts")
      .update({ status: "ACTIVE", started_on: new Date().toISOString().slice(0, 10) })
      .eq("id", contractId);
    setBusy(false);
    if (updateError) return setError("Não foi possível ativar este contrato.");
    router.refresh();
  }

  async function addInstallment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setSaved(false);
    const form = new FormData(formElement);
    const period = String(form.get("period"));
    const amount = Number(form.get("amount"));
    const dueOn = String(form.get("dueOn"));
    const paid = String(form.get("status")) === "PAID";
    const { error: insertError } = await browserClient()
      .from("supermarket_contract_installments")
      .insert({
        contract_id: contractId,
        period: `${period}-01`,
        amount,
        due_on: dueOn,
        status: paid ? "PAID" : String(form.get("status")),
        paid_at: paid ? new Date().toISOString() : null,
      });
    setBusy(false);
    if (insertError) {
      setError(insertError.code === "23505" ? "Já existe um lançamento para este mês." : "Não foi possível registrar a mensalidade.");
      return;
    }
    setSaved(true);
    formElement.reset();
    router.refresh();
  }

  return (
    <div className={styles.actions}>
      {status === "PROPOSED" ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={activate}>
          <Check size={14} /> Ativar contrato
        </Button>
      ) : status === "ACTIVE" ? (
        <details className={styles.addPayment}>
          <summary><Plus size={14} /> Lançar mensalidade</summary>
          <form onSubmit={addInstallment}>
            <label>Mês <Input required type="month" name="period" defaultValue={new Date().toISOString().slice(0, 7)} /></label>
            <label>Valor <Input required type="number" name="amount" min="0.01" step="0.01" defaultValue="499.00" /></label>
            <label>Vencimento <Input required type="date" name="dueOn" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
            <label>Status <select name="status" defaultValue="PAID"><option value="PAID">Pago</option><option value="PENDING">Aguardando</option><option value="OVERDUE">Vencido</option></select></label>
            <Button size="sm" type="submit" disabled={busy}><Save size={14} /> Registrar</Button>
            {error && <small role="alert">{error}</small>}
            {saved && <small role="status">Mensalidade registrada.</small>}
          </form>
        </details>
      ) : (
        <span className={styles.noAction}>—</span>
      )}
      {error && status !== "ACTIVE" && <small role="alert">{error}</small>}
    </div>
  );
}
