"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const LAST_UPDATED = "8 de julio de 2026";

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: "1. Informacion general",
    body: "Market EG es una plataforma de anuncios clasificados que permite a los usuarios de Guinea Ecuatorial publicar, buscar y contactar sobre productos y servicios. Market EG no es parte en las transacciones entre usuarios y actua unicamente como intermediario tecnologico.\n\nAl registrarte o usar la aplicacion, aceptas estos Terminos y Condiciones en su totalidad. Si no estas de acuerdo, no utilices la plataforma.",
  },
  {
    title: "2. Registro y cuenta",
    body: "Para usar Market EG necesitas crear una cuenta mediante Google Sign-In.\nDebes proporcionar informacion veraz y mantenerla actualizada.\nEres responsable de la seguridad de tu cuenta y de toda actividad que se realice desde ella.\nNo esta permitido crear multiples cuentas ni compartir tu acceso con terceros.\nDebes tener al menos 18 anos para registrarte.",
  },
  {
    title: "3. Publicacion de anuncios",
    body: "Los anuncios deben describir productos o servicios reales y disponibles.\nLas fotos deben corresponder al producto o servicio ofrecido.\nLos precios deben expresarse en francos CFA (XAF) y reflejar el valor real del articulo.\nEsta prohibido publicar anuncios de productos ilegales, falsificados, robados, armas, drogas, medicamentos sin receta, animales protegidos o cualquier articulo cuya venta este prohibida por la legislacion de Guinea Ecuatorial.\nEsta prohibido publicar contenido ofensivo, discriminatorio, violento o sexual.\nMarket EG se reserva el derecho de eliminar cualquier anuncio que incumpla estas normas sin previo aviso.",
  },
  {
    title: "4. Conducta del usuario",
    body: "Debes tratar a otros usuarios con respeto.\nEsta prohibido el acoso, las amenazas, el spam, la suplantacion de identidad y cualquier forma de fraude o estafa.\nNo debes usar la plataforma para fines distintos a la compraventa de productos y servicios legitimos.\nEl incumplimiento de estas normas puede resultar en la suspension o eliminacion permanente de tu cuenta.",
  },
  {
    title: "5. Transacciones entre usuarios",
    body: "Market EG no participa, media ni garantiza las transacciones entre usuarios. No somos responsables de:\n\nLa calidad, seguridad o legalidad de los productos o servicios publicados.\nLa veracidad de los anuncios o la identidad de los usuarios.\nLa capacidad de los vendedores para vender o de los compradores para pagar.\nProblemas derivados de envios, entregas o pagos.\n\nTe recomendamos seguir los consejos de seguridad disponibles en el Centro de ayuda antes de realizar cualquier transaccion.",
  },
  {
    title: "6. Propiedad intelectual",
    body: "El contenido que publicas (textos, fotos, descripciones) sigue siendo de tu propiedad. Sin embargo, al publicarlo en Market EG, nos otorgas una licencia no exclusiva, gratuita y mundial para mostrarlo, distribuirlo y promocionarlo dentro de la plataforma.\n\nLa marca Market EG, su logotipo, diseno y codigo son propiedad de sus creadores y estan protegidos. No esta permitido copiar, modificar ni distribuir ningun elemento de la aplicacion sin autorizacion.",
  },
  {
    title: "7. Proteccion de datos",
    body: "Market EG recopila y trata los siguientes datos personales:\n\nNombre, email y foto de perfil (proporcionados por Google Sign-In).\nTelefono, ubicacion y biografia (proporcionados voluntariamente).\nAnuncios publicados, valoraciones y actividad dentro de la app.\n\nUsamos estos datos para el funcionamiento de la plataforma, la comunicacion con los usuarios y la mejora del servicio. No vendemos ni compartimos tus datos con terceros para fines comerciales.\n\nPuedes solicitar la eliminacion de tus datos eliminando tu cuenta desde la seccion Cuenta de tu perfil.",
  },
  {
    title: "8. Limitacion de responsabilidad",
    body: 'Market EG se proporciona "tal cual", sin garantias de ningun tipo. No garantizamos:\n\nLa disponibilidad ininterrumpida del servicio.\nLa ausencia de errores o vulnerabilidades.\nLos resultados obtenidos mediante el uso de la plataforma.\n\nEn ningun caso Market EG sera responsable de danos directos, indirectos o consecuentes derivados del uso de la plataforma o de transacciones entre usuarios.',
  },
  {
    title: "9. Suspension y eliminacion de cuentas",
    body: "Market EG se reserva el derecho de suspender o eliminar cuentas que:\n\nIncumplan estos Terminos y Condiciones.\nPubliquen contenido ilegal, fraudulento o danino.\nReciban multiples reportes de otros usuarios.\nRealicen un uso abusivo de la plataforma.\n\nLa eliminacion de una cuenta conlleva la eliminacion de todos los datos asociados: anuncios, valoraciones, seguidores y favoritos.",
  },
  {
    title: "10. Modificaciones",
    body: "Market EG puede modificar estos Terminos y Condiciones en cualquier momento. Los cambios seran efectivos desde su publicacion en la aplicacion. El uso continuado de la plataforma despues de un cambio implica la aceptacion de los nuevos terminos.\n\nTe notificaremos de cambios importantes a traves de la aplicacion.",
  },
  {
    title: "11. Contacto",
    body: "Para cualquier consulta sobre estos Terminos y Condiciones, puedes contactarnos en:\n\nEmail: soporte@marketeg.com\nWhatsApp: +240 222 000 000",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container/80"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Terminos y condiciones
        </h1>
      </div>

      <p className="mb-6 text-xs text-muted">
        Ultima actualizacion: {LAST_UPDATED}
      </p>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
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
