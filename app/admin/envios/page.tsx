"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { Shipment, Order } from "@/lib/supabase/types";

type ShipmentWithRelations = Shipment & {
  orders: { order_number: number; shipping_name: string; shipping_email: string } | null;
};

type TabKey = "all" | "pending" | "in_transit" | "delivered" | "returned";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "in_transit", label: "En Tránsito" },
  { key: "delivered", label: "Entregados" },
  { key: "returned", label: "Devueltos" },
];

const TAB_FILTER: Record<TabKey, Shipment["status"][]> = {
  all: [],
  pending: ["pending"],
  in_transit: ["picked_up", "in_transit", "out_for_delivery"],
  delivered: ["delivered"],
  returned: ["returned", "failed"],
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  picked_up: "Recogido",
  in_transit: "En tránsito",
  out_for_delivery: "En reparto",
  delivered: "Entregado",
  returned: "Devuelto",
  failed: "Fallido",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "admin-badge--amber",
  picked_up: "admin-badge--blue",
  in_transit: "admin-badge--blue admin-badge--dot",
  out_for_delivery: "admin-badge--teal",
  delivered: "admin-badge--green",
  returned: "admin-badge--red",
  failed: "admin-badge--red",
};

const CARRIERS = ["Correos", "SEUR", "MRW", "GLS", "DHL", "UPS", "Otro"];

const ALL_STATUSES: Shipment["status"][] = [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
  "failed",
];

const PER_PAGE = 15;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const EMPTY_FORM = {
  order_id: "",
  tracking_number: "",
  carrier: "Correos",
  weight_kg: 0,
  estimated_delivery: "",
  notes: "",
  status: "pending" as Shipment["status"],
};

