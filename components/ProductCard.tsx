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
  const [showQuick, setShowQuick] = useState(false);

  function handleAddToCart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({ sku: product.sku, name: product.nombre, price: product.precio, imageUrl: product.imagen });
    setAdded(true);
    setShowQuick(false);
    setTimeout(() => setAdded(false), 1800);
  }

  function openQuick(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowQuick(true);
  }

  return (
    <>
      <article className="pc-card" itemScope itemType="https://schema.org/Product">
        {/* ── Imagen ── */}
        <Link href={href} className="pc-card__img-link" tabIndex={-1} aria-hidden="true">
          <div className="pc-card__img-wrap">
            <div className="pc-card__badges">
              {showDiscount && product.descuento != null && (
                <span className="pc-card__badge pc-card__badge--sale">-{product.descuento}%</span>
              )}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imagen}
              alt={product.nombre}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="pc-card__img"
              itemProp="image"
              onError={(e) => {
                const el = e.currentTarget;
                if (!el.src.endsWith("product_1.png")) el.src = "/assets/images/product_1.png";
              }}
            />

            {/* Hover overlay con botón */}
            <div className="pc-card__overlay">
              <button
                type="button"
                className="pc-card__quick-btn"
                onTouchEnd={(e) => { e.preventDefault(); openQuick(e); }}
                onClick={openQuick}
                aria-label="Vista rápida"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Vista rápida
              </button>
            </div>

            {/* FAB carrito — siempre visible en móvil */}
            <button
              type="button"
              className={`pc-card__cart-fab${added ? " pc-card__cart-fab--added" : ""}`}
              onTouchEnd={(e) => { e.preventDefault(); handleAddToCart(e); }}
              onClick={handleAddToCart}
              aria-label="Añadir al carrito"
            >
              {added ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              )}
            </button>
          </div>
        </Link>

        {/* ── Info ── */}
        <div className="pc-card__info">
          {/* Marca en mayúsculas — como druni */}
          <p className="pc-card__brand" itemProp="brand" itemScope itemType="https://schema.org/Brand">
            <span itemProp="name">{product.marca.toUpperCase()}</span>
          </p>

          {/* Nombre del producto */}
          <h2 className="pc-card__name" itemProp="name">
            <Link href={href}>{product.nombre}</Link>
          </h2>

          {/* Tipo · ml */}
          <p className="pc-card__type">
            {product.nombre.includes("@")
              ? <><span className="pc-card__at-tag">@ Caja genérica</span>{product.ml ? ` · ${product.ml}` : ""}</>
              : <>{product.tipo}{product.ml ? ` · ${product.ml}` : ""}</>
            }
          </p>

          {/* Precios */}
          <div className="pc-card__prices" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="priceCurrency" content="EUR" />
            <meta itemProp="availability" content="https://schema.org/InStock" />
            {showDiscount && (
              <span className="pc-card__price-orig">{formatEuro(product.pvp!)}</span>
            )}
            <span className="pc-card__price" itemProp="price" content={String(product.precio)}>
              {formatEuro(product.precio)}
            </span>
          </div>

          {/* Botón añadir — visible en desktop debajo de la info */}
          <button
            type="button"
            className={`pc-card__add-btn${added ? " pc-card__add-btn--added" : ""}`}
            onTouchEnd={(e) => { e.preventDefault(); handleAddToCart(e); }}
            onClick={handleAddToCart}
          >
            {added ? "✓ Añadido" : "Añadir al carrito"}
          </button>
        </div>
      </article>

      {/* ── Quick-add modal ── */}
      {showQuick && (
        <div
          className="qa-overlay"
          onTouchEnd={(e) => { e.preventDefault(); setShowQuick(false); }}
          onClick={() => setShowQuick(false)}
        >
          <div
            className="qa-modal"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="qa-modal__close"
              onTouchEnd={(e) => { e.preventDefault(); setShowQuick(false); }}
              onClick={() => setShowQuick(false)}
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div className="qa-modal__body">
              {/* Imagen */}
              <div className="qa-modal__img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imagen}
                  alt={product.nombre}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.src.endsWith("product_1.png")) el.src = "/assets/images/product_1.png";
                  }}
                />
              </div>

              {/* Info */}
              <div className="qa-modal__info">
                <p className="qa-modal__brand">{product.marca.toUpperCase()}</p>
                <h3 className="qa-modal__name">{product.nombre}</h3>
                {product.ml && <p className="qa-modal__ml">{product.ml}</p>}

                <div className="qa-modal__prices">
                  {showDiscount && <span className="qa-modal__price-orig">{formatEuro(product.pvp!)}</span>}
                  <span className="qa-modal__price">{formatEuro(product.precio)}</span>
                  {showDiscount && product.descuento && (
                    <span className="qa-modal__badge">-{product.descuento}%</span>
                  )}
                </div>

                <div className="qa-modal__tipo">
                  <span className="qa-tipo-tag qa-tipo-tag--active">{product.tipo}</span>
                  {product.nombre.includes("@") && (
                    <span className="qa-tipo-tag qa-tipo-tag--at">@ Caja genérica</span>
                  )}
                </div>

                <button
                  type="button"
                  className="qa-modal__add"
                  onTouchEnd={(e) => { e.preventDefault(); handleAddToCart(e); }}
                  onClick={handleAddToCart}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                  Añadir al carrito
                </button>

                <Link href={href} className="qa-modal__link" onClick={() => setShowQuick(false)}>
                  Ver producto completo →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
