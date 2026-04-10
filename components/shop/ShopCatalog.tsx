"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { TiendaProducto } from "@/lib/tienda-types";
import { ProductCard } from "@/components/ProductCard";

const PAGE_SIZE = 24;
type SortKey = "default" | "price-asc" | "price-desc" | "descuento";

// Meta-categoría "cosmeticos" agrupa todas las subcategorías de cosmética
const COSMETICOS_SLUGS = new Set([
  "cosmetica-mujer", "cosmetica-hombre", "maquillaje",
  "rostro", "cuerpo", "cabello", "ojos", "cuidado", "solares",
]);

type Props = { products: TiendaProducto[] };

export function ShopCatalog({ products }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQ    = searchParams.get("q")    ?? "";
  const urlCat  = searchParams.get("cat")  ?? "";
  const urlSort = (searchParams.get("sort") ?? "default") as SortKey;

  const [page,   setPage]   = useState(1);
  const [sort,   setSort]   = useState<SortKey>(urlSort);
  const [search, setSearch] = useState(urlQ);
  const [cat,    setCat]    = useState(urlCat);

  useEffect(() => {
    setSearch(urlQ);
    setSort(urlSort);
    setCat(urlCat);
    setPage(1);
  }, [urlQ, urlSort, urlCat]);

  const filtered = useMemo(() => {
    let list = products;

    // Filtro por categoría
    if (cat === "cosmeticos") {
      list = list.filter((p) => COSMETICOS_SLUGS.has(p.categoria));
    } else if (cat === "nicho") {
      list = list.filter((p) => p.nicho === true);
    } else if (cat) {
      list = list.filter((p) => p.categoria === cat);
    }

    // Búsqueda por texto
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.marca.toLowerCase().includes(q)
      );
    }

    // Ordenación
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.precio - b.precio); break;
      case "price-desc":
        list = [...list].sort((a, b) => b.precio - a.precio); break;
      case "descuento":
        list = [...list].sort((a, b) => (b.descuento ?? 0) - (a.descuento ?? 0)); break;
    }
    return list;
  }, [products, sort, search, cat]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const pageProducts = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSort(v: SortKey) {
    setSort(v); setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", v);
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  }

  function handleCat(v: string) {
    setCat(v); setPage(1);
    const params = new URLSearchParams();
    if (v) params.set("cat", v);
    if (sort !== "default") params.set("sort", sort);
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  }

  function handleSearch(v: string) { setSearch(v); setPage(1); }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (cat) params.set("cat", cat);
    if (sort !== "default") params.set("sort", sort);
    router.push(`/shop?${params.toString()}`);
  }

  function pageNums() {
    const pages = new Set<number>([1, totalPages]);
    for (let d = -2; d <= 2; d++) {
      const p = safePage + d;
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
      out.push(sorted[i]);
    }
    return out;
  }

  return (
    <>
      {/* Toolbar */}
      <div className="escencia-shop-toolbar">
        <p className="escencia-shop-toolbar__count">
          {filtered.length === 0
            ? "Sin resultados"
            : `Mostrando ${Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(safePage * PAGE_SIZE, filtered.length)} de ${filtered.length} productos`}
          {search.trim() && <span> para &ldquo;<strong>{search}</strong>&rdquo;</span>}
        </p>
        <div className="escencia-shop-toolbar__right">
          <form onSubmit={handleSearchSubmit} className="escencia-shop-search">
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar en la tienda..."
              aria-label="Buscar productos"
            />
            <button type="submit" aria-label="Buscar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>
          <select
            className="escencia-shop-sort"
            value={sort}
            onChange={(e) => handleSort(e.target.value as SortKey)}
          >
            <option value="default">Ordenar: Predeterminado</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="descuento">Mayor descuento</option>
          </select>
        </div>
      </div>

      <div style={{ height: 24 }} />

      {pageProducts.length === 0 ? (
        <div className="escencia-shop-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>No se encontraron productos{search.trim() ? ` para "${search}"` : ""}.</p>
          <button className="cs_btn cs_style_1 cs_medium" onClick={() => { setSearch(""); setCat(""); setPage(1); router.push("/shop"); }}>
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="escencia-product-grid">
          {pageProducts.map((p) => <ProductCard product={p} key={p.sku} />)}
        </div>
      )}

      <div style={{ height: 40 }} />

      {totalPages > 1 && (
        <div className="escencia-pagination">
          <button className="escencia-pagination__arrow" disabled={safePage === 1}
            onClick={() => { setPage(safePage - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <svg width="8" height="14" viewBox="0 0 11 20" fill="currentColor"><path d="M11 0.96476L11 19.0353C11 19.8904 9.96356 20.326 9.34818 19.7129L0.279353 10.6777C-0.0931162 10.3066-0.0931163 9.69347 0.279353 9.32222L9.34818 0.286953C9.96356-0.325993 11 0.109636 11 0.96476Z"/></svg>
          </button>
          {pageNums().map((item, i) =>
            item === "…" ? (
              <span key={`e${i}`} className="escencia-pagination__ellipsis">…</span>
            ) : (
              <button key={item}
                className={`escencia-pagination__page${safePage === item ? " active" : ""}`}
                onClick={() => { setPage(item as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                {item}
              </button>
            )
          )}
          <button className="escencia-pagination__arrow" disabled={safePage === totalPages}
            onClick={() => { setPage(safePage + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <svg width="8" height="14" viewBox="0 0 11 20" fill="currentColor"><path d="M8.32057e-07 0.964762L4.21688e-08 19.0353C4.79022e-09 19.8904 1.03644 20.326 1.65182 19.7129L10.7206 10.6777C11.0931 10.3066 11.0931 9.69347 10.7206 9.32222L1.65182 0.286955C1.03644-0.32599 8.69435e-07 0.109639 8.32057e-07 0.964762Z"/></svg>
          </button>
        </div>
      )}
    </>
  );
}
