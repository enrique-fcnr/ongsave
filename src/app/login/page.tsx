import Link from "next/link";
import { Brand } from "@/components/shared";
import { LoginForm } from "@/components/login-form";
import { isConfigured } from "@/lib/supabase/config";
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
        <div>
          <span className="eyebrow" style={{ color: "#8fcba1" }}>
            Cada alimento importa
          </span>
          <h1 style={{ marginTop: 24 }}>
            O excedente de hoje.
            <br />A esperança de amanhã.
          </h1>
          <p>
            Uma rede de pessoas conectadas por um propósito: levar alimentos mais longe e
            desperdício a zero.
          </p>
        </div>
        <span className="small" style={{ color: "#b8cbbf" }}>
          São Paulo · Conexões que alimentam
        </span>
      </section>
      <section className="auth-form">
        <div className="stack">
          <div className="md:hidden">
            <Brand />
          </div>
          <div className="title-block">
            <h1>Bom ter você aqui.</h1>
            <p>Entre para acompanhar seus resgates e fazer a diferença.</p>
          </div>
          {!isConfigured() && (
            <div className="notice">
              Primeiro, copie <code>.env.example</code> para <code>.env.local</code>, preencha o
              Supabase e execute o bootstrap descrito no README.
            </div>
          )}
          {query.profile && (
            <p className="error">
              Sua conta ainda não tem um perfil operacional. Execute <code>npm run demo:users</code>{" "}
              ou peça o cadastro ao administrador.
            </p>
          )}
          <LoginForm configured={isConfigured()} />
          {process.env.ENABLE_DEMO_MODE === "true" && (
            <Link href="/demo" className="small muted" style={{ textAlign: "center" }}>
              Acessar ambiente de demonstração
            </Link>
          )}
          <p className="small muted" style={{ textAlign: "center" }}>
            Acesso exclusivo para participantes cadastrados.
          </p>
        </div>
      </section>
    </main>
  );
}
