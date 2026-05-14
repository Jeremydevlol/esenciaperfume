"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

const ANNOUNCEMENTS = [
  "Envío GRATIS en pedidos superiores a 100€",
  "Hasta 50% de descuento en perfumes seleccionados",
  "Regala fragancia — encuentra el perfume perfecto",
];

function iosTap(fn: () => void) {
  return (e: React.TouchEvent) => { e.preventDefault(); fn(); };
}

export function SiteHeader() {
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    setSearchOpen(false);
    if (q) router.push(`/shop?q=${encodeURIComponent(q)}`);
    else router.push("/shop");
  }

  return (
    <>
      <header className="pf-header">
        {/* ── Announcement bar ── */}
        {announcementVisible && (
          <div className="pf-announce">
            <button type="button" className="pf-announce__arrow"
              onTouchEnd={iosTap(() => setAnnouncementIdx((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length))}
              onClick={() => setAnnouncementIdx((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length)}
              aria-label="Anterior">
              <svg width="6" height="11" viewBox="0 0 6 11" fill="none"><path d="M5 1L1 5.5L5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span className="pf-announce__text">{ANNOUNCEMENTS[announcementIdx]}</span>
            <button type="button" className="pf-announce__arrow"
              onTouchEnd={iosTap(() => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length))}
              onClick={() => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENTS.length)}
              aria-label="Siguiente">
              <svg width="6" height="11" viewBox="0 0 6 11" fill="none"><path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button type="button" className="pf-announce__close"
              onTouchEnd={iosTap(() => setAnnouncementVisible(false))}
              onClick={() => setAnnouncementVisible(false)} aria-label="Cerrar">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        )}

        {/* ── Main bar ── */}
        <div className="pf-main">
          {/* LEFT: search */}
          <div className="pf-main__left">
            <button type="button" className="pf-search-trigger"
              onTouchEnd={iosTap(() => setSearchOpen((v) => !v))}
              onClick={() => setSearchOpen((v) => !v)} aria-label="Buscar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span>Buscar</span>
            </button>
          </div>

          {/* CENTER: logo */}
          <Link href="/" className="pf-logo" aria-label="Secreto Digital — Inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logosecreto.png" alt="Secreto Digital" className="pf-logo__img" />
          </Link>

          {/* RIGHT: cart */}
          <div className="pf-main__right">
            <button type="button" className="pf-icon-btn pf-cart-btn"
              onTouchEnd={iosTap(openCart)} onClick={openCart} aria-label="Carrito">
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

        {/* ── Search bar ── */}
        {searchOpen && (
          <div className="pf-search-bar">
            <form onSubmit={handleSearch} className="pf-search-bar__form">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input ref={searchInputRef} type="search" value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Busca marcas, perfumes…" className="pf-search-bar__input" />
              <button type="button" className="pf-search-bar__close"
                onTouchEnd={iosTap(() => setSearchOpen(false))}
                onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Spacer dinámico */}
      <div className={`pf-header-spacer${announcementVisible ? "" : " pf-header-spacer--no-announce"}`} aria-hidden="true" />
    </>
  );
}
