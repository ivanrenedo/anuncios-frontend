"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ShoppingBag,
  Tag,
  User,
  Shield,
  MessageCircle,
  Truck,
  Wallet,
} from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  Icon: React.ElementType;
  color: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqSection[] = [
  {
    title: "Comprar",
    Icon: ShoppingBag,
    color: "var(--color-primary)",
    items: [
      {
        q: "Como contacto a un vendedor?",
        a: "Desde el detalle del producto, pulsa en el nombre del vendedor para ver su perfil. Alli encontraras su telefono o email si los tiene visibles. Tambien puedes contactarle por WhatsApp directamente.",
      },
      {
        q: "Los pagos se hacen dentro de la app?",
        a: "No. Bomelh es una plataforma de anuncios. Los pagos se acuerdan directamente entre comprador y vendedor. Te recomendamos usar metodos seguros y, si es posible, realizar el intercambio en persona.",
      },
      {
        q: "Como se si un vendedor es de confianza?",
        a: "Revisa su perfil: la insignia de verificado indica que ha confirmado su identidad. Tambien puedes consultar sus valoraciones, el numero de seguidores y cuanto tiempo lleva en la plataforma.",
      },
    ],
  },
  {
    title: "Vender",
    Icon: Tag,
    color: "var(--color-tertiary)",
    items: [
      {
        q: "Como publico un anuncio?",
        a: 'Ve a "Publicar", elige el tipo de anuncio (marketplace, vehiculos, inmobiliaria, servicios o empleo), rellena los campos y anade fotos. Revisa la vista previa y pulsa "Publicar".',
      },
      {
        q: "Cuantas fotos puedo subir?",
        a: "Depende de tu plan. Con el plan Gratis puedes subir hasta 4 fotos por anuncio. Los planes Estrella y Premium permiten mas fotos.",
      },
      {
        q: "Puedo editar mi anuncio despues de publicarlo?",
        a: 'Si. Ve a tu perfil, en la seccion "Mis anuncios" encontraras un icono de editar en cada anuncio. Podras modificar cualquier campo, incluyendo fotos, precio y descripcion.',
      },
      {
        q: "Publicar anuncios tiene algun coste?",
        a: "No. Publicar anuncios en Bomelh es completamente gratuito.",
      },
    ],
  },
  {
    title: "Cuenta",
    Icon: User,
    color: "var(--color-secondary)",
    items: [
      {
        q: "Como edito mi perfil?",
        a: 'En tu perfil, pulsa el boton "Editar perfil". Podras cambiar tu nombre, ubicacion, biografia, foto de perfil y foto de portada.',
      },
      {
        q: "Como elimino mi cuenta?",
        a: 'En tu perfil, baja hasta la seccion "Cuenta" y pulsa "Eliminar cuenta". Se borraran permanentemente todos tus datos: anuncios, valoraciones, seguidores y favoritos. Esta accion no se puede deshacer.',
      },
      {
        q: "Puedo ocultar mi telefono o email?",
        a: 'Si. Ve a Ajustes y desactiva "Mostrar telefono" o "Mostrar email". Los demas usuarios no podran verlos en tu perfil publico.',
      },
    ],
  },
  {
    title: "Seguridad",
    Icon: Shield,
    color: "var(--color-danger)",
    items: [
      {
        q: "Como reporto un usuario o anuncio?",
        a: 'En el perfil del usuario o en el detalle del producto, pulsa el boton "Reportar". Elige el motivo y envia tu reporte. Nuestro equipo lo revisara lo antes posible.',
      },
      {
        q: "Que hago si me estafan?",
        a: "Reporta al usuario inmediatamente desde su perfil. Contacta con nuestro equipo de soporte para que podamos tomar medidas. Si la estafa involucra dinero, te recomendamos tambien denunciarlo ante las autoridades locales.",
      },
      {
        q: "Consejos para compras seguras",
        a: "Queda en lugares publicos y concurridos para hacer el intercambio.\nNo envies dinero por adelantado a desconocidos.\nRevisa el producto antes de pagar.\nDesconfia de precios demasiado bajos.\nVerifica el perfil del vendedor: valoraciones, tiempo en la plataforma y verificacion.",
      },
    ],
  },
  {
    title: "Envios y entregas",
    Icon: Truck,
    color: "var(--color-on-surface-variant)",
    items: [
      {
        q: "Como se hace la entrega?",
        a: "La entrega se acuerda entre comprador y vendedor. Lo mas habitual es quedar en persona en un lugar publico. Coordina los detalles por telefono o WhatsApp antes de la cita.",
      },
      {
        q: "Hay envios entre ciudades?",
        a: "Bomelh no gestiona envios, pero muchos vendedores envian productos entre Malabo y Bata usando servicios de transporte locales. Consulta directamente con el vendedor las opciones disponibles y los costes.",
      },
    ],
  },
  {
    title: "Precios y pagos",
    Icon: Wallet,
    color: "var(--color-tertiary)",
    items: [
      {
        q: "En que moneda se publican los precios?",
        a: "Todos los precios se muestran en francos CFA (XAF), la moneda oficial de Guinea Ecuatorial.",
      },
      {
        q: "Se puede negociar el precio?",
        a: "Si. Los precios publicados son orientativos. Puedes contactar al vendedor y negociar directamente. Es una practica habitual y aceptada.",
      },
      {
        q: "Que metodos de pago se usan?",
        a: "El metodo de pago se acuerda entre comprador y vendedor. Los mas comunes en Guinea Ecuatorial son: efectivo, transferencia bancaria y pago movil.",
      },
    ],
  },
  {
    title: "Contacto",
    Icon: MessageCircle,
    color: "var(--color-primary)",
    items: [
      {
        q: "Como contacto al equipo de Bomelh?",
        a: "Puedes escribirnos por email a soporte@marketeg.com o por WhatsApp al +240 222 000 000. Respondemos de lunes a viernes, de 9:00 a 18:00.",
      },
      {
        q: "Cuanto tardan en responder?",
        a: "Intentamos responder en menos de 24 horas en dias laborables. Los reportes de seguridad tienen prioridad y se revisan lo antes posible.",
      },
    ],
  },
];

