"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

function formatEuro(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

const ENVIO = 0; // PRUEBAS: envío desactivado temporalmente
const ENVIO_GRATIS_DESDE = 0;

const PROVINCIAS = [
  "Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Baleares",
  "Barcelona","Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ciudad Real",
  "Córdoba","La Coruña","Cuenca","Gerona","Granada","Guadalajara","Guipúzcoa",
  "Huelva","Huesca","Jaén","León","Lérida","Lugo","Madrid","Málaga","Murcia",
  "Navarra","Orense","Palencia","Las Palmas","Pontevedra","La Rioja","Salamanca",
  "Santa Cruz de Tenerife","Segovia","Sevilla","Soria","Tarragona","Teruel","Toledo",
  "Valencia","Valladolid","Vizcaya","Zamora","Zaragoza","Ceuta","Melilla",
];

/** Primeros 2 dígitos del CP → provincia española */
const CP_PROVINCIA: Record<string, string> = {
  "01":"Álava","02":"Albacete","03":"Alicante","04":"Almería","05":"Ávila",
  "06":"Badajoz","07":"Baleares","08":"Barcelona","09":"Burgos","10":"Cáceres",
  "11":"Cádiz","12":"Castellón","13":"Ciudad Real","14":"Córdoba","15":"La Coruña",
  "16":"Cuenca","17":"Gerona","18":"Granada","19":"Guadalajara","20":"Guipúzcoa",
  "21":"Huelva","22":"Huesca","23":"Jaén","24":"León","25":"Lérida","26":"La Rioja",
  "27":"Lugo","28":"Madrid","29":"Málaga","30":"Murcia","31":"Navarra","32":"Orense",
  "33":"Asturias","34":"Palencia","35":"Las Palmas","36":"Pontevedra","37":"Salamanca",
  "38":"Santa Cruz de Tenerife","39":"Cantabria","40":"Segovia","41":"Sevilla",
  "42":"Soria","43":"Tarragona","44":"Teruel","45":"Toledo","46":"Valencia",
  "47":"Valladolid","48":"Vizcaya","49":"Zamora","50":"Zaragoza","51":"Ceuta","52":"Melilla",
};

type TpvParams = {
  endpoint: string;
  MerchantID: string;
  AcquirerBIN: string;
  TerminalID: string;
  Num_operacion: string;
  Importe: string;
  TipoMoneda: string;
  Exponente: string;
  Cifrado: string;
  Pago_soportado: string;
  Idioma: string;
  URL_OK: string;
  URL_NOK: string;
  Firma: string;
};

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const formRef = useRef<HTMLFormElement>(null);

  // Datos de contacto
  const [nombre,   setNombre]   = useState("");
  const [email,    setEmail]    = useState("");
  const [telefono, setTelefono] = useState("");

  // Dirección de envío
  const [direccion, setDireccion] = useState("");
  const [cp,        setCp]        = useState("");
  const [ciudad,    setCiudad]    = useState("");
  const [provincia, setProvincia] = useState("");

  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [tpvParams,   setTpvParams]   = useState<TpvParams | null>(null);
  const [cpLooking,   setCpLooking]   = useState(false);   // spinner mientras busca
  const [cpError,     setCpError]     = useState("");       // CP no encontrado

  const envio      = totalPrice >= ENVIO_GRATIS_DESDE ? 0 : ENVIO;
  const totalFinal = totalPrice + envio;

  // Auto-submit hidden form when TPV params arrive
  useEffect(() => {
    if (tpvParams && formRef.current) {
      formRef.current.submit();
    }
  }, [tpvParams]);

  // Auto-relleno ciudad y provincia al introducir CP (5 dígitos)
  useEffect(() => {
    const digits = cp.replace(/\D/g, "");
    if (digits.length !== 5) { setCpError(""); return; }

    // Provincia instantánea por prefijo
    const prefix = digits.slice(0, 2);
    const prov = CP_PROVINCIA[prefix];
    if (prov) setProvincia(prov);

    // Ciudad desde API zippopotam.us (gratuita, sin clave)
    const controller = new AbortController();
    setCpLooking(true);
    setCpError("");

    fetch(`https://api.zippopotam.us/es/${digits}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        const place = data?.places?.[0]?.["place name"];
        if (place) setCiudad(place);
        else setCpError("CP no encontrado — introduce la ciudad manualmente");
      })
      .catch((err) => {
        if (err.name !== "AbortError")
          setCpError("No se pudo obtener la ciudad — introdúcela manualmente");
      })
      .finally(() => setCpLooking(false));

    return () => controller.abort();
  }, [cp]);

  async function handlePagar(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tpv/crear-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalEuros: totalFinal }),
      });

      if (!res.ok) throw new Error("Error al conectar con el TPV");

      const params: TpvParams = await res.json();
      setTpvParams(params);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  if (items.length === 0 && !tpvParams) {
    return (
      <>
        <SiteHeader />
        <main className="checkout-empty">
          <div className="checkout-empty__inner">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.3">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <h2>Tu carrito está vacío</h2>
            <p>Añade productos antes de finalizar la compra.</p>
            <Link href="/shop" className="cs_btn cs_style_1 cs_medium">
              Ver productos
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />

      {/* Hidden TPV form — auto-submitted when params arrive */}
      {tpvParams && (
        <form
          ref={formRef}
          method="POST"
          action={tpvParams.endpoint}
          style={{ display: "none" }}
        >
          <input type="hidden" name="MerchantID"     value={tpvParams.MerchantID} />
          <input type="hidden" name="AcquirerBIN"    value={tpvParams.AcquirerBIN} />
          <input type="hidden" name="TerminalID"     value={tpvParams.TerminalID} />
          <input type="hidden" name="Num_operacion"  value={tpvParams.Num_operacion} />
          <input type="hidden" name="Importe"        value={tpvParams.Importe} />
          <input type="hidden" name="TipoMoneda"     value={tpvParams.TipoMoneda} />
          <input type="hidden" name="Exponente"      value={tpvParams.Exponente} />
          <input type="hidden" name="Cifrado"        value={tpvParams.Cifrado} />
          <input type="hidden" name="Pago_soportado" value={tpvParams.Pago_soportado} />
          <input type="hidden" name="Idioma"         value={tpvParams.Idioma} />
          <input type="hidden" name="URL_OK"         value={tpvParams.URL_OK} />
          <input type="hidden" name="URL_NOK"        value={tpvParams.URL_NOK} />
          <input type="hidden" name="Firma"          value={tpvParams.Firma} />
        </form>
      )}

      <main className="checkout-page">
        <div className="checkout-page__inner">
          <h1 className="checkout-page__title">Finalizar compra</h1>

          <div className="checkout-layout">
            {/* ─── Formulario ─── */}
            <section className="checkout-form-section">
              <form onSubmit={handlePagar} className="checkout-form">

                {/* BLOQUE 1: Datos personales */}
                <div className="checkout-block">
                  <h2 className="checkout-section-title">
                    <span className="checkout-section-num">1</span>
                    Datos de contacto
                  </h2>
                  <div className="checkout-field">
                    <label htmlFor="nombre">Nombre completo *</label>
                    <input id="nombre" type="text" required
                      value={nombre} onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre y apellidos" />
                  </div>
                  <div className="checkout-row-2">
                    <div className="checkout-field">
                      <label htmlFor="email">Correo electrónico *</label>
                      <input id="email" type="email" required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com" />
                    </div>
                    <div className="checkout-field">
                      <label htmlFor="telefono">Teléfono *</label>
                      <input id="telefono" type="tel" required
                        value={telefono} onChange={(e) => setTelefono(e.target.value)}
                        placeholder="612 345 678" />
                    </div>
                  </div>
                </div>

                {/* BLOQUE 2: Dirección de envío */}
                <div className="checkout-block">
                  <h2 className="checkout-section-title">
                    <span className="checkout-section-num">2</span>
                    Dirección de envío
                  </h2>
                  <div className="checkout-field">
                    <label htmlFor="direccion">Calle y número *</label>
                    <input id="direccion" type="text" required
                      value={direccion} onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: Calle Mayor 12, 3º izda" />
                  </div>
                  <div className="checkout-row-3">
                    <div className="checkout-field">
                      <label htmlFor="cp">Código postal *</label>
                      <input id="cp" type="text" required pattern="[0-9]{5}"
                        maxLength={5} inputMode="numeric"
                        value={cp} onChange={(e) => setCp(e.target.value.replace(/\D/g, ""))}
                        placeholder="28001" />
                    </div>
                    <div className="checkout-field checkout-field--grow">
                      <label htmlFor="ciudad">
                        Ciudad / Municipio *
                        {cpLooking && <span className="checkout-cp-spinner" aria-label="Buscando…" />}
                      </label>
                      <input id="ciudad" type="text" required
                        value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                        placeholder={cpLooking ? "Buscando…" : "Ej: Madrid"} />
                      {cpError && <p className="checkout-cp-error">{cpError}</p>}
                    </div>
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="provincia">Provincia *</label>
                    <select id="provincia" required
                      value={provincia} onChange={(e) => setProvincia(e.target.value)}
                      className="checkout-select">
                      <option value="">Selecciona provincia…</option>
                      {PROVINCIAS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* BLOQUE 3: Pago */}
                <div className="checkout-block checkout-block--pay">
                  <h2 className="checkout-section-title">
                    <span className="checkout-section-num">3</span>
                    Pago seguro
                  </h2>
                  <p className="checkout-pay-info">
                    Serás redirigido a la pasarela de pago de Cecabank donde podrás
                    introducir los datos de tu tarjeta de forma segura.
                  </p>

                  {error && <p className="checkout-error">{error}</p>}

                  <button type="submit" className="checkout-pay-btn"
                    disabled={loading || items.length === 0}>
                    {loading ? (
                      <>
                        <span className="checkout-spinner" />
                        Conectando con el banco…
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                          <line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                        Pagar {formatEuro(totalFinal)} de forma segura
                      </>
                    )}
                  </button>

                  <p className="checkout-secure-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Cifrado SSL · Cecabank · Sin almacenamiento de datos de tarjeta
                  </p>
                </div>
              </form>
            </section>

            {/* ─── Resumen del pedido ─── */}
            <aside className="checkout-summary">
              <h2 className="checkout-section-title">Tu pedido</h2>
              <ul className="checkout-items">
                {items.map((item) => (
                  <li key={item.sku} className="checkout-item">
                    <div className="checkout-item__img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (!el.src.endsWith("product_1.png")) el.src = "/assets/images/product_1.png";
                        }}
                      />
                      <span className="checkout-item__qty">{item.quantity}</span>
                    </div>
                    <div className="checkout-item__info">
                      <p className="checkout-item__name">{item.name}</p>
                      <p className="checkout-item__price">{formatEuro(item.price * item.quantity)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="checkout-totals">
                <div className="checkout-totals__row">
                  <span>Subtotal</span>
                  <span>{formatEuro(totalPrice)}</span>
                </div>
                <div className="checkout-totals__row">
                  <span>Envío</span>
                  <span>{envio === 0 ? "✓ Gratis" : formatEuro(envio)}</span>
                </div>
                {envio > 0 && (
                  <p className="checkout-totals__free-note">
                    ¡{formatEuro(ENVIO_GRATIS_DESDE - totalPrice)} más para envío gratis!
                  </p>
                )}
                <div className="checkout-totals__row checkout-totals__total">
                  <span>Total</span>
                  <strong>{formatEuro(totalFinal)}</strong>
                </div>
              </div>

              <div className="checkout-payment-logos">
                <p className="checkout-payment-logos__label">Formas de pago aceptadas:</p>
                <div className="checkout-payment-logos__badges">
                  <span className="checkout-badge">VISA</span>
                  <span className="checkout-badge">Mastercard</span>
                </div>
              </div>

              <div className="checkout-summary-guarantee">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Compra 100% segura y protegida
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
