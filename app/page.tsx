import type { Metadata } from "next";
import Link from "next/link";
import { getTiendaProductos, getEnOferta } from "@/lib/tienda-products";
import { SITE_DEFAULT_TITLE, SITE_DEFAULT_DESCRIPTION, siteUrl } from "@/lib/site-seo";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroSection } from "@/components/home/HeroSection";
import { ProductSliderSection } from "@/components/home/ProductSliderSection";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: { absolute: SITE_DEFAULT_TITLE },
  description: SITE_DEFAULT_DESCRIPTION,
  alternates: { canonical: siteUrl().origin },
};

export default function HomePage() {
  const all = getTiendaProductos();

  // Oferta Flash: productos con descuento >= 30%
  const flashSale = getEnOferta(30).slice(0, 12);
  const flashSkus = new Set(flashSale.map((p) => p.sku));

  // Destacados: perfumes mujer/hombre sin descuento
  const featured = all
    .filter((p) => ["mujer", "hombre"].includes(p.categoria) && !flashSkus.has(p.sku))
    .slice(0, 8);
  const featuredSkus = new Set(featured.map((p) => p.sku));

  // Novedades: otras categorías, no repetidos
  const newIn = all
    .filter((p) => !flashSkus.has(p.sku) && !featuredSkus.has(p.sku))
    .slice(0, 8);

  const base = siteUrl().origin;

  // WebSite + SearchAction JSON-LD
  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: base,
    name: "Secreto Digital",
    description: SITE_DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/shop?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }} />
      <SiteHeader />
      <main>
        {/* Hero full-width */}
        <HeroSection />

        {/* Category cards */}
        <section className="home-cats">
          <div className="container">
            <div className="home-cats__grid">
              {[
                { href: "/shop?cat=mujer",  img: "/assets/images/banner2.png", label: "Perfumes Mujer",    sub: "Las fragancias más exclusivas" },
                { href: "/shop?cat=hombre", img: "/assets/images/banner1.png", label: "Perfumes Hombre",   sub: "Tu fragancia perfecta" },
                { href: "/shop?cat=infantil", img: "/assets/images/banner3.png", label: "Unisex & Infantil", sub: "Últimos lanzamientos" },
              ].map((cat) => (
                <Link key={cat.label} href={cat.href} className="home-cat-card">
                  <div className="home-cat-card__bg" style={{ backgroundImage: `url('${cat.img}')` }} />
                  <div className="home-cat-card__overlay" />
                  <div className="home-cat-card__info">
                    <h2 className="home-cat-card__title">{cat.label}</h2>
                    <p className="home-cat-card__sub">{cat.sub}</p>
                    <span className="home-cat-card__btn">Ver colección →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Flash sale slider */}
        <ProductSliderSection
          title="Oferta Flash"
          products={flashSale}
          viewAllHref="/shop?sort=descuento"
          accent
          countdownDate="2026-07-31T23:59:59"
        />

        {/* Featured products grid */}
        <section className="home-featured">
          <div className="container">
            <div className="home-section-head">
              <h2 className="home-section-head__title">Productos Destacados</h2>
              <Link href="/shop" className="home-section-head__link">Ver todos →</Link>
            </div>
            <div className="home-featured__grid">
              {featured.map((p) => <ProductCard product={p} key={p.sku} />)}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="home-cta">
          <div className="home-cta__inner" style={{ backgroundImage: "url('/assets/images/cta_bg.jpeg')" }}>
            <div className="home-cta__overlay" />
            <div className="home-cta__content">
              <h2 className="home-cta__title">Descubre los Perfumes<br />más Populares</h2>
              <Link href="/shop" className="home-cta__btn">Ver colección completa</Link>
            </div>
          </div>
        </section>

        {/* New in store */}
        <section className="home-newin">
          <div className="container">
            <div className="home-section-head">
              <h2 className="home-section-head__title">Novedades</h2>
              <Link href="/shop" className="home-section-head__link">Ver todas →</Link>
            </div>
            <div className="home-featured__grid">
              {newIn.map((p) => <ProductCard product={p} key={p.sku} />)}
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <FeatureStrip />
      </main>
      <SiteFooter />
    </div>
  );
}
