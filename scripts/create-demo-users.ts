import { serviceClient } from "./environment";
import { accountData, financialSupportData, id, organizationData } from "./seed-data";
import { seed } from "./seed";
async function main() {
  const client = serviceClient();
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const { error: orgError } = await client
    .from("organizations")
    .upsert(organizationData, { onConflict: "id" });
  if (orgError) throw orgError;
  for (const account of accountData) {
    let user = users.find((u) => u.email === account.email);
    if (!user) {
      const { data, error } = await client.auth.admin.createUser({
        email: account.email,
        password: "demo123",
        email_confirm: true,
        app_metadata: { ongsave_demo: true },
      });
      if (error) throw error;
      user = data.user!;
    } else {
      const { error } = await client.auth.admin.updateUserById(user.id, {
        password: "demo123",
        email_confirm: true,
      });
      if (error) throw error;
    }
    const profile = {
      id: id(`profile:${account.email}`),
      auth_user_id: user.id,
      name: account.name,
      email: account.email,
      role: account.role,
      phone: "(11) 99999-1000",
    };
    const { error } = await client.from("profiles").upsert(profile, { onConflict: "id" });
    if (error) throw error;
    if (account.org) {
      const { error } = await client.from("organization_members").upsert(
        {
          id: id(`member:${account.email}`),
          organization_id: id(account.org),
          profile_id: profile.id,
          member_role: "operator",
        },
        { onConflict: "organization_id,profile_id" },
      );
      if (error) throw error;
    }
    console.log(`Conta pronta: ${account.email}`);
  }
  const { error: supportError } = await client
    .from("financial_supports")
    .upsert(financialSupportData, { onConflict: "id" });
  if (supportError) throw supportError;
  await seed();
  console.log("Contas demo prontas. Senha: demo123");
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
