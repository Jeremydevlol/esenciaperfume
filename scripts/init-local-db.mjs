#!/usr/bin/env node

/**
 * Inicializa la BD local (data/db/) con productos de data/tienda/todos.json
 * y tablas vacías para el resto de módulos.
 *
 * Uso: node scripts/init-local-db.mjs
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DB_DIR = path.join(ROOT, "data", "db");
const SOURCE = path.join(ROOT, "data", "tienda", "todos.json");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function write(name, data) {
  fs.writeFileSync(path.join(DB_DIR, `${name}.json`), JSON.stringify(data, null, 2));
  console.log(`  ✓ ${name}: ${Array.isArray(data) ? data.length : 0} registros`);
}

console.log("\n🔧 Inicializando BD local...\n");

// ── Productos ────────────────────────────────────────────────────
let products = [];

if (fs.existsSync(SOURCE)) {
  const raw = JSON.parse(fs.readFileSync(SOURCE, "utf-8"));
  console.log(`  Fuente: ${raw.length} productos en todos.json`);

  products = raw.map((p) => ({
    id: crypto.randomUUID(),
    sku: String(p.sku || ""),
    name: p.nombre || "",
    brand: p.marca || "",
    category: p.categoria || "",
    subcategory: "",
    tipo: p.tipo || "Regular",
    ml: parseInt(String(p.ml || "0").replace(/[^\d]/g, "")) || 0,
    price: Number(p.precio) || 0,
    original_price: Number(p.pvp) || 0,
    discount_pct: Number(p.descuento) || 0,
    cost_price: 0,
    image_url: p.imagen || "",
    description: p.descripcion || "",
    stock: 0,
    min_stock: 5,
    active: true,
    featured: false,
    nicho: Boolean(p.nicho),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
} else {
  console.log("  ⚠ data/tienda/todos.json no encontrado, productos vacío");
}

write("products", products);

// ── Tablas vacías ────────────────────────────────────────────────
const emptyTables = [
  "customers",
  "orders",
  "order_items",
  "suppliers",
  "purchase_orders",
  "purchase_order_items",
  "invoices",
  "shipments",
  "stock_movements",
  "sync_log",
];

for (const table of emptyTables) {
  write(table, []);
}

// ── Counters ─────────────────────────────────────────────────────
fs.writeFileSync(
  path.join(DB_DIR, "_counters.json"),
  JSON.stringify({ orders: 0, purchase_orders: 0 }, null, 2),
);
console.log("  ✓ _counters: inicializado");

console.log(`\n✅ BD local lista en data/db/ (${products.length} productos)\n`);
