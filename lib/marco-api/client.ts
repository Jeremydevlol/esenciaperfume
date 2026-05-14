/**
 * Cliente para scrapear datos de perfumedigital.es (ERP de Marco).
 *
 * El sistema de Marco es PHP con páginas HTML. Extraemos datos
 * parseando el HTML con regex.
 */

import { PERFUMEDIGITAL } from "./config";

// ─── TIPOS ──────────────────────────────────────────────────────────

export interface PerfumeDigitalProduct {
  id: string;
  nombre: string;
  marca: string;
  imagen_url: string;
  precio_venta: number;
  pvp_original: number;
  url: string;
}

export interface ProductDetail extends PerfumeDigitalProduct {
  categoria: string;
  descripcion: string;
  stock: number;
  tipo: string;
}

export interface StockLogEntry {
  product_id: string;
  log_id: string;
  units: number;
  timestamp: string;
}

// ─── HELPERS ────────────────────────────────────────────────────────

async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "SecretoDigital-Sync/1.0",
      Accept: "text/html",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

function decodeHTML(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractPrice(priceStr: string): number {
  const match = priceStr.match(/(\d+[.,]\d{2})\s*€/);
  if (match) return parseFloat(match[1].replace(",", "."));
  const nums = priceStr.match(/\d+[.,]\d{2}/g);
  if (nums && nums.length >= 2)
    return parseFloat(nums[1].replace(",", "."));
  if (nums && nums.length === 1)
    return parseFloat(nums[0].replace(",", "."));
  return 0;
}

function extractOriginalPrice(priceStr: string): number {
  const nums = priceStr.match(/\d+[.,]\d{2}/g);
  if (nums && nums.length >= 1)
    return parseFloat(nums[0].replace(",", "."));
  return 0;
}

// ─── DETALLE DE PRODUCTO ────────────────────────────────────────────

/** Obtener detalle completo de un producto por su ID */
export async function fetchProductDetail(
  productId: string,
): Promise<ProductDetail | null> {
  try {
    const url = `${PERFUMEDIGITAL.baseUrl}${PERFUMEDIGITAL.endpoints.productDetail}${productId}`;
    const html = await fetchHTML(url);

    // Nombre: buscar en el título o en un <td> / <h> que contenga el nombre
    const nameMatch =
      html.match(/<td[^>]*class="[^"]*titulo[^"]*"[^>]*>(.*?)<\/td>/is) ||
      html.match(/<h\d[^>]*>(.*?)<\/h\d>/is) ||
      html.match(/<title>(.*?)<\/title>/i);
    const nombre = nameMatch ? decodeHTML(nameMatch[1]) : "";

    // Marca
    const brandMatch = html.match(/Marca:\s*<a[^>]*>(.*?)<\/a>/i) ||
      html.match(/Marca:\s*([\w\s&'.]+)/i);
    const marca = brandMatch ? decodeHTML(brandMatch[1]) : "";

    // Categoría
    const catMatch = html.match(/Categoria:\s*([\w\s]+)/i);
    const categoria = catMatch ? catMatch[1].trim() : "";

    // Descripción
    const descMatch =
      html.match(/Descripcion:\s*([\s\S]*?)(?=\d+\.\d{2}\s+\d+\.\d{2})/i) ||
      html.match(/Descripcion:\s*([\s\S]*?)(?=<\/td>)/i);
    const descripcion = descMatch ? decodeHTML(descMatch[1]).slice(0, 2000) : "";

    // Precios: "22.00 5.99 €"
    const priceBlock =
      html.match(/(\d+\.\d{2})\s+(\d+\.\d{2})\s*€/);
    const pvp_original = priceBlock
      ? parseFloat(priceBlock[1])
      : 0;
    const precio_venta = priceBlock
      ? parseFloat(priceBlock[2])
      : 0;

    // Stock: "Unidades: X"
    const stockMatch = html.match(/Unidades:\s*(\d+)/i);
    const stock = stockMatch ? parseInt(stockMatch[1], 10) : 0;

    // Imagen
    const imgMatch = html.match(/<img[^>]*src="([^"]*catalog[^"]*)"[^>]*>/i);
    const imagen_url = imgMatch
      ? imgMatch[1].startsWith("http")
        ? imgMatch[1]
        : `${PERFUMEDIGITAL.baseUrl}/${imgMatch[1]}`
      : "";

    // Tipo (Regular / Tester @)
    const tipo = nombre.includes("@") ? "Tester" : "Regular";

    return {
      id: productId,
      nombre,
      marca,
      imagen_url,
      precio_venta,
      pvp_original,
      url: url,
      categoria,
      descripcion,
      stock,
      tipo,
    };
  } catch (err) {
    console.error(`Error fetching product ${productId}:`, err);
    return null;
  }
}

// ─── LOG DE STOCK ───────────────────────────────────────────────────

/**
 * Parsear el log de stock de LOGTOTAL.php.
 * Cada entrada tiene: product_id, log_id, units, timestamp
 */
export async function fetchStockLog(): Promise<StockLogEntry[]> {
  try {
    const url = `${PERFUMEDIGITAL.baseUrl}${PERFUMEDIGITAL.endpoints.stockLog}`;
    const html = await fetchHTML(url);

    const entries: StockLogEntry[] = [];

    // Patrón: id enlace, (log_id), "Actualizado XXXXX desde unid: N", timestamp
    const regex =
      /id=(\d+)[^,]*,\s*\((\d+)\),\s*Actualizado\s+\d+\s+desde\s+unid:\s*(-?\d+),\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/g;

    let match;
    while ((match = regex.exec(html)) !== null) {
      entries.push({
        product_id: match[1],
        log_id: match[2],
        units: parseInt(match[3], 10),
        timestamp: match[4],
      });
    }

    return entries;
  } catch (err) {
    console.error("Error fetching stock log:", err);
    return [];
  }
}

/**
 * Obtener el stock actual de un producto consultando su pagina de detalle
 */
export async function fetchProductStock(
  productId: string,
): Promise<number | null> {
  const detail = await fetchProductDetail(productId);
  return detail ? detail.stock : null;
}

/**
 * Obtener stock de múltiples productos en paralelo (max 10 concurrent)
 */
export async function fetchMultipleStocks(
  productIds: string[],
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  const batchSize = 10;

  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);
    const promises = batch.map(async (id) => {
      const stock = await fetchProductStock(id);
      if (stock !== null) results.set(id, stock);
    });
    await Promise.all(promises);
    // Breve pausa entre batches para no sobrecargar
    if (i + batchSize < productIds.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}

// ─── ENVÍO DE PEDIDOS A MARCO ───────────────────────────────────────

export interface MarcoOrderPayload {
  canal: string;
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
    dni: string;
    direccion: {
      calle: string;
      ciudad: string;
      provincia: string;
      cp: string;
      pais: string;
    };
  };
  items: Array<{
    sku: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  metodo_pago: string;
  referencia_pago: string;
  total: number;
  notas: string;
}

/**
 * Enviar un pedido al sistema de Marco.
 *
 * Marco no tiene API REST pública para recibir pedidos aún.
 * Por ahora esta función registra el intento y devuelve un
 * resultado simulado. Cuando Marco implemente su endpoint,
 * basta con descomentar el fetch real.
 */
export async function createMarcoOrder(
  payload: MarcoOrderPayload,
): Promise<{ ok: boolean; data?: { order_id: string; order_number: string }; error?: string }> {
  try {
    // TODO: Descomentar cuando Marco tenga endpoint de pedidos
    // const res = await fetch(`${PERFUMEDIGITAL.baseUrl}/api/pedidos`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    // const data = await res.json();
    // return { ok: res.ok, data };

    console.log(
      `[MarcoOrder] Pedido registrado (canal: ${payload.canal}, total: ${payload.total}€, items: ${payload.items.length}). Pendiente de envío manual a Marco.`,
    );

    return {
      ok: false,
      error: "API de pedidos de Marco no configurada aún. Notificar manualmente.",
    };
  } catch (err) {
    console.error("[MarcoOrder] Error:", err);
    return { ok: false, error: String(err) };
  }
}

// ─── TRANSFORMADOR ──────────────────────────────────────────────────

/** Transforma un producto de perfumedigital al formato de nuestra BD */
export function transformToSupabaseProduct(p: ProductDetail) {
  const nombre = p.nombre.replace(/\s*@\s*$/, "").trim();
  const mlMatch = nombre.match(/(\d+)\s*ML/i);
  const ml = mlMatch ? parseInt(mlMatch[1], 10) : 0;
  const descuento =
    p.pvp_original > 0
      ? Math.round(((p.pvp_original - p.precio_venta) / p.pvp_original) * 100)
      : 0;

  return {
    sku: p.id,
    name: nombre,
    brand: p.marca,
    category: p.categoria.toLowerCase(),
    tipo: p.tipo,
    ml,
    price: p.precio_venta,
    original_price: p.pvp_original,
    discount_pct: descuento,
    image_url: p.imagen_url,
    description: p.descripcion,
    stock: p.stock,
    active: p.stock > 0,
  };
}
