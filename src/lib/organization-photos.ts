import type { NetworkOrganization } from "./admin-network";

// Public institutional sources researched for this presentation. Do not label
// generic or chain-wide photos as photographs of a particular store or building.
export const organizationPhotos: Record<string, NetworkOrganization["photo"]> = {
  "banco-de-alimentos": {
    url: "https://bancodealimentos.org.br/wp-content/uploads/elementor/thumbs/OBA-Home-Coleta-Distribuicao-Alimentos-rrwvcojl68075tkxz8ajgj4o0zc79e8w4s7brexg20.jpg",
    label: "Foto institucional · Banco de Alimentos",
    source: "https://bancodealimentos.org.br/",
  },
  sefras: {
    url: "https://static.wixstatic.com/media/6d1a55_2ab9c6e67a624315850e7b3bec2ab8dc~mv2.jpg",
    label: "Imagem institucional · SEFRAS",
    source: "https://www.sefras.org.br/",
  },
  "ten-yad": {
    url: "https://tenyad.org.br/wp-content/uploads/2025/02/nos-alimentamos.jpg",
    label: "Foto institucional · Ten Yad",
    source: "https://tenyad.org.br/",
  },
  "arsenal-da-esperanca": {
    url: "https://br.sermig.org/media/pagine/thumb/49029211547_5e54dc764a_c_1573140444_339.jpg",
    label: "Foto institucional · Arsenal da Esperança",
    source: "https://br.sermig.org/arsenais/arsenal-da-esperanza-sao-paulo-brasil.html",
  },
  "santa-fe": {
    url: "https://santafe.org.br/wp-content/uploads/2026/05/cuidado.jpg",
    label: "Foto institucional · Santa Fé",
    source: "https://santafe.org.br/",
  },
  "hirota-ipiranga": {
    url: "https://hirotafood.com.br/wp-content/uploads/2024/10/loja-dentro-scaled-655x600.jpg",
    label: "Foto da rede Hirota",
    source: "https://hirotafood.com.br/hirota-em-casa/",
  },
  "casa-santa-luzia": {
    url: "https://santaluzia.vtexassets.com/assets/vtex/assets-builder/santaluzia.store-theme/2.6.1/banners/institucionais/nossa-historia___e075c27d7c51b3dfea04a3aed3332f81.png",
    label: "Imagem institucional · Casa Santa Luzia",
    source: "https://www.santaluzia.com.br/institucional/nossa-historia",
  },
  "sonda-itaberaba": {
    url: "https://sondadelivery.com.br/Arquivos/Loja/22.jpg?v=01072026101903",
    label: "Fachada · Sonda Itaberaba",
    source: "https://sondadelivery.com.br/delivery/LojasFisicas",
  },
  "sonda-jacana": {
    url: "https://sondadelivery.com.br/Arquivos/Loja/24.jpg?v=15012026153349",
    label: "Fachada · Sonda Jaçanã",
    source: "https://sondadelivery.com.br/delivery/LojasFisicas",
  },
};
