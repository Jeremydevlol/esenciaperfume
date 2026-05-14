"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { Invoice, Order } from "@/lib/supabase/types";

type InvoiceWithRelations = Invoice & {
  customers: { first_name: string; last_name: string; email: string } | null;
  orders: { order_number: number } | null;
};

type TabKey = "all" | "draft" | "sent" | "paid" | "overdue" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "draft", label: "Borradores" },
  { key: "sent", label: "Enviadas" },
  { key: "paid", label: "Pagadas" },
  { key: "overdue", label: "Vencidas" },
  { key: "cancelled", label: "Canceladas" },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

const STATUS_BADGE: Record<string, string> = {
  draft: "admin-badge--gray",
  sent: "admin-badge--blue",
  paid: "admin-badge--green",
  overdue: "admin-badge--red",
  cancelled: "admin-badge--red",
};

const PER_PAGE = 15;

function formatEUR(value: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const EMPTY_FORM = {
  invoice_number: "",
  order_id: "",
  customer_id: "",
  customer_display: "",
  subtotal: 0,
  tax_rate: 21,
  tax_amount: 0,
  total: 0,
  due_date: "",
  notes: "",
  status: "draft" as Invoice["status"],
};

export default function FacturacionPage() {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("*, customers(first_name, last_name, email), orders(order_number)")
      .order("created_at", { ascending: false });
    setInvoices((data as InvoiceWithRelations[]) ?? []);
    setLoading(false);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("order_number", { ascending: false });
    setOrders((data ?? []) as Order[]);
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchOrders();
  }, [fetchInvoices, fetchOrders]);

  const filtered = invoices.filter((inv) => {
    if (tab !== "all" && inv.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = inv.invoice_number?.toLowerCase().includes(q);
      const matchEmail = inv.customers?.email?.toLowerCase().includes(q);
      if (!matchNum && !matchEmail) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  async function generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .like("invoice_number", `SD-${year}-%`);
    return `SD-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  }

  async function openCreateModal() {
    const num = await generateInvoiceNumber();
    setForm({ ...EMPTY_FORM, invoice_number: num });
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(inv: InvoiceWithRelations) {
    setForm({
      invoice_number: inv.invoice_number,
      order_id: inv.order_id ?? "",
      customer_id: inv.customer_id ?? "",
      customer_display: inv.customers
        ? `${inv.customers.first_name} ${inv.customers.last_name}`
        : "",
      subtotal: inv.subtotal,
      tax_rate: inv.tax_rate,
      tax_amount: inv.tax_amount,
      total: inv.total,
      due_date: inv.due_date?.split("T")[0] ?? "",
      notes: inv.notes ?? "",
      status: inv.status,
    });
    setEditingId(inv.id);
    setModalOpen(true);
  }

  function handleOrderChange(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const subtotal = order.subtotal ?? 0;
      const taxAmt = +(subtotal * (form.tax_rate / 100)).toFixed(2);
      setForm((f) => ({
        ...f,
        order_id: orderId,
        customer_id: order.customer_id ?? "",
        customer_display: order.shipping_name ?? "",
        subtotal,
        tax_amount: taxAmt,
        total: +(subtotal + taxAmt).toFixed(2),
      }));
    } else {
      setForm((f) => ({ ...f, order_id: orderId }));
    }
  }

  function recalc(subtotal: number, taxRate: number) {
    const taxAmt = +(subtotal * (taxRate / 100)).toFixed(2);
    setForm((f) => ({
      ...f,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmt,
      total: +(subtotal + taxAmt).toFixed(2),
    }));
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      invoice_number: form.invoice_number,
      order_id: form.order_id || null,
      customer_id: form.customer_id || null,
      subtotal: form.subtotal,
      tax_rate: form.tax_rate,
      tax_amount: form.tax_amount,
      total: form.total,
      due_date: form.due_date || null,
      notes: form.notes,
      status: form.status,
    };

    if (editingId) {
      await supabase.from("invoices").update(payload).eq("id", editingId);
    } else {
      await supabase.from("invoices").insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchInvoices();
  }

  async function markAsPaid(id: string) {
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);
    fetchInvoices();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta factura?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    fetchInvoices();
  }

  return (
    <AdminShell pageTitle="Facturación">
      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab${tab === t.key ? " admin-tab--active" : ""}`}
            onClick={() => { setTab(t.key); setPage(1); }}
          >
            {t.label}
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
              className="admin-search__input"
              placeholder="Buscar por nº factura o email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="admin-toolbar__right">
          <button className="admin-btn admin-btn--primary" onClick={openCreateModal}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Factura
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card admin-card--flush">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /></div>
        ) : paginated.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="admin-empty__title">Sin facturas</p>
            <p className="admin-empty__text">No se encontraron facturas con los filtros actuales.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nº Factura</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Pedido</th>
                    <th>Subtotal</th>
                    <th>IVA</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                      <td style={{ color: "#64748b", fontSize: 12.5 }}>{formatDate(inv.created_at)}</td>
                      <td>
                        {inv.customers
                          ? `${inv.customers.first_name} ${inv.customers.last_name}`
                          : "—"}
                        {inv.customers?.email && (
                          <span style={{ display: "block", fontSize: 11.5, color: "#94a3b8" }}>
                            {inv.customers.email}
                          </span>
                        )}
                      </td>
                      <td>
                        {inv.orders ? (
                          <Link
                            href={`/admin/pedidos/${inv.order_id}`}
                            style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
                          >
                            #{String(inv.orders.order_number).padStart(4, "0")}
                          </Link>
                        ) : "—"}
                      </td>
                      <td>{formatEUR(inv.subtotal)}</td>
                      <td>{formatEUR(inv.tax_amount)}</td>
                      <td style={{ fontWeight: 600 }}>{formatEUR(inv.total)}</td>
                      <td>
                        <span className={`admin-badge ${STATUS_BADGE[inv.status] ?? "admin-badge--gray"}`}>
                          {STATUS_LABELS[inv.status] ?? inv.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => openEditModal(inv)}
                          >
                            Editar
                          </button>
                          {inv.status !== "paid" && inv.status !== "cancelled" && (
                            <button
                              className="admin-btn admin-btn--sm admin-btn--primary"
                              onClick={() => markAsPaid(inv.id)}
                            >
                              Marcar pagada
                            </button>
                          )}
                          <button
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => handleDelete(inv.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
              <span>
                Mostrando {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} de{" "}
                {filtered.length}
              </span>
              <div className="admin-pagination__pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`admin-pagination__page${p === safePage ? " admin-pagination__page--active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal admin-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {editingId ? "Editar Factura" : "Nueva Factura"}
              </h2>
              <button className="admin-modal__close" onClick={() => setModalOpen(false)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Nº Factura</label>
                  <input className="admin-input" value={form.invoice_number} readOnly />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Pedido asociado</label>
                  <select
                    className="admin-select"
                    value={form.order_id}
                    onChange={(e) => handleOrderChange(e.target.value)}
                  >
                    <option value="">— Seleccionar pedido —</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{String(o.order_number).padStart(4, "0")} — {o.shipping_name || "Sin nombre"} — {formatEUR(o.total)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Cliente</label>
                  <input
                    className="admin-input"
                    value={form.customer_display}
                    readOnly
                    placeholder="Se rellena automáticamente del pedido"
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Estado</label>
                  <select
                    className="admin-select"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Invoice["status"] }))}
                  >
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviada</option>
                    <option value="paid">Pagada</option>
                    <option value="overdue">Vencida</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-row admin-form-row--3">
                <div className="admin-field">
                  <label className="admin-label">Subtotal (€)</label>
                  <input
                    className="admin-input"
                    type="number"
                    step="0.01"
                    value={form.subtotal}
                    onChange={(e) => recalc(+e.target.value, form.tax_rate)}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Tipo IVA (%)</label>
                  <input
                    className="admin-input"
                    type="number"
                    value={form.tax_rate}
                    onChange={(e) => recalc(form.subtotal, +e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">IVA calculado (€)</label>
                  <input className="admin-input" value={form.tax_amount.toFixed(2)} readOnly />
                </div>
              </div>

              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Total (€)</label>
                  <input className="admin-input" value={form.total.toFixed(2)} readOnly style={{ fontWeight: 700 }} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Fecha vencimiento</label>
                  <input
                    className="admin-input"
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label className="admin-label">Notas</label>
                <textarea
                  className="admin-textarea"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Notas internas sobre la factura…"
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear factura"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
