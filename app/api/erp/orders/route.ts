import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/transport";
import { orderConfirmationEmail } from "@/lib/email/templates";

/**
 * POST /api/erp/orders — Crea un pedido en el ERP desde la tienda
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      customer,
      shipping,
      payment_method,
      payment_ref,
      subtotal,
      shipping_cost,
      total,
    } = body;

    if (!items?.length || !customer?.email) {
      return NextResponse.json(
        { error: "Faltan datos del pedido" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customer.email)
      .single();

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert({
          email: customer.email,
          first_name: customer.first_name || "",
          last_name: customer.last_name || "",
          phone: customer.phone || "",
          dni: customer.dni || "",
          address: shipping?.address || {},
        })
        .select("id")
        .single();

      if (custErr || !newCustomer) {
        return NextResponse.json(
          { error: "Error creando cliente: " + custErr?.message },
          { status: 500 },
        );
      }
      customerId = newCustomer.id;
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        status: payment_method === "contrareembolso" ? "confirmed" : "pending",
        payment_method: payment_method || "",
        payment_status:
          payment_method === "contrareembolso" ? "pending" : "pending",
        subtotal: subtotal || 0,
        shipping_cost: shipping_cost || 0,
        total: total || 0,
        shipping_name: shipping?.name || "",
        shipping_email: customer.email,
        shipping_phone: shipping?.phone || customer.phone || "",
        shipping_address: shipping?.address || {},
        payment_ref: payment_ref || "",
        notes: "",
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Error creando pedido: " + orderErr?.message },
        { status: 500 },
      );
    }

    const orderItems = items.map(
      (item: {
        sku: string;
        name: string;
        quantity: number;
        price: number;
        product_id?: string;
      }) => ({
        order_id: order.id,
        product_id: item.product_id || null,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      }),
    );

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsErr) {
      console.error("Error insertando líneas de pedido:", itemsErr);
    }

    for (const item of items) {
      if (item.sku) {
        const { data: product } = await supabase
          .from("products")
          .select("id, stock")
          .eq("sku", item.sku)
          .single();

        if (product) {
          await supabase.from("stock_movements").insert({
            product_id: product.id,
            type: "out",
            quantity: item.quantity,
            prev_stock: product.stock,
            new_stock: product.stock - item.quantity,
            reference: `order:${order.order_number}`,
            notes: `Venta pedido #${order.order_number}`,
          });
        }
      }
    }

    // Non-blocking: send order confirmation email
    const confirmationHtml = orderConfirmationEmail({
      orderNumber: order.order_number,
      customerName: shipping?.name || `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Cliente",
      email: customer.email,
      items: items.map((i: { name: string; quantity: number; price: number }) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      subtotal: subtotal || 0,
      shippingCost: shipping_cost || 0,
      total: total || 0,
      paymentMethod: payment_method || "",
      shippingAddress: shipping?.address || "",
    });

    sendEmail(
      customer.email,
      `Confirmación de pedido #${String(order.order_number).padStart(4, "0")}`,
      confirmationHtml,
    ).catch((err) => console.error("[Email] Error enviando confirmación:", err));

    // Non-blocking: notificación interna a la tienda (Guillab) de cada pedido nuevo
    const notifyEmail = process.env.ORDER_NOTIFY_EMAIL || "info@guillab.com";
    if (notifyEmail) {
      const numero = String(order.order_number).padStart(4, "0");
      const cliente =
        shipping?.name ||
        `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
        "Cliente";
      const adminHtml = `
        <div style="font-family:system-ui,Arial,sans-serif;color:#111">
          <h2 style="margin:0 0 12px">🛎️ Nuevo pedido #${numero}</h2>
          <table style="border-collapse:collapse;font-size:14px">
            <tr><td style="padding:2px 12px 2px 0;color:#666">Cliente</td><td><strong>${cliente}</strong></td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#666">Email</td><td>${customer.email}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#666">Teléfono</td><td>${shipping?.phone || customer.phone || "—"}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#666">Pago</td><td>${payment_method || "—"}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#666">Total</td><td><strong>${(total || 0).toFixed(2)} €</strong></td></tr>
          </table>
        </div>
        ${confirmationHtml}
      `;
      sendEmail(
        notifyEmail,
        `🛎️ Nuevo pedido #${numero} — ${cliente}`,
        adminHtml,
      ).catch((err) => console.error("[Email] Error notificando a la tienda:", err));
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
    });
  } catch (err) {
    console.error("Error en POST /api/erp/orders:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/erp/orders — Actualiza estado de un pedido
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, status, payment_status, payment_ref } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "Falta order_id" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (status) updates.status = status;
    if (payment_status) updates.payment_status = payment_status;
    if (payment_ref) updates.payment_ref = payment_ref;

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", order_id);

    if (error) {
      return NextResponse.json(
        { error: "Error actualizando pedido: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en PATCH /api/erp/orders:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
