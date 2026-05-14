/* Global type declarations for tracking scripts */
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetOrAction: string,
      params?: Record<string, unknown>,
    ) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

type CartItem = {
  sku: string;
  name: string;
  price: number;
  quantity: number;
};

export function trackPurchase(
  value: number,
  currency: string,
  items: CartItem[],
) {
  window.gtag?.("event", "purchase", {
    value,
    currency,
    items: items.map((i) => ({
      item_id: i.sku,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });

  window.fbq?.("track", "Purchase", {
    value,
    currency,
    contents: items.map((i) => ({
      id: i.sku,
      quantity: i.quantity,
    })),
    content_type: "product",
  });
}

export function trackAddToCart(sku: string, name: string, price: number) {
  window.gtag?.("event", "add_to_cart", {
    currency: "EUR",
    value: price,
    items: [{ item_id: sku, item_name: name, price, quantity: 1 }],
  });

  window.fbq?.("track", "AddToCart", {
    value: price,
    currency: "EUR",
    contents: [{ id: sku, quantity: 1 }],
    content_name: name,
    content_type: "product",
  });
}

export function trackViewItem(
  sku: string,
  name: string,
  price: number,
  category: string,
) {
  window.gtag?.("event", "view_item", {
    currency: "EUR",
    value: price,
    items: [
      { item_id: sku, item_name: name, price, item_category: category },
    ],
  });

  window.fbq?.("track", "ViewContent", {
    value: price,
    currency: "EUR",
    contents: [{ id: sku, quantity: 1 }],
    content_name: name,
    content_category: category,
    content_type: "product",
  });
}

export function trackBeginCheckout(value: number, items: CartItem[]) {
  window.gtag?.("event", "begin_checkout", {
    currency: "EUR",
    value,
    items: items.map((i) => ({
      item_id: i.sku,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });

  window.fbq?.("track", "InitiateCheckout", {
    value,
    currency: "EUR",
    contents: items.map((i) => ({
      id: i.sku,
      quantity: i.quantity,
    })),
    content_type: "product",
    num_items: items.length,
  });
}
