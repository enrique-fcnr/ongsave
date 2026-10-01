import type { Metadata, Viewport } from "next";
import "@fontsource/geist/latin-400.css";
import "@fontsource/geist/latin-500.css";
import "@fontsource/geist/latin-600.css";
import "./globals.css";
import { PWA } from "@/components/pwa";
export const metadata: Metadata = {
  title: { default: "ONGSave · Uma fotografia inicia um resgate", template: "%s · ONGSave" },
  description:
    "Alimentos encontram novos destinos. Conectamos supermercados, instituições e pessoas que fazem a diferença.",
  applicationName: "ONGSave",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ONGSave" },
  icons: { icon: "/icon.svg", apple: "/icons/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15803D",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PWA />
        {children}
      </body>
    </html>
  );
}
