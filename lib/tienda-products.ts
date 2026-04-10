/**
 * Loader de productos — SOLO SERVIDOR
 * Usa 'fs' — nunca importar desde Client Components.
 * Los Client Components deben importar tipos desde '@/lib/tienda-types'.
 */

import fs from "fs";
import path from "path";

// Re-exportamos tipos y constantes para comodidad en Server Components
export type { TiendaProducto, CategoriaInfo } from "@/lib/tienda-types";
export { CATEGORIAS } from "@/lib/tienda-types";

import type { TiendaProducto } from "@/lib/tienda-types";

// ── Loader principal (caché en memoria) ───────────────────────────────────────
let _cache: TiendaProducto[] | null = null;

export function getTiendaProductos(): TiendaProducto[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "tienda", "todos.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  _cache = JSON.parse(raw) as TiendaProducto[];
  return _cache;
}

export function getByCategoria(slug: string): TiendaProducto[] {
  return getTiendaProductos().filter((p) => p.categoria === slug);
}

export function getEnOferta(minPct = 20): TiendaProducto[] {
  return getTiendaProductos().filter(
    (p) => p.descuento != null && p.descuento >= minPct
  );
}

export function getBySku(sku: string): TiendaProducto | undefined {
  return getTiendaProductos().find((p) => p.sku === sku);
}

export function buscar(q: string): TiendaProducto[] {
  const term = q.toLowerCase().trim();
  if (!term) return getTiendaProductos();
  return getTiendaProductos().filter(
    (p) =>
      p.nombre.toLowerCase().includes(term) ||
      p.marca.toLowerCase().includes(term)
  );
}

export function getMarcas(): string[] {
  const set = new Set(getTiendaProductos().map((p) => p.marca).filter(Boolean));
  return Array.from(set).sort();
}
