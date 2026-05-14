"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

function ConfirmacionContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const clearedRef = useRef(false);

  const isPaypal = searchParams.get("paypal") === "1";
  const txId = searchParams.get("tx") || "";
  const isReembolso = searchParams.get("metodo") === "reembolso";
  const orderNumber = searchParams.get("pedido") || "";

  useEffect(() => {
    if (!clearedRef.current) {
      clearCart();
      clearedRef.current = true;
    }
  }, [clearCart]);

  const titulo = isPaypal
    ? "¡Pago con PayPal realizado con éxito!"
    : isReembolso
      ? "¡Pedido confirmado!"
      : "¡Pedido realizado con éxito!";

  const mensaje = isPaypal
    ? "Tu pago ha sido procesado correctamente a través de PayPal."
    : isReembolso
      ? "Tu pedido contra-reembolso ha sido registrado. Abonarás el importe al repartidor cuando recibas tu paquete."
      : "Tu pedido ha sido procesado correctamente.";

  return (
    <>
      <SiteHeader />
      <main className="tpv-result-page">
        <div className="tpv-result-page__card tpv-result-page__card--ok">
          <div className="tpv-result-page__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logosecreto.png" alt="Secreto Digital" />
          </div>

          <div className="tpv-result-page__icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h1 className="tpv-result-page__title">{titulo}</h1>

          <p className="tpv-result-page__text">{mensaje}</p>

          {orderNumber && (
            <p className="tpv-result-page__text">
              Número de pedido: <strong>{orderNumber}</strong>
            </p>
          )}

          {txId && (
            <p className="tpv-result-page__text tpv-result-page__text--small">
              Referencia de transacción: <strong>{txId}</strong>
            </p>
          )}

          <p className="tpv-result-page__text">
            Recibirás un correo de confirmación en breve con los detalles de tu
            pedido.
          </p>

          <p className="tpv-result-page__text tpv-result-page__text--small">
            Si tienes alguna duda puedes contactar con nosotros en{" "}
            <a href="mailto:info@perfumesyaromas.com">
              info@perfumesyaromas.com
            </a>
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

export default function ConfirmacionPage() {
  return (
    <Suspense>
      <ConfirmacionContent />
    </Suspense>
  );
}
