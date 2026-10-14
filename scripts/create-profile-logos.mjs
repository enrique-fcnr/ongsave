import { mkdir, writeFile } from "node:fs/promises";

const output = new URL("../public/profile-avatars/source/", import.meta.url);
await mkdir(output, { recursive: true });

const logos = [
  ["mercado-paulista", "MP", "#176b50", "#d8efc9", "MERCADO PAULISTA", '<path d="M256 84c-99 48-130 154-26 219 74-46 99-132 26-219Z" fill="#b9dc70"/><path d="M205 286c28-61 68-110 123-153" fill="none" stroke="#176b50" stroke-width="16" stroke-linecap="round"/>'],
  ["supermercado-aurora", "SA", "#cc5c27", "#ffe6b0", "SUPERMERCADO AURORA", '<path d="M140 242a116 116 0 0 1 232 0" fill="none" stroke="#ef9c36" stroke-width="28" stroke-linecap="round"/><path d="M256 90v48m-116-1 34 35m198-35-34 35" stroke="#ef9c36" stroke-width="18" stroke-linecap="round"/>'],
  ["emporio-central", "EC", "#74402f", "#f3e4d1", "EMPÓRIO CENTRAL", '<path d="M150 238h212M170 208l86-104 86 104" fill="none" stroke="#a66b43" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><path d="M205 238v54m102-54v54" stroke="#a66b43" stroke-width="18" stroke-linecap="round"/>'],
  ["mercado-nova-vida", "NV", "#278276", "#d6eee3", "MERCADO NOVA VIDA", '<path d="M256 286c-92-47-117-140-27-201 85 37 115 127 27 201Z" fill="#80bf91"/><path d="M256 286c92-47 117-140 27-201" fill="none" stroke="#278276" stroke-width="16" stroke-linecap="round"/>'],
  ["instituto-esperanca", "IE", "#246b62", "#d8eee5", "INSTITUTO ESPERANÇA", '<path d="m256 78 22 66 69-2-55 42 21 67-57-40-57 40 21-67-55-42 69 2Z" fill="#85bd88"/>'],
  ["casa-sao-lucas", "CSL", "#356281", "#dcebf1", "CASA SÃO LUCAS", '<path d="m142 217 114-102 114 102v92H142Z" fill="#9ac6b1"/><path d="M224 309v-73h64v73M256 137v58m-29-29h58" fill="none" stroke="#356281" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>'],
  ["projeto-viver", "PV", "#5b6f47", "#e2edd2", "PROJETO VIVER", '<path d="M256 282c-78-44-82-126-1-190 82 64 78 146 1 190Z" fill="#a2c46b"/><path d="M256 280v-95m0 46-41-34m41 60 42-39" fill="none" stroke="#5b6f47" stroke-width="14" stroke-linecap="round"/>'],
  ["maos-abertas", "MA", "#a84d47", "#f6ded6", "MÃOS ABERTAS", '<path d="M170 250c-27-17-54-2-46 24l52 68c21 26 44 38 80 38s59-12 80-38l52-68c8-26-19-41-46-24l-59 37v-84c0-30-49-30-49 0v83l-64-36Z" fill="#e7a177"/>'],
  ["ong-banco-de-alimentos", "OBA", "#256847", "#e6f2e6", "ONG BANCO DE ALIMENTOS", '<path d="M124 188a132 132 0 0 1 264 0c-22 85-86 131-132 151-46-20-110-66-132-151Z" fill="#dc5b4c"/><path d="M126 188a132 132 0 0 1 260 0" fill="none" stroke="#3b874a" stroke-width="24" stroke-linecap="round"/><g fill="#f7f2d9"><circle cx="200" cy="174" r="9"/><circle cx="255" cy="140" r="9"/><circle cx="312" cy="174" r="9"/></g>'],
  ["ten-yad", "TY", "#263d61", "#efe7d4", "TEN YAD", '<path d="M162 220c26-31 48-40 70-10l24 31 24-31c22-30 44-21 70 10l-67 87c-15 19-39 19-54 0Z" fill="#c39b53"/><path d="M196 224 256 290l60-66" fill="none" stroke="#fff7e4" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>'],
];

for (const [slug, initials, ink, wash, caption, motif] of logos) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${wash}"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><circle cx="256" cy="256" r="256" fill="url(#bg)"/><circle cx="256" cy="199" r="143" fill="#fff" fill-opacity=".68"/>${motif}<text x="256" y="363" text-anchor="middle" font-family="Arial,sans-serif" font-size="${initials.length > 2 ? 88 : 112}" font-weight="800" letter-spacing="-4" fill="${ink}">${initials}</text><text x="256" y="423" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="2.2" fill="${ink}">${caption}</text><circle cx="256" cy="256" r="242" fill="none" stroke="#fff" stroke-opacity=".68" stroke-width="8"/></svg>`;
  await writeFile(new URL(`${slug}.svg`, output), svg, "utf8");
}
