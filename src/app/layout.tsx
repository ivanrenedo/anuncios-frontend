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
  title: "Market EG — Comprar y vender en Guinea Ecuatorial",
  description:
    "El marketplace de Guinea Ecuatorial. Compra y vende moda, tecnología, coches, hogar y servicios cerca de ti.",
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
