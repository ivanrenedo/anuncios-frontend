import type { MetadataRoute } from "next";

/**
 * Web App Manifest — habilita "Añadir a pantalla de inicio" (Android/Chrome
 * y Safari iOS) y le da al shop apariencia de app instalada.
 *
 * Fuente única de estos strings: `src/app/layout.tsx` (metadata) — cualquier
 * cambio en name / theme_color / descripción debería replicarse ahí.
 *
 * Los iconos referenciados existen ya en `public/`:
 *   - /favicon.png (48×48), /favicon-32.png (32×32)
 *   - /icon-192.png, /icon-512.png (PWA)
 *   - /apple-touch-icon.png (iOS)
 *   - /brand/bomelh-mark-512.png (maskable — safe-area friendly)
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bomelh — Comprar y vender en Guinea Ecuatorial",
    short_name: "Bomelh",
    description:
      "El marketplace de Guinea Ecuatorial. Compra y vende moda, tecnología, coches, hogar y servicios cerca de ti.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#006b5e",
    lang: "es-GQ",
    dir: "ltr",
    categories: ["shopping", "business", "lifestyle"],
    icons: [
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Maskable icon con safe-area (el símbolo Bomelh centrado con padding),
      // permite que Android lo recorte a cualquier forma sin cortar el logo.
      {
        src: "/brand/bomelh-mark-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    // Atajos long-press en Android (home screen) para las acciones más
    // frecuentes del marketplace. Mantener a 4 como máximo — Android sólo
    // muestra los primeros 3-4 según fabricante.
    shortcuts: [
      {
        name: "Publicar anuncio",
        short_name: "Publicar",
        description: "Sube un anuncio nuevo en menos de 2 minutos",
        url: "/post",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Explorar",
        short_name: "Explorar",
        description: "Descubre lo nuevo cerca de ti",
        url: "/explore",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Guardados",
        short_name: "Guardados",
        description: "Tus anuncios favoritos",
        url: "/saved",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Planes",
        short_name: "Planes",
        description: "Vende más con un plan de pago",
        url: "/plans",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
