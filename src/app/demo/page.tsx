import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/shared";
import { DemoControls } from "@/components/demo-controls";
import { isConfigured } from "@/lib/supabase/config";
export const dynamic = "force-dynamic";
export default function Demo() {
  if (process.env.ENABLE_DEMO_MODE !== "true") notFound();
  return (
    <main className="narrow stack demo-page">
      <div className="demo-header">
        <Brand />
        <Link href="/" className="back">
          <ArrowLeft size={15} />
          Voltar ao site
        </Link>
      </div>
      <div className="title-block demo-intro">
        <span className="eyebrow muted">Conheça a rede por dentro</span>
        <h1>Três papéis. Um resgate conectado.</h1>
        <p>
          Escolha um perfil para explorar a plataforma. As contas e os dados deste ambiente são de
          demonstração.
        </p>
      </div>
      {!isConfigured() && (
        <p className="notice">A demonstração está temporariamente indisponível.</p>
      )}
      <DemoControls configured={isConfigured()} />
    </main>
  );
}
