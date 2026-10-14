import { readFile } from "node:fs/promises";
import path from "node:path";
import { serviceClient } from "./environment";

const filesByEmail: Record<string, string> = {
  "aurora@ongsave.demo": "supermercado-aurora.webp",
  "central@ongsave.demo": "emporio-central.webp",
  "novavida@ongsave.demo": "mercado-nova-vida.webp",
  "assaimooca@ongsave.com": "assai.webp",
  "hirotaipiranga@ongsave.com": "hirota.webp",
  "joaninmooca@ongsave.com": "joanin.webp",
  "casasantaluzia@ongsave.com": "casa-santa-luzia.webp",
  "sondaitaberaba@ongsave.com": "sonda.webp",
  "sondajacana@ongsave.com": "sonda.webp",
  "mercado@ongsave.demo": "mercado-paulista.webp",
  "bancodealimentos@ongsave.com": "ong-banco-de-alimentos.webp",
  "pratocheio@ongsave.com": "prato-cheio.webp",
  "sefras@ongsave.com": "sefras.webp",
  "tenyad@ongsave.com": "ten-yad.webp",
  "arsenaldaesperanca@ongsave.com": "arsenal-da-esperanca.webp",
  "santafe@ongsave.com": "santa-fe.webp",
  "ong@ongsave.demo": "instituto-esperanca.webp",
  "saolucas@ongsave.demo": "casa-sao-lucas.webp",
  "viver@ongsave.demo": "projeto-viver.webp",
  "maosabertas@ongsave.demo": "maos-abertas.webp",
  "rafael@ongsave.demo": "rafael-santos.webp",
  "motorista@ongsave.demo": "lucas-almeida.webp",
  "mariana@ongsave.demo": "mariana-costa.webp",
  "admin@ongsave.com": "ongsave-admin.webp",
};

async function main() {
  const supabase = serviceClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, auth_user_id, email, avatar_url")
    .in("email", Object.keys(filesByEmail));
  if (error) throw error;

  const found = new Map((profiles ?? []).map((profile) => [profile.email, profile]));
  const missing = Object.keys(filesByEmail).filter((email) => !found.has(email));
  if (missing.length) throw new Error(`Contas ausentes no banco: ${missing.join(", ")}`);
  if (found.size !== 24) throw new Error(`Esperava 24 perfis e encontrei ${found.size}.`);

  for (const [email, filename] of Object.entries(filesByEmail)) {
    const profile = found.get(email)!;
    const existingId = profile.avatar_url?.match(/^\/api\/profile\/photo\?v=([0-9a-f-]{36})$/)?.[1];
    const avatarId = existingId ?? crypto.randomUUID();
    const objectPath = `${profile.auth_user_id}/${avatarId}.webp`;
    const bytes = await readFile(path.join(process.cwd(), "assets/profile-avatars/ready", filename));
    const { error: uploadError } = await supabase.storage.from("avatars").upload(objectPath, bytes, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
    });
    if (uploadError) throw new Error(`Upload falhou para ${email}: ${uploadError.message}`);

    const avatarUrl = `/api/profile/photo?v=${avatarId}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", profile.id);
    if (updateError) throw new Error(`Atualização falhou para ${email}: ${updateError.message}`);
    console.log(`Avatar atualizado: ${email}`);
  }

  const { data: verified, error: verifyError } = await supabase
    .from("profiles")
    .select("email, avatar_url")
    .in("email", Object.keys(filesByEmail));
  if (verifyError) throw verifyError;
  const incomplete = (verified ?? []).filter((profile) => !profile.avatar_url);
  if (incomplete.length || (verified ?? []).length !== 24) {
    throw new Error(`Validação falhou: ${(verified ?? []).length} perfis encontrados, ${incomplete.length} sem avatar.`);
  }
  console.log(`Validação concluída: ${(verified ?? []).length} perfis com avatar.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
