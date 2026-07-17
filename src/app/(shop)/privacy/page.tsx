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
    title: "1. Responsable del tratamiento",
    body: "El responsable del tratamiento de tus datos personales es Market EG, plataforma de anuncios clasificados con actividad en Guinea Ecuatorial.\n\nPara cualquier consulta relacionada con tus datos, puedes contactarnos en soporte@marketeg.com.",
  },
  {
    title: "2. Datos que recopilamos",
    body: "Recopilamos los siguientes datos personales:\n\nDatos de registro: nombre, direccion de email y foto de perfil, proporcionados automaticamente por Google Sign-In.\nDatos de perfil: telefono, ubicacion y biografia, que proporcionas voluntariamente.\nContenido publicado: anuncios (textos, fotos, precios), valoraciones y comentarios.\nDatos de uso: productos visitados, busquedas realizadas y preferencias de notificacion.\nDatos tecnicos: token de notificaciones push, tipo de dispositivo y sistema operativo.",
  },
  {
    title: "3. Finalidad del tratamiento",
    body: "Utilizamos tus datos para:\n\nGestionar tu cuenta y autenticacion: permitirte iniciar sesion y mantener tu perfil.\nPublicar y mostrar anuncios: hacer visibles tus productos y servicios a otros usuarios.\nComunicaciones: enviarte notificaciones sobre actividad en tus anuncios, nuevos seguidores y valoraciones.\nSeguridad: detectar y prevenir fraudes, abusos y actividades ilicitas.\nMejora del servicio: analizar el uso de la plataforma para mejorar la experiencia.\n\nNo utilizamos tus datos para publicidad de terceros ni para perfilado con fines comerciales.",
  },
  {
    title: "4. Base legal",
    body: "Ejecucion del servicio: necesitamos tus datos de registro y perfil para proporcionarte el servicio.\nConsentimiento: al registrarte y publicar contenido, consientes el tratamiento de tus datos para los fines descritos.\nInteres legitimo: para la seguridad de la plataforma y la prevencion de fraudes.",
  },
  {
    title: "5. Comparticion de datos",
    body: 'Tus datos pueden ser visibles o compartidos en estos casos:\n\nPerfil publico: tu nombre, foto, ubicacion, biografia, anuncios y valoraciones son visibles para todos los usuarios. Tu email y telefono solo se muestran si activas las opciones "Mostrar email" y "Mostrar telefono" en los ajustes.\nProveedores tecnicos: utilizamos servicios de terceros para el funcionamiento de la app (almacenamiento en la nube, notificaciones push a traves de Expo/Firebase). Estos proveedores solo acceden a los datos necesarios para prestar su servicio.\nObligacion legal: podemos compartir datos si es requerido por ley o por autoridades competentes de Guinea Ecuatorial.\n\nNo vendemos ni cedemos tus datos personales a terceros para fines comerciales.',
  },
  {
    title: "6. Almacenamiento y seguridad",
    body: "Tus datos se almacenan en servidores protegidos con medidas de seguridad tecnicas y organizativas adecuadas, incluyendo:\n\nComunicaciones cifradas (HTTPS/TLS).\nContrasenas y tokens almacenados de forma segura.\nAcceso restringido a los datos por parte del equipo tecnico.\n\nConservamos tus datos mientras mantengas tu cuenta activa. Si eliminas tu cuenta, todos tus datos se borran permanentemente de nuestros servidores.",
  },
  {
    title: "7. Tus derechos",
    body: 'Como usuario, tienes derecho a:\n\nAcceso: consultar que datos tenemos sobre ti. Tu perfil y contenido son visibles desde la app.\nRectificacion: modificar tus datos en cualquier momento desde "Editar perfil".\nEliminacion: borrar tu cuenta y todos tus datos desde la seccion "Cuenta" en tu perfil. La eliminacion es permanente e irreversible.\nPortabilidad: solicitar una copia de tus datos contactando con soporte.\nOposicion: desactivar las notificaciones desde los ajustes de la app.\n\nPara ejercer cualquiera de estos derechos, contacta con nosotros en soporte@marketeg.com.',
  },
  {
    title: "8. Cookies y tecnologias similares",
    body: "Market EG utiliza almacenamiento local en el navegador (localStorage) para:\n\nMantener tu sesion iniciada.\nGuardar tus preferencias (tema, idioma, notificaciones).\nAlmacenar datos de perfil en cache para un acceso mas rapido.\n\nEstos datos se almacenan unicamente en tu navegador y se eliminan al cerrar sesion.",
  },
  {
    title: "9. Menores de edad",
    body: "Market EG no esta dirigido a menores de 18 anos. No recopilamos intencionadamente datos de menores. Si detectamos que un menor se ha registrado, eliminaremos su cuenta y datos asociados.",
  },
  {
    title: "10. Modificaciones",
    body: "Podemos actualizar esta Politica de Privacidad para reflejar cambios en nuestras practicas o en la legislacion aplicable. Los cambios seran efectivos desde su publicacion en la aplicacion.\n\nTe notificaremos de cambios significativos a traves de la app. El uso continuado de Market EG despues de una actualizacion implica la aceptacion de la nueva politica.",
  },
  {
    title: "11. Contacto",
    body: "Para cualquier consulta sobre esta Politica de Privacidad o el tratamiento de tus datos:\n\nEmail: soporte@marketeg.com\nWhatsApp: +240 222 000 000",
  },
];

export default function PrivacyPage() {
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
          Politica de privacidad
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
