import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { PWA } from "@/components/pwa";
export const metadata: Metadata = {
  title: { default: "ONGSave · Uma fotografia inicia um resgate", template: "%s · ONGSave" },
  description:
    "Alimentos encontram novos destinos. Conectamos supermercados, instituições e pessoas que fazem a diferença.",
  applicationName: "ONGSave",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ONGSave" },
  icons: {
    icon: [
      { url: "/icon.svg?v=brand-20261013", type: "image/svg+xml", sizes: "any" },
      { url: "/icons/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#22694f",
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
