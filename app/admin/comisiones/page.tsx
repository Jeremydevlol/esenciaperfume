"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function getMonthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    opts.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return opts;
}

function getCommissionRate(products: number): number {
  if (products <= 300) return 1.0;
  if (products <= 700) return 1.25;
  if (products <= 1500) return 1.5;
  return 1.5; // above 1500: renegotiation, use 1.50 as baseline
}

function getMonthlyFee(products: number): number {
  if (products === 0) return 0;
  if (products <= 100) return 300;
  if (products <= 300) return 500;
  if (products <= 700) return 800;
  return 1200;
}

function getCommissionTierLabel(products: number): string {
  if (products <= 300) return "1-300 (1,00 €/ud)";
  if (products <= 700) return "301-700 (1,25 €/ud)";
  if (products <= 1500) return "701-1500 (1,50 €/ud)";
  return "+1500 (renegociar)";
}

function getNextTier(products: number): { label: string; threshold: number } | null {
  if (products <= 300) return { label: "301-700 (1,25 €/ud)", threshold: 300 };
  if (products <= 700) return { label: "701-1500 (1,50 €/ud)", threshold: 700 };
  if (products <= 1500) return { label: "+1500 (renegociar)", threshold: 1500 };
  return null;
}

interface DailyBreakdown {
  date: string;
  orders: number;
  products: number;
  commission: number;
}

export default function ComisionesPage() {
  const supabase = createClient();
  const monthOptions = getMonthOptions();

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [dailyData, setDailyData] = useState<DailyBreakdown[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [year, month] = selectedMonth.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1).toISOString();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_items(quantity)")
      .eq("payment_status", "paid")
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    if (!orders || orders.length === 0) {
      setTotalProducts(0);
      setDailyData([]);
      setLoading(false);
      return;
    }

    let prodCount = 0;
    const dayMap = new Map<string, { orders: number; products: number }>();

    for (const order of orders) {
      const items = (order as any).order_items as { quantity: number }[] | null;
      const qty = items?.reduce((s: number, i: { quantity: number }) => s + (i.quantity || 0), 0) ?? 0;
      prodCount += qty;

      const dayKey = new Date(order.created_at).toISOString().slice(0, 10);
      const existing = dayMap.get(dayKey) || { orders: 0, products: 0 };
      existing.orders += 1;
      existing.products += qty;
      dayMap.set(dayKey, existing);
    }

    setTotalProducts(prodCount);

    const rate = getCommissionRate(prodCount);
    const daysInMonth = new Date(year, month, 0).getDate();
    const breakdown: DailyBreakdown[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const entry = dayMap.get(dateStr);
      if (entry) {
        breakdown.push({
          date: dateStr,
          orders: entry.orders,
          products: entry.products,
          commission: entry.products * rate,
        });
      }
    }

    setDailyData(breakdown);
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const commissionRate = getCommissionRate(totalProducts);
  const totalCommissions = totalProducts * commissionRate;
  const monthlyFee = getMonthlyFee(totalProducts);
  const totalToCobrar = totalCommissions + monthlyFee;
  const nextTier = getNextTier(totalProducts);

  const tierStart = totalProducts <= 300 ? 0 : totalProducts <= 700 ? 301 : totalProducts <= 1500 ? 701 : 1501;
  const tierEnd = totalProducts <= 300 ? 300 : totalProducts <= 700 ? 700 : totalProducts <= 1500 ? 1500 : 2000;
  const progressPct = tierEnd > tierStart ? Math.min(((totalProducts - tierStart) / (tierEnd - tierStart)) * 100, 100) : 100;

  return (
    <AdminShell pageTitle="Comisiones">
      {/* Month selector toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__left">
          <select
            className="admin-select"
            style={{ width: 240 }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--blue">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Productos Vendidos</p>
                <p className="admin-stat-card__value">{totalProducts.toLocaleString("es-ES")}</p>
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                  Tramo: {getCommissionTierLabel(totalProducts)}
                </span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--green">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Comisión por Producto</p>
                <p className="admin-stat-card__value">{fmt.format(commissionRate)}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--purple">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Total Comisiones</p>
                <p className="admin-stat-card__value">{fmt.format(totalCommissions)}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--amber">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Fee Mensual</p>
                <p className="admin-stat-card__value">{fmt.format(monthlyFee)}</p>
              </div>
            </div>
          </div>

          {/* Liquidación mensual */}
          <div className="admin-card" style={{ marginBottom: 28 }}>
            <div className="admin-card__header">
              <h3 className="admin-card__title">Liquidación Mensual</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#334155" }}>
                <span>Comisiones por producto ({totalProducts} × {fmt.format(commissionRate)})</span>
                <span style={{ fontWeight: 600 }}>{fmt.format(totalCommissions)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#334155" }}>
                <span>Fee mensual de mantenimiento</span>
                <span style={{ fontWeight: 600 }}>{fmt.format(monthlyFee)}</span>
              </div>
              <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Total a cobrar</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", letterSpacing: "-0.02em" }}>{fmt.format(totalToCobrar)}</span>
              </div>
            </div>
          </div>

          {/* Progress bar to next tier */}
          {nextTier && (
            <div className="admin-card" style={{ marginBottom: 28 }}>
              <div className="admin-card__header">
                <h3 className="admin-card__title">Progreso al siguiente tramo</h3>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Siguiente: {nextTier.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 12, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #2563eb, #7c3aed)", borderRadius: 6, transition: "width 0.4s ease" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}>
                  {totalProducts} / {nextTier.threshold}
                </span>
              </div>
            </div>
          )}

          {/* Daily breakdown table */}
          <div className="admin-card admin-card--flush">
            <div className="admin-card__header" style={{ padding: "20px 24px 0" }}>
              <h3 className="admin-card__title">Desglose Diario</h3>
            </div>
            {dailyData.length === 0 ? (
              <div className="admin-empty">
                <div className="admin-empty__icon">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="admin-empty__title">Sin ventas este mes</p>
                <p className="admin-empty__text">No hay pedidos pagados registrados en el mes seleccionado.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Pedidos del día</th>
                      <th>Productos vendidos</th>
                      <th>Comisión del día</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((row) => (
                      <tr key={row.date}>
                        <td>{formatDate(row.date + "T00:00:00")}</td>
                        <td>{row.orders}</td>
                        <td>{row.products}</td>
                        <td style={{ fontWeight: 600 }}>{fmt.format(row.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#f8fafc" }}>
                      <td style={{ fontWeight: 700 }}>Total</td>
                      <td style={{ fontWeight: 700 }}>{dailyData.reduce((s, r) => s + r.orders, 0)}</td>
                      <td style={{ fontWeight: 700 }}>{totalProducts}</td>
                      <td style={{ fontWeight: 700 }}>{fmt.format(totalCommissions)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}
