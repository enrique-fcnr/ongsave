import { notFound } from "next/navigation";
import { Brand } from "@/components/shared";
import { DemoControls } from "@/components/demo-controls";
import { isConfigured } from "@/lib/supabase/config";
export const dynamic = "force-dynamic";
export default function Demo() {
  if (process.env.ENABLE_DEMO_MODE !== "true") notFound();
  return (
    <main className="narrow stack" style={{ maxWidth: 480, padding: "35px 24px 70px" }}>
      <Brand />
      <div className="title-block">
        <span className="eyebrow muted">Ambiente acadêmico</span>
        <h1>Modo Demonstração</h1>
        <p>Uma conta em cada celular. Um resgate conectado do início ao fim.</p>
      </div>
      {!isConfigured() && (
        <p className="notice">Configure as variáveis do Supabase para habilitar os acessos.</p>
      )}
      <DemoControls configured={isConfigured()} />
    </main>
  );
}
