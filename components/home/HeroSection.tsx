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

    </section>
  );
}
