"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import TOP_MARCAS from "@/data/top-marcas.json";

const ANNOUNCEMENTS = [
  "🚚 Envío GRATIS en pedidos superiores a 50€",
  "✨ Hasta 50% de descuento en perfumes seleccionados",
  "🎁 Regala fragancia — encuentra el perfume perfecto",
];

const NAV_LINKS = [
  { href: "/shop",                      label: "Todos los productos" },
  { href: "/shop?sort=descuento",       label: "🔥 Ofertas Flash" },
  { href: "/shop?cat=nicho",            label: "✦ Perfumes de Nicho" },
  { href: "/shop?cat=mujer",            label: "Perfumes Mujer" },
  { href: "/shop?cat=hombre",           label: "Perfumes Hombre" },
  { href: "/shop?cat=infantil",         label: "Perfumes Infantiles" },
  { href: "/shop?cat=outlet",           label: "Outlet Perfumería" },
  { href: "/shop?cat=descatalogados",   label: "Descatalogados y Rarezas" },
  { href: "/shop?cat=aftershave",       label: "After Shave & Body" },
  { href: "/shop?cat=cosmeticos",       label: "Cosméticos" },
  { href: "/shop?cat=maquillaje",       label: "Maquillaje" },
  { href: "/shop?cat=cosmetica-mujer",  label: "Cosmética Mujer" },
  { href: "/shop?cat=cosmetica-hombre", label: "Cosmética Hombre" },
  { href: "/shop?cat=cabello",          label: "Cuidado Cabello" },
  { href: "/shop?cat=rostro",           label: "Tratamiento Rostro" },
  { href: "/shop?cat=ojos",             label: "Contorno de Ojos" },
  { href: "/shop?cat=cuerpo",           label: "Tratamiento Cuerpo" },
  { href: "/shop?cat=solares",          label: "Solares" },
  { href: "/shop?cat=cuidado",          label: "Cuidado Personal" },
  { href: "/shop?cat=gafas",            label: "Gafas de Sol" },
];

/**
 * iOS Safari fix: en botones dentro de position:fixed, onClick puede no dispararse.
 * onTouchEnd con preventDefault() evita el ghost click de 300ms y garantiza la acción.
 * El onClick queda como fallback para escritorio (ratón).
 */
function iosTap(fn: () => void) {
  return (e: React.TouchEvent) => {
    e.preventDefault();
    fn();
  };
}

