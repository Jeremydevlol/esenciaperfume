import fs from "node:fs";
import path from "node:path";

export type DruniProduct = {
  name: string;
  sku: string;
  priceCurrent: number;
  priceOriginal?: number;
  discountPct?: number;
  category: string;
  brandId: string;
  units: string;
  descriptionHtml: string;
  productUrl: string;
  imageUrl: string;
};

let cachedPerfumes: DruniProduct[] | null = null;
let productBySku: Map<string, DruniProduct> | null = null;

function parsePipeCsvLine(line: string): string[] {
  return line
    .split(/\|(?=(?:[^"]*"[^"]*")*[^"]*$)/g)
    .map((field) => field.trim().replace(/^"(.*)"$/, "$1").replace(/""/g, '"'));
}

function parsePrice(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCsvPath(): string {
  const candidates = [
    path.join(process.cwd(), "edp_producto.csv"),
    path.join(process.cwd(), "..", "edp_producto.csv"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error("No se encontro edp_producto.csv");
}

const PLACEHOLDER_IMG = "/assets/images/product_1.png";

/** Mapa nombre en minúsculas → nombre real en disco (p. ej. foo.JPG → foo.JPG) */
let edpFileLowerToActual: Map<string, string> | null = null;

function edpImagesDir(): string {
  return path.join(process.cwd(), "public", "assets", "images", "edp");
}

function getEdpFileLowerToActual(): Map<string, string> {
  if (edpFileLowerToActual) return edpFileLowerToActual;
  const map = new Map<string, string>();
  const dir = edpImagesDir();
  try {
    if (!fs.existsSync(dir)) {
      edpFileLowerToActual = map;
      return map;
    }
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (!fs.statSync(full).isFile()) continue;
      map.set(name.toLowerCase(), name);
    }
  } catch {
    // directorio ilegible
  }
  edpFileLowerToActual = map;
  return map;
}

function edpImageBaseUrl(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_EDP_IMAGE_BASE?.trim() ||
    process.env.EDP_IMAGE_BASE?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "");
}

function safeEdpImageFileName(raw: string): string {
  const base = path.basename(String(raw).replace(/\\/g, "/").trim());
  if (!base || base === "." || base.includes("..")) return "";
  return base;
}

/** Evita mostrar id_categoria pegado al nombre si el CSV vino mal formateado */
function cleanEdpProductName(raw: string): string {
  return String(raw ?? "")
    .replace(/^[a-f0-9]{24,32}\s+/i, "")
    .trim();
}

function resolveEdpImageUrl(imageField: string): string {
  const raw = String(imageField ?? "").trim();
  if (!raw) return PLACEHOLDER_IMG;

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const fileName = safeEdpImageFileName(raw);
  if (!fileName) return PLACEHOLDER_IMG;

  const key = fileName.toLowerCase();
  const index = getEdpFileLowerToActual();
  const actualOnDisk = index.get(key);
  if (actualOnDisk) {
    return `/assets/images/edp/${encodeURIComponent(actualOnDisk)}`;
  }

  /** Fallback: ruta literal por si el índice aún no incluye el archivo */
  const folder = "edp" as const;
  const directLocal = path.join(process.cwd(), "public", "assets", "images", folder, key);
  if (fs.existsSync(directLocal)) {
    return `/assets/images/${folder}/${encodeURIComponent(key)}`;
  }

  const base = edpImageBaseUrl();
  if (base) {
    return `${base}/${encodeURIComponent(key)}`;
  }

  return PLACEHOLDER_IMG;
}

/** Solo productos cuyo fichero de imagen existe en `public/assets/images/edp/` (coincidencia sin distinguir mayúsculas). */
function edpImageFileExistsLocally(imageField: string): boolean {
  const raw = String(imageField ?? "").trim();
  if (!raw || /^https?:\/\//i.test(raw)) return false;

  const fileName = safeEdpImageFileName(raw);
  if (!fileName) return false;

  const key = fileName.toLowerCase();
  const index = getEdpFileLowerToActual();
  if (index.get(key)) return true;

  const directLocal = path.join(edpImagesDir(), key);
  return fs.existsSync(directLocal);
}

function loadFromEdpCsv(raw: string): DruniProduct[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];
  const parsed: DruniProduct[] = [];

  for (const row of lines.slice(1)) {
    const cols = parsePipeCsvLine(row);
    if (cols.length < 10) continue;

    const id = cols[0];
    const category = cols[1] ?? "";
    const brandId = cols[2] ?? "";
    const name = cleanEdpProductName(cols[3] ?? "");
    const descriptionHtml = cols[4] ?? "";
    const imageField = cols[6] ?? "";
    const units = cols[7] ?? "";
    const imageRaw = safeEdpImageFileName(imageField);
    const pvr = parsePrice(cols[8] ?? "0");
    const pvp = parsePrice(cols[9] ?? "0");

    if (!id || !name || !imageRaw) continue;
    if (!Number.isFinite(pvp) || pvp <= 0 || pvp >= 5000) continue;
    if (!edpImageFileExistsLocally(imageField)) continue;

    const discountPct =
      pvr > 0 && pvr > pvp ? Number.parseFloat((((pvr - pvp) / pvr) * 100).toFixed(2)) : undefined;

    parsed.push({
      name,
      sku: id,
      priceCurrent: pvp,
      priceOriginal: pvr > 0 ? pvr : undefined,
      discountPct,
      category,
      brandId,
      units,
      descriptionHtml,
      productUrl: "",
      imageUrl: resolveEdpImageUrl(imageField),
    });
  }

  return parsed;
}

export function getDruniPerfumes(): DruniProduct[] {
  if (cachedPerfumes) return cachedPerfumes;

  const csvPath = getCsvPath();
  const raw = fs.readFileSync(csvPath, "utf8");
  const parsed = loadFromEdpCsv(raw);

  cachedPerfumes = parsed;
  productBySku = new Map(parsed.map((p) => [p.sku, p]));
  return parsed;
}

export function getEdpProductById(id: string): DruniProduct | null {
  getDruniPerfumes();
  return productBySku?.get(String(id)) ?? null;
}
