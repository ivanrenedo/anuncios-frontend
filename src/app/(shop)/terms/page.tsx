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
    title: "1. Información general",
    body: "Bomelh es una plataforma de anuncios clasificados que permite a los usuarios de Guinea Ecuatorial publicar, buscar y contactar sobre productos y servicios. Bomelh no es parte en las transacciones entre usuarios y actúa únicamente como intermediario tecnológico.\n\nAl registrarte o usar la aplicación, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no utilices la plataforma.",
  },
  {
    title: "2. Registro y cuenta",
    body: "Para usar Bomelh necesitas crear una cuenta mediante Google Sign-In.\nDebes proporcionar información veraz y mantenerla actualizada.\nEres responsable de la seguridad de tu cuenta y de toda actividad que se realice desde ella.\nNo está permitido crear múltiples cuentas ni compartir tu acceso con terceros.\nDebes tener al menos 18 años para registrarte.",
  },
  {
    title: "3. Publicación de anuncios",
    body: "Los anuncios deben describir productos o servicios reales y disponibles.\nLas fotos deben corresponder al producto o servicio ofrecido.\nLos precios deben expresarse en francos CFA (XAF) y reflejar el valor real del artículo.\nEstá prohibido publicar anuncios de productos ilegales, falsificados, robados, armas, drogas, medicamentos sin receta, animales protegidos o cualquier artículo cuya venta esté prohibida por la legislación de Guinea Ecuatorial.\nEstá prohibido publicar contenido ofensivo, discriminatorio, violento o sexual.\nBomelh se reserva el derecho de eliminar cualquier anuncio que incumpla estas normas sin previo aviso.",
  },
  {
    title: "4. Conducta del usuario",
    body: "Debes tratar a otros usuarios con respeto.\nEstá prohibido el acoso, las amenazas, el spam, la suplantación de identidad y cualquier forma de fraude o estafa.\nNo debes usar la plataforma para fines distintos a la compraventa de productos y servicios legítimos.\nEl incumplimiento de estas normas puede resultar en la suspensión o eliminación permanente de tu cuenta.",
  },
  {
    title: "5. Transacciones entre usuarios",
    body: "Bomelh no participa, media ni garantiza las transacciones entre usuarios. No somos responsables de:\n\nLa calidad, seguridad o legalidad de los productos o servicios publicados.\nLa veracidad de los anuncios o la identidad de los usuarios.\nLa capacidad de los vendedores para vender o de los compradores para pagar.\nProblemas derivados de envíos, entregas o pagos.\n\nTe recomendamos seguir los consejos de seguridad disponibles en el Centro de ayuda antes de realizar cualquier transacción.",
  },
  {
    title: "6. Propiedad intelectual",
    body: "El contenido que publicas (textos, fotos, descripciones) sigue siendo de tu propiedad. Sin embargo, al publicarlo en Bomelh, nos otorgas una licencia no exclusiva, gratuita y mundial para mostrarlo, distribuirlo y promocionarlo dentro de la plataforma.\n\nLa marca Bomelh, su logotipo, diseño y código son propiedad de sus creadores y están protegidos. No está permitido copiar, modificar ni distribuir ningún elemento de la aplicación sin autorización.",
  },
  {
    title: "7. Protección de datos",
    body: "Bomelh recopila y trata los siguientes datos personales:\n\nNombre, email y foto de perfil (proporcionados por Google Sign-In).\nTeléfono, ubicación y biografía (proporcionados voluntariamente).\nAnuncios publicados, valoraciones y actividad dentro de la app.\n\nUsamos estos datos para el funcionamiento de la plataforma, la comunicación con los usuarios y la mejora del servicio. No vendemos ni compartimos tus datos con terceros para fines comerciales.\n\nPuedes solicitar la eliminación de tus datos eliminando tu cuenta desde la sección Cuenta de tu perfil.",
  },
  {
    title: "8. Limitación de responsabilidad",
    body: 'Bomelh se proporciona "tal cual", sin garantías de ningún tipo. No garantizamos:\n\nLa disponibilidad ininterrumpida del servicio.\nLa ausencia de errores o vulnerabilidades.\nLos resultados obtenidos mediante el uso de la plataforma.\n\nEn ningún caso Bomelh será responsable de daños directos, indirectos o consecuentes derivados del uso de la plataforma o de transacciones entre usuarios.',
  },
  {
    title: "9. Suspensión y eliminación de cuentas",
    body: "Bomelh se reserva el derecho de suspender o eliminar cuentas que:\n\nIncumplan estos Términos y Condiciones.\nPubliquen contenido ilegal, fraudulento o dañino.\nReciban múltiples reportes de otros usuarios.\nRealicen un uso abusivo de la plataforma.\n\nLa eliminación de una cuenta conlleva la eliminación de todos los datos asociados: anuncios, valoraciones, seguidores y favoritos.",
  },
  {
    title: "10. Modificaciones",
    body: "Bomelh puede modificar estos Términos y Condiciones en cualquier momento. Los cambios serán efectivos desde su publicación en la aplicación. El uso continuado de la plataforma después de un cambio implica la aceptación de los nuevos términos.\n\nTe notificaremos de cambios importantes a través de la aplicación.",
  },
  {
    title: "11. Contacto",
    body: `Para cualquier consulta sobre estos Términos y Condiciones:\n\n• Email: ${email}\n• Contacto: ${whatsapp}`,
  },
];

export default function TermsPage() {
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
          Términos y condiciones
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
