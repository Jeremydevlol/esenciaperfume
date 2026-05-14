"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/supabase/types";

const PAGE_SIZE = 20;

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "unisex", label: "Unisex" },
  { value: "maquillaje", label: "Maquillaje" },
  { value: "cuidado", label: "Cuidado" },
];

const TIPOS = [
  "EDP",
  "EDT",
  "Colonia",
  "Parfum",
  "Body Mist",
  "Set",
  "Otro",
];

const EMPTY_FORM: Omit<Product, "id" | "created_at" | "updated_at"> = {
  sku: "",
  name: "",
  brand: "",
  category: "",
  subcategory: "",
  tipo: "",
  ml: 0,
  price: 0,
  original_price: 0,
  discount_pct: 0,
  cost_price: 0,
  image_url: "",
  description: "",
  stock: 0,
  min_stock: 0,
  active: true,
  featured: false,
};

function fmtEur(n: number) {
  return n.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export default function ProductosPage() {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  /* ── Fetch products ──────────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let countQuery = supabase.from("products").select("*", { count: "exact", head: true });
    let dataQuery = supabase.from("products").select("*").order("created_at", { ascending: false }).range(from, to);

    if (search) {
      const pattern = `%${search}%`;
      countQuery = countQuery.ilike("name", pattern);
      dataQuery = dataQuery.ilike("name", pattern);
    }
    if (catFilter) {
      countQuery = countQuery.eq("category", catFilter);
      dataQuery = dataQuery.eq("category", catFilter);
    }

    const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

    if (!error && data) {
      setProducts(data as Product[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [supabase, page, search, catFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* Reset to page 1 when filters change */
  useEffect(() => {
    setPage(1);
  }, [search, catFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /* ── Form helpers ────────────────────────────────────────────────── */
  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "price" || key === "original_price") {
        const price = key === "price" ? (value as number) : prev.price;
        const original = key === "original_price" ? (value as number) : prev.original_price;
        next.discount_pct = original > 0 ? Math.round(((original - price) / original) * 100) : 0;
      }

      return next;
    });
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      category: p.category,
      subcategory: p.subcategory,
      tipo: p.tipo,
      ml: p.ml,
      price: p.price,
      original_price: p.original_price,
      discount_pct: p.discount_pct,
      cost_price: p.cost_price,
      image_url: p.image_url,
      description: p.description,
      stock: p.stock,
      min_stock: p.min_stock,
      active: p.active,
      featured: p.featured,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form };

    if (editingId) {
      await supabase.from("products").update(payload).eq("id", editingId);
    } else {
      await supabase.from("products").insert(payload);
    }

    setSaving(false);
    setModalOpen(false);
    fetchProducts();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from("products").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchProducts();
  }

  /* ── Pagination range ────────────────────────────────────────────── */
  function pageRange(): number[] {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <AdminShell pageTitle="Productos">
      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__left">
          <div className="admin-search">
            <span className="admin-search__icon">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              className="admin-search__input"
              placeholder="Buscar producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            style={{ width: "auto" }}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="admin-toolbar__right">
          <button className="admin-btn admin-btn--primary" onClick={openCreate}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 5v14m-7-7h14" />
            </svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="admin-card admin-card--flush">
        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="admin-empty__title">Sin productos</p>
            <p className="admin-empty__text">
              {search || catFilter
                ? "No se encontraron productos con esos filtros."
                : "Aún no hay productos. Crea el primero."}
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>SKU</th>
                    <th>Nombre</th>
                    <th>Marca</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.image_url ? (
                          <img
                            className="admin-product-thumb"
                            src={p.image_url}
                            alt={p.name}
                            width={40}
                            height={40}
                          />
                        ) : (
                          <span
                            className="admin-product-thumb"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#94a3b8",
                              background: "#f8fafc",
                            }}
                          >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.sku}</td>
                      <td style={{ fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </td>
                      <td>{p.brand}</td>
                      <td style={{ textTransform: "capitalize" }}>{p.category}</td>
                      <td style={{ fontWeight: 600 }}>{fmtEur(p.price)}</td>
                      <td>
                        <span style={{ color: p.stock <= p.min_stock ? "#dc2626" : undefined, fontWeight: p.stock <= p.min_stock ? 700 : undefined }}>
                          {p.stock}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge--dot ${p.active ? "admin-badge--green" : "admin-badge--red"}`}>
                          {p.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="admin-btn admin-btn--secondary admin-btn--sm" onClick={() => openEdit(p)}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => setDeleteTarget(p)}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} productos
              </span>
              <div className="admin-pagination__pages">
                <button
                  className="admin-pagination__page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {pageRange().map((n) => (
                  <button
                    key={n}
                    className={`admin-pagination__page${n === page ? " admin-pagination__page--active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="admin-pagination__page"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Create / Edit modal ──────────────────────────────────────── */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal admin-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">
                {editingId ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button className="admin-modal__close" onClick={() => setModalOpen(false)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="admin-modal__body">
              {/* Row 1 – identifiers */}
              <div className="admin-form-row admin-form-row--3">
                <div className="admin-field">
                  <label className="admin-label">SKU</label>
                  <input className="admin-input" value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Nombre</label>
                  <input className="admin-input" value={form.name} onChange={(e) => setField("name", e.target.value)} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Marca</label>
                  <input className="admin-input" value={form.brand} onChange={(e) => setField("brand", e.target.value)} />
                </div>
              </div>

              {/* Row 2 – classification */}
              <div className="admin-form-row admin-form-row--3">
                <div className="admin-field">
                  <label className="admin-label">Categoría</label>
                  <select className="admin-select" value={form.category} onChange={(e) => setField("category", e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {CATEGORIES.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label className="admin-label">Subcategoría</label>
                  <input className="admin-input" value={form.subcategory} onChange={(e) => setField("subcategory", e.target.value)} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Tipo</label>
                  <select className="admin-select" value={form.tipo} onChange={(e) => setField("tipo", e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3 – ML */}
              <div className="admin-form-row admin-form-row--3">
                <div className="admin-field">
                  <label className="admin-label">ML</label>
                  <input className="admin-input" type="number" min={0} value={form.ml} onChange={(e) => setField("ml", Number(e.target.value))} />
                </div>
              </div>

              {/* Row 4 – pricing */}
              <div className="admin-form-row admin-form-row--3">
                <div className="admin-field">
                  <label className="admin-label">Precio (€)</label>
                  <input className="admin-input" type="number" step="0.01" min={0} value={form.price} onChange={(e) => setField("price", Number(e.target.value))} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Precio Original (€)</label>
                  <input className="admin-input" type="number" step="0.01" min={0} value={form.original_price} onChange={(e) => setField("original_price", Number(e.target.value))} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">% Descuento</label>
                  <input className="admin-input" type="number" value={form.discount_pct} readOnly style={{ background: "#f8fafc", cursor: "default" }} />
                </div>
              </div>

              <div className="admin-form-row admin-form-row--3">
                <div className="admin-field">
                  <label className="admin-label">Precio Coste (€)</label>
                  <input className="admin-input" type="number" step="0.01" min={0} value={form.cost_price} onChange={(e) => setField("cost_price", Number(e.target.value))} />
                </div>
              </div>

              {/* Row 5 – image */}
              <div className="admin-form-row">
                <div className="admin-field">
                  <label className="admin-label">URL Imagen</label>
                  <input className="admin-input" type="url" placeholder="https://…" value={form.image_url} onChange={(e) => setField("image_url", e.target.value)} />
                </div>
              </div>

              {/* Row 6 – description */}
              <div className="admin-form-row">
                <div className="admin-field">
                  <label className="admin-label">Descripción</label>
                  <textarea className="admin-textarea" rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} />
                </div>
              </div>

              {/* Row 7 – stock */}
              <div className="admin-form-row admin-form-row--2">
                <div className="admin-field">
                  <label className="admin-label">Stock</label>
                  <input className="admin-input" type="number" min={0} value={form.stock} onChange={(e) => setField("stock", Number(e.target.value))} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Stock Mínimo</label>
                  <input className="admin-input" type="number" min={0} value={form.min_stock} onChange={(e) => setField("min_stock", Number(e.target.value))} />
                </div>
              </div>

              {/* Row 8 – flags */}
              <div className="admin-form-row admin-form-row--2">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.active} onChange={(e) => setField("active", e.target.checked)} />
                  <span className="admin-label" style={{ margin: 0 }}>Activo</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
                  <span className="admin-label" style={{ margin: 0 }}>Destacado</span>
                </label>
              </div>
            </div>

            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="admin-btn admin-btn--primary" disabled={saving} onClick={handleSave}>
                {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ────────────────────────────────── */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Eliminar producto</h2>
              <button className="admin-modal__close" onClick={() => setDeleteTarget(null)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: 0, fontSize: 14 }}>
                ¿Estás seguro de que quieres eliminar <strong>{deleteTarget.name}</strong>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button className="admin-btn admin-btn--danger" onClick={handleDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
