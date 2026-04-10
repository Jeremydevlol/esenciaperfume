import Link from "next/link";

export function HeroSection() {
  return (
    <section className="pf-hero">
      {/* Full-width banner */}
      <div
        className="pf-hero__banner"
        style={{ backgroundImage: "url('/assets/images/banner4.png')" }}
      >
        {/* Subtle gradient for text legibility */}
        <div className="pf-hero__overlay" />

        {/* Text — bottom left */}
        <div className="pf-hero__content">
          <p className="pf-hero__breadcrumb">Tienda / Nuevos Perfumes</p>
          <h1 className="pf-hero__title">
            Nuestra Colección<br />de Perfumes 2025
          </h1>
          <Link href="/shop" className="pf-hero__cta">
            Ver toda la colección
          </Link>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="pf-hero__tabs-bar">
        <div className="pf-hero__tabs">
          <Link href="/shop" className="pf-hero__tab pf-hero__tab--active">Todos</Link>
          <Link href="/shop?cat=mujer" className="pf-hero__tab">Mujer</Link>
          <Link href="/shop?cat=hombre" className="pf-hero__tab">Hombre</Link>
          <Link href="/shop?cat=unisex" className="pf-hero__tab">Unisex</Link>
          <Link href="/shop?cat=nicho" className="pf-hero__tab">Nicho</Link>
          <Link href="/shop?cat=cosmeticos" className="pf-hero__tab">Cosméticos</Link>
        </div>
        <Link href="/shop" className="pf-hero__filter-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filtros
        </Link>
      </div>
    </section>
  );
}
