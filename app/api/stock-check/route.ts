import { NextRequest, NextResponse } from "next/server";

const BASE = "https://perfumedigital.es/exportadatos.php?op=descripcion&id=";

async function fetchStock(sku: string): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${BASE}${sku}`, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return -1;
    const html = await res.text();
    const m = html.match(/Unidades:\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 0;
  } catch {
    clearTimeout(timer);
    return -1;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { skus } = (await req.json()) as { skus: string[] };
    if (!Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json({ error: "skus[] requerido" }, { status: 400 });
    }

    const batch = skus.slice(0, 15);
    const results: Record<string, number> = {};

    const CONCURRENCY = 5;
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY);
      const stocks = await Promise.all(chunk.map((sku) => fetchStock(sku)));
      chunk.forEach((sku, idx) => {
        results[sku] = stocks[idx];
      });
      if (i + CONCURRENCY < batch.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    return NextResponse.json({ stocks: results });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
