import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CSV_CANDIDATES = [
  path.join(ROOT, "scripts", "productos_completos.csv"),
  path.join(ROOT, "productos_perfumedigital.csv"),
  path.join(ROOT, "..", "productos_perfumedigital.csv"),
];

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = {
    dryRun: false,
    csvPath: null,
    outDir: null,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") out.dryRun = true;
    else if (argv[i] === "--csv" && argv[i + 1]) {
      out.csvPath = path.resolve(argv[++i]);
    } else if (argv[i] === "--out" && argv[i + 1]) {
      out.outDir = path.resolve(argv[++i]);
    }
  }
  return out;
}

function findCsvPath(explicit) {
  if (explicit && fs.existsSync(explicit)) return explicit;
  for (const candidate of CSV_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "No se encontro CSV de imagenes (productos_completos.csv / productos_perfumedigital.csv). Usa --csv /ruta/archivo.csv",
  );
}

/** Indices de imagen_url y filename opcional; filename se deduce de la URL si falta. */
function columnIndicesFromHeader(headerParts) {
  const h = headerParts.map((x) => x.trim().toLowerCase());
  const iUrl = h.indexOf("imagen_url");
  const iFilename = h.indexOf("filename");
  if (iUrl >= 0) {
    return { iUrl, iFilename };
  }
  return { iUrl: 3, iFilename: 4 };
}

function basenameSafe(name) {
  const b = path.basename(String(name).replace(/\\/g, "/").trim());
  if (!b || b.includes("..")) return "";
  return b;
}

/** CSV: comas dentro de comillas, "" como escape */
function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i += 1;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        cur += line[i];
        i += 1;
      }
      continue;
    }
    if (line[i] === ",") {
      result.push(cur);
      cur = "";
      i += 1;
      continue;
    }
    cur += line[i];
    i += 1;
  }
  result.push(cur);
  return result;
}

async function downloadOne(url, destPath) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PerfumeriaLocal/1.0; +https://localhost)",
      Accept: "image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 80) throw new Error("Respuesta demasiado pequeña");
  fs.writeFileSync(destPath, buf);
}

async function pool(items, concurrency, fn) {
  let idx = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    async () => {
      for (;;) {
        const j = idx++;
        if (j >= items.length) return;
        await fn(items[j], j);
      }
    },
  );
  await Promise.all(workers);
}

async function main() {
  const args = parseArgs();
  const OUTPUT_DIR =
    args.outDir ?? path.join(ROOT, "public", "assets", "images", "edp");
  const csvPath = findCsvPath(args.csvPath ?? null);

  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    console.error("CSV vacio o sin datos");
    process.exit(1);
  }

  const headerParts = parseCsvLine(lines[0]);
  const { iUrl, iFilename } = columnIndicesFromHeader(headerParts);

  /** @type {Map<string, { url: string, dest: string }>} */
  const unique = new Map();

  for (let li = 1; li < lines.length; li++) {
    const parts = parseCsvLine(lines[li]);
    if (parts.length <= iUrl) continue;
    const imagenUrl = (parts[iUrl] || "").trim();
    let filename =
      iFilename >= 0 && parts[iFilename] ? basenameSafe(parts[iFilename]) : "";
    if (!filename && imagenUrl) {
      filename = basenameSafe(imagenUrl);
    }
    if (!imagenUrl || !/^https?:\/\//i.test(imagenUrl) || !filename) continue;

    const key = filename.toLowerCase();
    const dest = path.join(OUTPUT_DIR, key);
    if (!unique.has(key)) {
      unique.set(key, { url: imagenUrl, dest });
    }
  }

  const tasks = [...unique.entries()];

  if (args.dryRun) {
    console.log(`CSV: ${csvPath}`);
    console.log(`Filas en CSV (aprox.): ${lines.length - 1}`);
    console.log(`Imagenes unicas por filename: ${tasks.length}`);
    console.log("(sin descargar --dry-run)\n");
    for (const [key, { url }] of tasks.sort((a, b) => a[0].localeCompare(b[0]))) {
      console.log(`${key}\t${url}`);
    }
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  await pool(tasks, 4, async ([key, { url, dest }]) => {
    if (fs.existsSync(dest)) {
      skipped += 1;
      return;
    }
    try {
      await downloadOne(url, dest);
      ok += 1;
    } catch (e) {
      failed += 1;
      console.warn(`Fallo ${key}: ${String(e)}`);
    }
  });

  console.log(
    `PerfumeDigital: unicos=${tasks.length} | descargadas=${ok} | ya existian=${skipped} | fallidas=${failed}`,
  );
  console.log(`Destino: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
