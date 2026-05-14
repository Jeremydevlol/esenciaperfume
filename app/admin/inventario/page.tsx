"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { Product, StockMovement } from "@/lib/supabase/types";
import { useCallback, useEffect, useState } from "react";

type Tab = "all" | "low" | "out";
type MovementType = "in" | "out" | "adjustment";

const EUR = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

function stockStatus(p: Product) {
  if (p.stock === 0) return "out";
  if (p.stock <= p.min_stock) return "low";
  return "ok";
}

const STATUS_LABEL: Record<string, string> = {
  ok: "OK",
  low: "Bajo",
  out: "Agotado",
};
const STATUS_BADGE: Record<string, string> = {
  ok: "admin-badge admin-badge--green admin-badge--dot",
  low: "admin-badge admin-badge--amber admin-badge--dot",
  out: "admin-badge admin-badge--red admin-badge--dot",
};

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
  return: "Devolución",
};

export default function InventarioPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  // Stock adjustment modal
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<MovementType>("in");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Movement history modal
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("stock", { ascending: true });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter((p) => {
    if (activeTab === "low") return stockStatus(p) === "low";
    if (activeTab === "out") return stockStatus(p) === "out";
    return true;
  });

  const totalProducts = products.length;
  const lowStock = products.filter((p) => stockStatus(p) === "low").length;
  const outOfStock = products.filter((p) => stockStatus(p) === "out").length;
  const totalValue = products.reduce(
    (s, p) => s + p.stock * (p.cost_price ?? 0),
    0,
  );

  /* ── Stock adjustment ─────────────────────────────────────────────── */
  const openAdjust = (p: Product) => {
    setAdjustProduct(p);
    setAdjustType("in");
    setAdjustQty("");
    setAdjustNotes("");
  };

  const submitAdjust = async () => {
    if (!adjustProduct || !adjustQty) return;
    setSaving(true);
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setSaving(false);
      return;
    }

    const prev = adjustProduct.stock;
    let newStock: number;
    if (adjustType === "in") newStock = prev + qty;
    else if (adjustType === "out") newStock = Math.max(0, prev - qty);
    else newStock = qty;

    await supabase.from("stock_movements").insert({
      product_id: adjustProduct.id,
      type: adjustType,
      quantity: qty,
      prev_stock: prev,
      new_stock: newStock,
      notes: adjustNotes,
    });

    await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", adjustProduct.id);

    setAdjustProduct(null);
    setSaving(false);
    fetchProducts();
  };

  /* ── Movement history ─────────────────────────────────────────────── */
  const openHistory = async (p: Product) => {
    setHistoryProduct(p);
    setLoadingMovements(true);
    const { data } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", p.id)
      .order("created_at", { ascending: false });
    setMovements((data as StockMovement[]) ?? []);
    setLoadingMovements(false);
  };

  return (
    <AdminShell pageTitle="Inventario">
      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Total Productos</p>
            <p className="admin-stat-card__value">{totalProducts}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--amber">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Bajo Stock</p>
            <p className="admin-stat-card__value">{lowStock}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--red">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Sin Stock</p>
            <p className="admin-stat-card__value">{outOfStock}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Valor Total Inventario</p>
            <p className="admin-stat-card__value">{EUR(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="admin-tabs">
        {([["all", "Todo"], ["low", "Stock Bajo"], ["out", "Sin Stock"]] as const).map(
          ([key, label]) => (
            <button
              key={key}
              className={`admin-tab${activeTab === key ? " admin-tab--active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ),
        )}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <p className="admin-empty__title">Sin resultados</p>
            <p className="admin-empty__text">No hay productos en esta categoría.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Precio Coste</th>
                  <th>Valor Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const s = stockStatus(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt=""
                              className="admin-product-thumb"
                            />
                          ) : (
                            <span
                              className="admin-product-thumb"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f1f5f9",
                                color: "#94a3b8",
                                fontSize: 14,
                              }}
                            >
                              —
                            </span>
                          )}
                          <span style={{ fontWeight: 600 }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.sku}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              s === "out"
                                ? "#dc2626"
                                : s === "low"
                                  ? "#b45309"
                                  : "#15803d",
                          }}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td>{p.min_stock}</td>
                      <td>{EUR(p.cost_price ?? 0)}</td>
                      <td>{EUR(p.stock * (p.cost_price ?? 0))}</td>
                      <td>
                        <span className={STATUS_BADGE[s]}>{STATUS_LABEL[s]}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="admin-btn admin-btn--sm admin-btn--primary"
                            onClick={() => openAdjust(p)}
                          >
                            Ajustar Stock
                          </button>
                          <button
                            className="admin-btn admin-btn--sm admin-btn--secondary"
                            onClick={() => openHistory(p)}
                          >
                            Historial
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Adjust stock modal ───────────────────────────────────────── */}
      {adjustProduct && (
        <div className="admin-modal-overlay" onClick={() => setAdjustProduct(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Ajustar Stock — {adjustProduct.name}</h2>
              <button className="admin-modal__close" onClick={() => setAdjustProduct(null)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                Stock actual:{" "}
                <strong style={{ color: "#0f172a" }}>{adjustProduct.stock}</strong>
              </p>

              <div className="admin-field">
                <label className="admin-label">Tipo de movimiento</label>
                <select
                  className="admin-select"
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as MovementType)}
                >
                  <option value="in">Entrada</option>
                  <option value="out">Salida</option>
                  <option value="adjustment">Ajuste (fijar cantidad)</option>
                </select>
              </div>

              <div className="admin-field">
                <label className="admin-label">Cantidad</label>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder={adjustType === "adjustment" ? "Nuevo stock total" : "Cantidad"}
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Notas</label>
                <textarea
                  className="admin-textarea"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Motivo del ajuste..."
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button
                className="admin-btn admin-btn--secondary"
                onClick={() => setAdjustProduct(null)}
              >
                Cancelar
              </button>
              <button
                className="admin-btn admin-btn--primary"
                disabled={saving || !adjustQty}
                onClick={submitAdjust}
              >
                {saving ? "Guardando…" : "Guardar movimiento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Movement history modal ───────────────────────────────────── */}
      {historyProduct && (
        <div className="admin-modal-overlay" onClick={() => setHistoryProduct(null)}>
          <div
            className="admin-modal admin-modal--lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                Historial de Movimientos — {historyProduct.name}
              </h2>
              <button className="admin-modal__close" onClick={() => setHistoryProduct(null)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body" style={{ padding: 0 }}>
              {loadingMovements ? (
                <div className="admin-loading">
                  <div className="admin-spinner" />
                </div>
              ) : movements.length === 0 ? (
                <div className="admin-empty">
                  <p className="admin-empty__title">Sin movimientos</p>
                  <p className="admin-empty__text">
                    Este producto no tiene movimientos de stock registrados.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Stock Anterior</th>
                        <th>Stock Nuevo</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m) => (
                        <tr key={m.id}>
                          <td>
                            {new Date(m.created_at).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td>
                            <span
                              className={`admin-badge admin-badge--${
                                m.type === "in" || m.type === "return"
                                  ? "green"
                                  : m.type === "out"
                                    ? "red"
                                    : "amber"
                              }`}
                            >
                              {MOVEMENT_LABELS[m.type] ?? m.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                          <td>{m.prev_stock}</td>
                          <td>{m.new_stock}</td>
                          <td style={{ color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {m.notes || "—"}
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
                onClick={() => setHistoryProduct(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
