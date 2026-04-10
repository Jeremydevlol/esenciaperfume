import { NextRequest, NextResponse } from "next/server";

const PAYPAL_API =
  process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("PayPal credentials no configuradas en .env.local");
  }

  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("No se pudo obtener el token de PayPal");

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { totalEuros } = await req.json();

    if (!totalEuros || isNaN(totalEuros)) {
      return NextResponse.json({ error: "Importe inválido" }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value: totalEuros.toFixed(2),
            },
            description: "Pedido Secreto Digital Perfumería",
          },
        ],
        application_context: {
          brand_name: "Secreto Digital",
          locale: "es-ES",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${origin}/confirmacion`,
          cancel_url: `${origin}/checkout`,
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      console.error("PayPal order error:", err);
      throw new Error("Error al crear la orden en PayPal");
    }

    const order = await orderRes.json();
    return NextResponse.json({ orderId: order.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
