/**
 * Migración: importa productos de data/tienda/todos.json a Supabase.
 *
 * Uso:
 *   node scripts/migrate-to-supabase.mjs
 *
 * Requiere las variables de entorno en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || SUPABASE_URL.includes("TU-PROYECTO")) {
  console.error("❌ Configura NEXT_PUBLIC_SUPABASE_URL en .env.local antes de migrar");
  process.exit(1);
}
if (!SERVICE_KEY || SERVICE_KEY.includes("tu-")) {
  console.error("❌ Configura SUPABASE_SERVICE_ROLE_KEY en .env.local antes de migrar");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const todosPath = path.join(__dirname, "..", "data", "tienda", "todos.json");
const productos = JSON.parse(fs.readFileSync(todosPath, "utf-8"));

console.log(`📦 ${productos.length} productos encontrados en todos.json`);

const BATCH_SIZE = 50;
let inserted = 0;
let skipped = 0;
let errors = 0;

for (let i = 0; i < productos.length; i += BATCH_SIZE) {
  const batch = productos.slice(i, i + BATCH_SIZE).map((p) => {
    const precio = Number(p.precio) || 0;
    const pvp = Number(p.pvp) || 0;
    const descuento = Number(p.descuento) || 0;

    return {
      sku: p.sku,
      name: p.nombre || "",
      brand: p.marca || "",
      category: p.categoria || "",
      subcategory: "",
      tipo: p.tipo || "",
      ml: parseInt(p.ml) || 0,
      price: precio,
      original_price: pvp > 0 ? pvp : precio,
      discount_pct: descuento,
      cost_price: 0,
      image_url: p.imagen || "",
      description: p.descripcion || "",
      stock: 10,
      min_stock: 5,
      active: true,
      featured: false,
    };
  });

  const { data, error } = await supabase
    .from("products")
    .upsert(batch, { onConflict: "sku", ignoreDuplicates: false })
    .select("id");

  if (error) {
    console.error(`❌ Error en batch ${i / BATCH_SIZE + 1}:`, error.message);
    errors += batch.length;
  } else {
    inserted += data.length;
    console.log(`✅ Batch ${i / BATCH_SIZE + 1}: ${data.length} productos importados`);
  }
}

console.log("\n═══════════════════════════════════════");
console.log(`✅ Importados: ${inserted}`);
console.log(`⏭️  Omitidos:   ${skipped}`);
console.log(`❌ Errores:     ${errors}`);
console.log("═══════════════════════════════════════\n");
