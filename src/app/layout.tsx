import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bomell — Comprar y vender en Guinea Ecuatorial",
  description:
    "El marketplace de Guinea Ecuatorial. Compra y vende moda, tecnología, coches, hogar y servicios cerca de ti.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#006b5e",
  openGraph: {
    title: "Bomell — El marketplace de Guinea Ecuatorial",
    description:
      "Compra y vende cerca de ti, con vendedores verificados. Malabo, Bata y toda Guinea Ecuatorial.",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    locale: "es_GQ",
    type: "website",
  },
};

// Runs before paint so the correct theme class is on <html> with no flash.
const themeScript = `(function(){try{var m=localStorage.getItem('market_theme')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${manrope.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-surface text-on-surface antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
