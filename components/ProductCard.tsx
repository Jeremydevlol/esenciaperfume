"use client";

import Link from "next/link";
import { useState } from "react";
import type { TiendaProducto } from "@/lib/tienda-types";
import { useCart } from "@/lib/cart-context";

function formatEuro(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

type Props = { product: TiendaProducto };

export function ProductCard({ product }: Props) {
  const href = `/product/${encodeURIComponent(product.sku)}`;
  const showDiscount = product.pvp != null && product.pvp > product.precio;
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      sku:      product.sku,
      name:     product.nombre,
      price:    product.precio,
      imageUrl: product.imagen,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="pc-card">
      {/* ── Imagen ── */}
      <Link href={href} className="pc-card__img-link" tabIndex={-1} aria-hidden="true">
        <div className="pc-card__img-wrap">
          {showDiscount && product.descuento != null ? (
            <span className="pc-card__badge pc-card__badge--sale">-{product.descuento}%</span>
          ) : (
            <span className="pc-card__badge pc-card__badge--new">NUEVO</span>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imagen}
            alt={product.nombre}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="pc-card__img"
            onError={(e) => {
              const el = e.currentTarget;
              if (!el.src.endsWith("product_1.png")) el.src = "/assets/images/product_1.png";
            }}
          />

          <button
            type="button"
            className={`pc-card__cart-fab${added ? " pc-card__cart-fab--added" : ""}`}
            onClick={handleAddToCart}
            aria-label="Añadir al carrito"
          >
            {added ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            )}
          </button>
        </div>
      </Link>

      {/* ── Info ── */}
      <div className="pc-card__info">
        <div className="pc-card__row-top">
          <h2 className="pc-card__name">
            <Link href={href}>{product.nombre}</Link>
          </h2>
          <div className="pc-card__prices">
            {showDiscount && (
              <span className="pc-card__price-orig">{formatEuro(product.pvp!)}</span>
            )}
            <span className="pc-card__price">{formatEuro(product.precio)}</span>
          </div>
        </div>

        <p className="pc-card__type">{product.marca}</p>

        <div className="pc-card__sizes">
          <span>Regular</span>
          <span>Tester</span>
        </div>
      </div>
    </article>
  );
}
