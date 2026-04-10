"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";

/** Toast que aparece en la parte inferior de la pantalla al añadir un producto al carrito */
export function CartToast() {
  const { lastAdded, toastVisible, dismissToast, openCart } = useCart();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep the last item in local state so the exit animation can still show it
  const [displayed, setDisplayed] = useState<typeof lastAdded>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (toastVisible && lastAdded) {
      setDisplayed(lastAdded);
      setExiting(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      // Auto dismiss after 3 s
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(() => dismissToast(), 220);
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toastVisible, lastAdded, dismissToast]);

  if (!displayed || (!toastVisible && !exiting)) return null;

  function handleClose() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => dismissToast(), 220);
  }

  function handleViewCart() {
    handleClose();
    openCart();
  }

  return (
    <div
      className={`ct-toast${exiting ? " ct-toast--exit" : ""}`}
      role="status"
      aria-live="polite"
    >
      {/* Imagen del producto */}
      {displayed.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="ct-toast__img"
          src={displayed.imageUrl}
          alt={displayed.name}
        />
      ) : (
        <div className="ct-toast__img-placeholder">🛒</div>
      )}

      {/* Texto */}
      <div className="ct-toast__body">
        <p className="ct-toast__label">✓ Añadido al carrito</p>
        <p className="ct-toast__name">{displayed.name}</p>
        <p className="ct-toast__sub">
          {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(displayed.price)}
        </p>
      </div>

      {/* Botón ver carrito */}
      <button
        type="button"
        className="ct-toast__cta"
        style={{
          background: "#fff",
          color: "#111",
          border: "none",
          borderRadius: "6px",
          padding: "6px 10px",
          fontSize: "11px",
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
          pointerEvents: "auto",
          whiteSpace: "nowrap",
          touchAction: "manipulation",
        }}
        onTouchEnd={(e) => { e.preventDefault(); handleViewCart(); }}
        onClick={handleViewCart}
      >
        Ver carrito
      </button>
    </div>
  );
}
