import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ROOT = process.cwd();
const CSV_CANDIDATES = [
  path.join(ROOT, "edp_producto.csv"),
  path.join(ROOT, "..", "edp_producto.csv"),
];
const OUTPUT_DIR = path.join(ROOT, "public", "assets", "images", "edp");

function findCsvPath() {
  for (const candidate of CSV_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("No se encontro edp_producto.csv");
}

function parsePipeCsvLine(line) {
  return line
    .split(/\|(?=(?:[^"]*"[^"]*")*[^"]*$)/g)
    .map((field) => field.trim().replace(/^"(.*)"$/, "$1").replace(/""/g, '"'));
}

function basenameSafe(name) {
  const b = path.basename(String(name).replace(/\\/g, "/").trim());
  if (!b || b.includes("..")) return "";
  return b;
}

function collectSearchRoots(parentDir) {
  const extra = process.env.EDP_IMAGES_SOURCE
    ? process.env.EDP_IMAGES_SOURCE.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
    : [];
  const defaults = [
    parentDir,
    path.join(parentDir, "imagenes"),
    path.join(parentDir, "images"),
    path.join(parentDir, "fotos"),
    path.join(parentDir, "img"),
    path.join(parentDir, "productos"),
    path.join(parentDir, "fotos_producto"),
  ];
  return [...new Set([...extra, ...defaults])];
}

function findSourceFile(roots, imageName) {
  for (const root of roots) {
    const direct = path.join(root, imageName);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  }
  return null;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const csvPath = findCsvPath();
  const parentDir = path.dirname(csvPath);
  const searchRoots = collectSearchRoots(parentDir);

  const input = fs.createReadStream(csvPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  let isHeader = true;
  let total = 0;
  let copied = 0;
  let skipped = 0;
  let missing = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (isHeader) {
      isHeader = false;
      continue;
    }

    const cols = parsePipeCsvLine(line);
    if (cols.length < 7) continue;

    const imageName = basenameSafe(cols[6]);
    if (!imageName) continue;
    total += 1;

    const dest = path.join(OUTPUT_DIR, imageName);
    if (fs.existsSync(dest)) {
      skipped += 1;
      continue;
    }

    const src = findSourceFile(searchRoots, imageName);
    if (!src) {
      missing += 1;
      continue;
    }

    fs.copyFileSync(src, dest);
    copied += 1;
  }

  console.log(
    `Imagenes EDP: ${total} | copiadas: ${copied} | ya existian: ${skipped} | no encontradas: ${missing}`,
  );
  console.log(
    `Rutas buscadas: ${searchRoots.slice(0, 6).join(", ")}${searchRoots.length > 6 ? ", ..." : ""}`,
  );
  if (missing > 0) {
    console.log(
      "Tip: pon todas las fotos en una carpeta y exporta EDP_IMAGES_SOURCE=/ruta/a/tus/fotos",
    );
    console.log(
      "O define NEXT_PUBLIC_EDP_IMAGE_BASE=https://tu-servidor/ruta/ en .env.local",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
