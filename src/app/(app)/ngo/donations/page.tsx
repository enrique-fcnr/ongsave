import { redirect } from "next/navigation";
import { donationFeed, signedPhoto } from "@/lib/data";
import { matchScore } from "@/lib/domain";
import { DonationCard, Empty } from "@/components/shared";
export default async function Donations() {
  const { batches, preferences, organization, profile, orgs } = await donationFeed();
  if (profile.role !== "NGO") redirect("/home");
  const scored = batches
    .map((b) => ({
      b,
      score:
        preferences && organization
          ? matchScore(
              b,
              organization,
              preferences,
              orgs.find((o) => o.id === b.supermarket_id),
            )
          : 0,
    }))
    .sort((a, b) => b.score - a.score);
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">Alimentos em busca de um destino</span>
        <h1>Doações próximas</h1>
        <p>Ordenadas por categoria, capacidade e preferências da sua instituição.</p>
      </div>
      {!preferences?.receiving_enabled && (
        <p className="notice">
          O recebimento está pausado. Ative-o no seu perfil para aceitar doações.
        </p>
      )}
      {scored.length ? (
        <div className="donation-grid">
          {await Promise.all(
            scored.map(async ({ b, score }) => (
              <DonationCard
                key={b.id}
                batch={b}
                market={orgs.find((o) => o.id === b.supermarket_id)}
                url={await signedPhoto(b.image_url)}
                score={score}
              />
            )),
          )}
        </div>
      ) : (
        <Empty
          title="Nenhuma doação disponível agora"
          body="Novas oportunidades aparecerão aqui."
        />
      )}
      <p className="small muted">
        Compatibilidade calculada por regras simples. A disponibilidade é confirmada ao aceitar.
      </p>
    </div>
  );
}
