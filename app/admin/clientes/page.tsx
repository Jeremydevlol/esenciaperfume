"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Order } from "@/lib/supabase/types";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

type SortField = "total_spent" | "total_orders" | "created_at";

interface FormData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  dni: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  notes: string;
  tags: string;
}

const emptyForm: FormData = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  dni: "",
  street: "",
  city: "",
  province: "",
  postal_code: "",
  country: "España",
  notes: "",
  tags: "",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatCurrency(n: number) {
  return n.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export default function ClientesPage() {
  const supabase = useRef(createClient()).current;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailOrders, setDetailOrders] = useState<Order[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch customers ────────────────────────────────────────────── */
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order(sortField, { ascending: false })
      .range(from, to);

    if (search.trim()) {
      const q = search.trim();
      query = query.or(
        `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
      );
    }

    const { data, count, error } = await query;
    if (!error) {
      setCustomers(data ?? []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [supabase, page, search, sortField]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* ── Search debounce ────────────────────────────────────────────── */
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(0);
    }, 350);
  };

  /* ── Form helpers ───────────────────────────────────────────────── */
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      email: c.email ?? "",
      first_name: c.first_name ?? "",
      last_name: c.last_name ?? "",
      phone: c.phone ?? "",
      dni: c.dni ?? "",
      street: c.address?.street ?? "",
      city: c.address?.city ?? "",
      province: c.address?.province ?? "",
      postal_code: c.address?.postal_code ?? "",
      country: c.address?.country ?? "España",
      notes: c.notes ?? "",
      tags: (c.tags ?? []).join(", "),
    });
    setShowForm(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      dni: form.dni,
      address: {
        street: form.street,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
        country: form.country,
      },
      notes: form.notes,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (editingId) {
      await supabase.from("customers").update(payload).eq("id", editingId);
    } else {
      await supabase.from("customers").insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    fetchCustomers();
  };

  /* ── Detail view ────────────────────────────────────────────────── */
  const openDetail = async (c: Customer) => {
    setDetailCustomer(c);
    setLoadingDetail(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setDetailOrders(data ?? []);
    setLoadingDetail(false);
  };

  /* ── Delete ─────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("customers").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    fetchCustomers();
  };

  /* ── Pagination ─────────────────────────────────────────────────── */
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pageNumbers: number[] = [];
  for (let i = 0; i < totalPages; i++) pageNumbers.push(i);

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    processing: "En proceso",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    returned: "Devuelto",
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "amber",
    confirmed: "blue",
    processing: "purple",
    shipped: "teal",
    delivered: "green",
    cancelled: "red",
    returned: "gray",
  };

  return (
    <AdminShell pageTitle="Clientes">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__left">
          <div className="admin-search">
            <span className="admin-search__icon">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              className="admin-search__input"
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <select
            className="admin-select"
            style={{ width: "auto" }}
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value as SortField);
              setPage(0);
            }}
          >
            <option value="created_at">Más recientes</option>
            <option value="total_spent">Mayor gasto</option>
            <option value="total_orders">Más pedidos</option>
          </select>
        </div>
        <div className="admin-toolbar__right">
          <button className="admin-btn admin-btn--primary" onClick={openCreate}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 5v14m-7-7h14" />
            </svg>
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="admin-card admin-card--flush">
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
          </div>
        ) : customers.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="admin-empty__title">Sin clientes</p>
            <p className="admin-empty__text">
              {search
                ? "No se encontraron clientes con esa búsqueda."
                : "Aún no hay clientes registrados."}
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre completo</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Total Pedidos</th>
                    <th>Total Gastado</th>
                    <th>Registrado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>
                        {c.first_name} {c.last_name}
                        {c.tags?.length > 0 && (
                          <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {c.tags.map((tag) => (
                              <span key={tag} className="admin-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>{c.email}</td>
                      <td>{c.phone || "—"}</td>
                      <td>
                        <span className="admin-badge admin-badge--blue">
                          {c.total_orders}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {formatCurrency(c.total_spent)}
                      </td>
                      <td>{formatDate(c.created_at)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => openDetail(c)}
                            title="Ver detalle"
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => openEdit(c)}
                            title="Editar"
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => setDeleteTarget(c)}
                            title="Eliminar"
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <span>
                  Mostrando {page * PAGE_SIZE + 1}–
                  {Math.min((page + 1) * PAGE_SIZE, totalCount)} de{" "}
                  {totalCount}
                </span>
                <div className="admin-pagination__pages">
                  <button
                    className="admin-pagination__page"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ‹
                  </button>
                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      className={`admin-pagination__page${n === page ? " admin-pagination__page--active" : ""}`}
                      onClick={() => setPage(n)}
                    >
                      {n + 1}
                    </button>
                  ))}
                  <button
                    className="admin-pagination__page"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────── */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="admin-modal admin-modal--lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {editingId ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button
                className="admin-modal__close"
                onClick={() => setShowForm(false)}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="admin-modal__body">
              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Email</label>
                  <input
                    className="admin-input"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">DNI / NIF</label>
                  <input
                    className="admin-input"
                    name="dni"
                    value={form.dni}
                    onChange={handleFormChange}
                    placeholder="12345678A"
                  />
                </div>
              </div>

              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Nombre</label>
                  <input
                    className="admin-input"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Apellidos</label>
                  <input
                    className="admin-input"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Teléfono</label>
                  <input
                    className="admin-input"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Tags (separados por coma)</label>
                  <input
                    className="admin-input"
                    name="tags"
                    value={form.tags}
                    onChange={handleFormChange}
                    placeholder="VIP, mayorista, frecuente"
                  />
                </div>
              </div>

              <div className="admin-field">
                <label className="admin-label">Calle</label>
                <input
                  className="admin-input"
                  name="street"
                  value={form.street}
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Ciudad</label>
                  <input
                    className="admin-input"
                    name="city"
                    value={form.city}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Provincia</label>
                  <input
                    className="admin-input"
                    name="province"
                    value={form.province}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Código Postal</label>
                  <input
                    className="admin-input"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">País</label>
                  <input
                    className="admin-input"
                    name="country"
                    value={form.country}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label className="admin-label">Notas</label>
                <textarea
                  className="admin-textarea"
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  placeholder="Notas internas sobre el cliente…"
                />
              </div>
            </div>

            <div className="admin-modal__footer">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                className="admin-btn admin-btn--primary"
                onClick={handleSave}
                disabled={saving || !form.email}
              >
                {saving
                  ? "Guardando…"
                  : editingId
                    ? "Guardar Cambios"
                    : "Crear Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────── */}
      {detailCustomer && (
        <div
          className="admin-modal-overlay"
          onClick={() => setDetailCustomer(null)}
        >
          <div
            className="admin-modal admin-modal--lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {detailCustomer.first_name} {detailCustomer.last_name}
              </h2>
              <button
                className="admin-modal__close"
                onClick={() => setDetailCustomer(null)}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="admin-modal__body">
              <div className="admin-detail-row">
                <span className="admin-detail-label">Email</span>
                <span className="admin-detail-value">
                  {detailCustomer.email}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Teléfono</span>
                <span className="admin-detail-value">
                  {detailCustomer.phone || "—"}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">DNI / NIF</span>
                <span className="admin-detail-value">
                  {detailCustomer.dni || "—"}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Dirección</span>
                <span className="admin-detail-value">
                  {[
                    detailCustomer.address?.street,
                    detailCustomer.address?.city,
                    detailCustomer.address?.province,
                    detailCustomer.address?.postal_code,
                    detailCustomer.address?.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Total Pedidos</span>
                <span className="admin-detail-value">
                  {detailCustomer.total_orders}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Total Gastado</span>
                <span className="admin-detail-value">
                  {formatCurrency(detailCustomer.total_spent)}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Registrado</span>
                <span className="admin-detail-value">
                  {formatDate(detailCustomer.created_at)}
                </span>
              </div>
              {detailCustomer.tags?.length > 0 && (
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Tags</span>
                  <span className="admin-detail-value" style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {detailCustomer.tags.map((tag) => (
                      <span key={tag} className="admin-tag">{tag}</span>
                    ))}
                  </span>
                </div>
              )}
              {detailCustomer.notes && (
                <div className="admin-detail-row">
                  <span className="admin-detail-label">Notas</span>
                  <span className="admin-detail-value" style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
                    {detailCustomer.notes}
                  </span>
                </div>
              )}

              {/* Customer orders */}
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "12px 0 0", color: "#0f172a" }}>
                Pedidos del cliente
              </h3>

              {loadingDetail ? (
                <div className="admin-loading">
                  <div className="admin-spinner" />
                </div>
              ) : detailOrders.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>
                  Este cliente no tiene pedidos.
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nº Pedido</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailOrders.map((o) => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 600 }}>
                            #{o.order_number}
                          </td>
                          <td>{formatDate(o.created_at)}</td>
                          <td>
                            <span
                              className={`admin-badge admin-badge--${STATUS_COLORS[o.status] ?? "gray"} admin-badge--dot`}
                            >
                              {STATUS_LABELS[o.status] ?? o.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {formatCurrency(o.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-modal__footer">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => {
                  setDetailCustomer(null);
                  openEdit(detailCustomer);
                }}
              >
                Editar
              </button>
              <button
                className="admin-btn admin-btn--primary"
                onClick={() => setDetailCustomer(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ──────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="admin-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Eliminar cliente</h2>
              <button
                className="admin-modal__close"
                onClick={() => setDeleteTarget(null)}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: 0 }}>
                ¿Estás seguro de que deseas eliminar a{" "}
                <strong>
                  {deleteTarget.first_name} {deleteTarget.last_name}
                </strong>
                ? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
