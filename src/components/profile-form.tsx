"use client";
import { FormSections } from "./screen-sections";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save } from "lucide-react";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { browserClient } from "@/lib/supabase/client";
import { categories, categoryLabels, type Preferences, type Profile } from "@/lib/domain";
export function ProfileForm({
  profile,
  prefs,
  driver,
}: {
  profile: Profile;
  prefs?: Preferences | null;
  driver?: {
    id: string;
    availability: boolean;
    vehicle_label: string;
    vehicle_capacity_kg: number;
  } | null;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  return (
    <div className="stack">
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          setFailed(false);
          try {
            const form = new FormData(e.currentTarget);
            const basic = z
              .object({ name: z.string().min(2).max(100), phone: z.string().max(25) })
              .parse({ name: form.get("name"), phone: form.get("phone") });
            const client = browserClient();
            const { error } = await client.from("profiles").update(basic).eq("id", profile.id);
            if (error) throw error;
            if (prefs) {
              const update = {
                daily_capacity_kg: Number(form.get("capacity")),
                receiving_enabled: form.get("receiving") === "on",
                receiving_start: String(form.get("start")),
                receiving_end: String(form.get("end")),
                accepted_categories: form.getAll("category").map(String),
                has_fridge: form.get("fridge") === "on",
                has_freezer: form.get("freezer") === "on",
              };
              if (update.receiving_start >= update.receiving_end)
                throw new Error("O horário de término precisa ser posterior ao início.");
              const { error } = await client
                .from("ngo_preferences")
                .update(update)
                .eq("organization_id", prefs.organization_id);
              if (error) throw error;
            }
            if (driver) {
              const { error } = await client
                .from("drivers")
                .update({ availability: form.get("availability") === "on" })
                .eq("id", driver.id);
              if (error) throw error;
            }
            setMessage("Preferências atualizadas.");
            router.refresh();
          } catch (e) {
            setFailed(true);
            setMessage(e instanceof Error ? e.message : "Não foi possível salvar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <FormSections
          labels={
            prefs
              ? ["Seus dados", "Disponibilidade", "Alimentos", "Conta"]
              : driver
                ? ["Seus dados", "Veículo", "Conta"]
                : ["Seus dados", "Conta"]
          }
        >
          <fieldset className="form-section">
            <legend>Seus dados</legend>
            <div className="form-columns">
              <label className="field">
                Nome
                <Input
                  name="name"
                  defaultValue={profile.name}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
              <label className="field">
                Telefone
                <Input name="phone" type="tel" defaultValue={profile.phone || ""} maxLength={25} />
              </label>
            </div>
            <label className="field">
              E-mail
              <Input value={profile.email} readOnly />
            </label>
          </fieldset>
          {prefs && (
            <>
              <fieldset className="form-section">
                <legend>Disponibilidade para receber</legend>
                <p>Informe o horário e o volume que sua instituição consegue receber.</p>
                <label className="check-label">
                  <input
                    name="receiving"
                    type="checkbox"
                    defaultChecked={prefs.receiving_enabled}
                  />
                  Recebimento ativo
                </label>
                <label className="field">
                  Capacidade diária (kg)
                  <Input
                    name="capacity"
                    type="number"
                    min={1}
                    max={5000}
                    required
                    defaultValue={prefs.daily_capacity_kg}
                  />
                </label>
                <div className="form-columns">
                  <label className="field">
                    A partir de
                    <Input
                      type="time"
                      name="start"
                      required
                      defaultValue={prefs.receiving_start.slice(0, 5)}
                    />
                  </label>
                  <label className="field">
                    Até
                    <Input
                      type="time"
                      name="end"
                      required
                      defaultValue={prefs.receiving_end.slice(0, 5)}
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset className="form-section">
                <legend>Alimentos e armazenamento</legend>
                <p>Selecione as categorias aceitas e os recursos disponíveis.</p>
                <div className="choice-grid">
                  {categories.map((c) => (
                    <label className="check-label" key={c}>
                      <input
                        name="category"
                        value={c}
                        type="checkbox"
                        defaultChecked={prefs.accepted_categories.includes(c)}
                      />
                      {categoryLabels[c]}
                    </label>
                  ))}
                </div>
                <div className="choice-grid">
                  <label className="check-label">
                    <input name="fridge" type="checkbox" defaultChecked={prefs.has_fridge} />
                    Possui geladeira
                  </label>
                  <label className="check-label">
                    <input name="freezer" type="checkbox" defaultChecked={prefs.has_freezer} />
                    Possui freezer
                  </label>
                </div>
              </fieldset>
            </>
          )}
          {driver && (
            <>
              <fieldset className="form-section">
                <legend>Seu veículo e suas missões</legend>
                <p className="small muted">
                  {driver.vehicle_label} · Capacidade de {driver.vehicle_capacity_kg} kg
                </p>
                <label className="check-label">
                  <input type="checkbox" name="availability" defaultChecked={driver.availability} />
                  Disponível para novas missões
                </label>
              </fieldset>
            </>
          )}
          <section className="panel stack">
            <h2>Sua conta</h2>
            <p className="small muted">
              Para alterar o e-mail, fale com a equipe responsável pelo cadastro.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await browserClient().auth.signOut();
                router.replace("/login");
                router.refresh();
              }}
            >
              <LogOut size={17} />
              Sair da conta
            </Button>
            <p className="small muted">
              Para instalar o app, use “Adicionar à tela inicial” no navegador do celular. O
              primeiro acesso precisa de conexão.
            </p>
          </section>
        </FormSections>
        {message && (
          <p className={failed ? "error" : "notice"} role={failed ? "alert" : "status"}>
            {message}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          <Save size={17} />
          {busy ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>
    </div>
  );
}
