"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCart } from "@/lib/cart-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useRouter } from "next/navigation";
import { trackBeginCheckout } from "@/lib/tracking";

function formatEuro(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

const ENVIO = 5.99;
const ENVIO_GRATIS_DESDE = 100;
const PAYPAL_SURCHARGE = 0.02;   // 2% extra por gestión PayPal
const REEMBOLSO_FEE   = 3.00;   // suplemento contra-reembolso

const PROVINCIAS = [
  "── España ──",
  "Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Baleares",
  "Barcelona","Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ciudad Real",
  "Córdoba","La Coruña","Cuenca","Gerona","Granada","Guadalajara","Guipúzcoa",
  "Huelva","Huesca","Jaén","León","Lérida","Lugo","Madrid","Málaga","Murcia",
  "Navarra","Orense","Palencia","Las Palmas","Pontevedra","La Rioja","Salamanca",
  "Santa Cruz de Tenerife","Segovia","Sevilla","Soria","Tarragona","Teruel","Toledo",
  "Valencia","Valladolid","Vizcaya","Zamora","Zaragoza","Ceuta","Melilla",
  "── Portugal Continental ──",
  "Portugal",
];

/** Prefijos CP de zonas sin servicio de envío */
const BANNED_CP_PREFIXES = new Set(["35", "38"]); // Canarias (Las Palmas, Tenerife)

/** Provincias sin servicio de envío */
const BANNED_PROVINCES = new Set(["Las Palmas", "Santa Cruz de Tenerife"]);

/** Mensaje de error para zona no cubierta */
function getBannedZoneMsg(zona: string): string {
  return `❌ Lo sentimos, no realizamos envíos a ${zona}. Servimos pedidos a España Peninsular y Portugal Continental únicamente.`;
}

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

type PayMethod = "tarjeta" | "paypal" | "reembolso";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const router  = useRouter();

  // Método de pago seleccionado
  const [payMethod, setPayMethod] = useState<PayMethod>("tarjeta");

  // Datos de contacto
  const [nombre,   setNombre]   = useState("");
  const [email,    setEmail]    = useState("");
  const [telefono, setTelefono] = useState("");

  // Dirección de envío
  const [direccion, setDireccion] = useState("");
  const [cp,        setCp]        = useState("");
  const [ciudad,    setCiudad]    = useState("");
  const [provincia, setProvincia] = useState("");

  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [tpvParams,      setTpvParams]      = useState<TpvParams | null>(null);
  const [cpLooking,      setCpLooking]      = useState(false);
  const [cpError,        setCpError]        = useState("");
  const [zoneError,      setZoneError]      = useState("");       // zona sin envío
  const [paypalError,    setPaypalError]    = useState("");
  const [reembolsoSent,  setReembolsoSent]  = useState(false);

  const envio           = totalPrice >= ENVIO_GRATIS_DESDE ? 0 : ENVIO;
  const totalBase       = totalPrice + envio;
  const paypalSurcharge = Math.round(totalBase * PAYPAL_SURCHARGE * 100) / 100;
  const totalPaypal     = Math.round((totalBase + paypalSurcharge) * 100) / 100;
  const totalReembolso  = Math.round((totalBase + REEMBOLSO_FEE) * 100) / 100;
  // totalFinal según método seleccionado
  const totalFinal = payMethod === "paypal"
    ? totalPaypal
    : payMethod === "reembolso"
      ? totalReembolso
      : totalBase;

  // Track begin_checkout on page load
  useEffect(() => {
    if (items.length === 0) return;
    trackBeginCheckout(
      totalPrice,
      items.map((i) => ({
        sku: i.sku,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildErpPayload(paymentMethod: string, paymentRef: string) {
    const nameParts = nombre.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      items: items.map((i) => ({
        sku: i.sku,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      customer: {
        email,
        first_name: firstName,
        last_name: lastName,
        phone: telefono,
      },
      shipping: {
        name: nombre,
        phone: telefono,
        address: {
          street: direccion,
          city: ciudad,
          province: provincia,
          postal_code: cp,
          country: provincia === "Portugal" ? "PT" : "ES",
        },
      },
      payment_method: paymentMethod,
      payment_ref: paymentRef,
      subtotal: totalPrice,
      shipping_cost: envio,
      total:
        paymentMethod === "paypal"
          ? totalPaypal
          : paymentMethod === "contrareembolso"
            ? totalReembolso
            : totalBase,
    };
  }

  // Auto-submit hidden form when TPV params arrive
  useEffect(() => {
    if (tpvParams && formRef.current) {
      formRef.current.submit();
    }
  }, [tpvParams]);

  // Auto-relleno ciudad y provincia al introducir CP
  useEffect(() => {
    const raw    = cp.trim();
    const digits = raw.replace(/\D/g, "");

    if (digits.length === 0) { setCpError(""); setZoneError(""); return; }

    // ── Andorra: AD + 3 dígitos ──
    if (/^[Aa][Dd]/i.test(raw)) {
      setZoneError(getBannedZoneMsg("Andorra"));
      setCiudad(""); setProvincia("");
      return;
    }

    // ── Detectar si es CP portugués:
    //    - tiene guión (formato XXXX-XXX), O
    //    - tiene 6+ dígitos sin guión (los CPs españoles son exactamente 5)
    const isPortuguese = raw.includes("-") || digits.length >= 6;

    if (isPortuguese) {
      if (digits.length < 4) { setCpError(""); setZoneError(""); return; }

      const firstFour = parseInt(digits.slice(0, 4).padEnd(4, "0"), 10);

      // Madeira: 9000–9399 → bloqueado
      if (firstFour >= 9000 && firstFour <= 9399) {
        setZoneError(getBannedZoneMsg("Madeira (Portugal)"));
        setCiudad(""); setProvincia("");
        return;
      }
      // Açores: 9400–9980 → bloqueado
      if (firstFour >= 9400 && firstFour <= 9980) {
        setZoneError(getBannedZoneMsg("Açores (Portugal)"));
        setCiudad(""); setProvincia("");
        return;
      }

      setZoneError("");
      if (digits.length !== 7) { setCpError(""); return; }

      setProvincia("Portugal");
      const formattedPt = `${digits.slice(0, 4)}-${digits.slice(4)}`;
      const controller = new AbortController();
      setCpLooking(true); setCpError("");

      fetch(`https://api.zippopotam.us/pt/${formattedPt}`, { signal: controller.signal })
        .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
        .then((data) => {
          const place = data?.places?.[0]?.["place name"];
          if (place) setCiudad(place);
          else setCpError("Código postal no encontrado — introduce la ciudad manualmente");
        })
        .catch((err) => {
          if (err.name !== "AbortError")
            setCpError("No se pudo obtener la ciudad — introdúcela manualmente");
        })
        .finally(() => setCpLooking(false));

      return () => controller.abort();
    }

    // ── CP español ──
    const prefix = digits.slice(0, 2);

    // Canarias — salta desde los 2 primeros dígitos
    if (digits.length >= 2 && BANNED_CP_PREFIXES.has(prefix)) {
      const zona = prefix === "35" ? "Las Palmas (Canarias)" : "Santa Cruz de Tenerife (Canarias)";
      setZoneError(getBannedZoneMsg(zona));
      setCiudad(""); setProvincia("");
      return;
    }

    setZoneError("");
    if (digits.length !== 5) { setCpError(""); return; }

    const prov = CP_PROVINCIA[prefix];
    if (prov) setProvincia(prov);

    const controller = new AbortController();
    setCpLooking(true); setCpError("");

    fetch(`https://api.zippopotam.us/es/${digits}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
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

  /** Valida que todos los campos del formulario estén rellenos */
  function formValido(): boolean {
    return !!(nombre && email && telefono && direccion && cp && ciudad && provincia && !zoneError);
  }

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

      const orderData = buildErpPayload("tpv", params.Num_operacion);
      try {
        localStorage.setItem("pending_order_data", JSON.stringify(orderData));
      } catch { /* ignore storage errors */ }

      setTpvParams(params);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  async function handleReembolso(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || !formValido()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/pedido/contrareembolso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, email, telefono,
          direccion, cp, ciudad, provincia,
          items: items.map((i) => ({ sku: i.sku, name: i.name, qty: i.quantity, price: i.price })),
          totalEuros: totalReembolso,
        }),
      });

      if (!res.ok) throw new Error("Error al registrar el pedido");

      const data = await res.json();
      const pedidoParam = data.order_number ? `&pedido=${data.order_number}` : "";
      router.push(`/confirmacion?metodo=reembolso${pedidoParam}`);
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

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  return (
    <PayPalScriptProvider options={{
      clientId: paypalClientId,
      currency: "EUR",
      locale: "es_ES",
      intent: "capture",
    }}>
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
                      <input id="cp" type="text" required
                        maxLength={8}
                        value={cp}
                        onChange={(e) => {
                          let val = e.target.value;
                          // Andorra: dejar pasar "AD" + dígitos
                          if (/^[Aa][Dd]/i.test(val)) {
                            val = val.replace(/[^ADad0-9]/gi, "").slice(0, 6).toUpperCase();
                          } else {
                            // Solo dígitos y un guión
                            val = val.replace(/[^0-9-]/g, "");
                            const onlyDigits = val.replace(/-/g, "");
                            if (val.includes("-")) {
                              // Mantener formato XXXX-XXX
                              const parts = val.split("-");
                              val = `${parts[0].slice(0,4)}-${(parts[1] || "").slice(0,3)}`;
                            } else if (onlyDigits.length >= 6) {
                              // 6+ dígitos sin guión → formato portugués XXXX-XXX
                              val = `${onlyDigits.slice(0,4)}-${onlyDigits.slice(4,7)}`;
                            }
                            // 1-5 dígitos sin guión → CP español, se deja como está
                          }
                          setCp(val);
                        }}
                        placeholder="28001 / 1000-001"
                        autoComplete="postal-code"
                      />
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
                      value={provincia}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val || val.startsWith("──")) return;
                        setProvincia(val);
                        if (BANNED_PROVINCES.has(val)) {
                          setZoneError(getBannedZoneMsg(val + " (Canarias)"));
                        } else {
                          setZoneError("");
                        }
                      }}
                      className="checkout-select">
                      <option value="">Selecciona provincia…</option>
                      {PROVINCIAS.map((p) => {
                        const isSeparator = p.startsWith("──");
                        return (
                          <option key={p} value={isSeparator ? "" : p} disabled={isSeparator}
                            style={isSeparator ? {color:"#aaa", fontStyle:"italic"} : {}}>
                            {p}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Alerta zona sin envío */}
                  {zoneError && (
                    <div className="checkout-zone-error" role="alert">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>{zoneError}</span>
                    </div>
                  )}
                </div>

                {/* BLOQUE 3: Método de pago */}
                <div className="checkout-block checkout-block--pay">
                  <h2 className="checkout-section-title">
                    <span className="checkout-section-num">3</span>
                    Método de pago
                  </h2>

                  {/* Selector de método */}
                  <div className="checkout-pay-methods">
                    <label
                      className={`checkout-pay-method${payMethod === "tarjeta" ? " checkout-pay-method--active" : ""}`}
                      onClick={() => setPayMethod("tarjeta")}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        value="tarjeta"
                        checked={payMethod === "tarjeta"}
                        onChange={() => setPayMethod("tarjeta")}
                      />
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      <span>Tarjeta bancaria</span>
                      <span className="checkout-pay-method__badges">
                        <span className="checkout-badge checkout-badge--sm">VISA</span>
                        <span className="checkout-badge checkout-badge--sm">MC</span>
                      </span>
                    </label>

                    <label
                      className={`checkout-pay-method${payMethod === "paypal" ? " checkout-pay-method--active" : ""}`}
                      onClick={() => setPayMethod("paypal")}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        value="paypal"
                        checked={payMethod === "paypal"}
                        onChange={() => setPayMethod("paypal")}
                      />
                      {/* Logo PayPal SVG inline */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M7.2 20.9H4.6c-.4 0-.7-.3-.6-.7L6.4 3.8c.1-.3.4-.5.7-.5h6.4c2.8 0 4.7 1.5 4.4 4.3-.4 3.6-2.7 5-5.8 5H9.8L8.5 20c0 .2-.2.4-.4.4l-.9.5z" fill="#253b80"/>
                        <path d="M18.4 8.1c-.3 2.8-2.1 4.3-4.9 4.3h-1.7c-.3 0-.6.3-.7.6l-.8 5.2c0 .2.1.4.3.4h2.3c.3 0 .5-.2.6-.5l.5-3.3c.1-.3.3-.5.6-.5h.8c2.4 0 4-1.2 4.4-3.7.2-1.1 0-2-.6-2.5z" fill="#179bd7"/>
                      </svg>
                      <span>PayPal</span>
                    </label>

                    <label
                      className={`checkout-pay-method${payMethod === "reembolso" ? " checkout-pay-method--active" : ""}`}
                      onClick={() => setPayMethod("reembolso")}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        value="reembolso"
                        checked={payMethod === "reembolso"}
                        onChange={() => setPayMethod("reembolso")}
                      />
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2"/>
                        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                        <line x1="12" y1="12" x2="12" y2="16"/>
                        <line x1="10" y1="14" x2="14" y2="14"/>
                      </svg>
                      <span>Contra-reembolso</span>
                    </label>
                  </div>

                  {/* ── Tarjeta ── */}
                  {payMethod === "tarjeta" && (
                    <div className="checkout-pay-block">
                      <p className="checkout-pay-info">
                        Serás redirigido a la pasarela de pago de Cecabank donde podrás
                        introducir los datos de tu tarjeta de forma segura.
                      </p>

                      {error && <p className="checkout-error">{error}</p>}

                      <button type="submit" className="checkout-pay-btn"
                        disabled={loading || items.length === 0 || !!zoneError}>
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
                            Pagar {formatEuro(totalBase)} con tarjeta
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
                  )}

                  {/* ── Contra-reembolso ── */}
                  {payMethod === "reembolso" && (
                    <div className="checkout-pay-block">
                      <div className="checkout-reembolso-info">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0, color:"#2e7d32"}}>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <div>
                          <strong>Pago al recibir el pedido</strong>
                          <p>Abonarás el importe en efectivo al repartidor cuando recibas tu pedido. Sin necesidad de tarjeta ni cuenta online.</p>
                          <p className="checkout-reembolso-fee">
                            Se añade un suplemento de <strong>{formatEuro(REEMBOLSO_FEE)}</strong> por gestión de contra-reembolso.
                          </p>
                        </div>
                      </div>

                      {error && <p className="checkout-error">{error}</p>}

                      <button
                        type="button"
                        className="checkout-pay-btn checkout-pay-btn--reembolso"
                        disabled={loading || items.length === 0 || !!zoneError || !formValido()}
                        onClick={handleReembolso}
                      >
                        {loading ? (
                          <>
                            <span className="checkout-spinner" />
                            Procesando pedido…
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Confirmar pedido — {formatEuro(totalReembolso)} contra-reembolso
                          </>
                        )}
                      </button>

                      <p className="checkout-secure-note">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Recibirás confirmación por email · Pago en efectivo al repartidor
                      </p>
                    </div>
                  )}

                  {/* ── PayPal ── */}
                  {payMethod === "paypal" && (
                    <div className="checkout-pay-block checkout-pay-block--paypal">
                      {!formValido() ? (
                        <div className="checkout-paypal-notice">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          Completa todos los campos del formulario para activar el pago con PayPal.
                        </div>
                      ) : (
                        <>
                          <p className="checkout-pay-info">
                            Haz clic en el botón de PayPal. Podrás pagar con tu cuenta PayPal o con tarjeta a través de PayPal.
                          </p>
                          <p className="checkout-paypal-surcharge-note">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            Se aplica un suplemento del 2% por comisiones de PayPal ({formatEuro(paypalSurcharge)}). Total: <strong>{formatEuro(totalPaypal)}</strong>
                          </p>
                          {paypalError && <p className="checkout-error">{paypalError}</p>}
                          <div className="checkout-paypal-btn-wrap">
                            <PayPalButtons
                              style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 48 }}
                              disabled={!!zoneError}
                              createOrder={async () => {
                                setPaypalError("");
                                const res = await fetch("/api/paypal/crear-orden", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ totalEuros: totalFinal }),
                                });
                                const data = await res.json();
                                if (!res.ok || !data.orderId) {
                                  throw new Error(data.error || "Error al crear orden PayPal");
                                }
                                return data.orderId;
                              }}
                              onApprove={async (data) => {
                                const orderPayload = buildErpPayload("paypal", data.orderID || "");
                                const { payment_method: _pm, payment_ref: _pr, ...orderData } = orderPayload;

                                const res = await fetch("/api/paypal/capturar-pago", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ orderId: data.orderID, orderData }),
                                });
                                const result = await res.json();
                                if (!res.ok || result.status !== "COMPLETED") {
                                  setPaypalError("El pago no se completó correctamente. Inténtalo de nuevo.");
                                  return;
                                }
                                const pedidoParam = result.order_number ? `&pedido=${result.order_number}` : "";
                                router.push(`/confirmacion?paypal=1&tx=${result.txId}${pedidoParam}`);
                              }}
                              onError={(err) => {
                                console.error("PayPal error:", err);
                                setPaypalError("Error en el proceso de PayPal. Por favor, inténtalo de nuevo.");
                              }}
                              onCancel={() => {
                                setPaypalError("Pago cancelado. Puedes intentarlo de nuevo cuando quieras.");
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
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
                  <span>Gastos de envío</span>
                  <span className={envio === 0 ? "checkout-totals__free" : ""}>
                    {envio === 0 ? "✓ Gratis" : formatEuro(envio)}
                  </span>
                </div>

                {/* Barra de progreso hacia envío gratis */}
                {envio > 0 && (
                  <div className="checkout-shipping-progress">
                    <div className="checkout-shipping-progress__bar">
                      <div
                        className="checkout-shipping-progress__fill"
                        style={{ width: `${Math.min((totalPrice / ENVIO_GRATIS_DESDE) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="checkout-shipping-progress__label">
                      Añade <strong>{formatEuro(ENVIO_GRATIS_DESDE - totalPrice)}</strong> más y el envío será gratis
                    </p>
                  </div>
                )}

                {/* Recargo PayPal */}
                {payMethod === "paypal" && (
                  <div className="checkout-totals__row checkout-totals__surcharge">
                    <span>Comisión PayPal (2%)</span>
                    <span>+{formatEuro(paypalSurcharge)}</span>
                  </div>
                )}

                {/* Suplemento contra-reembolso */}
                {payMethod === "reembolso" && (
                  <div className="checkout-totals__row checkout-totals__surcharge">
                    <span>Gestión contra-reembolso</span>
                    <span>+{formatEuro(REEMBOLSO_FEE)}</span>
                  </div>
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
                  <span className="checkout-badge checkout-badge--paypal">PayPal</span>
                  <span className="checkout-badge checkout-badge--reembolso">Contra-reembolso</span>
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
    </PayPalScriptProvider>
  );
}
