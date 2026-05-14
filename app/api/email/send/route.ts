import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/transport";
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderDeliveredEmail,
  type OrderConfirmationData,
  type OrderShippedData,
  type OrderDeliveredData,
} from "@/lib/email/templates";

const INTERNAL_SECRET = process.env.ADMIN_SESSION_SECRET ?? "";

function isAuthorized(req: NextRequest): boolean {
  const origin = req.headers.get("origin") ?? "";
  const referer = req.headers.get("referer") ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  if (baseUrl && (origin.startsWith(baseUrl) || referer.startsWith(baseUrl))) {
    return true;
  }

  const secret = req.headers.get("x-email-secret");
  if (INTERNAL_SECRET && secret === INTERNAL_SECRET) {
    return true;
  }

  return false;
}

type TemplateKey = "order-confirmation" | "order-shipped" | "order-delivered";

const TEMPLATES: Record<
  TemplateKey,
  {
    subject: (d: Record<string, unknown>) => string;
    html: (d: never) => string;
  }
> = {
  "order-confirmation": {
    subject: (d) =>
      `Confirmación de pedido #${String(d.orderNumber ?? "").toString().padStart(4, "0")}`,
    html: orderConfirmationEmail as unknown as (d: never) => string,
  },
  "order-shipped": {
    subject: (d) =>
      `Tu pedido #${String(d.orderNumber ?? "").toString().padStart(4, "0")} ha sido enviado`,
    html: orderShippedEmail as unknown as (d: never) => string,
  },
  "order-delivered": {
    subject: (d) =>
      `Tu pedido #${String(d.orderNumber ?? "").toString().padStart(4, "0")} ha sido entregado`,
    html: orderDeliveredEmail as unknown as (d: never) => string,
  },
};

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { to, template, data } = (await req.json()) as {
      to: string;
      template: string;
      data: OrderConfirmationData | OrderShippedData | OrderDeliveredData;
    };

    if (!to || !template || !data) {
      return NextResponse.json(
        { error: "Faltan campos: to, template, data" },
        { status: 400 },
      );
    }

    const tmpl = TEMPLATES[template as TemplateKey];
    if (!tmpl) {
      return NextResponse.json(
        { error: `Plantilla desconocida: ${template}` },
        { status: 400 },
      );
    }

    const subject = tmpl.subject(data as unknown as Record<string, unknown>);
    const html = tmpl.html(data as never);

    const result = await sendEmail(to, subject, html);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Error enviando email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error("[POST /api/email/send]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
