import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/erp/products — Lista productos del ERP (con paginación)
 * Query params: page, limit, category, brand, search, active
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "40");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");
    const active = searchParams.get("active");

    const supabase = createAdminClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (active !== null) query = query.eq("active", active !== "false");
    if (category) query = query.eq("category", category);
    if (brand) query = query.ilike("brand", `%${brand}%`);
    if (search)
      query = query.or(
        `name.ilike.%${search}%,brand.ilike.%${search}%,sku.ilike.%${search}%`,
      );

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      products: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error("Error en GET /api/erp/products:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/erp/products/[sku] — Obtener producto por SKU
 * Query param: sku
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku } = body;

    if (!sku) {
      return NextResponse.json({ error: "Falta SKU" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("sku", sku)
      .eq("active", true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ product: data });
  } catch (err) {
    console.error("Error en POST /api/erp/products:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 },
    );
  }
}
