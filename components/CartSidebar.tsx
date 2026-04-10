"use client";

import { useCart } from "@/lib/cart-context";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatEuro(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export function CartSidebar() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart, isOpen, closeCart } = useCart();

  // Control render/animation: sidebar solo existe en el DOM cuando está abierto o animándose
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  // Bloquea el overlay 350ms al abrir para evitar ghost clicks de iOS Safari
  const [overlayClickable, setOverlayClickable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setOverlayClickable(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateIn(true);
          setTimeout(() => setOverlayClickable(true), 350);
        });
      });
    } else {
      setAnimateIn(false);
      setOverlayClickable(false);
      const t = setTimeout(() => setMounted(false), 340);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay — bloqueado 350ms tras abrir para evitar ghost clicks de iOS */}
      <div
        className={`cart-overlay${animateIn ? " cart-overlay--visible" : ""}`}
        onTouchEnd={(e) => { e.preventDefault(); if (overlayClickable) closeCart(); }}
        onClick={overlayClickable ? closeCart : undefined}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`cart-sidebar${animateIn ? " cart-sidebar--open" : ""}`}
        aria-label="Carrito de compra"
      >
        {/* Header */}
        <div className="cart-sidebar__header">
          <h2 className="cart-sidebar__title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Carrito ({totalItems})
          </h2>
          <button type="button" className="cart-sidebar__close" onTouchEnd={(e) => { e.preventDefault(); closeCart(); }} onClick={closeCart} aria-label="Cerrar carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="cart-sidebar__body">
          {items.length === 0 ? (
            <div className="cart-sidebar__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <p>Tu carrito está vacío</p>
              <Link href="/shop" className="cs_btn cs_style_1 cs_medium" onClick={closeCart}>
                Ver productos
              </Link>
            </div>
          ) : (
            <ul className="cart-sidebar__list">
              {items.map((item) => (
                <li key={item.sku} className="cart-item">
                  <div className="cart-item__img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (!el.src.endsWith("product_1.png")) el.src = "/assets/images/product_1.png";
                      }}
                    />
                  </div>
                  <div className="cart-item__info">
                    <p className="cart-item__name">{item.name}</p>
                    {item.name.includes("@") && (
                      <div className="cart-item__at-notice">
                        <span className="cart-item__at-badge">@ Caja genérica</span>
                        <p className="cart-item__at-text">
                          Este producto se entrega en caja blanca o marrón, no en su embalaje original. El contenido es 100% auténtico — solo el envoltorio exterior difiere.
                        </p>
                      </div>
                    )}
                    {/regular/i.test(item.name) && (
                      <div className="cart-item__regular-notice">
                        <span className="cart-item__regular-badge">✓ Producto Regular</span>
                        <p className="cart-item__regular-text">
                          Este producto se entrega en su caja y embalaje original de fábrica, tal como lo distribuye la marca.
                        </p>
                      </div>
                    )}
                    <p className="cart-item__price">{formatEuro(item.price)}</p>
                    <div className="cart-item__qty">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                        aria-label="Reducir cantidad"
                      >−</button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                        aria-label="Aumentar cantidad"
                      >+</button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cart-item__remove"
                    onClick={() => removeItem(item.sku)}
                    aria-label="Eliminar del carrito"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-sidebar__footer">
            <div className="cart-sidebar__subtotal">
              <span>Subtotal</span>
              <strong>{formatEuro(totalPrice)}</strong>
            </div>
            <p className="cart-sidebar__shipping">Envío calculado en el siguiente paso</p>
            <Link
              href="/checkout"
              className="cs_btn cs_style_1 cs_medium"
              style={{ width: "100%", display: "block", textAlign: "center" }}
              onClick={closeCart}
            >
              Finalizar compra
            </Link>
            <button
              type="button"
              className="cart-sidebar__clear"
              onClick={clearCart}
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
