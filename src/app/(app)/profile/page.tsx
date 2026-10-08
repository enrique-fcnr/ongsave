import { requireProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
import { ownDriver, preferencesFor } from "@/server/queries";
export default async function Profile() {
  const { db, actor, profile, organization } = await requireProfile();
  const [prefs, driver] = await Promise.all([
    profile.role === "NGO" && organization
      ? preferencesFor(db, actor, organization.id)
      : Promise.resolve(null),
    profile.role === "DRIVER" ? ownDriver(db, actor) : Promise.resolve(null),
  ]);
  return (
    <div className="narrow stack">
      <div className="title-block">
        <span className="eyebrow muted">Sua conexão com a rede</span>
        <h1>Seu perfil na rede</h1>
        <p>
          {organization?.name || profile.name}
          {organization ? ` · ${organization.neighborhood}, São Paulo` : " · Motorista"}. Mantenha
          seus dados e sua disponibilidade atualizados.
        </p>
      </div>
      <ProfileForm profile={profile} prefs={prefs} driver={driver} />
    </div>
  );
}
