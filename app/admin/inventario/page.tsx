"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/supabase/types";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

const EUR = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function InventarioPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [liveStock, setLiveStock] = useState<Record<string, number>>({});
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockProgress, setStockProgress] = useState("");
  const stockAbort = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const getStock = (sku: string): number | null =>
    sku in liveStock ? liveStock[sku] : null;

  const totalWithStock = Object.keys(liveStock).length;
  const outOfStock = Object.values(liveStock).filter((v) => v === 0).length;
  const lowStock = Object.values(liveStock).filter((v) => v > 0 && v <= 5).length;
  const inStock = Object.values(liveStock).filter((v) => v > 5).length;

  const fetchLiveStockForPage = useCallback(async () => {
    const skus = pageProducts.map((p) => p.sku);
    if (skus.length === 0) return;
    setLoadingStock(true);
    setStockProgress("Consultando stock en tiempo real...");

    try {
      const res = await fetch("/api/stock-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus }),
      });
      const { stocks } = await res.json();
      if (stocks) {
        setLiveStock((prev) => ({ ...prev, ...stocks }));
      }
    } catch {
      setStockProgress("Error al consultar stock");
    } finally {
      setLoadingStock(false);
      setStockProgress("");
    }
  }, [pageProducts.map((p) => p.sku).join(",")]);

  const fetchAllStock = async () => {
    if (loadingStock) {
      stockAbort.current?.abort();
      setLoadingStock(false);
      setStockProgress("");
      return;
    }

    setLoadingStock(true);
    stockAbort.current = new AbortController();
    const allSkus = filtered.map((p) => p.sku);
    const BATCH = 15;
    let done = 0;

    try {
      for (let i = 0; i < allSkus.length; i += BATCH) {
        if (stockAbort.current.signal.aborted) break;
        const batch = allSkus.slice(i, i + BATCH);
        setStockProgress(
          `Consultando stock… ${done}/${allSkus.length} (${Math.round((done / allSkus.length) * 100)}%)`,
        );

        try {
          const res = await fetch("/api/stock-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skus: batch }),
            signal: stockAbort.current.signal,
          });
          const { stocks } = await res.json();
          if (stocks) {
            setLiveStock((prev) => ({ ...prev, ...stocks }));
          }
        } catch {
          if (stockAbort.current.signal.aborted) break;
        }
        done += batch.length;
      }
    } finally {
      setLoadingStock(false);
      setStockProgress("");
    }
  };

  function stockBadge(stock: number | null) {
    if (stock === null)
      return { cls: "admin-badge admin-badge--gray admin-badge--dot", label: "—" };
    if (stock === 0)
      return {
        cls: "admin-badge admin-badge--red admin-badge--dot",
        label: "Agotado",
      };
    if (stock <= 5)
      return {
        cls: "admin-badge admin-badge--amber admin-badge--dot",
        label: `Bajo (${stock})`,
      };
    return {
      cls: "admin-badge admin-badge--green admin-badge--dot",
      label: `OK (${stock})`,
    };
  }

  return (
    <AdminShell pageTitle="Inventario">
      {/* Stat cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">Total Productos</p>
            <p className="admin-stat-card__value">{filtered.length}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="admin-stat-card__info">
            <p className="admin-stat-card__label">En Stock</p>
            <p className="admin-stat-card__value">{totalWithStock > 0 ? inStock : "—"}</p>
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
            <p className="admin-stat-card__value">{totalWithStock > 0 ? lowStock : "—"}</p>
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
            <p className="admin-stat-card__value">{totalWithStock > 0 ? outOfStock : "—"}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__left">
          <input
            className="admin-input"
            style={{ width: 300 }}
            placeholder="Buscar por nombre, SKU o marca…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="admin-toolbar__right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {stockProgress && (
            <span style={{ fontSize: 12, color: "#64748b" }}>{stockProgress}</span>
          )}
          <button
            className="admin-btn admin-btn--sm admin-btn--secondary"
            onClick={fetchLiveStockForPage}
            disabled={loadingStock}
          >
            {loadingStock ? "Consultando…" : "Stock página actual"}
          </button>
          <button
            className={`admin-btn admin-btn--sm ${loadingStock ? "admin-btn--danger" : "admin-btn--primary"}`}
            onClick={fetchAllStock}
          >
            {loadingStock ? "⏹ Detener" : "⟳ Sync todo el stock"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card admin-card--flush">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty__title">Sin resultados</p>
            <p className="admin-empty__text">No hay productos que coincidan.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Marca</th>
                    <th>Precio</th>
                    <th>PVP</th>
                    <th>Stock (perfumedigital)</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pageProducts.map((p) => {
                    const stock = getStock(p.sku);
                    const badge = stockBadge(stock);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="admin-product-thumb" />
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
                            <span style={{ fontWeight: 600, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.sku}</td>
                        <td>{p.brand}</td>
                        <td>{EUR(p.price)}</td>
                        <td style={{ color: "#64748b" }}>{EUR(p.original_price)}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color:
                                stock === null
                                  ? "#94a3b8"
                                  : stock === 0
                                    ? "#dc2626"
                                    : stock <= 5
                                      ? "#b45309"
                                      : "#15803d",
                            }}
                          >
                            {stock === null ? "—" : stock}
                          </span>
                        </td>
                        <td>
                          <span className={badge.cls}>{badge.label}</span>
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
                <span className="admin-pagination__info">
                  {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filtered.length)} de{" "}
                  {filtered.length}
                </span>
                <div className="admin-pagination__pages">
                  <button
                    className="admin-btn admin-btn--sm admin-btn--secondary"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - safePage) <= 2,
                    )
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span style={{ padding: "0 4px", color: "#94a3b8" }}>…</span>
                        )}
                        <button
                          className={`admin-btn admin-btn--sm ${
                            p === safePage
                              ? "admin-btn--primary"
                              : "admin-btn--secondary"
                          }`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                  <button
                    className="admin-btn admin-btn--sm admin-btn--secondary"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
