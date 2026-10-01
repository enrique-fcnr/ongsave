import Link from "next/link";
import { ArrowRight, Leaf, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { operationalData, donationFeed, signedPhoto } from "@/lib/data";
import { matchScore } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Metrics, Charts } from "@/components/metrics";
import { DonationCard, Empty, RescueList } from "@/components/shared";
export default async function Home() {
  const data = await operationalData();
  const { profile, organization, rescues, orgs } = data;
  if (profile.role === "DRIVER") redirect("/driver/missions");
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  let feed: React.ReactNode = null;
  if (profile.role === "NGO") {
    const { batches, preferences } = await donationFeed();
    const sorted = batches
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
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    feed = (
      <section className="stack">
        <div className="between">
          <h2>Doações próximas</h2>
          <Link className="small muted row" href="/ngo/donations">
            Ver todas
            <ArrowRight size={14} />
          </Link>
        </div>
        {sorted.length ? (
          <div className="donation-grid">
            {await Promise.all(
              sorted.map(async ({ b, score }) => (
                <DonationCard
                  key={b.id}
                  batch={b}
                  score={score}
                  market={orgs.find((o) => o.id === b.supermarket_id)}
                  url={await signedPhoto(b.image_url)}
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
      </section>
    );
  }
  return (
    <div className="stack">
      <div className="between">
        <div className="title-block">
          <span className="muted small">{greeting},</span>
          <h1>{organization?.name || profile.name}</h1>
          <p>Há sempre um novo destino para fazer a diferença.</p>
        </div>
        {profile.role === "SUPERMARKET" && (
          <Button
            className="mobile-hide"
            render={<Link href="/supermarket/surplus/new" />}
            nativeButton={false}
          >
            <Plus size={18} />
            Registrar excedente
          </Button>
        )}
      </div>
      <Metrics rescues={rescues} role={profile.role} />
      {profile.role === "SUPERMARKET" ? (
        <>
          <div className="impact-banner">
            <div>
              <span className="eyebrow" style={{ color: "#9bcbab" }}>
                Uma foto. Muitas possibilidades.
              </span>
              <h2 style={{ marginTop: 12 }}>O próximo resgate começa com você.</h2>
              <p>
                Registre os alimentos disponíveis. Sua equipe revisa, e a rede encontra um novo
                destino.
              </p>
              <Button
                style={{ marginTop: 22, background: "#22c55e", color: "#10271b" }}
                render={<Link href="/supermarket/surplus/new" />}
                nativeButton={false}
              >
                <Plus size={17} />
                Registrar novo excedente
              </Button>
            </div>
            <Leaf className="art" />
          </div>
          <div className="mobile-hide">
            <Charts rescues={rescues} asOf={data.asOf} />
          </div>
        </>
      ) : (
        feed
      )}
      <section className="stack">
        <div className="between">
          <h2>Seus resgates recentes</h2>
          <Link className="small muted" href="/rescues">
            Ver histórico
          </Link>
        </div>
        <RescueList rescues={rescues.slice(0, 5)} orgs={orgs} />
      </section>
    </div>
  );
}
