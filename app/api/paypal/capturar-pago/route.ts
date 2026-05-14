import { NextRequest, NextResponse } from "next/server";

const PAYPAL_API =
  process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials no configuradas");
  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("No se pudo obtener el token de PayPal");
  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, orderData } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

    const accessToken = await getAccessToken();

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const err = await captureRes.text();
      console.error("PayPal capture error:", err);
      throw new Error("Error al capturar el pago de PayPal");
    }

    const capture = await captureRes.json();
    const status  = capture?.status;
    const txId    = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    let orderNumber = "";

    if (status === "COMPLETED" && orderData) {
      try {
        const erpPayload = {
          ...orderData,
          payment_method: "paypal",
          payment_ref: txId || orderId,
        };

        const origin = req.nextUrl.origin;
        const erpRes = await fetch(`${origin}/api/erp/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(erpPayload),
        });

        const erpData = await erpRes.json();

        if (erpRes.ok && erpData.order_number) {
          orderNumber = erpData.order_number;
        } else {
          console.error("Error ERP (PayPal):", erpData.error);
        }
      } catch (erpErr) {
        console.error("Error creando pedido ERP (PayPal):", erpErr);
      }
    }

    return NextResponse.json({ status, txId, order_number: orderNumber });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
