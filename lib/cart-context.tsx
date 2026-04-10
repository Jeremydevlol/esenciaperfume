"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type CartItem = {
  sku: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  lastAdded: Omit<CartItem, "quantity"> | null;
  toastVisible: boolean;
  dismissToast: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "esencia_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Always start with [] so server and client initial render match (no hydration mismatch).
  // localStorage is loaded in the effect below, after hydration is complete.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<Omit<CartItem, "quantity"> | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Load persisted cart after mount (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved) as CartItem[]);
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist cart to localStorage whenever items change (skip the first render)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items, hydrated]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.sku === newItem.sku);
      if (existing) {
        return prev.map((i) =>
          i.sku === newItem.sku ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setLastAdded(newItem);
    setToastVisible(true);
  }, []);

  const dismissToast = useCallback(() => setToastVisible(false), []);

  const removeItem = useCallback((sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku));
  }, []);

  const updateQuantity = useCallback((sku: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.sku !== sku));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.sku === sku ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        hydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart,
        closeCart,
        lastAdded,
        toastVisible,
        dismissToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
