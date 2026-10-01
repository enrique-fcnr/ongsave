import { serviceClient } from "./environment";
async function main() {
  if (process.env.ENABLE_DEMO_MODE !== "true")
    throw new Error("Defina ENABLE_DEMO_MODE=true para resetar.");
  const client = serviceClient();
  const { data: profile, error } = await client
    .from("profiles")
    .select("auth_user_id")
    .eq("email", "mercado@ongsave.demo")
    .single();
  if (error) throw error;
  const paths: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data: objects, error: listError } = await client.storage
      .from("surplus")
      .list(profile.auth_user_id, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
    if (listError) throw listError;
    paths.push(
      ...(objects || [])
        .filter((object) => object.id)
        .map((object) => `${profile.auth_user_id}/${object.name}`),
    );
    if (!objects || objects.length < 1000) break;
  }
  const { error: resetError } = await client.rpc("reset_demo", {
    actor_auth_id: profile.auth_user_id,
  });
  if (resetError) throw resetError;
  for (let offset = 0; offset < paths.length; offset += 100) {
    const { error } = await client.storage
      .from("surplus")
      .remove(paths.slice(offset, offset + 100));
    if (error) throw error;
  }
  console.log("Demonstração resetada. Histórico inicial preservado.");
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
