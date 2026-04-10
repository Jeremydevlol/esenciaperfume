"use client";

import { useState } from "react";

const GLOSSARY = [
  { term: "EDC",     def: "Eau de Cologne — concentración ligera, ideal para el día." },
  { term: "EDT",     def: "Eau de Toilette — concentración media, muy versátil." },
  { term: "EDP",     def: "Eau de Parfum — concentración alta, mayor duración." },
  { term: "ML",      def: "Mililitros del producto — indica el tamaño del frasco." },
  { term: "REGULAR", def: "El producto va en su caja original tal y como lo encontraría en tiendas." },
  { term: "@",       def: "El producto va en caja genérica blanca o marrón (a veces sin caja) y puede no llevar tapón. Por lo demás es exactamente igual que el Regular y 100% original." },
];

export function ProductLegend() {
  const [open, setOpen] = useState(false);

  return (
    <section className="pl-section">
      <button
        type="button"
        className="pl-toggle"
        onTouchEnd={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="pl-toggle__icon">ℹ️</span>
        <span>Información importante sobre este producto</span>
        <svg
          className={`pl-toggle__arrow${open ? " pl-toggle__arrow--open" : ""}`}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="pl-body">
          {/* Aviso principal */}
          <div className="pl-notice">
            <p>
              ★ Todos nuestros productos son <strong>100% originales</strong>. Este producto puede ir en caja genérica
              y puede que no lleve tapón, pero el producto es original. Las fotografías del producto son <strong>ilustrativas</strong> y
              pueden no coincidir exactamente con el producto que reciba.
            </p>
          </div>

          {/* Significados */}
          <h4 className="pl-gloss__title">Glosario de términos</h4>
          <dl className="pl-gloss">
            {GLOSSARY.map(({ term, def }) => (
              <div key={term} className="pl-gloss__item">
                <dt className="pl-gloss__term">{term}</dt>
                <dd className="pl-gloss__def">{def}</dd>
              </div>
            ))}
          </dl>

          {/* Aviso sobre @ */}
          <div className="pl-notice pl-notice--info">
            <p>
              Los productos con <strong>@</strong> en el nombre van en caja genérica blanca o marrón
              (en ocasiones puede que no lleven ninguna caja) y pueden no llevar tapón — por eso son más baratos que
              los REGULAR. Por lo demás son exactamente iguales y <strong>100% originales</strong>.
              Las fotografías que los ilustran son del producto REGULAR para identificarlo; no se corresponden
              con el envoltorio genérico. Gracias.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
