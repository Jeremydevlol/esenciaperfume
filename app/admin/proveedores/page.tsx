"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { PurchaseOrder, Supplier } from "@/lib/supabase/types";
import { useCallback, useEffect, useState } from "react";

const EUR = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

const EMPTY_SUPPLIER: Omit<Supplier, "id" | "created_at" | "updated_at"> = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  payment_terms: "",
  notes: "",
  active: true,
};

const PO_STATUS_BADGE: Record<string, string> = {
  draft: "admin-badge admin-badge--gray admin-badge--dot",
  sent: "admin-badge admin-badge--blue admin-badge--dot",
  partial: "admin-badge admin-badge--amber admin-badge--dot",
  received: "admin-badge admin-badge--green admin-badge--dot",
  cancelled: "admin-badge admin-badge--red admin-badge--dot",
};
const PO_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  partial: "Parcial",
  received: "Recibida",
  cancelled: "Cancelada",
};

export default function ProveedoresPage() {
  const supabase = createClient();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form modal
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  // Purchase orders per supplier (expandable row)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });
    setSuppliers((data as Supplier[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filtered = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.contact_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  /* ── CRUD ──────────────────────────────────────────────────────────── */
  const openNew = () => {
    setIsNew(true);
    setEditing(null);
    setForm({ ...EMPTY_SUPPLIER });
  };

  const openEdit = (s: Supplier) => {
    setIsNew(false);
    setEditing(s);
    setForm({
      name: s.name,
      contact_name: s.contact_name,
      email: s.email,
      phone: s.phone,
      address: s.address,
      website: s.website,
      payment_terms: s.payment_terms,
      notes: s.notes,
      active: s.active,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setIsNew(false);
  };
  const showForm = isNew || editing !== null;

  const handleSave = async () => {
    setSaving(true);
    if (isNew) {
      await supabase.from("suppliers").insert(form);
    } else if (editing) {
      await supabase.from("suppliers").update(form).eq("id", editing.id);
    }
    setSaving(false);
    closeForm();
    fetchSuppliers();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await supabase.from("suppliers").delete().eq("id", deleting.id);
    setDeleting(null);
    fetchSuppliers();
  };

  /* ── Purchase orders ──────────────────────────────────────────────── */
  const toggleOrders = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setLoadingOrders(true);
    const { data } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false });
    setOrders((data as PurchaseOrder[]) ?? []);
    setLoadingOrders(false);
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <AdminShell pageTitle="Proveedores">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
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
              placeholder="Buscar proveedor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="admin-toolbar__right">
          <button className="admin-btn admin-btn--primary" onClick={openNew}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="admin-card admin-card--flush">
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="admin-empty__title">Sin proveedores</p>
            <p className="admin-empty__text">
              {search
                ? "No se encontraron proveedores con esa búsqueda."
                : "Añade tu primer proveedor para empezar."}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <>
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.contact_name || "—"}</td>
                      <td>
                        {s.email ? (
                          <a href={`mailto:${s.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                            {s.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{s.phone || "—"}</td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--dot ${
                            s.active ? "admin-badge--green" : "admin-badge--gray"
                          }`}
                        >
                          {s.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="admin-btn admin-btn--sm admin-btn--secondary"
                            onClick={() => openEdit(s)}
                            title="Editar"
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            className="admin-btn admin-btn--sm admin-btn--danger"
                            onClick={() => setDeleting(s)}
                            title="Eliminar"
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            className="admin-btn admin-btn--sm admin-btn--secondary"
                            onClick={() => toggleOrders(s.id)}
                            title="Pedidos de compra"
                          >
                            {expandedId === s.id ? "▲ Pedidos" : "▼ Pedidos"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded purchase orders */}
                    {expandedId === s.id && (
                      <tr key={`${s.id}-orders`}>
                        <td colSpan={6} style={{ background: "#f8fafc", padding: "16px 24px" }}>
                          <strong style={{ fontSize: 13, marginBottom: 8, display: "block" }}>
                            Pedidos de compra — {s.name}
                          </strong>
                          {loadingOrders ? (
                            <div className="admin-loading" style={{ padding: "24px 0" }}>
                              <div className="admin-spinner" />
                            </div>
                          ) : orders.length === 0 ? (
                            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                              No hay pedidos de compra registrados.
                            </p>
                          ) : (
                            <table className="admin-table" style={{ fontSize: 12.5 }}>
                              <thead>
                                <tr>
                                  <th>Nº Pedido</th>
                                  <th>Fecha</th>
                                  <th>Estado</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders.map((po) => (
                                  <tr key={po.id}>
                                    <td style={{ fontFamily: "monospace" }}>#{po.po_number}</td>
                                    <td>
                                      {new Date(po.created_at).toLocaleDateString("es-ES", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </td>
                                    <td>
                                      <span className={PO_STATUS_BADGE[po.status] ?? "admin-badge"}>
                                        {PO_STATUS_LABEL[po.status] ?? po.status}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{EUR(po.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Supplier form modal ──────────────────────────────────────── */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {isNew ? "Nuevo Proveedor" : "Editar Proveedor"}
              </h2>
              <button className="admin-modal__close" onClick={closeForm}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Nombre *</label>
                  <input
                    className="admin-input"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Contacto</label>
                  <input
                    className="admin-input"
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    placeholder="Persona de contacto"
                  />
                </div>
              </div>

              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Email</label>
                  <input
                    className="admin-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Teléfono</label>
                  <input
                    className="admin-input"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div className="admin-field">
                <label className="admin-label">Dirección</label>
                <input
                  className="admin-input"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>

              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Web</label>
                  <input
                    className="admin-input"
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Condiciones de pago</label>
                  <input
                    className="admin-input"
                    value={form.payment_terms}
                    onChange={(e) => set("payment_terms", e.target.value)}
                    placeholder="Ej: 30 días, transferencia"
                  />
                </div>
              </div>

              <div className="admin-field">
                <label className="admin-label">Notas</label>
                <textarea
                  className="admin-textarea"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Notas internas sobre el proveedor..."
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Activo
              </label>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={closeForm}>
                Cancelar
              </button>
              <button
                className="admin-btn admin-btn--primary"
                disabled={saving || !form.name.trim()}
                onClick={handleSave}
              >
                {saving ? "Guardando…" : isNew ? "Crear Proveedor" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ────────────────────────────────── */}
      {deleting && (
        <div className="admin-modal-overlay" onClick={() => setDeleting(null)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Eliminar Proveedor</h2>
              <button className="admin-modal__close" onClick={() => setDeleting(null)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: 0, fontSize: 14 }}>
                ¿Estás seguro de que deseas eliminar a{" "}
                <strong>{deleting.name}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
              <button className="admin-btn admin-btn--danger" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
