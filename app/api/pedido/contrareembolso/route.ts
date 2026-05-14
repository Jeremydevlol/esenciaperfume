import { NextRequest, NextResponse } from "next/server";

const ENVIO = 5.99;
const ENVIO_GRATIS_DESDE = 100;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombre,
      email,
      telefono,
      direccion,
      cp,
      ciudad,
      provincia,
      items,
      totalEuros,
    } = body;

    if (!items?.length || !email || !nombre) {
      return NextResponse.json(
        { error: "Faltan datos del pedido" },
        { status: 400 },
      );
    }

    const nameParts = (nombre as string).trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const subtotal = items.reduce(
      (sum: number, i: { price: number; qty: number }) =>
        sum + i.price * i.qty,
      0,
    );
    const shippingCost = subtotal >= ENVIO_GRATIS_DESDE ? 0 : ENVIO;

    const erpPayload = {
      items: items.map(
        (i: { sku: string; name: string; qty: number; price: number }) => ({
          sku: i.sku,
          name: i.name,
          quantity: i.qty,
          price: i.price,
        }),
      ),
      customer: {
        email,
        first_name: firstName,
        last_name: lastName,
        phone: telefono || "",
      },
      shipping: {
        name: nombre,
        phone: telefono || "",
        address: {
          street: direccion,
          city: ciudad,
          province: provincia,
          postal_code: cp,
          country: provincia === "Portugal" ? "PT" : "ES",
        },
      },
      payment_method: "contrareembolso",
      payment_ref: "",
      subtotal,
      shipping_cost: shippingCost,
      total: totalEuros,
    };

    const origin = req.nextUrl.origin;
    const erpRes = await fetch(`${origin}/api/erp/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(erpPayload),
    });

    const erpData = await erpRes.json();

    if (!erpRes.ok) {
      console.error("Error ERP contra-reembolso:", erpData);
      return NextResponse.json(
        { error: erpData.error || "Error al registrar pedido" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      order_number: erpData.order_number,
    });
  } catch (err) {
    console.error("Error en POST /api/pedido/contrareembolso:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
