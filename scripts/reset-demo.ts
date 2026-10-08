// Resets the demo through the app itself (same resetDemo + R2 cleanup as the /demo button),
// signed in as the official supermarket account.
//   npm run demo:reset                       → produção (NEXT_PUBLIC_APP_URL de .env.production)
//   npm run demo:reset -- http://localhost:8787   → cf:preview local
import { readFileSync } from "node:fs";

function productionUrl() {
  const line = readFileSync(".env.production", "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_APP_URL="));
  return line?.split("=")[1]?.trim();
}

async function main() {
  const base = (process.argv[2] || productionUrl() || "").replace(/\/$/, "");
  if (!base) throw new Error("Informe a URL do app.");
  const signIn = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email: "mercado@ongsave.demo", password: "demo123" }),
  });
  if (!signIn.ok) throw new Error(`Login da conta oficial falhou (${signIn.status}).`);
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const reset = await fetch(`${base}/api/demo/reset`, {
    method: "POST",
    headers: { cookie, Origin: base },
  });
  const body = (await reset.json()) as { ok?: boolean; error?: string; warning?: string };
  if (!reset.ok) throw new Error(body.error || `Reset falhou (${reset.status}).`);
  console.log(body.warning || `Demonstração resetada em ${base}. Histórico inicial preservado.`);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
