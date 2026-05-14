"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderItem } from "@/lib/supabase/types";

type StatusFilter = "all" | Order["status"];

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "processing", label: "Procesando" },
  { key: "shipped", label: "Enviados" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
];

const ORDER_STATUS_MAP: Record<Order["status"], { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "amber" },
  confirmed: { label: "Confirmado", color: "blue" },
  processing: { label: "Procesando", color: "blue" },
  shipped: { label: "Enviado", color: "teal" },
  delivered: { label: "Entregado", color: "green" },
  cancelled: { label: "Cancelado", color: "red" },
  returned: { label: "Devuelto", color: "purple" },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: "Pagado", color: "green" },
  pending: { label: "Pendiente", color: "amber" },
  failed: { label: "Fallido", color: "red" },
  refunded: { label: "Reembolsado", color: "purple" },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  tpv: "Tarjeta",
  paypal: "PayPal",
  contrareembolso: "Contra reembolso",
  transferencia: "Transferencia",
};

const PER_PAGE = 15;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatPrice(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default function PedidosPage() {
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("*, customers(first_name, last_name, email)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (search.trim()) {
      const s = search.trim();
      const numericSearch = parseInt(s, 10);
      if (!isNaN(numericSearch)) {
        query = query.eq("order_number", numericSearch);
      } else {
        query = query.ilike("shipping_email", `%${s}%`);
      }
    }

    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count } = await query;
    setOrders((data as Order[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const openDetail = async (order: Order) => {
    setSelectedOrder(order);
    setInternalNotes(order.internal_notes ?? "");
    setLoadingItems(true);
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    setOrderItems((data as OrderItem[]) ?? []);
    setLoadingItems(false);
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const updateStatus = async (orderId: string, status: Order["status"]) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : prev));
    }
  };

  const saveNotes = async () => {
    if (!selectedOrder) return;
    setSavingNotes(true);
    await supabase
      .from("orders")
      .update({ internal_notes: internalNotes })
      .eq("id", selectedOrder.id);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id ? { ...o, internal_notes: internalNotes } : o
      )
    );
    setSavingNotes(false);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  const getCustomerName = (order: Order) => {
    const c = order.customer as any;
    if (c?.first_name || c?.last_name) return `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
    return order.shipping_name || "—";
  };

  const getCustomerEmail = (order: Order) => {
    const c = order.customer as any;
    return c?.email || order.shipping_email || "";
  };

  return (
    <AdminShell pageTitle="Pedidos">
      {/* Tabs */}
      <div className="admin-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab${statusFilter === tab.key ? " admin-tab--active" : ""}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__left">
          <div className="admin-search">
            <span className="admin-search__icon">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              className="admin-search__input"
              placeholder="Buscar por nº pedido o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="admin-toolbar__right">
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {total} pedido{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card admin-card--flush">
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="admin-empty__title">No se encontraron pedidos</p>
            <p className="admin-empty__text">No hay pedidos que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th># Pedido</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Método pago</th>
                    <th>Estado pago</th>
                    <th>Estado pedido</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const os = ORDER_STATUS_MAP[order.status];
                    const ps = PAYMENT_STATUS_MAP[order.payment_status] ?? { label: order.payment_status, color: "gray" };
                    return (
                      <tr
                        key={order.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => openDetail(order)}
                      >
                        <td style={{ fontWeight: 700 }}>#{order.order_number}</td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>
                          <div style={{ lineHeight: 1.3 }}>
                            <div style={{ fontWeight: 600 }}>{getCustomerName(order)}</div>
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>{getCustomerEmail(order)}</div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatPrice(order.total)}</td>
                        <td>{PAYMENT_METHOD_MAP[order.payment_method] ?? "—"}</td>
                        <td>
                          <span className={`admin-badge admin-badge--${ps.color} admin-badge--dot`}>
                            {ps.label}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge admin-badge--${os.color} admin-badge--dot`}>
                            {os.label}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            className="admin-select"
                            style={{ width: "auto", padding: "5px 10px", fontSize: 12 }}
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value as Order["status"])}
                          >
                            {Object.entries(ORDER_STATUS_MAP).map(([key, val]) => (
                              <option key={key} value={key}>{val.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <span>
                  Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} de {total}
                </span>
                <div className="admin-pagination__pages">
                  <button
                    className="admin-pagination__page"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p} style={{ display: "contents" }}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span style={{ padding: "0 4px", color: "#94a3b8" }}>…</span>
                        )}
                        <button
                          className={`admin-pagination__page${p === page ? " admin-pagination__page--active" : ""}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                  <button
                    className="admin-pagination__page"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={closeDetail}>
          <div className="admin-modal admin-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                Pedido #{selectedOrder.order_number}
              </h2>
              <button className="admin-modal__close" onClick={closeDetail}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="admin-modal__body">
              {/* Status & payment summary */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span className={`admin-badge admin-badge--${ORDER_STATUS_MAP[selectedOrder.status].color} admin-badge--dot`}>
                  {ORDER_STATUS_MAP[selectedOrder.status].label}
                </span>
                <span className={`admin-badge admin-badge--${(PAYMENT_STATUS_MAP[selectedOrder.payment_status] ?? { color: "gray" }).color} admin-badge--dot`}>
                  {(PAYMENT_STATUS_MAP[selectedOrder.payment_status] ?? { label: selectedOrder.payment_status }).label}
                </span>
                <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 18 }}>
                  {formatPrice(selectedOrder.total)}
                </span>
              </div>

              {/* Detail Grid */}
              <div className="admin-detail-grid">
                {/* Left: Items */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#0f172a" }}>
                    Artículos del pedido
                  </h3>
                  {loadingItems ? (
                    <div className="admin-loading" style={{ padding: 24 }}>
                      <div className="admin-spinner" />
                    </div>
                  ) : (
                    <div className="admin-table-wrap" style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Precio</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.sku}</div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatPrice(item.unit_price)}</td>
                              <td style={{ fontWeight: 600 }}>{formatPrice(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Order totals */}
                  <div style={{ marginTop: 16 }}>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Subtotal</span>
                      <span className="admin-detail-value">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Envío</span>
                      <span className="admin-detail-value">{formatPrice(selectedOrder.shipping_cost)}</span>
                    </div>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Impuestos</span>
                      <span className="admin-detail-value">{formatPrice(selectedOrder.tax_amount)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="admin-detail-row">
                        <span className="admin-detail-label">Descuento</span>
                        <span className="admin-detail-value" style={{ color: "#16a34a" }}>
                          -{formatPrice(selectedOrder.discount_amount)}
                        </span>
                      </div>
                    )}
                    <div className="admin-detail-row" style={{ fontWeight: 700 }}>
                      <span className="admin-detail-label" style={{ fontWeight: 700 }}>Total</span>
                      <span className="admin-detail-value">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Customer */}
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>Cliente</h4>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Nombre</span>
                      <span className="admin-detail-value">{getCustomerName(selectedOrder)}</span>
                    </div>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Email</span>
                      <span className="admin-detail-value">{getCustomerEmail(selectedOrder)}</span>
                    </div>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Teléfono</span>
                      <span className="admin-detail-value">{selectedOrder.shipping_phone || "—"}</span>
                    </div>
                  </div>

                  {/* Shipping address */}
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>Dirección de envío</h4>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                      {selectedOrder.shipping_address?.street && <div>{selectedOrder.shipping_address.street}</div>}
                      {(selectedOrder.shipping_address?.postal_code || selectedOrder.shipping_address?.city) && (
                        <div>
                          {selectedOrder.shipping_address.postal_code} {selectedOrder.shipping_address.city}
                        </div>
                      )}
                      {selectedOrder.shipping_address?.province && <div>{selectedOrder.shipping_address.province}</div>}
                      {selectedOrder.shipping_address?.country && <div>{selectedOrder.shipping_address.country}</div>}
                      {!selectedOrder.shipping_address?.street && "—"}
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>Pago</h4>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Método</span>
                      <span className="admin-detail-value">
                        {PAYMENT_METHOD_MAP[selectedOrder.payment_method] ?? "—"}
                      </span>
                    </div>
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Estado</span>
                      <span className="admin-detail-value">
                        <span className={`admin-badge admin-badge--${(PAYMENT_STATUS_MAP[selectedOrder.payment_status] ?? { color: "gray" }).color}`}>
                          {(PAYMENT_STATUS_MAP[selectedOrder.payment_status] ?? { label: selectedOrder.payment_status }).label}
                        </span>
                      </span>
                    </div>
                    {selectedOrder.payment_ref && (
                      <div className="admin-detail-row">
                        <span className="admin-detail-label">Referencia</span>
                        <span className="admin-detail-value" style={{ fontSize: 12, fontFamily: "monospace" }}>
                          {selectedOrder.payment_ref}
                        </span>
                      </div>
                    )}
                    <div className="admin-detail-row">
                      <span className="admin-detail-label">Fecha</span>
                      <span className="admin-detail-value">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                  </div>

                  {/* Status change */}
                  <div>
                    <label className="admin-label">Cambiar estado</label>
                    <select
                      className="admin-select"
                      value={selectedOrder.status}
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value as Order["status"])}
                    >
                      {Object.entries(ORDER_STATUS_MAP).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Internal notes */}
                  <div>
                    <label className="admin-label">Notas internas</label>
                    <textarea
                      className="admin-textarea"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Añadir notas internas sobre este pedido..."
                      rows={4}
                    />
                    <button
                      className="admin-btn admin-btn--primary admin-btn--sm"
                      style={{ marginTop: 8 }}
                      onClick={saveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? "Guardando..." : "Guardar notas"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
