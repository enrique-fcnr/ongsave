import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "assets/profile-avatars/source");
const outputDir = path.join(root, "assets/profile-avatars/ready");
await fs.mkdir(sourceDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const remote = {
  "prato-cheio": "https://pratocheio.org.br/wp-content/uploads/2021/05/cropped-logo_apc-1-192x192.png",
  sefras: "https://storage.googleapis.com/atados-v3/user-uploaded/images/95636538-6578-4cd4-9355-739681f1a26f.png",
  "arsenal-da-esperanca": "https://cdn.v2v.net/0x0%3A512x512/600x600/filters%3Astill%28%29%3Aformat%28jpeg%29%3Aquality%2880%29%3Afill%28white%2Ctrue%29/994f8ac9-c531-4628-bab3-ff3fa9f05a96.jpeg?v=63733176457",
  "santa-fe": "https://santafe.org.br/wp-content/uploads/2022/12/Logo-SF.png",
  assai: "https://static.ifood-static.com.br/image/upload/t_high/logosgde/743085ac-e7e2-4b5c-adb6-5465afc1ddda/202403012329_AK9U.png",
  hirota: "https://cdn.brandfetch.io/idCkStxs6y/w/960/h/958/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764820617650",
  joanin: "https://www.joanin.com.br/wp-content/uploads/2017/11/logo_header_joanin.png",
  "casa-santa-luzia": "https://santaluzia.vtexassets.com/assets/vtex/assets-builder/santaluzia.store-theme/2.6.2/icons/svg/logo-santaluzia___bc5488548245b81bedaf0fd2097364ee.svg",
  sonda: "https://www.sondadelivery.com.br/scripts/img/sonda-logo.jpg",
};

for (const [slug, url] of Object.entries(remote)) {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 ONGSave profile avatar setup" },
  });
  if (!response.ok) throw new Error(`Falha ao baixar ${slug}: HTTP ${response.status}`);
  await fs.writeFile(path.join(sourceDir, `${slug}-source`), Buffer.from(await response.arrayBuffer()));
}

const sourceFor = {
  "mercado-paulista": "mercado-paulista.svg",
  "supermercado-aurora": "supermercado-aurora.svg",
  "emporio-central": "emporio-central.svg",
  "mercado-nova-vida": "mercado-nova-vida.svg",
  "instituto-esperanca": "instituto-esperanca.svg",
  "casa-sao-lucas": "casa-sao-lucas.svg",
  "projeto-viver": "projeto-viver.svg",
  "maos-abertas": "maos-abertas.svg",
  "ong-banco-de-alimentos": "ong-banco-de-alimentos.svg",
  "ten-yad": "ten-yad.svg",
  "ongsave-admin": "ongsave-admin.svg",
  "lucas-almeida": "lucas-almeida.png",
  "mariana-costa": "mariana-costa.png",
  "rafael-santos": "rafael-santos.png",
  "prato-cheio": "prato-cheio-source",
  sefras: "sefras-source",
  "arsenal-da-esperanca": "arsenal-da-esperanca-source",
  "santa-fe": "santa-fe-source",
  assai: "assai-source",
  hirota: "hirota-source",
  joanin: "joanin-source",
  "casa-santa-luzia": "casa-santa-luzia-source",
  sonda: "sonda-source",
};

for (const [slug, filename] of Object.entries(sourceFor)) {
  const input = await fs.readFile(path.join(sourceDir, filename));
  const isPortrait = ["lucas-almeida", "mariana-costa", "rafael-santos"].includes(slug);
  await sharp(input, { density: 144 })
    .resize(512, 512, {
      fit: isPortrait ? "cover" : "contain",
      position: "centre",
      background: "#ffffff",
    })
    .webp({ quality: 88, effort: 5 })
    .toFile(path.join(outputDir, `${slug}.webp`));
}

console.log(`Avatares prontos: ${Object.keys(sourceFor).length}`);
