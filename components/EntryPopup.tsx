"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ANNOUNCEMENTS = [
  {
    eyebrow: "✅ Garantía de autenticidad",
    title: "Todos nuestros productos son 100% originales",
    body: "Los productos con @ van en caja genérica y pueden no llevar tapón, pero el producto es completamente original. Las fotografías son ilustrativas.",
    cta: { label: "Ver ofertas", href: "/shop?sort=descuento" },
  },
  {
    eyebrow: "🚚 Envío rápido",
    title: "Envío GRATIS en pedidos superiores a 50€",
    body: "Recibe tus perfumes favoritos en casa en 24–48h. Devolución gratuita en 30 días.",
    cta: { label: "Ver toda la tienda", href: "/shop" },
  },
];

/** Popup de anuncios — aparece 3s después de la primera visita (o cada 3 días) */
export function EntryPopup() {
  const [visible, setVisible] = useState(false);
  const [idx] = useState(() => Math.floor(Math.random() * ANNOUNCEMENTS.length));

  useEffect(() => {
    const last = localStorage.getItem("ep_popup_seen");
    if (last && Date.now() - Number(last) < 3 * 24 * 60 * 60 * 1000) return;
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  function close() {
    localStorage.setItem("ep_popup_seen", String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  const ann = ANNOUNCEMENTS[idx];

  return (
    <div
      className="ep-popup-overlay"
      onTouchEnd={(e) => { e.preventDefault(); close(); }}
      onClick={close}
    >
      <div
        className="ep-popup ep-popup--announce"
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Anuncio"
      >
        <button
          type="button"
          className="ep-popup__close"
          onTouchEnd={(e) => { e.preventDefault(); close(); }}
          onClick={close}
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Imagen lateral */}
        <div className="ep-popup__img" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/banner1.png" alt="" />
        </div>

        {/* Contenido */}
        <div className="ep-popup__body">
          <p className="ep-popup__eyebrow">{ann.eyebrow}</p>
          <h2 className="ep-popup__title">{ann.title}</h2>
          <p className="ep-popup__sub">{ann.body}</p>

          <div className="ep-popup__actions">
            <Link
              href={ann.cta.href}
              className="ep-popup__submit"
              onClick={close}
              onTouchEnd={(e) => { e.stopPropagation(); close(); }}
            >
              {ann.cta.label}
            </Link>
            <button
              type="button"
              className="ep-popup__skip"
              onTouchEnd={(e) => { e.preventDefault(); close(); }}
              onClick={close}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
