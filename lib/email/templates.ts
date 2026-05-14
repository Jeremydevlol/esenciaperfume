/* ─── Shared helpers ─── */

const BRAND = "#1a1a2e";
const ACCENT = "#c4a35a";

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Perfumería y Cosmética</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND};padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:${ACCENT};letter-spacing:1px;">
                Perfumería y Cosmética
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 32px;border-top:1px solid #eaeaea;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999999;line-height:1.6;">
                Este email es una notificación de tu pedido.<br/>
                &copy; 2024 Perfumería y Cosmética
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function euro(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

const PAYMENT_LABELS: Record<string, string> = {
  card: "Tarjeta de crédito/débito",
  tpv: "Tarjeta de crédito/débito",
  paypal: "PayPal",
  contrareembolso: "Contrareembolso",
  bizum: "Bizum",
  transfer: "Transferencia bancaria",
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
        ]
          .filter(Boolean)
          .join(", ");

  const itemsRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333333;">
            ${item.name}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333333;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333333;text-align:right;">
            ${euro(item.unitPrice)}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333333;text-align:right;font-weight:600;">
            ${euro(item.unitPrice * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND};">¡Gracias por tu compra, ${data.customerName}!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
      Hemos recibido tu pedido <strong style="color:${BRAND};">#${String(data.orderNumber).padStart(4, "0")}</strong> correctamente.
      A continuación tienes el resumen de tu compra.
    </p>

    <!-- Order items table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eaeaea;border-radius:6px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background-color:${BRAND};">
          <th style="padding:10px 12px;font-size:12px;color:${ACCENT};text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Producto</th>
          <th style="padding:10px 12px;font-size:12px;color:${ACCENT};text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Cant.</th>
          <th style="padding:10px 12px;font-size:12px;color:${ACCENT};text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Precio</th>
          <th style="padding:10px 12px;font-size:12px;color:${ACCENT};text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:8px 12px;font-size:13px;color:#666666;text-align:right;">Subtotal</td>
          <td style="padding:8px 12px;font-size:13px;color:#333333;text-align:right;">${euro(data.subtotal)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding:8px 12px;font-size:13px;color:#666666;text-align:right;">Envío</td>
          <td style="padding:8px 12px;font-size:13px;color:#333333;text-align:right;">${data.shippingCost === 0 ? "Gratis" : euro(data.shippingCost)}</td>
        </tr>
        <tr style="background-color:#fafafa;">
          <td colspan="3" style="padding:12px;font-size:15px;color:${BRAND};text-align:right;font-weight:700;">Total</td>
          <td style="padding:12px;font-size:15px;color:${BRAND};text-align:right;font-weight:700;">${euro(data.total)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Payment & shipping -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="50%" valign="top" style="padding-right:12px;">
          <p style="margin:0 0 6px;font-size:11px;color:#999999;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Método de pago</p>
          <p style="margin:0;font-size:14px;color:#333333;">${PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}</p>
        </td>
        <td width="50%" valign="top" style="padding-left:12px;">
          <p style="margin:0 0 6px;font-size:11px;color:#999999;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Dirección de envío</p>
          <p style="margin:0;font-size:14px;color:#333333;line-height:1.5;">${addressStr || "—"}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
      Te enviaremos un email con la información de seguimiento cuando tu pedido sea enviado.
    </p>`;

  return layout(body);
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
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND};">¡Tu pedido está en camino!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
      Hola ${data.customerName}, tu pedido <strong style="color:${BRAND};">#${String(data.orderNumber).padStart(4, "0")}</strong> ha sido enviado.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eaeaea;border-radius:6px;overflow:hidden;margin-bottom:24px;">
      <tr style="background-color:#fafafa;">
        <td style="padding:14px 16px;font-size:12px;color:#999999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:40%;">
          Transportista
        </td>
        <td style="padding:14px 16px;font-size:14px;color:#333333;">
          ${data.carrier}
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;font-size:12px;color:#999999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #f0f0f0;">
          Nº de seguimiento
        </td>
        <td style="padding:14px 16px;font-size:14px;color:#333333;font-family:monospace;border-top:1px solid #f0f0f0;">
          ${data.trackingNumber}
        </td>
      </tr>
      ${
        data.estimatedDelivery
          ? `<tr style="background-color:#fafafa;">
        <td style="padding:14px 16px;font-size:12px;color:#999999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #f0f0f0;">
          Entrega estimada
        </td>
        <td style="padding:14px 16px;font-size:14px;color:#333333;border-top:1px solid #f0f0f0;">
          ${data.estimatedDelivery}
        </td>
      </tr>`
          : ""
      }
    </table>

    ${
      data.trackingUrl
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${data.trackingUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background-color:${ACCENT};color:${BRAND};font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">
            Rastrear mi pedido
          </a>
        </td>
      </tr>
    </table>`
        : ""
    }

    <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
      Si tienes alguna pregunta sobre tu envío, no dudes en contactarnos respondiendo a este email.
    </p>`;

  return layout(body);
}

/* ─── 3. Order Delivered ─── */

export interface OrderDeliveredData {
  orderNumber: string | number;
  customerName: string;
}

export function orderDeliveredEmail(data: OrderDeliveredData): string {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND};">¡Tu pedido ha sido entregado!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
      Hola ${data.customerName}, tu pedido <strong style="color:${BRAND};">#${String(data.orderNumber).padStart(4, "0")}</strong>
      ha sido entregado correctamente.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eaeaea;border-radius:6px;overflow:hidden;margin-bottom:24px;background-color:#fafafa;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <p style="margin:0 0 12px;font-size:36px;">✓</p>
          <p style="margin:0 0 8px;font-size:16px;color:${BRAND};font-weight:700;">Pedido completado</p>
          <p style="margin:0;font-size:13px;color:#666666;line-height:1.5;">
            Esperamos que disfrutes de tus productos. Tu opinión es muy importante para nosotros.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:14px;color:#666666;line-height:1.6;">
      Si tienes cualquier problema con tu pedido o quieres dejarnos una reseña,
      puedes contactarnos respondiendo a este email o visitando nuestra tienda.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="https://perfumeriaycosmetica.com" target="_blank" style="display:inline-block;padding:14px 32px;background-color:${ACCENT};color:${BRAND};font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">
            Visitar la tienda
          </a>
        </td>
      </tr>
    </table>`;

  return layout(body);
}
