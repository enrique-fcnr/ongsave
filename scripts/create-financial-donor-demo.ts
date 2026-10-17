import { serviceClient } from "./environment";
import { accountData, financialSupportData, id, organizationData } from "./seed-data";

async function main() {
  const client = serviceClient();
  const account = accountData.find((item) => item.email === "apoio@ongsave.demo");
  const organization = organizationData.find((item) => item.slug === "grupo-horizonte");
  if (!account?.org || !organization)
    throw new Error("Conta de empresa apoiadora não configurada.");

  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  let user = users.find((item) => item.email === account.email);
  if (!user) {
    const { data, error } = await client.auth.admin.createUser({
      email: account.email,
      password: "demo123",
      email_confirm: true,
      app_metadata: { ongsave_demo: true },
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { error } = await client.auth.admin.updateUserById(user.id, {
      password: "demo123",
      email_confirm: true,
    });
    if (error) throw error;
  }
  if (!user) throw new Error("Não foi possível criar a conta demonstrativa.");

  const { error: organizationError } = await client
    .from("organizations")
    .upsert(organization, { onConflict: "id" });
  if (organizationError) throw organizationError;
  const profile = {
    id: id(`profile:${account.email}`),
    auth_user_id: user.id,
    name: account.name,
    email: account.email,
    role: account.role,
    phone: "(11) 99999-1000",
  };
  const { error: profileError } = await client
    .from("profiles")
    .upsert(profile, { onConflict: "id" });
  if (profileError) throw profileError;
  const { error: memberError } = await client.from("organization_members").upsert(
    {
      id: id(`member:${account.email}`),
      organization_id: organization.id,
      profile_id: profile.id,
      member_role: "operator",
    },
    { onConflict: "organization_id,profile_id" },
  );
  if (memberError) throw memberError;
  const { error: supportError } = await client
    .from("financial_supports")
    .upsert(financialSupportData, { onConflict: "id", ignoreDuplicates: true });
  if (supportError) throw supportError;
  console.log("Conta de demonstração criada: apoio@ongsave.demo (senha demo123).");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
