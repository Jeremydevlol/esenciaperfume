import { NextRequest, NextResponse } from "next/server";
import {
  syncStockFromLog,
  syncProductDetails,
  syncFromLocalCatalog,
} from "@/lib/marco-api/sync";

/**
 * POST /api/erp/sync — Sincronizar con perfumedigital.es
 *
 * Body: { type: "stock" | "details" | "full", productIds?: string[] }
 *
 * - "stock"   → Lee LOGTOTAL.php y actualiza stock de productos cambiados
 * - "details" → Scrapea detalle de productos específicos (requiere productIds)
 * - "full"    → Importa todo el catálogo desde catalogo_general.json local
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || "stock";

    let result;

    switch (type) {
      case "stock":
        result = await syncStockFromLog();
        break;
      case "details":
        if (!body.productIds?.length) {
          return NextResponse.json(
            { error: "productIds requerido para sync de detalle" },
            { status: 400 },
          );
        }
        result = await syncProductDetails(body.productIds);
        break;
      case "full":
        result = await syncFromLocalCatalog();
        break;
      default:
        return NextResponse.json(
          { error: `Tipo de sync no válido: ${type}` },
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error en sincronización:", err);
    return NextResponse.json(
      { error: "Error de sincronización", details: String(err) },
      { status: 500 },
    );
  }
}
