import { requireProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
export default async function Profile() {
  const { client, profile, organization } = await requireProfile();
  const [p, d] = await Promise.all([
    profile.role === "NGO" && organization
      ? client.from("ngo_preferences").select("*").eq("organization_id", organization.id).single()
      : Promise.resolve({ data: null, error: null }),
    profile.role === "DRIVER"
      ? client.from("drivers").select("*").eq("profile_id", profile.id).single()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (p.error || d.error) throw new Error(p.error?.message || d.error?.message);
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
      <ProfileForm profile={profile} prefs={p.data} driver={d.data} />
    </div>
  );
}
