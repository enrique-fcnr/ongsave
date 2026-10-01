import Link from "next/link";
export default function NotFound() {
  return (
    <main className="narrow panel stack" style={{ marginTop: 70 }}>
      <h1>Não encontramos esta página.</h1>
      <p className="muted">
        O endereço pode ter mudado ou o registro não está disponível para seu perfil.
      </p>
      <Link href="/home">Voltar ao início</Link>
    </main>
  );
}
