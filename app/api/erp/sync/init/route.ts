import { NextResponse } from "next/server";
import { startStockSync } from "@/lib/stock-sync-scheduler";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = startStockSync();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[StockSync] Failed to start scheduler:", err);
    return NextResponse.json(
      { error: "Failed to start scheduler", details: String(err) },
      { status: 500 },
    );
  }
}
