"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { DashboardStats, Order, Product } from "@/lib/supabase/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  returned: "Devuelto",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "admin-badge--amber",
  confirmed: "admin-badge--blue",
  processing: "admin-badge--purple",
  shipped: "admin-badge--teal",
  delivered: "admin-badge--green",
  cancelled: "admin-badge--red",
  returned: "admin-badge--gray",
};

function formatEUR(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchDashboard() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
          { data: products },
          { data: activeProducts },
          { data: orders },
          { data: todayOrders },
          { data: customers },
          { data: lowStock },
          { data: recent },
        ] = await Promise.all([
          supabase.from("products").select("id", { count: "exact" }),
          supabase.from("products").select("id", { count: "exact" }).eq("active", true),
          supabase.from("orders").select("*"),
          supabase.from("orders").select("*").gte("created_at", today.toISOString()),
          supabase.from("customers").select("id", { count: "exact" }),
          supabase
            .from("products")
            .select("*")
            .eq("active", true)
            .lte("stock", 10)
            .order("stock", { ascending: true })
            .limit(8),
          supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const allOrders: Order[] = (orders ?? []) as Order[];
        const pendingOrders = allOrders.filter(
          (o: Order) => o.status === "pending" || o.status === "confirmed"
        );
        const revenueToday = (todayOrders ?? []).reduce(
          (sum: number, o: Order) => sum + (o.total ?? 0),
          0
        );

        setStats({
          revenueToday,
          pendingOrders: pendingOrders.length,
          totalProducts: activeProducts?.length ?? 0,
          totalCustomers: customers?.length ?? 0,
          totalOrders: allOrders.length,
          totalRevenue: allOrders.reduce((s: number, o: Order) => s + (o.total ?? 0), 0),
          avgOrderValue:
            allOrders.length > 0
              ? allOrders.reduce((s: number, o: Order) => s + (o.total ?? 0), 0) /
                allOrders.length
              : 0,
          lowStockCount: lowStock?.length ?? 0,
        });

        setRecentOrders((recent ?? []) as Order[]);
        setLowStockProducts((lowStock ?? []) as Product[]);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return (
    <AdminShell pageTitle="Dashboard">
      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--green">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Ingresos Hoy</p>
                <p className="admin-stat-card__value">{formatEUR(stats?.revenueToday ?? 0)}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--amber">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Pedidos Pendientes</p>
                <p className="admin-stat-card__value">{stats?.pendingOrders ?? 0}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--blue">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Productos Activos</p>
                <p className="admin-stat-card__value">{stats?.totalProducts ?? 0}</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-card__icon admin-stat-card__icon--purple">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="admin-stat-card__info">
                <p className="admin-stat-card__label">Clientes Totales</p>
                <p className="admin-stat-card__value">{stats?.totalCustomers ?? 0}</p>
              </div>
            </div>
          </div>

          {/* ── Recent orders + Low stock ── */}
          <div className="admin-grid-3">
            <div className="admin-card">
              <div className="admin-card__header">
                <h2 className="admin-card__title">Pedidos Recientes</h2>
              </div>
              {recentOrders.length === 0 ? (
                <div className="admin-empty">
                  <p className="admin-empty__title">Sin pedidos</p>
                  <p className="admin-empty__text">
                    Aún no hay pedidos registrados en el sistema.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600 }}>
                            #{String(order.order_number).padStart(4, "0")}
                          </td>
                          <td>{order.shipping_name || "—"}</td>
                          <td>{formatEUR(order.total)}</td>
                          <td>
                            <span
                              className={`admin-badge admin-badge--dot ${STATUS_BADGE[order.status] ?? "admin-badge--gray"}`}
                            >
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </td>
                          <td style={{ color: "#94a3b8", fontSize: 12.5 }}>
                            {new Date(order.created_at).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-card">
              <div className="admin-card__header">
                <h2 className="admin-card__title">Stock Bajo</h2>
                {lowStockProducts.length > 0 && (
                  <span className="admin-badge admin-badge--red admin-badge--dot">
                    {lowStockProducts.length}
                  </span>
                )}
              </div>
              {lowStockProducts.length === 0 ? (
                <div className="admin-empty">
                  <p className="admin-empty__title">Todo en orden</p>
                  <p className="admin-empty__text">
                    No hay productos con stock bajo.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 0",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#334155",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {product.name}
                        </p>
                        <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8" }}>
                          {product.sku}
                        </p>
                      </div>
                      <span
                        className={`admin-badge ${
                          product.stock === 0
                            ? "admin-badge--red"
                            : product.stock <= 3
                              ? "admin-badge--amber"
                              : "admin-badge--gray"
                        }`}
                      >
                        {product.stock === 0 ? "Agotado" : `${product.stock} uds`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Activity ── */}
          <div style={{ marginTop: 20 }}>
            <div className="admin-card">
              <div className="admin-card__header">
                <h2 className="admin-card__title">Actividad Reciente</h2>
              </div>
              {recentOrders.length === 0 ? (
                <div className="admin-empty">
                  <p className="admin-empty__title">Sin actividad</p>
                  <p className="admin-empty__text">
                    La actividad reciente aparecerá aquí.
                  </p>
                </div>
              ) : (
                <div className="admin-activity-list">
                  {recentOrders.map((order) => {
                    const dotColor =
                      order.status === "delivered"
                        ? "admin-activity-dot--green"
                        : order.status === "cancelled" || order.status === "returned"
                          ? "admin-activity-dot--red"
                          : order.status === "pending"
                            ? "admin-activity-dot--amber"
                            : "admin-activity-dot--blue";

                    const actionText =
                      order.status === "delivered"
                        ? "Pedido entregado"
                        : order.status === "shipped"
                          ? "Pedido enviado"
                          : order.status === "cancelled"
                            ? "Pedido cancelado"
                            : order.status === "processing"
                              ? "Pedido en preparación"
                              : "Nuevo pedido recibido";

                    return (
                      <div key={order.id} className="admin-activity-item">
                        <div className={`admin-activity-dot ${dotColor}`} />
                        <span className="admin-activity-text">
                          {actionText}{" "}
                          <strong>#{String(order.order_number).padStart(4, "0")}</strong>
                          {order.shipping_name ? ` — ${order.shipping_name}` : ""}
                          {" · "}
                          {formatEUR(order.total)}
                        </span>
                        <span className="admin-activity-time">
                          {timeAgo(order.created_at)}
                        </span>
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
