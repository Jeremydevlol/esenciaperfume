import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarcoOrder, type MarcoOrderPayload } from "@/lib/marco-api/client";

/**
 * POST /api/erp/marco-order — Enviar pedido al ERP de Marco
 *
 * Se llama después de que un pago se confirma.
 * Crea el pedido en nuestro Supabase Y lo envía al ERP de Marco.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Falta order_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, order_items(*), customers(first_name, last_name, email, phone, dni)")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 },
      );
    }

    const customer = order.customers;
    const address = order.shipping_address || {};

    const marcoPayload: MarcoOrderPayload = {
      canal: "secreto-digital",
      cliente: {
        nombre: `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim() || order.shipping_name,
        email: customer?.email || order.shipping_email,
        telefono: customer?.phone || order.shipping_phone,
        dni: customer?.dni || "",
        direccion: {
          calle: address.street || "",
          ciudad: address.city || "",
          provincia: address.province || "",
          cp: address.postal_code || "",
          pais: address.country || "España",
        },
      },
      items: (order.order_items || []).map((item: { sku: string; quantity: number; unit_price: number }) => ({
        sku: item.sku,
        cantidad: item.quantity,
        precio_unitario: item.unit_price,
      })),
      metodo_pago: order.payment_method || "",
      referencia_pago: order.payment_ref || "",
      total: order.total,
      notas: order.notes || "",
    };

    const marcoRes = await createMarcoOrder(marcoPayload);

    if (marcoRes.ok && marcoRes.data) {
      await supabase
        .from("orders")
        .update({
          internal_notes: `Enviado a Marco — ID: ${marcoRes.data.order_id}, Nº: ${marcoRes.data.order_number}`,
          status: "confirmed",
        })
        .eq("id", order_id);

      return NextResponse.json({
        success: true,
        marco_order_id: marcoRes.data.order_id,
        marco_order_number: marcoRes.data.order_number,
      });
    }

    // Si Marco no está conectado aún, el pedido queda en nuestro sistema igualmente
    await supabase
      .from("orders")
      .update({
        internal_notes: `⚠️ No se pudo enviar a Marco: ${marcoRes.error || "API no configurada"}. Notificar manualmente.`,
      })
      .eq("id", order_id);

    return NextResponse.json({
      success: false,
      warning: "Pedido guardado localmente pero no se pudo enviar a Marco",
      error: marcoRes.error,
    });
  } catch (err) {
    console.error("Error enviando pedido a Marco:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 },
    );
  }
}
