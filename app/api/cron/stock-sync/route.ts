import { NextRequest, NextResponse } from "next/server";
import { syncStockFromLog, syncFromLocalCatalog } from "@/lib/marco-api/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isFull = req.nextUrl.searchParams.get("full") === "1";
  const syncType = isFull ? "full" : "stock";

  console.log(`[StockSync] Cron ${syncType} sync started at ${new Date().toISOString()}`);

  try {
    const result = isFull
      ? await syncFromLocalCatalog()
      : await syncStockFromLog();

    console.log(
      `[StockSync] Cron ${syncType} sync finished — ${result.updated} updated, ${result.errors.length} errors, ${result.duration_ms}ms`,
    );

    return NextResponse.json({ type: syncType, ...result });
  } catch (err) {
    console.error(`[StockSync] Cron ${syncType} sync failed:`, err);
    return NextResponse.json(
      { error: "Sync failed", details: String(err) },
      { status: 500 },
    );
  }
}
