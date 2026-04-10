"use client";

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { TiendaProducto } from "@/lib/tienda-types";
import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  products: TiendaProducto[];
  viewAllHref?: string;
  accentTitle?: boolean;
  accent?: boolean;
  countdownDate?: string;
};

function Countdown({ target }: { target: string }) {
  const [time, setTime] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    const end = new Date(target).getTime();
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTime({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="pss-countdown">
      <span className="pss-countdown__box">{time.h}</span>
      <span className="pss-countdown__sep">:</span>
      <span className="pss-countdown__box">{time.m}</span>
      <span className="pss-countdown__sep">:</span>
      <span className="pss-countdown__box">{time.s}</span>
    </div>
  );
}

export function ProductSliderSection({
  title,
  products,
  viewAllHref = "/shop",
  accent = false,
  countdownDate,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  return (
    <section className={`pss-section${accent ? " pss-section--accent" : ""}`}>
      <div className="container">
        {/* Header row */}
        <div className="pss-header">
          <h2 className="pss-header__title">{title}</h2>
          <div className="pss-header__right">
            {countdownDate && (
              <>
                <span className="pss-header__label">Termina en</span>
                <Countdown target={countdownDate} />
              </>
            )}
            <Link className="pss-header__link" href={viewAllHref}>
              Ver todos →
            </Link>
          </div>
        </div>

        {/* Slider track */}
        <div className="pss-slider-wrap">
          <button
            className="pss-arrow pss-arrow--left"
            onClick={() => scroll("left")}
            aria-label="Anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="pss-track" ref={trackRef}>
            {products.slice(0, 12).map((p) => (
              <div className="pss-slide" key={p.sku}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          <button
            className="pss-arrow pss-arrow--right"
            onClick={() => scroll("right")}
            aria-label="Siguiente"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
