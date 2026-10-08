import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb } from "./helpers";
import { seedDemo } from "./seed";
import { hashPassword } from "better-auth/crypto";
import { createAuth, type Auth } from "../../src/server/auth/auth";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
const { resolveProfile } = await import("../../src/lib/auth");

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let auth: Auth;
const baseURL = "http://localhost:8787";

async function signIn(email: string, password: string) {
  return auth.api.signInEmail({
    body: { email, password },
    headers: new Headers({ origin: baseURL }),
    asResponse: true,
  });
}
function cookieFrom(response: Response) {
  return response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

beforeAll(async () => {
  ctx = await createTestDb();
  await seedDemo(ctx.d1);
  auth = createAuth(ctx.db, { secret: "test-secret-with-at-least-32-characters!", baseURL });
});
afterAll(async () => ctx?.dispose());

describe("Better Auth sobre D1", () => {
  it("entra com a senha certa e recusa a errada", async () => {
    const ok = await signIn("ong@ongsave.demo", "demo123");
    expect(ok.status).toBe(200);
    expect(cookieFrom(ok)).toMatch(/better-auth\.session_token=/);
    const setCookie = ok.headers.getSetCookie().join("\n");
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    const wrong = await signIn("ong@ongsave.demo", "senhaerrada");
    expect(wrong.status).toBe(401);
    const unknown = await signIn("ninguem@ongsave.demo", "demo123");
    expect(unknown.status).toBe(401);
  });

  it("não permite autocadastro", async () => {
    const response = await auth.api.signUpEmail({
      body: { email: "novo@ongsave.demo", password: "demo1234", name: "Novo" },
      headers: new Headers({ origin: baseURL }),
      asResponse: true,
    });
    expect(response.ok).toBe(false);
    const row = await ctx.d1
      .prepare("SELECT count(*) AS n FROM user WHERE email='novo@ongsave.demo'")
      .first<{ n: number }>();
    expect(row?.n).toBe(0);
  });

  it("sem sessão manda para /login; com sessão devolve perfil e organização", async () => {
    expect(await resolveProfile(ctx.db, auth, new Headers())).toEqual({ redirect: "/login" });
    const cookie = cookieFrom(await signIn("mercado@ongsave.demo", "demo123"));
    const result = await resolveProfile(ctx.db, auth, new Headers({ cookie }));
    expect("redirect" in result).toBe(false);
    if ("redirect" in result) return;
    expect(result.profile.email).toBe("mercado@ongsave.demo");
    expect(result.profile.role).toBe("SUPERMARKET");
    expect(result.organization?.name).toBe("Mercado Paulista");
    expect(result.actor.orgIds).toEqual([result.organization?.id]);
  });

  it("usuário sem perfil vai para /login?profile=missing", async () => {
    // Conta de autenticação válida, ainda sem profile vinculado pelo administrador.
    await ctx.d1.batch([
      ctx.d1.prepare(
        "INSERT INTO user(id,name,email,email_verified) VALUES('orphan','Sem perfil','semperfil@ongsave.demo',1)",
      ),
      ctx.d1
        .prepare(
          "INSERT INTO account(id,account_id,provider_id,user_id,password) VALUES('orphan-acc','orphan','credential','orphan',?)",
        )
        .bind(await hashPassword("demo123")),
    ]);
    const cookie = cookieFrom(await signIn("semperfil@ongsave.demo", "demo123"));
    expect(await resolveProfile(ctx.db, auth, new Headers({ cookie }))).toEqual({
      redirect: "/login?profile=missing",
    });
  });

  it("logout invalida a sessão no servidor", async () => {
    const cookie = cookieFrom(await signIn("motorista@ongsave.demo", "demo123"));
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).not.toBeNull();
    const out = await auth.api.signOut({
      headers: new Headers({ cookie, origin: baseURL }),
      asResponse: true,
    });
    expect(out.status).toBe(200);
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
  });
});
