import { hashPassword } from "better-auth/crypto";
import { accountData, id } from "./seed-data";
import { execute, target, upsert } from "./d1-sql";
import { organizationStatements, seedStatements } from "./seed-d1";

// Creates the 11 demo accounts directly in the Better Auth tables (password hashed with
// Better Auth's own hashPassword), links profiles and memberships, then applies the seed.
// Sign-up stays disabled in the app; only this server-side script provisions accounts.
export async function demoUserStatements(password = "demo123") {
  const hash = await hashPassword(password);
  const now = Date.now();
  const users = accountData.map((a) => ({
    id: id(`auth:${a.email}`),
    name: a.name,
    email: a.email,
    email_verified: true,
    created_at: now,
    updated_at: now,
  }));
  const accounts = accountData.map((a) => ({
    id: id(`account:${a.email}`),
    account_id: id(`auth:${a.email}`),
    provider_id: "credential",
    user_id: id(`auth:${a.email}`),
    password: hash,
    created_at: now,
    updated_at: now,
  }));
  const profiles = accountData.map((a) => ({
    id: id(`profile:${a.email}`),
    auth_user_id: id(`auth:${a.email}`),
    name: a.name,
    email: a.email,
    role: a.role,
    phone: "(11) 99999-1000",
  }));
  const members = accountData
    .filter((a) => a.org)
    .map((a) => ({
      id: id(`member:${a.email}`),
      organization_id: id(a.org!),
      profile_id: id(`profile:${a.email}`),
      member_role: "operator",
    }));
  return [
    ...upsert("user", users, "id", ["created_at"]),
    ...upsert("account", accounts, "id", ["created_at"]),
    ...upsert("profiles", profiles),
    ...upsert("organization_members", members),
  ];
}

if (process.argv[1]?.endsWith("create-demo-users.ts")) {
  (async () => {
    const where = target();
    execute(
      [...organizationStatements(), ...(await demoUserStatements()), ...seedStatements()],
      where,
    );
    for (const a of accountData) console.log(`Conta pronta: ${a.email}`);
    console.log("Contas demo prontas. Senha: demo123");
  })().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  });
}
