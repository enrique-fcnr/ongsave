"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="panel stack">
      <h1>Vamos tentar novamente.</h1>
      <p className="muted">
        Não foi possível carregar os dados. Confira sua conexão e a configuração do Supabase.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
