"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const slides = [
  {
    title: "Todo lo que buscas,\ncerca de ti",
    subtitle: "Miles de anuncios en Guinea Ecuatorial",
    cta: "Explorar ahora",
    href: "/explore",
    from: "#006b5e",
    to: "#13c1ac",
    image:
      "https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Vende lo que ya\nno usas",
    subtitle: "Publica gratis en menos de un minuto",
    cta: "Empezar a vender",
    href: "/post",
    from: "#0058bc",
    to: "#0070eb",
    image:
      "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Coches, motos\ny mucho más",
    subtitle: "Encuentra tu próximo vehículo",
    cta: "Ver coches",
    href: "/explore?cat=coches",
    from: "#8c5000",
    to: "#fb9300",
    image:
      "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

export default function PromoCarousel() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const s = slides[i];

  return (
    <div className="px-4 pt-4 sm:px-6">
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{ backgroundImage: `linear-gradient(120deg, ${s.from}, ${s.to})` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={s.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-700"
        />
        <div className="relative flex flex-col gap-3 px-6 py-8 sm:px-10 sm:py-14">
          <h2 className="max-w-md whitespace-pre-line text-2xl font-extrabold leading-tight text-white sm:text-4xl">
            {s.title}
          </h2>
          <p className="text-sm text-white/85 sm:text-base">{s.subtitle}</p>
          <Link
            href={s.href}
            className="mt-2 inline-flex w-fit rounded-full bg-white px-5 py-2.5 text-sm font-bold text-on-surface shadow-soft transition hover:scale-105"
          >
            {s.cta}
          </Link>
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-6 flex gap-1.5 sm:left-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
