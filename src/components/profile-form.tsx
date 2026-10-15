"use client";
import { FormSections } from "./screen-sections";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save } from "lucide-react";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ProfileAvatar } from "./profile-avatar";
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const photoInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className="stack profile-form">
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
            const vehicle = driver
              ? z
                  .object({
                    vehicle_label: z.string().trim().min(2, "Informe o modelo do veículo.").max(100),
                    vehicle_capacity_kg: z.coerce.number().int().min(1).max(5000),
                  })
                  .parse({
                    vehicle_label: form.get("vehicle_label"),
                    vehicle_capacity_kg: form.get("vehicle_capacity_kg"),
                  })
              : null;
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
                .update({
                  ...(vehicle || {}),
                  availability: form.get("availability") === "on",
                })
                .eq("id", driver.id);
              if (error) throw error;
            }
            if (photo) {
              const photoForm = new FormData();
              photoForm.set("file", photo);
              const response = await fetch("/api/profile/photo", {
                method: "POST",
                body: photoForm,
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || "Não foi possível salvar a foto.");
              setAvatarUrl(result.avatarUrl);
              setPhoto(null);
              setPreview("");
              if (photoInput.current) photoInput.current.value = "";
            }
            setMessage("Perfil atualizado.");
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
              ? ["Seus dados", "Disponibilidade", "Alimentos"]
              : driver
                ? ["Seus dados", "Veículo"]
                : ["Seus dados"]
          }
        >
          <fieldset className="form-section">
            <legend>Seus dados</legend>
            <div className="profile-photo-field">
              <ProfileAvatar
                name={profile.name}
                url={preview || avatarUrl}
                className="profile-photo-preview"
              />
              <div className="profile-photo-controls">
                <strong>Foto de perfil</strong>
                <div className="row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => photoInput.current?.click()}
                  >
                    <Camera size={16} />
                    {preview || avatarUrl ? "Trocar foto" : "Adicionar foto"}
                  </Button>
                  {photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        setPhoto(null);
                        setPreview("");
                        if (photoInput.current) photoInput.current.value = "";
                      }}
                    >
                      Desfazer
                    </Button>
                  )}
                </div>
                <p className="small muted" id="profile-photo-help">
                  {photo
                    ? "Foto selecionada. Salve para atualizar."
                    : "JPEG, PNG ou WebP · Até 4 MB"}
                </p>
              </div>
              <input
                ref={photoInput}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Foto de perfil"
                aria-describedby="profile-photo-help"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    !file.size ||
                    file.size > 4 * 1024 * 1024 ||
                    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
                  ) {
                    setFailed(true);
                    setMessage("Escolha uma foto JPEG, PNG ou WebP de até 4 MB.");
                    e.target.value = "";
                    return;
                  }
                  setFailed(false);
                  setMessage("");
                  setPhoto(file);
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </div>
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
                <legend>Seu veículo e suas entregas</legend>
                <div className="form-columns">
                  <label className="field">
                    Veículo (modelo e cor)
                    <Input
                      name="vehicle_label"
                      defaultValue={driver.vehicle_label}
                      minLength={2}
                      maxLength={100}
                      required
                    />
                  </label>
                  <label className="field">
                    Capacidade de carga (kg)
                    <Input
                      name="vehicle_capacity_kg"
                      type="number"
                      min={1}
                      max={5000}
                      step={1}
                      defaultValue={driver.vehicle_capacity_kg}
                      required
                    />
                  </label>
                </div>
                <p className="small muted">A capacidade ajuda a evitar uma rota com mais peso do que o seu veículo comporta.</p>
                <label className="check-label">
                  <input type="checkbox" name="availability" defaultChecked={driver.availability} />
                  Disponível para novas entregas
                </label>
              </fieldset>
            </>
          )}
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