export default function EnviosPage() {
  const [shipments, setShipments] = useState<ShipmentWithRelations[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("shipments")
      .select("*, orders(order_number, shipping_name, shipping_email)")
      .order("created_at", { ascending: false });
    setShipments((data as ShipmentWithRelations[]) ?? []);
    setLoading(false);
  }, []);

  const fetchAvailableOrders = useCallback(async () => {
    const { data: allOrders } = await supabase
      .from("orders")
      .select("*")
      .order("order_number", { ascending: false });

    const { data: existingShipments } = await supabase
      .from("shipments")
      .select("order_id");

    const usedOrderIds = new Set((existingShipments ?? []).map((s: { order_id: string }) => s.order_id));
    setAvailableOrders((allOrders ?? []).filter((o: Order) => !usedOrderIds.has(o.id)));
  }, []);

  useEffect(() => {
    fetchShipments();
    fetchAvailableOrders();
  }, [fetchShipments, fetchAvailableOrders]);

  const filtered = shipments.filter((s) => {
    const statuses = TAB_FILTER[tab];
    if (statuses.length > 0 && !statuses.includes(s.status)) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTracking = s.tracking_number?.toLowerCase().includes(q);
      const matchOrder = s.orders?.order_number
        ? String(s.orders.order_number).includes(q)
        : false;
      const matchName = s.orders?.shipping_name?.toLowerCase().includes(q);
      if (!matchTracking && !matchOrder && !matchName) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(s: ShipmentWithRelations) {
    setForm({
      order_id: s.order_id,
      tracking_number: s.tracking_number ?? "",
      carrier: s.carrier ?? "Correos",
      weight_kg: s.weight_kg ?? 0,
      estimated_delivery: s.estimated_delivery?.split("T")[0] ?? "",
      notes: s.notes ?? "",
      status: s.status,
    });
    setEditingId(s.id);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      order_id: form.order_id || null,
      tracking_number: form.tracking_number,
      carrier: form.carrier,
      status: form.status,
      weight_kg: form.weight_kg || null,
      estimated_delivery: form.estimated_delivery || null,
      notes: form.notes,
      shipped_at:
        form.status !== "pending" && !editingId
          ? new Date().toISOString()
          : undefined,
      delivered_at: form.status === "delivered" ? new Date().toISOString() : undefined,
    };

    if (editingId) {
      await supabase.from("shipments").update(payload).eq("id", editingId);
    } else {
      await supabase.from("shipments").insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchShipments();
    fetchAvailableOrders();
  }

  async function updateStatus(id: string, status: Shipment["status"]) {
    const update: Record<string, unknown> = { status };
    if (status === "delivered") update.delivered_at = new Date().toISOString();
    if (status === "picked_up" || status === "in_transit") {
      update.shipped_at = new Date().toISOString();
    }
    await supabase.from("shipments").update(update).eq("id", id);

    if (status === "in_transit" || status === "picked_up") {
      const shipment = shipments.find((s) => s.id === id);
      if (shipment?.orders?.shipping_email && shipment.tracking_number) {
        const trackUrl = getTrackingUrl(shipment.carrier, shipment.tracking_number);
        fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: shipment.orders.shipping_email,
            template: "order-shipped",
            data: {
              orderNumber: shipment.orders.order_number,
              customerName: shipment.orders.shipping_name || "Cliente",
              trackingNumber: shipment.tracking_number,
              carrier: shipment.carrier || "—",
              estimatedDelivery: shipment.estimated_delivery
                ? new Date(shipment.estimated_delivery).toLocaleDateString("es-ES")
                : undefined,
              trackingUrl: trackUrl ?? undefined,
            },
          }),
        }).catch((err) => console.error("[Email] Error enviando email de envío:", err));
      }
    }

    if (status === "delivered") {
      const shipment = shipments.find((s) => s.id === id);
      if (shipment?.orders?.shipping_email) {
        fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: shipment.orders.shipping_email,
            template: "order-delivered",
            data: {
              orderNumber: shipment.orders.order_number,
              customerName: shipment.orders.shipping_name || "Cliente",
            },
          }),
        }).catch((err) => console.error("[Email] Error enviando email de entrega:", err));
      }
    }

    fetchShipments();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este envío?")) return;
    await supabase.from("shipments").delete().eq("id", id);
    fetchShipments();
    fetchAvailableOrders();
  }

  function getTrackingUrl(carrier: string, tracking: string): string | null {
    if (!tracking) return null;
    const urls: Record<string, string> = {
      Correos: `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${tracking}`,
      SEUR: `https://www.seur.com/livetracking/?segOnlineIdentificador=${tracking}`,
      MRW: `https://www.mrw.es/seguimiento_envios/MRW_resultados_702.asp?ref=${tracking}`,
      GLS: `https://www.gls-spain.es/es/seguimiento-de-envios/?match=${tracking}`,
      DHL: `https://www.dhl.com/es-es/home/rastreo.html?tracking-id=${tracking}`,
      UPS: `https://www.ups.com/track?tracknum=${tracking}`,
    };
    return urls[carrier] ?? null;
  }

  return (
    <AdminShell pageTitle="Envíos">
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
              placeholder="Buscar por tracking, pedido o nombre…"
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
            Nuevo Envío
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <p className="admin-empty__title">Sin envíos</p>
            <p className="admin-empty__text">No se encontraron envíos con los filtros actuales.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Tracking</th>
                    <th>Transportista</th>
                    <th>Estado</th>
                    <th>Fecha envío</th>
                    <th>Entrega estimada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => {
                    const trackUrl = getTrackingUrl(s.carrier, s.tracking_number);
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>
                          {s.orders
                            ? `#${String(s.orders.order_number).padStart(4, "0")}`
                            : "—"}
                          {s.orders?.shipping_name && (
                            <span style={{ display: "block", fontSize: 11.5, color: "#94a3b8", fontWeight: 400 }}>
                              {s.orders.shipping_name}
                            </span>
                          )}
                        </td>
                        <td>
                          {s.tracking_number ? (
                            <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>
                              {s.tracking_number}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>
                        <td>{s.carrier || "—"}</td>
                        <td>
                          <select
                            className="admin-select"
                            value={s.status}
                            onChange={(e) => updateStatus(s.id, e.target.value as Shipment["status"])}
                            style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
                          >
                            {ALL_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {STATUS_LABELS[st]}
                              </option>
                            ))}
                          </select>
                          <span
                            className={`admin-badge ${STATUS_BADGE[s.status] ?? "admin-badge--gray"}`}
                            style={{ marginLeft: 8 }}
                          >
                            {STATUS_LABELS[s.status] ?? s.status}
                          </span>
                        </td>
                        <td style={{ color: "#64748b", fontSize: 12.5 }}>
                          {formatDate(s.shipped_at)}
                        </td>
                        <td style={{ color: "#64748b", fontSize: 12.5 }}>
                          {formatDate(s.estimated_delivery)}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="admin-btn admin-btn--secondary admin-btn--sm"
                              onClick={() => openEditModal(s)}
                            >
                              Editar
                            </button>
                            {trackUrl && (
                              <a
                                href={trackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-btn admin-btn--secondary admin-btn--sm"
                              >
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Rastrear
                              </a>
                            )}
                            <button
                              className="admin-btn admin-btn--danger admin-btn--sm"
                              onClick={() => handleDelete(s.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                {editingId ? "Editar Envío" : "Nuevo Envío"}
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
                  <label className="admin-label">Pedido</label>
                  <select
                    className="admin-select"
                    value={form.order_id}
                    onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value }))}
                    disabled={!!editingId}
                  >
                    <option value="">— Seleccionar pedido —</option>
                    {availableOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{String(o.order_number).padStart(4, "0")} — {o.shipping_name || "Sin nombre"}
                      </option>
                    ))}
                    {editingId && form.order_id && (
                      <option value={form.order_id}>
                        Pedido actual
                      </option>
                    )}
                  </select>
                </div>
                <div className="admin-field">
                  <label className="admin-label">Nº Tracking</label>
                  <input
                    className="admin-input"
                    value={form.tracking_number}
                    onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))}
                    placeholder="Número de seguimiento"
                  />
                </div>
              </div>

              <div className="admin-form-row admin-form-row--3">
                <div className="admin-field">
                  <label className="admin-label">Transportista</label>
                  <select
                    className="admin-select"
                    value={form.carrier}
                    onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
                  >
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label className="admin-label">Peso (kg)</label>
                  <input
                    className="admin-input"
                    type="number"
                    step="0.01"
                    value={form.weight_kg}
                    onChange={(e) => setForm((f) => ({ ...f, weight_kg: +e.target.value }))}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Fecha entrega estimada</label>
                  <input
                    className="admin-input"
                    type="date"
                    value={form.estimated_delivery}
                    onChange={(e) => setForm((f) => ({ ...f, estimated_delivery: e.target.value }))}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label className="admin-label">Notas</label>
                <textarea
                  className="admin-textarea"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Notas sobre el envío…"
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear envío"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
