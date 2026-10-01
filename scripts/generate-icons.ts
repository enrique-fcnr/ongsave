import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
mkdirSync("public/icons", { recursive: true });
async function main() {
  const svg = readFileSync("public/icon.svg");
  for (const size of [192, 512])
    await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
  await sharp(svg)
    .resize(320, 320)
    .extend({ top: 96, bottom: 96, left: 96, right: 96, background: "#d6ef93" })
    .png()
    .toFile("public/icons/icon-maskable.png");
  console.log("Ícones PWA gerados.");
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