export default function HelpPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <Link
          href="/"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container/80"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Centro de ayuda
        </h1>
      </div>

      <p className="mb-6 text-sm text-muted">En que podemos ayudarte?</p>

      <div className="space-y-5">
        {FAQ_DATA.map((section) => {
          const SectionIcon = section.Icon;
          return (
            <div
              key={section.title}
              className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-lowest"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 border-b border-outline-variant/20 px-5 py-4">
                <div
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in srgb, ${section.color} 15%, transparent)` }}
                >
                  <SectionIcon
                    size={18}
                    strokeWidth={1.8}
                    style={{ color: section.color }}
                  />
                </div>
                <span className="text-base font-bold text-on-surface">
                  {section.title}
                </span>
              </div>

              {/* Questions */}
              {section.items.map((item, idx) => {
                const key = `${section.title}-${idx}`;
                const isOpen = !!expanded[key];
                return (
                  <div key={key}>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={`flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-surface-container/40 ${
                        idx < section.items.length - 1 || isOpen
                          ? "border-b border-outline-variant/15"
                          : ""
                      }`}
                    >
                      <span className="text-sm font-semibold text-on-surface">
                        {item.q}
                      </span>
                      <ChevronDown
                        size={16}
                        strokeWidth={1.8}
                        className={`shrink-0 text-on-surface-variant transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        className={`px-5 pb-4 ${
                          idx < section.items.length - 1
                            ? "border-b border-outline-variant/15"
                            : ""
                        }`}
                      >
                        <p className="whitespace-pre-line text-[13px] leading-relaxed text-on-surface-variant">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* WhatsApp contact */}
      <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <MessageCircle
            size={20}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0 text-primary"
          />
          <div>
            <p className="text-sm font-bold text-on-surface">
              No encuentras lo que buscas?
            </p>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Escribenos por WhatsApp y te ayudaremos personalmente.
            </p>
            <a
              href="https://wa.me/240222000000?text=Hola%2C%20necesito%20ayuda%20con%20Market%20EG"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition hover:opacity-90"
            >
              <MessageCircle size={14} strokeWidth={2} />
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
