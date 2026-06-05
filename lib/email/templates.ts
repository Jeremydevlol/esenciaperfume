/* ─── Shared helpers ─── */

const WHITE  = "#ffffff";
const BLACK  = "#000000";
const GRAY1  = "#111111"; // fondos oscuros
const GRAY2  = "#1a1a1a"; // bordes
const GRAY3  = "#f5f5f5"; // fondos claros secundarios
const MUTED  = "#888888";

function layout(body: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Guillab</title>
</head>
<body style="margin:0;padding:0;background:${WHITE};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${WHITE}">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ebebeb;padding:40px 0">
    <tr><td align="center" style="padding:0 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${WHITE}">

        <!-- HEADER negro -->
        <tr><td style="background:${BLACK};padding:44px 48px 36px;text-align:center">
          <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:#666">Casa española de perfumería nicho</p>
          <h1 style="margin:0;font-size:28px;font-weight:200;letter-spacing:0.22em;color:${WHITE};text-transform:uppercase">GUILLAB</h1>
          <p style="margin:10px 0 0;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:#999">· Madrid · MMXXIII ·</p>
        </td></tr>

        <!-- BODY -->
        ${body}

        <!-- FOOTER negro -->
        <tr><td style="background:${BLACK};padding:32px 48px;text-align:center">
          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#555">Guillab Cosmetics S.L.</p>
          <p style="margin:0 0 14px;font-size:11px;color:#555;line-height:1.9">Calle Serrano 19 · 28006 Madrid · España<br>info@guillab.com · +34 630 777 417</p>
          <p style="margin:0;font-size:9px;color:#444">&copy; MMXXVI Guillab · Todos los derechos reservados</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function euro(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

const PAYMENT_LABELS: Record<string, string> = {
  card:            "Tarjeta de crédito/débito",
  tpv:             "Tarjeta de crédito/débito",
  paypal:          "PayPal",
  contrareembolso: "Contrareembolso",
  bizum:           "Bizum",
  transfer:        "Transferencia bancaria",
};

/* ─── 1. Order Confirmation ─── */

export interface OrderConfirmationData {
  orderNumber: string | number;
  customerName: string;
  email: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  shippingAddress: string | Record<string, unknown>;
}

export function orderConfirmationEmail(data: OrderConfirmationData): string {
  const addressStr =
    typeof data.shippingAddress === "string"
      ? data.shippingAddress
      : [
          (data.shippingAddress as Record<string, string>).street,
          (data.shippingAddress as Record<string, string>).city,
          (data.shippingAddress as Record<string, string>).province,
          (data.shippingAddress as Record<string, string>).postal_code,
          (data.shippingAddress as Record<string, string>).country,
        ].filter(Boolean).join(", ");

  const numStr   = String(data.orderNumber).padStart(4, "0");
  const payLabel = PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod;

  const itemsRows = data.items.map((item) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #ebebeb;vertical-align:top">
        <p style="margin:0;font-size:14px;font-weight:400;color:${BLACK}">${item.name}</p>
        <p style="margin:3px 0 0;font-size:11px;color:${MUTED}">Cantidad: ${item.quantity}</p>
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #ebebeb;text-align:right;vertical-align:top;white-space:nowrap">
        <p style="margin:0;font-size:14px;color:${BLACK}">${euro(item.unitPrice * item.quantity)}</p>
      </td>
    </tr>`).join("");

  const body = `
    <!-- HERO blanco -->
    <tr><td style="background:${WHITE};padding:52px 48px 40px;text-align:center;border-bottom:2px solid ${BLACK}">
      <p style="margin:0 0 12px;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:${MUTED}">Confirmación de pedido</p>
      <h2 style="margin:0 0 12px;font-size:28px;font-weight:200;color:${BLACK};letter-spacing:0.04em">Gracias, ${data.customerName}.</h2>
      <p style="margin:0 0 28px;font-size:13px;color:${MUTED};line-height:1.7">Tu pedido ha sido recibido y está siendo preparado<br>en nuestro atelier de Madrid.</p>
      <table cellpadding="0" cellspacing="0" align="center"><tr>
        <td style="background:${BLACK};padding:12px 40px">
          <p style="margin:0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${WHITE}">Pedido #${numStr}</p>
        </td>
      </tr></table>
    </td></tr>

    <!-- PRODUCTOS -->
    <tr><td style="background:${WHITE};padding:40px 48px;border-bottom:1px solid #ebebeb">
      <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:${MUTED}">Detalle del pedido</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
        <tr>
          <td style="padding-bottom:10px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#bbb;border-bottom:2px solid ${BLACK}">Producto</td>
          <td style="padding-bottom:10px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#bbb;border-bottom:2px solid ${BLACK};text-align:right">Importe</td>
        </tr>
        ${itemsRows}
        <tr>
          <td style="padding:14px 0 6px;font-size:12px;color:${MUTED}">Subtotal</td>
          <td style="padding:14px 0 6px;font-size:12px;color:${MUTED};text-align:right">${euro(data.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:${MUTED}">Envío</td>
          <td style="padding:6px 0;font-size:12px;color:${BLACK};text-align:right">${data.shippingCost === 0 ? "Gratis" : euro(data.shippingCost)}</td>
        </tr>
        <tr style="border-top:2px solid ${BLACK}">
          <td style="padding:16px 0 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${BLACK}">Total</td>
          <td style="padding:16px 0 0;font-size:24px;font-weight:200;color:${BLACK};text-align:right;letter-spacing:0.02em">${euro(data.total)}</td>
        </tr>
      </table>
    </td></tr>

    <!-- ENVÍO + PAGO -->
    <tr><td style="background:${GRAY3};padding:32px 48px;border-bottom:1px solid #ddd">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="48%" style="padding:24px;background:${WHITE};border:1px solid #ddd;vertical-align:top">
            <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:${MUTED}">Dirección de envío</p>
            <p style="margin:0;font-size:13px;color:${BLACK};line-height:1.7">${addressStr || "—"}</p>
            <p style="margin:12px 0 0;font-size:11px;color:${MUTED}">Entrega: <strong style="color:${BLACK}">24 – 48h</strong></p>
          </td>
          <td width="4%"></td>
          <td width="48%" style="padding:24px;background:${WHITE};border:1px solid #ddd;vertical-align:top">
            <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:${MUTED}">Método de pago</p>
            <p style="margin:0;font-size:13px;color:${BLACK}">${payLabel}</p>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- CTA -->
    <tr><td style="background:${WHITE};padding:40px 48px;text-align:center">
      <p style="margin:0 0 20px;font-size:13px;color:${MUTED};line-height:1.7">¿Tienes alguna pregunta sobre tu pedido?<br>Escríbenos y te respondemos en menos de 48h.</p>
      <table cellpadding="0" cellspacing="0" align="center"><tr>
        <td style="border:1px solid ${BLACK};padding:0">
          <a href="mailto:info@guillab.com" style="display:block;padding:13px 36px;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:${BLACK};text-decoration:none">Contactar con Guillab</a>
        </td>
      </tr></table>
    </td></tr>`;

  return layout(body, `Tu pedido #${numStr} ha sido recibido · Guillab Madrid`);
}

/* ─── 2. Order Shipped ─── */

export interface OrderShippedData {
  orderNumber: string | number;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
}

export function orderShippedEmail(data: OrderShippedData): string {
  const numStr = String(data.orderNumber).padStart(4, "0");
  const body = `
    <tr><td style="background:${WHITE};padding:52px 48px 40px;text-align:center;border-bottom:2px solid ${BLACK}">
      <p style="margin:0 0 12px;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:${MUTED}">Pedido en camino</p>
      <h2 style="margin:0 0 12px;font-size:28px;font-weight:200;color:${BLACK}">Tu pedido va en camino, ${data.customerName}.</h2>
      <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.7">El pedido <strong style="color:${BLACK}">#${numStr}</strong> ha salido de nuestro atelier.</p>
    </td></tr>
    <tr><td style="background:${WHITE};padding:40px 48px;border-bottom:1px solid #ebebeb">
      <p style="margin:0 0 20px;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:${MUTED}">Información de envío</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
        <tr><td style="padding:12px 0;color:${MUTED};border-bottom:1px solid #ebebeb;width:140px">Transportista</td><td style="padding:12px 0;color:${BLACK};border-bottom:1px solid #ebebeb">${data.carrier}</td></tr>
        <tr><td style="padding:12px 0;color:${MUTED};border-bottom:1px solid #ebebeb">Seguimiento</td><td style="padding:12px 0;color:${BLACK};font-family:monospace;border-bottom:1px solid #ebebeb">${data.trackingNumber}</td></tr>
        ${data.estimatedDelivery ? `<tr><td style="padding:12px 0;color:${MUTED}">Entrega estimada</td><td style="padding:12px 0;color:${BLACK};font-weight:500">${data.estimatedDelivery}</td></tr>` : ""}
      </table>
      ${data.trackingUrl ? `<table cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td style="border:1px solid ${BLACK};padding:0"><a href="${data.trackingUrl}" target="_blank" style="display:block;padding:13px 36px;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:${BLACK};text-decoration:none">Rastrear mi pedido</a></td></tr></table>` : ""}
    </td></tr>`;

  return layout(body, `Tu pedido #${numStr} está en camino · Guillab Madrid`);
}

/* ─── 3. Order Delivered ─── */

export interface OrderDeliveredData {
  orderNumber: string | number;
  customerName: string;
}

export function orderDeliveredEmail(data: OrderDeliveredData): string {
  const numStr = String(data.orderNumber).padStart(4, "0");
  const body = `
    <tr><td style="background:${WHITE};padding:52px 48px 40px;text-align:center;border-bottom:2px solid ${BLACK}">
      <p style="margin:0 0 12px;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:${MUTED}">Pedido entregado</p>
      <h2 style="margin:0 0 12px;font-size:28px;font-weight:200;color:${BLACK}">Pedido completado, ${data.customerName}.</h2>
      <p style="margin:0 0 28px;font-size:13px;color:${MUTED};line-height:1.7">El pedido <strong style="color:${BLACK}">#${numStr}</strong> ha sido entregado.<br>Esperamos que disfrutes de tus fragancias.</p>
      <table cellpadding="0" cellspacing="0" align="center"><tr><td style="background:${BLACK};padding:14px 40px">
        <p style="margin:0;font-size:20px;color:${WHITE};font-weight:200">&#10003;</p>
      </td></tr></table>
    </td></tr>
    <tr><td style="background:${WHITE};padding:40px 48px;text-align:center">
      <p style="margin:0 0 20px;font-size:13px;color:${MUTED};line-height:1.7">¿Tienes alguna pregunta o quieres dejarnos una reseña?<br>Escríbenos y te respondemos en menos de 48h.</p>
      <table cellpadding="0" cellspacing="0" align="center"><tr><td style="border:1px solid ${BLACK};padding:0">
        <a href="mailto:info@guillab.com" style="display:block;padding:13px 36px;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:${BLACK};text-decoration:none">Contactar con Guillab</a>
      </td></tr></table>
    </td></tr>`;

  return layout(body, `Tu pedido #${numStr} ha sido entregado · Guillab Madrid`);
}
