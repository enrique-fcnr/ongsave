import Link from "next/link";
import { ArrowRight, Leaf, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { operationalData, donationFeed, signedPhoto } from "@/lib/data";
import { matchScore } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Metrics, Charts, EnvironmentalImpact } from "@/components/metrics";
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
          <h2>Doações disponíveis para receber</h2>
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
      <div className="between page-heading">
        <div className="title-block">
          <span className="eyebrow">{greeting} · Sua rede de resgates</span>
          <h1>{organization?.name || profile.name}</h1>
          <p>
            {profile.role === "SUPERMARKET"
              ? "Registre o que pode ser doado e acompanhe os alimentos até a entrega."
              : "Encontre o que sua instituição pode receber e acompanhe cada resgate."}
          </p>
        </div>
        {profile.role === "SUPERMARKET" && (
          <Button render={<Link href="/supermarket/surplus/new" />} nativeButton={false}>
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
              <span className="eyebrow impact-eyebrow">Um gesto abre novos caminhos</span>
              <h2 style={{ marginTop: 12 }}>Dê um novo destino ao excedente.</h2>
              <p>
                Fotografe, confira as informações e publique. A rede conecta sua doação a quem pode
                recebê-la.
              </p>
              <Button
                className="impact-cta"
                render={<Link href="/supermarket/surplus/new" />}
                nativeButton={false}
              >
                <Plus size={17} />
                Registrar novo excedente
              </Button>
            </div>
            <Leaf className="art" />
          </div>
          <section className="stack">
            <div className="section-heading">
              <h2>Seu impacto até aqui</h2>
              <Link href="/supermarket/reports" className="text-link">
                Ver relatório <ArrowRight size={15} />
              </Link>
            </div>
            <Charts rescues={rescues} asOf={data.asOf} />
          </section>
        </>
      ) : (
        feed
      )}
      <section className="stack">
        <div className="section-heading">
          <h2>Seus resgates recentes</h2>
          <Link className="text-link" href="/rescues">
            Ver todos <ArrowRight size={15} />
          </Link>
        </div>
        <RescueList rescues={rescues.slice(0, 5)} orgs={orgs} />
      </section>
      {profile.role === "NGO" && (
        <section id="impacto" className="stack ngo-home-impact" aria-label="Seu impacto até aqui">
          <div className="title-block">
            <span className="eyebrow muted">O resultado das suas conexões</span>
            <h2>Seu impacto até aqui</h2>
            <p>Acompanhe os alimentos recebidos e os resultados de cada entrega confirmada.</p>
          </div>
          <Charts rescues={rescues} asOf={data.asOf} />
          <EnvironmentalImpact rescues={rescues} />
        </section>
      )}
    </div>
  );
}
