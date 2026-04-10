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

/** Devuelve marcas únicas normalizadas (mayúsculas, sin duplicados de casing),
 *  ordenadas alfabéticamente, con el número de productos de cada una. */
export function getMarcasNormalizadas(): { marca: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of getTiendaProductos()) {
    if (!p.marca) continue;
    const key = p.marca.toUpperCase().trim();
    // Filtrar nombres con problemas de encoding (contienen Ã)
    if (key.includes("Ã")) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([marca, count]) => ({ marca, count }))
    .sort((a, b) => a.marca.localeCompare(b.marca, "es"));
}

/** Top N marcas por número de productos */
export function getTopMarcas(n = 24): { marca: string; count: number }[] {
  return getMarcasNormalizadas()
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
