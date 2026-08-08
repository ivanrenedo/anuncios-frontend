import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bomelh — Comprar y vender en Guinea Ecuatorial",
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
    title: "Bomelh — El marketplace de Guinea Ecuatorial",
    description:
      "Compra y vende cerca de ti, con vendedores verificados. Malabo, Bata y toda Guinea Ecuatorial.",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    locale: "es_GQ",
    type: "website",
  },
};

// Runs before paint so the correct theme class is on <html> with no flash.
const themeScript = `(function(){try{var m=localStorage.getItem('market_theme')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

// Google Consent Mode v2 defaults — DEBE ejecutarse ANTES de que se cargue
// cualquier tag de Google (AdSense, GA4). Empieza con TODO denegado; luego
// el hook `useCookieConsent` empuja la elección real del usuario si ya
// existe en localStorage. Sin esto, Google inicializaría con "unknown" y
// AdSense podría cargar cookies antes de que el usuario decidiera.
const consentDefaultsScript = `
(function(){
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = window.gtag || gtag;
  gtag('consent','default',{
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    analytics_storage:'denied',
    functionality_storage:'denied',
    personalization_storage:'denied',
    security_storage:'granted',
    wait_for_update: 500
  });
  try {
    var raw = localStorage.getItem('bomelh_cookie_consent_v1');
    if (raw) {
      var s = JSON.parse(raw);
      if (s && s.version === 1 && s.categories) {
        var c = s.categories;
        gtag('consent','update',{
          ad_storage: c.advertising ? 'granted':'denied',
          ad_user_data: c.advertising ? 'granted':'denied',
          ad_personalization: c.advertising ? 'granted':'denied',
          analytics_storage: c.analytics ? 'granted':'denied',
          functionality_storage: c.functional ? 'granted':'denied',
          personalization_storage: c.functional ? 'granted':'denied',
          security_storage: 'granted'
        });
      }
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${manrope.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-surface text-on-surface antialiased">
        {/* Ambos scripts deben ejecutarse ANTES de la hidratación. Usamos
            `next/script` con `beforeInteractive` para evitar el warning
            "Encountered a script tag while rendering React component" y para
            que Next los inline en la respuesta SSR. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <Script
          id="consent-defaults"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: consentDefaultsScript }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
