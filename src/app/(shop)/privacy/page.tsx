"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useBusinessContact } from "@/hooks/useBusinessContact";
import { useMemo } from "react";

const LAST_UPDATED = "8 de julio de 2026";

interface Section {
  title: string;
  body: string;
}

const buildSections = (email: string, whatsapp: string): Section[] => [
  {
    title: "1. Responsable del tratamiento",
    body: "El responsable del tratamiento de tus datos personales es Bomelh, plataforma de anuncios clasificados con actividad en Guinea Ecuatorial.\n\nPara cualquier consulta relacionada con tus datos, puedes contactarnos en soporte@marketeg.com.",
  },
  {
    title: "2. Datos que recopilamos",
    body: "Recopilamos los siguientes datos personales:\n\nDatos de registro: nombre, dirección de email y foto de perfil, proporcionados automáticamente por Google Sign-In.\nDatos de perfil: teléfono, ubicación y biografía, que proporcionas voluntariamente.\nContenido publicado: anuncios (textos, fotos, precios), valoraciones y comentarios.\nDatos de uso: productos visitados, búsquedas realizadas y preferencias de notificación.\nDatos técnicos: token de notificaciones push, tipo de dispositivo y sistema operativo.",
  },
  {
    title: "3. Finalidad del tratamiento",
    body: "Utilizamos tus datos para:\n\nGestionar tu cuenta y autenticación: permitirte iniciar sesión y mantener tu perfil.\nPublicar y mostrar anuncios: hacer visibles tus productos y servicios a otros usuarios.\nComunicaciones: enviarte notificaciones sobre actividad en tus anuncios, nuevos seguidores y valoraciones.\nSeguridad: detectar y prevenir fraudes, abusos y actividades ilícitas.\nMejora del servicio: analizar el uso de la plataforma para mejorar la experiencia.\n\nNo utilizamos tus datos para publicidad de terceros ni para perfilado con fines comerciales.",
  },
  {
    title: "4. Base legal",
    body: "Ejecución del servicio: necesitamos tus datos de registro y perfil para proporcionarte el servicio.\nConsentimiento: al registrarte y publicar contenido, consientes el tratamiento de tus datos para los fines descritos.\nInterés legítimo: para la seguridad de la plataforma y la prevención de fraudes.",
  },
  {
    title: "5. Compartición de datos",
    body: 'Tus datos pueden ser visibles o compartidos en estos casos:\n\nPerfil público: tu nombre, foto, ubicación, biografía, anuncios y valoraciones son visibles para todos los usuarios. Tu email y teléfono solo se muestran si activas las opciones "Mostrar email" y "Mostrar teléfono" en los ajustes.\nProveedores técnicos: utilizamos servicios de terceros para el funcionamiento de la app (almacenamiento en la nube, notificaciones push a través de Expo/Firebase). Estos proveedores solo acceden a los datos necesarios para prestar su servicio.\nObligación legal: podemos compartir datos si es requerido por ley o por autoridades competentes de Guinea Ecuatorial.\n\nNo vendemos ni cedemos tus datos personales a terceros para fines comerciales.',
  },
  {
    title: "6. Almacenamiento y seguridad",
    body: "Tus datos se almacenan en servidores protegidos con medidas de seguridad técnicas y organizativas adecuadas, incluyendo:\n\nComunicaciones cifradas (HTTPS/TLS).\nContraseñas y tokens almacenados de forma segura.\nAcceso restringido a los datos por parte del equipo técnico.\n\nConservamos tus datos mientras mantengas tu cuenta activa. Si eliminas tu cuenta, todos tus datos se borran permanentemente de nuestros servidores.",
  },
  {
    title: "7. Tus derechos",
    body: 'Como usuario, tienes derecho a:\n\nAcceso: consultar qué datos tenemos sobre ti. Tu perfil y contenido son visibles desde la app.\nRectificación: modificar tus datos en cualquier momento desde "Editar perfil".\nEliminación: borrar tu cuenta y todos tus datos desde la sección "Cuenta" en tu perfil. La eliminación es permanente e irreversible.\nPortabilidad: solicitar una copia de tus datos contactando con soporte.\nOposición: desactivar las notificaciones desde los ajustes de la app.\n\nPara ejercer cualquiera de estos derechos, contacta con nosotros en soporte@marketeg.com.',
  },
  {
    title: "8. Cookies y tecnologías similares",
    body: "Bomelh utiliza almacenamiento local en el navegador (localStorage) para:\n\nMantener tu sesión iniciada.\nGuardar tus preferencias (tema, idioma, notificaciones).\nAlmacenar datos de perfil en caché para un acceso más rápido.\n\nEstos datos se almacenan únicamente en tu navegador y se eliminan al cerrar sesión.",
  },
  {
    title: "9. Menores de edad",
    body: "Bomelh no está dirigido a menores de 18 años. No recopilamos intencionadamente datos de menores. Si detectamos que un menor se ha registrado, eliminaremos su cuenta y datos asociados.",
  },
  {
    title: "10. Modificaciones",
    body: "Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas o en la legislación aplicable. Los cambios serán efectivos desde su publicación en la aplicación.\n\nTe notificaremos de cambios significativos a través de la app. El uso continuado de Bomelh después de una actualización implica la aceptación de la nueva política.",
  },
  {
    title: "11. Contacto",
    body: `Para cualquier consulta sobre esta Política de Privacidad o el tratamiento de tus datos:\n\n• Email: ${email}\n• Contacto: ${whatsapp}`,
  },
];

export default function PrivacyPage() {
  const { email, phone } = useBusinessContact();
  const sections = useMemo(() => buildSections(email, phone), [email, phone]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container/80"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Política de privacidad
        </h1>
      </div>

      <p className="mb-6 text-xs text-muted">
        Última actualización: {LAST_UPDATED}
      </p>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-base font-bold text-on-surface">
              {section.title}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
