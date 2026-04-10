"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type BrandItem = { marca: string; count: number };

type Props = {
  groups: Record<string, BrandItem[]>;
  letters: string[];
};

export function MarcasGrid({ groups, letters }: Props) {
  const [search, setSearch] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // Filtrar marcas según búsqueda o letra seleccionada
  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (q) {
      // Búsqueda: mostrar todas las marcas que coincidan, sin agrupar
      const matches: BrandItem[] = [];
      for (const key of letters) {
        for (const item of groups[key]) {
          if (item.marca.toLowerCase().includes(q)) matches.push(item);
        }
      }
      return [{ key: "Resultados", items: matches }];
    }

    if (activeLetter) {
      const items = groups[activeLetter] ?? [];
      return [{ key: activeLetter, items }];
    }

    // Sin filtro: mostrar todos agrupados
    return letters.map((key) => ({ key, items: groups[key] }));
  }, [search, activeLetter, groups, letters]);

  const totalVisible = visibleGroups.reduce((s, g) => s + g.items.length, 0);

  return (
    <>
      {/* Buscador de marcas */}
      <div className="marcas-search">
        <div className="marcas-search__wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar marca…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveLetter(null); }}
            className="marcas-search__input"
            aria-label="Buscar marca"
          />
          {search && (
            <button
              type="button"
              className="marcas-search__clear"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>
        {search && (
          <p className="marcas-search__count">
            {totalVisible} {totalVisible === 1 ? "marca" : "marcas"} encontradas
          </p>
        )}
      </div>

      {/* Índice A-Z */}
      {!search && (
        <div className="marcas-az" role="navigation" aria-label="Filtrar por letra">
          <button
            type="button"
            className={`marcas-az__btn${!activeLetter ? " marcas-az__btn--active" : ""}`}
            onClick={() => setActiveLetter(null)}
          >
            Todas
          </button>
          {letters.map((l) => (
            <button
              key={l}
              type="button"
              className={`marcas-az__btn${activeLetter === l ? " marcas-az__btn--active" : ""}`}
              onClick={() => setActiveLetter(activeLetter === l ? null : l)}
              aria-label={`Marcas que empiezan por ${l}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Grupos */}
      {visibleGroups.map(({ key, items }) =>
        items.length === 0 ? null : (
          <div key={key} className="marcas-group" id={`letra-${key}`}>
            {!search && (
              <h2 className="marcas-group__letter">{key}</h2>
            )}
            <div className="marcas-group__grid">
              {items.map(({ marca, count }) => (
                <Link
                  key={marca}
                  href={`/shop?marca=${encodeURIComponent(marca)}`}
                  className="marcas-card"
                >
                  <span className="marcas-card__initial">{marca[0]}</span>
                  <span className="marcas-card__name">{marca}</span>
                  <span className="marcas-card__count">{count} prod.</span>
                </Link>
              ))}
            </div>
          </div>
        )
      )}

      {totalVisible === 0 && (
        <div className="marcas-empty">
          <p>No se encontraron marcas para &ldquo;<strong>{search}</strong>&rdquo;</p>
        </div>
      )}
    </>
  );
}
