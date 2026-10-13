import { redirect } from "next/navigation";
import { donationFeed, signedPhoto } from "@/lib/data";
import { matchScore } from "@/lib/domain";
import { PagedItems } from "@/components/screen-sections";
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
        <h1>Doações disponíveis</h1>
        <p>
          Alimentos que os supermercados disponibilizaram para sua instituição receber. As doações
          mais compatíveis com seu perfil aparecem primeiro.
        </p>
      </div>
      {!preferences?.receiving_enabled && (
        <p className="notice">
          O recebimento está pausado. Ative-o no seu perfil para aceitar doações.
        </p>
      )}
      {scored.length ? (
        <PagedItems className="donation-grid" pageSize={2} label="Doações disponíveis">
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
        </PagedItems>
      ) : (
        <Empty
          title="Nenhuma doação disponível agora"
          body="Novas oportunidades aparecerão aqui."
        />
      )}
      <details className="method-note">
        <summary>Como as doações são organizadas</summary>
        <p>
          A ordem considera as categorias aceitas, a capacidade e as preferências da instituição. A
          disponibilidade do lote é confirmada ao aceitar.
        </p>
      </details>
    </div>
  );
}
