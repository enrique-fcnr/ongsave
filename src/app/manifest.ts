import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ONGSave · Resgate de alimentos",
    short_name: "ONGSave",
    description: "Uma fotografia inicia um resgate completo.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f7faf6",
    theme_color: "#22694f",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
