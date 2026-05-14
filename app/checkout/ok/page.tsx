"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const PENDING_ORDER_KEY = "pending_order_data";

export default function PagoOkPage() {
  const { clearCart } = useCart();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    clearCart();

    const raw = localStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return;
    localStorage.removeItem(PENDING_ORDER_KEY);

    try {
      const orderData = JSON.parse(raw);
      fetch("/api/erp/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order_number) {
            setOrderNumber(data.order_number);
          } else {
            console.error("Error ERP (TPV):", data.error);
          }
        })
        .catch((err) => {
          console.error("Error creando pedido ERP (TPV):", err);
        });
    } catch {
      /* ignore parse errors */
    }
  }, [clearCart]);

  return (
    <>
      <SiteHeader />
      <main className="tpv-result-page">
        <div className="tpv-result-page__card tpv-result-page__card--ok">
          {/* Logo */}
          <div className="tpv-result-page__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logosecreto.png" alt="Secreto Digital" />
          </div>

          <div className="tpv-result-page__icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1 className="tpv-result-page__title">¡Pago realizado con éxito!</h1>
          <p className="tpv-result-page__text">
            Gracias por tu compra. Recibirás un correo de confirmación en breve con los detalles de tu pedido.
          </p>
          {orderNumber && (
            <p className="tpv-result-page__text">
              Número de pedido: <strong>{orderNumber}</strong>
            </p>
          )}
          <p className="tpv-result-page__text tpv-result-page__text--small">
            Si tienes alguna duda puedes contactar con nosotros en{" "}
            <a href="mailto:info@perfumesyaromas.com">info@perfumesyaromas.com</a>
          </p>
          <div className="tpv-result-page__actions">
            <Link href="/shop" className="cs_btn cs_style_1 cs_medium">
              Seguir comprando
            </Link>
            <Link href="/" className="tpv-result-page__link">
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
