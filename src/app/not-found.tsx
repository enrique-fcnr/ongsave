import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";
export default function NotFound() {
  return (
    <main className="narrow panel stack error-state">
      <Sprout size={36} color="var(--primary)" />
      <h1>Não encontramos esta página.</h1>
      <p className="muted">
        O endereço pode ter mudado ou o registro não está disponível para seu perfil.
      </p>
      <Button render={<Link href="/home" />} nativeButton={false}>
        Voltar ao início
      </Button>
    </main>
  );
}
