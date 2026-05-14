"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

type PeriodKey = "today" | "7d" | "30d" | "90d" | "month" | "custom";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "90 días" },
  { key: "month", label: "Este mes" },
  { key: "custom", label: "Personalizado" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "#f59e0b" },
  confirmed: { label: "Confirmado", color: "#3b82f6" },
  processing: { label: "Procesando", color: "#6366f1" },
  shipped: { label: "Enviado", color: "#14b8a6" },
  delivered: { label: "Entregado", color: "#22c55e" },
  cancelled: { label: "Cancelado", color: "#ef4444" },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  tpv: "Tarjeta (TPV)",
  paypal: "PayPal",
  contrareembolso: "Contra reembolso",
  transferencia: "Transferencia",
};

function getStartDate(period: PeriodKey, customFrom: string): Date {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return new Date(now.getTime() - 7 * 86400000);
    case "30d":
      return new Date(now.getTime() - 30 * 86400000);
    case "90d":
      return new Date(now.getTime() - 90 * 86400000);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "custom":
      return customFrom ? new Date(customFrom) : new Date(now.getTime() - 30 * 86400000);
  }
}

function getEndDate(period: PeriodKey, customTo: string): Date {
  if (period === "custom" && customTo) return new Date(customTo + "T23:59:59.999");
  return new Date();
}

interface OrderWithItems {
  id: string;
  created_at: string;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  order_items: {
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    brand?: string;
    category?: string;
  }[];
}

interface TopProduct {
  sku: string;
  name: string;
  brand: string;
  units: number;
  revenue: number;
  pct: number;
}

interface DayRevenue {
  date: string;
  revenue: number;
}

