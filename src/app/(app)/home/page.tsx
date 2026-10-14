import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { operationalData } from "@/lib/data";
import { Metrics, Charts, EnvironmentalImpact } from "@/components/metrics";
import { ScreenSections } from "@/components/screen-sections";
export default async function Home() {
  const { profile: actor } = await requireProfile();
  if (actor.role === "ADMIN") redirect("/admin");
  const data = await operationalData();
  const { profile, organization, rescues } = data;
  if (profile.role === "DRIVER") redirect("/driver/missions");
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
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
      </div>
      <ScreenSections
        sections={[
          {
            id: "visao-geral",
            label: "Visão geral",
            content: (
              <div className="stack">
                <Metrics rescues={rescues} role={profile.role} />
                <section className="stack" id="impacto" aria-label="Seu impacto até aqui">
                  <div className="section-heading">
                    <h2>Seu impacto até aqui</h2>
                    {profile.role === "SUPERMARKET" && (
                      <Link href="/supermarket/reports" className="text-link">
                        Ver relatório <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                  <ScreenSections
                    label="Detalhes do impacto"
                    sections={[
                      {
                        id: "graficos",
                        label: "Gráficos",
                        content: <Charts rescues={rescues} asOf={data.asOf} />,
                      },
                      {
                        id: "estimativas",
                        label: "Estimativas ambientais",
                        content: <EnvironmentalImpact rescues={rescues} />,
                      },
                    ]}
                  />
                </section>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
