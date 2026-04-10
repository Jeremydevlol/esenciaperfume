import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PagoNokPage() {
  return (
    <>
      <SiteHeader />
      <main className="tpv-result-page">
        <div className="tpv-result-page__card tpv-result-page__card--nok">
          <div className="tpv-result-page__icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="tpv-result-page__title">El pago no se ha completado</h1>
          <p className="tpv-result-page__text">
            Lo sentimos, no hemos podido procesar tu pago. No se ha realizado ningún cargo en tu tarjeta.
          </p>
          <p className="tpv-result-page__text tpv-result-page__text--small">
            Esto puede deberse a fondos insuficientes, datos incorrectos o una cancelación voluntaria.
            Si el problema persiste, contacta con tu banco o escríbenos a{" "}
            <a href="mailto:info@perfumesyaromas.com">info@perfumesyaromas.com</a>.
          </p>
          <div className="tpv-result-page__actions">
            <Link href="/checkout" className="cs_btn cs_style_1 cs_medium">
              Intentar de nuevo
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
