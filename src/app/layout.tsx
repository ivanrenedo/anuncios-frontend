import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SHARE_URL || "https://bomelh.com"),
  title: "Bomelh - Comprar y vender en Guinea Ecuatorial",
  description:
    "El marketplace de Guinea Ecuatorial. Compra y vende moda, tecnología, coches, hogar y servicios cerca de ti.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Bomelh - El marketplace de Guinea Ecuatorial",
    description:
      "Compra y vende cerca de ti, con vendedores verificados. Malabo, Bata y toda Guinea Ecuatorial.",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    locale: "es_GQ",
    type: "website",
  },
  ...(ADSENSE_CLIENT
    ? { other: { "google-adsense-account": ADSENSE_CLIENT } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#006b5e",
};

const themeScript = `(function(){try{var m=localStorage.getItem('market_theme')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

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
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-surface text-on-surface antialiased">
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
        {ADSENSE_CLIENT && (
          <Script
            id="adsense-loader"
            strategy="beforeInteractive"
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
