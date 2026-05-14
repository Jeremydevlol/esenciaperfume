"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { trackAddToCart } from "@/lib/tracking";

type Props = {
  product: { sku: string; name: string; price: number; imageUrl: string };
};

export function AddToCartButton({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    trackAddToCart(product.sku, product.name, product.price);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`pd-add-btn${added ? " pd-add-btn--added" : ""}`}
    >
      {added ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          ¡AÑADIDO A LA CESTA!
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          AÑADIR A LA CESTA
        </>
      )}
    </button>
  );
}