export function SiteHeader() {
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [marcasOpen, setMarcasOpen] = useState(false);
  // Bloquea el overlay 350ms tras abrir el drawer para evitar ghost clicks residuales
  const overlayReadyRef = useRef(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { totalItems, openCart, hydrated } = useCart();

  useEffect(() => {
    if (!announcementVisible) return;
    const t = setInterval(() => {
      setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(t);
  }, [announcementVisible]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function openMenu() {
    overlayReadyRef.current = false;
    setMenuOpen(true);
    setTimeout(() => { overlayReadyRef.current = true; }, 350);
  }

  function closeMenu() {
    if (!overlayReadyRef.current) return;
    setMenuOpen(false);
  }

  function toggleSearch() {
    setSearchOpen((v) => !v);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    setSearchOpen(false);
    setMenuOpen(false);
    if (q) router.push(`/shop?q=${encodeURIComponent(q)}`);
    else router.push("/shop");
  }

  return (
    <>
      <header className="pf-header">
        {/* ── Announcement bar ── */}
        {announcementVisible && (
          <div className="pf-announce">
            <button
              type="button"
              className="pf-announce__arrow"
              onTouchEnd={iosTap(() => setAnnouncementIdx((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length))}
              onClick={() => setAnnouncementIdx((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}
              aria-label="Anterior"
            >
              <svg width="6" height="11" viewBox="0 0 6 11" fill="none"><path d="M5 1L1 5.5L5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="pf-announce__text">{ANNOUNCEMENTS[announcementIdx]}</span>
            <button
              type="button"
              className="pf-announce__arrow"
              onTouchEnd={iosTap(() => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length))}
              onClick={() => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length)}
              aria-label="Siguiente"
            >
              <svg width="6" height="11" viewBox="0 0 6 11" fill="none"><path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              type="button"
              className="pf-announce__close"
              onTouchEnd={iosTap(() => setAnnouncementVisible(false))}
              onClick={() => setAnnouncementVisible(false)}
              aria-label="Cerrar"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        )}

        {/* ── Main bar ── */}
        <div className="pf-main">
          {/* LEFT: hamburger + search */}
          <div className="pf-main__left">
            <button
              type="button"
              className="pf-hamburger"
              onTouchEnd={iosTap(openMenu)}
              onClick={openMenu}
              aria-label="Abrir menú"
            >
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="0" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              type="button"
              className="pf-search-trigger"
              onTouchEnd={iosTap(toggleSearch)}
              onClick={toggleSearch}
              aria-label="Buscar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span>Buscar</span>
            </button>
          </div>

          {/* CENTER: logo */}
          <Link href="/" className="pf-logo" aria-label="Secreto Digital — Inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/logosecreto.png"
              alt="Secreto Digital"
              className="pf-logo__img"
            />
          </Link>

          {/* RIGHT: cart */}
          <div className="pf-main__right">
            <button
              type="button"
              className="pf-icon-btn pf-cart-btn"
              onTouchEnd={iosTap(openCart)}
              onClick={openCart}
              aria-label="Carrito"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {hydrated && totalItems > 0 && (
                <span className="pf-cart-badge">{totalItems > 99 ? "99+" : totalItems}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Search bar — render condicional (sin max-height, Safari-safe) ── */}
        {searchOpen && (
          <div className="pf-search-bar">
            <form onSubmit={handleSearch} className="pf-search-bar__form">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Busca marcas, perfumes…"
                className="pf-search-bar__input"
              />
              <button
                type="button"
                className="pf-search-bar__close"
                onTouchEnd={iosTap(() => setSearchOpen(false))}
                onClick={() => setSearchOpen(false)}
                aria-label="Cerrar búsqueda"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Spacer dinámico */}
      <div
        className={`pf-header-spacer${announcementVisible ? "" : " pf-header-spacer--no-announce"}`}
        aria-hidden="true"
      />

      {/* ── Nav drawer ── */}
      {menuOpen && (
        <div className="pf-drawer" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          {/* Overlay — toque cierra el menú; onTouchEnd evita ghost clicks */}
          <div
            className="pf-drawer__overlay"
            onTouchEnd={(e) => { e.preventDefault(); closeMenu(); }}
            onClick={closeMenu}
          />
          <div className="pf-drawer__panel">
            <div className="pf-drawer__head">
              <span className="pf-drawer__title">Menú</span>
              <button
                type="button"
                className="pf-drawer__close"
                onTouchEnd={iosTap(() => setMenuOpen(false))}
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="15" y1="1" x2="1" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Search inside drawer */}
            <form onSubmit={handleSearch} className="pf-drawer__search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Busca perfumes…"
              />
              <button type="submit" aria-label="Buscar en tienda">→</button>
            </form>

            <nav>
              {/* ── Sección MARCAS ── */}
              <div className="pf-drawer__brands-section">
                <button
                  type="button"
                  className="pf-drawer__brands-toggle"
                  onTouchEnd={iosTap(() => setMarcasOpen((v) => !v))}
                  onClick={() => setMarcasOpen((v) => !v)}
                  aria-expanded={marcasOpen}
                >
                  <span>🏷️ Marcas</span>
                  <svg
                    className={`pf-drawer__brands-arrow${marcasOpen ? " pf-drawer__brands-arrow--open" : ""}`}
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {marcasOpen && (
                  <div className="pf-drawer__brands-body">
                    <div className="pf-drawer__brands-grid">
                      {(TOP_MARCAS as { marca: string; count: number }[]).map(({ marca }) => (
                        <Link
                          key={marca}
                          href={`/shop?marca=${encodeURIComponent(marca)}`}
                          className="pf-drawer__brand-pill"
                          onClick={() => setMenuOpen(false)}
                        >
                          {marca}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/marcas"
                      className="pf-drawer__brands-all"
                      onClick={() => setMenuOpen(false)}
                    >
                      Ver todas las marcas →
                    </Link>
                  </div>
                )}
              </div>

              <div className="pf-drawer__divider" />

              <ul className="pf-drawer__links">
                {NAV_LINKS.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} onClick={() => setMenuOpen(false)} className="pf-drawer__link">
                      {l.label}
                      <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
