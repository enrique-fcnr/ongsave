import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/shared";
import { LoginForm } from "@/components/login-form";
import { isConfigured } from "@/server/config";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-copy">
          <span className="eyebrow auth-eyebrow">Conexões que alimentam</span>
          <h1>
            O próximo destino
            <br />
            começa com você.
          </h1>
          <p>
            Mercados, instituições e motoristas conectados para que o alimento chegue mais longe.
          </p>
        </div>
        <div className="auth-team">
          <Image
            src="/landing/rescue-team.png"
            alt="Equipe ilustrativa de supermercado, instituição e motorista com uma caixa de alimentos"
            fill
            sizes="(max-width: 767px) 0px, 50vw"
          />
        </div>
        <span className="small auth-location">São Paulo · Conexões que alimentam</span>
      </section>
      <section className="auth-form">
        <div className="stack">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <div className="title-block">
            <span className="eyebrow">Sua rede de resgates</span>
            <h1>Bom ter você aqui.</h1>
            <p>Acesse sua conta para acompanhar doações, missões e entregas.</p>
          </div>
          {!isConfigured() && (
            <div className="notice">
              O acesso está temporariamente indisponível. Fale com a equipe responsável pela
              plataforma.
            </div>
          )}
          {query.profile && (
            <p className="error">
              Sua conta ainda precisa de um perfil na rede. Peça à equipe responsável para concluir
              seu cadastro.
            </p>
          )}
          <LoginForm configured={isConfigured()} />
          <div className="auth-footer">
            <p className="small muted">Acesso para participantes cadastrados.</p>
            {process.env.ENABLE_DEMO_MODE === "true" && (
              <Link href="/demo" className="text-link">
                Conhecer a demonstração
              </Link>
            )}
            <Link href="/" className="back">
              <ArrowLeft size={15} />
              Voltar ao site
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
