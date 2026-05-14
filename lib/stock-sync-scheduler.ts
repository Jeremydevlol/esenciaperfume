import { PERFUMEDIGITAL } from "@/lib/marco-api/config";
import { syncStockFromLog, syncFromLocalCatalog } from "@/lib/marco-api/sync";

let started = false;
let stockTimer: ReturnType<typeof setInterval> | null = null;
let fullSyncTimer: ReturnType<typeof setInterval> | null = null;

async function runStockSync() {
  try {
    console.log(`[StockSync] Quick stock sync started at ${new Date().toISOString()}`);
    const result = await syncStockFromLog();
    console.log(
      `[StockSync] Quick stock sync done — ${result.updated} updated, ${result.errors.length} errors, ${result.duration_ms}ms`,
    );
  } catch (err) {
    console.error("[StockSync] Quick stock sync failed:", err);
  }
}

async function runFullSync() {
  try {
    console.log(`[StockSync] Full catalog sync started at ${new Date().toISOString()}`);
    const result = await syncFromLocalCatalog();
    console.log(
      `[StockSync] Full catalog sync done — ${result.updated} updated, ${result.errors.length} errors, ${result.duration_ms}ms`,
    );
  } catch (err) {
    console.error("[StockSync] Full catalog sync failed:", err);
  }
}

export function startStockSync() {
  if (started) {
    console.log("[StockSync] Scheduler already running, skipping duplicate start");
    return { status: "already_running" } as const;
  }

  started = true;

  stockTimer = setInterval(runStockSync, PERFUMEDIGITAL.stockPollInterval);
  fullSyncTimer = setInterval(runFullSync, PERFUMEDIGITAL.fullSyncInterval);

  console.log(
    `[StockSync] Scheduler started — stock every ${PERFUMEDIGITAL.stockPollInterval / 1000}s, full every ${PERFUMEDIGITAL.fullSyncInterval / 1000}s`,
  );

  runStockSync();

  return { status: "started" } as const;
}

export function stopStockSync() {
  if (!started) {
    console.log("[StockSync] Scheduler not running, nothing to stop");
    return { status: "not_running" } as const;
  }

  if (stockTimer) clearInterval(stockTimer);
  if (fullSyncTimer) clearInterval(fullSyncTimer);

  stockTimer = null;
  fullSyncTimer = null;
  started = false;

  console.log("[StockSync] Scheduler stopped");
  return { status: "stopped" } as const;
}