export default function AnaliticasPage() {
  const supabase = createClient();

  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [productsSold, setProductsSold] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);

  const [dailyRevenue, setDailyRevenue] = useState<DayRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryData, setCategoryData] = useState<{ category: string; units: number; revenue: number }[]>([]);
  const [paymentData, setPaymentData] = useState<{ method: string; orders: number; revenue: number; pct: number }[]>([]);
  const [statusData, setStatusData] = useState<{ status: string; count: number }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const startDate = getStartDate(period, customFrom).toISOString();
    const endDate = getEndDate(period, customTo).toISOString();

    const [ordersRes, customersRes, allOrdersRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(sku, name, quantity, unit_price, total, brand, category)")
        .eq("payment_status", "paid")
        .gte("created_at", startDate)
        .lte("created_at", endDate),
      supabase
        .from("customers")
        .select("id")
        .gte("created_at", startDate)
        .lte("created_at", endDate),
      supabase
        .from("orders")
        .select("id, status, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate),
    ]);

    const orders = (ordersRes.data ?? []) as unknown as OrderWithItems[];
    const customers = customersRes.data ?? [];
    const allOrders = allOrdersRes.data ?? [];

    // KPIs
    let revenue = 0;
    let prodCount = 0;
    for (const o of orders) {
      revenue += o.total || 0;
      for (const item of o.order_items ?? []) {
        prodCount += item.quantity || 0;
      }
    }
    setTotalRevenue(revenue);
    setOrderCount(orders.length);
    setProductsSold(prodCount);
    setAvgTicket(orders.length > 0 ? revenue / orders.length : 0);
    setNewCustomers(customers.length);

    // Daily revenue
    const dayMap = new Map<string, number>();
    for (const o of orders) {
      const dayKey = o.created_at.slice(0, 10);
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + (o.total || 0));
    }

    const start = getStartDate(period, customFrom);
    const end = getEndDate(period, customTo);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    const showDays = Math.min(diffDays, period === "7d" || period === "today" ? 14 : 30);

    const dailyArr: DayRevenue[] = [];
    for (let i = showDays - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailyArr.push({ date: key, revenue: dayMap.get(key) || 0 });
    }
    setDailyRevenue(dailyArr);

    // Top products
    const prodMap = new Map<string, TopProduct>();
    for (const o of orders) {
      for (const item of o.order_items ?? []) {
        const key = item.sku || item.name;
        const existing = prodMap.get(key) || { sku: item.sku, name: item.name, brand: item.brand || "-", units: 0, revenue: 0, pct: 0 };
        existing.units += item.quantity || 0;
        existing.revenue += item.total || 0;
        prodMap.set(key, existing);
      }
    }
    const topArr = Array.from(prodMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p) => ({ ...p, pct: revenue > 0 ? (p.revenue / revenue) * 100 : 0 }));
    setTopProducts(topArr);

    // Categories
    const catMap = new Map<string, { units: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.order_items ?? []) {
        const cat = item.category || "Sin categoría";
        const existing = catMap.get(cat) || { units: 0, revenue: 0 };
        existing.units += item.quantity || 0;
        existing.revenue += item.total || 0;
        catMap.set(cat, existing);
      }
    }
    setCategoryData(
      Array.from(catMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
    );

    // Payment methods
    const payMap = new Map<string, { orders: number; revenue: number }>();
    for (const o of orders) {
      const m = o.payment_method || "otro";
      const existing = payMap.get(m) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += o.total || 0;
      payMap.set(m, existing);
    }
    setPaymentData(
      Array.from(payMap.entries())
        .map(([method, data]) => ({ method, ...data, pct: orders.length > 0 ? (data.orders / orders.length) * 100 : 0 }))
        .sort((a, b) => b.revenue - a.revenue)
    );

    // Order status (all orders, not just paid)
    const statusMap = new Map<string, number>();
    for (const o of allOrders) {
      statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
    }
    setStatusData(
      Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)
    );

    setLoading(false);
  }, [period, customFrom, customTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
  const maxStatusCount = Math.max(...statusData.map((s) => s.count), 1);

  return (
    <AdminShell pageTitle="Analíticas">
      {/* Period selector */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__left" style={{ flexWrap: "wrap", gap: 8 }}>
          <div className="admin-tabs" style={{ marginBottom: 0 }}>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`admin-tab${period === opt.key ? " admin-tab--active" : ""}`}
                onClick={() => setPeriod(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="date"
                className="admin-input"
                style={{ width: 160 }}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span style={{ color: "#94a3b8" }}>—</span>
              <input
                type="date"
                className="admin-input"
                style={{ width: 160 }}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /></div>
      ) : (
        <>
          {/* KPI cards — 3 per row */}
          <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--green">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Ventas Totales</p>
                <p className="admin-stat-card__value">{fmt.format(totalRevenue)}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--blue">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Pedidos</p>
                <p className="admin-stat-card__value">{orderCount.toLocaleString("es-ES")}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--purple">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Productos Vendidos</p>
                <p className="admin-stat-card__value">{productsSold.toLocaleString("es-ES")}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--amber">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Ticket Medio</p>
                <p className="admin-stat-card__value">{fmt.format(avgTicket)}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--teal">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Tasa de Conversión</p>
                <p className="admin-stat-card__value">—%</p>
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "block" }}>Próximamente</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--red">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Nuevos Clientes</p>
                <p className="admin-stat-card__value">{newCustomers.toLocaleString("es-ES")}</p>
              </div>
            </div>
          </div>

          {/* Sales chart (CSS bars) */}
          <div className="admin-card" style={{ marginBottom: 28 }}>
            <div className="admin-card__header">
              <h3 className="admin-card__title">Evolución de Ventas</h3>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Máx: {fmt.format(maxRevenue)}
              </span>
            </div>
            {dailyRevenue.length === 0 ? (
              <div className="admin-empty">
                <p className="admin-empty__title">Sin datos</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 200 }}>
                  {dailyRevenue.map((d) => (
                    <div
                      key={d.date}
                      title={`${formatDate(d.date + "T00:00:00")}: ${fmt.format(d.revenue)}`}
                      style={{
                        flex: 1,
                        height: `${(d.revenue / maxRevenue) * 100}%`,
                        background: d.revenue > 0 ? "linear-gradient(180deg, #2563eb, #3b82f6)" : "#e2e8f0",
                        borderRadius: "4px 4px 0 0",
                        minHeight: 2,
                        cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {dailyRevenue.map((d, i) => (
                    <div
                      key={d.date}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 9,
                        color: "#94a3b8",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {i % Math.max(1, Math.floor(dailyRevenue.length / 10)) === 0
                        ? formatShortDate(d.date + "T00:00:00")
                        : ""}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="admin-grid-2" style={{ marginBottom: 28 }}>
            {/* Top Products */}
            <div className="admin-card admin-card--flush">
              <div className="admin-card__header" style={{ padding: "20px 24px 0" }}>
                <h3 className="admin-card__title">Top Productos</h3>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Nombre</th>
                      <th>Marca</th>
                      <th>Uds.</th>
                      <th>Revenue</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>Sin datos</td></tr>
                    ) : (
                      topProducts.map((p) => (
                        <tr key={p.sku}>
                          <td><span className="admin-tag">{p.sku || "—"}</span></td>
                          <td>{p.name}</td>
                          <td>{p.brand}</td>
                          <td>{p.units}</td>
                          <td style={{ fontWeight: 600 }}>{fmt.format(p.revenue)}</td>
                          <td>{p.pct.toFixed(1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Categories */}
            <div className="admin-card admin-card--flush">
              <div className="admin-card__header" style={{ padding: "20px 24px 0" }}>
                <h3 className="admin-card__title">Top Categorías</h3>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Uds.</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>Sin datos</td></tr>
                    ) : (
                      categoryData.map((c) => (
                        <tr key={c.category}>
                          <td>{c.category}</td>
                          <td>{c.units}</td>
                          <td style={{ fontWeight: 600 }}>{fmt.format(c.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="admin-grid-2" style={{ marginBottom: 28 }}>
            {/* Payment methods */}
            <div className="admin-card admin-card--flush">
              <div className="admin-card__header" style={{ padding: "20px 24px 0" }}>
                <h3 className="admin-card__title">Métodos de Pago</h3>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Método</th>
                      <th>Pedidos</th>
                      <th>Revenue</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentData.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>Sin datos</td></tr>
                    ) : (
                      paymentData.map((p) => (
                        <tr key={p.method}>
                          <td>{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                          <td>{p.orders}</td>
                          <td style={{ fontWeight: 600 }}>{fmt.format(p.revenue)}</td>
                          <td>{p.pct.toFixed(1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Orders by status */}
            <div className="admin-card">
              <div className="admin-card__header">
                <h3 className="admin-card__title">Pedidos por Estado</h3>
              </div>
              {statusData.length === 0 ? (
                <div className="admin-empty" style={{ padding: 32 }}>
                  <p className="admin-empty__title">Sin datos</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {statusData.map((s) => {
                    const meta = STATUS_LABELS[s.status] || { label: s.status, color: "#94a3b8" };
                    return (
                      <div key={s.status}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{meta.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{s.count}</span>
                        </div>
                        <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${(s.count / maxStatusCount) * 100}%`,
                              height: "100%",
                              background: meta.color,
                              borderRadius: 4,
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
