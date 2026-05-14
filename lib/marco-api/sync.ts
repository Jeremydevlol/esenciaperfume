/**
 * Sincronización con perfumedigital.es (ERP de Marco).
 *
 * Dos modos:
 * 1. Sincronización completa: scrapea todo el catálogo y actualiza Supabase
 * 2. Sync rápido de stock: consulta LOGTOTAL.php y actualiza solo el stock
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchStockLog,
  fetchProductDetail,
  transformToSupabaseProduct,
  type StockLogEntry,
} from "./client";

interface SyncResult {
  success: boolean;
  updated: number;
  errors: string[];
  duration_ms: number;
}

/**
 * Sync rápido: lee LOGTOTAL.php y actualiza el stock de los productos
 * que han cambiado. Es lo más eficiente para mantener stock al día.
 */
export async function syncStockFromLog(): Promise<SyncResult> {
  const start = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];
  let updated = 0;

  const logEntries = await fetchStockLog();

  if (!logEntries.length) {
    return {
      success: true,
      updated: 0,
      errors: [],
      duration_ms: Date.now() - start,
    };
  }

  // Agrupar por product_id, quedarnos con la entrada más reciente
  const latestByProduct = new Map<string, StockLogEntry>();
  for (const entry of logEntries) {
    const existing = latestByProduct.get(entry.product_id);
    if (!existing || entry.timestamp > existing.timestamp) {
      latestByProduct.set(entry.product_id, entry);
    }
  }

  for (const [productId, entry] of latestByProduct) {
    const { error } = await supabase
      .from("products")
      .update({ stock: Math.max(0, entry.units) })
      .eq("sku", productId);

    if (error) {
      errors.push(`Error actualizando stock ${productId}: ${error.message}`);
    } else {
      updated++;
    }
  }

  // Registrar sync
  await supabase
    .from("sync_log")
    .insert({
      type: "stock_log",
      status: errors.length ? "partial" : "success",
      updated,
      errors: errors.length ? errors : [],
      duration_ms: Date.now() - start,
    })
    .then(() => {});

  return {
    success: errors.length === 0,
    updated,
    errors,
    duration_ms: Date.now() - start,
  };
}

/**
 * Sync de detalle: dado un array de product IDs, scrapea el detalle
 * de cada uno y actualiza/inserta en Supabase.
 */
export async function syncProductDetails(
  productIds: string[],
): Promise<SyncResult> {
  const start = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];
  let updated = 0;
  const batchSize = 5;

  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);

    const details = await Promise.all(
      batch.map((id) => fetchProductDetail(id)),
    );

    for (const detail of details) {
      if (!detail) continue;

      const product = transformToSupabaseProduct(detail);

      const { error } = await supabase
        .from("products")
        .upsert(product, { onConflict: "sku", ignoreDuplicates: false });

      if (error) {
        errors.push(`Error upsert ${detail.id}: ${error.message}`);
      } else {
        updated++;
      }
    }

    // Pausa entre batches
    if (i + batchSize < productIds.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  await supabase
    .from("sync_log")
    .insert({
      type: "product_details",
      status: errors.length ? "partial" : "success",
      updated,
      errors: errors.length ? errors : [],
      duration_ms: Date.now() - start,
    })
    .then(() => {});

  return {
    success: errors.length === 0,
    updated,
    errors,
    duration_ms: Date.now() - start,
  };
}

/**
 * Sync completo desde el catálogo JSON local ya scrapeado.
 * Usa perfumedigital_productos/catalogo_general.json como fuente
 * y luego enriquece con detalle y stock de perfumedigital.es.
 */
export async function syncFromLocalCatalog(): Promise<SyncResult> {
  const start = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];
  let updated = 0;

  try {
    // Leer catálogo local
    const fs = await import("fs");
    const path = await import("path");
    const catalogPath = path.join(
      process.cwd(),
      "perfumedigital_productos",
      "catalogo_general.json",
    );
    const raw = fs.readFileSync(catalogPath, "utf-8");
    const products = JSON.parse(raw) as Array<{
      nombre: string;
      url: string;
      imagen_url: string;
      precio: string;
      precio_antes: string;
      marca: string;
      sku: string;
    }>;

    const BATCH_SIZE = 50;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE).map((p) => {
        const precio_venta = extractPriceFromString(p.precio);
        const pvp = parseFloat(p.precio_antes) || 0;
        const nombre = p.nombre.replace(/\s*@\s*$/, "").trim();
        const tipo = p.nombre.includes("@") ? "Tester" : "Regular";
        const mlMatch = nombre.match(/(\d+)\s*ML/i);
        const ml = mlMatch ? parseInt(mlMatch[1], 10) : 0;
        const descuento =
          pvp > 0
            ? Math.round(((pvp - precio_venta) / pvp) * 100)
            : 0;

        return {
          sku: p.sku,
          name: nombre,
          brand: p.marca,
          category: "",
          tipo,
          ml,
          price: precio_venta,
          original_price: pvp,
          discount_pct: descuento,
          image_url: p.imagen_url,
          description: "",
          stock: 10, // default — se actualiza con syncStockFromLog
          active: true,
        };
      });

      const { data, error } = await supabase
        .from("products")
        .upsert(batch, { onConflict: "sku", ignoreDuplicates: false })
        .select("id");

      if (error) {
        errors.push(`Error batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      } else if (data) {
        updated += data.length;
      }
    }
  } catch (err) {
    errors.push(`Error general: ${err}`);
  }

  await supabase
    .from("sync_log")
    .insert({
      type: "full_catalog",
      status: errors.length ? "partial" : "success",
      updated,
      errors: errors.length ? errors : [],
      duration_ms: Date.now() - start,
    })
    .then(() => {});

  return {
    success: errors.length === 0,
    updated,
    errors,
    duration_ms: Date.now() - start,
  };
}

function extractPriceFromString(str: string): number {
  const match = str.match(/(\d+[.,]\d{2})\s*€/);
  if (match) return parseFloat(match[1].replace(",", "."));
  const nums = str.match(/\d+[.,]\d{2}/g);
  if (nums && nums.length >= 2) return parseFloat(nums[1].replace(",", "."));
  if (nums && nums.length === 1) return parseFloat(nums[0].replace(",", "."));
  return 0;
}
