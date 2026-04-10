import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTiendaProductos, getBySku } from "@/lib/tienda-products";
import { SITE_DEFAULT_DESCRIPTION, seoTitleSegment } from "@/lib/site-seo";
import { ProductDetailImage } from "../product-detail-image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartButton } from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function formatEuro(v: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const p = getBySku(decodeURIComponent(id));
  if (!p) return { title: "Producto", description: SITE_DEFAULT_DESCRIPTION };
  return {
    title: seoTitleSegment(p.nombre, 50),
    description: `${p.nombre} — ${p.marca}. ${SITE_DEFAULT_DESCRIPTION.slice(0, 100)}`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = getBySku(decodeURIComponent(id));
  if (!product) notFound();

  const showDiscount = product.pvp != null && product.pvp > product.precio;

  // Productos relacionados: misma categoría, distinto SKU
  const related = getTiendaProductos()
    .filter((p) => p.categoria === product.categoria && p.sku !== product.sku)
    .slice(0, 4);

  return (
    <div>
      <SiteHeader />
      <main>
        {/* ── Breadcrumb ── */}
        <div className="pd-breadcrumb">
          <div className="container">
            <ol className="pd-breadcrumb__list">
              <li><Link href="/">Inicio</Link></li>
              <li><svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1l4 4-4 4" stroke="#999" strokeWidth="1.4" strokeLinecap="round"/></svg></li>
              <li><Link href="/shop">Tienda</Link></li>
              <li><svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1l4 4-4 4" stroke="#999" strokeWidth="1.4" strokeLinecap="round"/></svg></li>
              <li aria-current="page">{product.nombre}</li>
            </ol>
          </div>
        </div>

        {/* ── Producto ── */}
        <div className="pd-wrap">
          {/* Imagen */}
          <div className="pd-gallery">
            <div className="pd-gallery__main">
              <ProductDetailImage src={product.imagen} alt={product.nombre} />
            </div>
          </div>

          {/* Info */}
          <div className="pd-info">
            <div className="pd-info__tags">
              {showDiscount ? (
                <span className="pd-tag pd-tag--sale">-{product.descuento}% DTO</span>
              ) : (
                <span className="pd-tag pd-tag--new">NUEVO</span>
              )}
            </div>

            <h1 className="pd-info__name">{product.nombre}</h1>
            <p className="pd-info__type">{product.marca}</p>

            <p className="pd-info__desc">
              {product.ml && `${product.ml} · `}{product.tipo}
            </p>

            <div className="pd-info__divider" />

            <div className="pd-info__stock">
              <span className="pd-stock-dot" />
              STOCK DISPONIBLE
            </div>

            <div className="pd-info__buy-row">
              <div className="pd-info__price-block">
                {showDiscount && (
                  <span className="pd-info__price-orig">{formatEuro(product.pvp!)}</span>
                )}
                <span className="pd-info__price">{formatEuro(product.precio)}</span>
              </div>
            </div>

            {/* Tipo (Regular / Tester) */}
            <div className="pd-info__sizes">
              {["Regular", "Tester"].map((s) => (
                <button key={s} className={`pd-size-btn${product.tipo === s ? " active" : ""}`} type="button">{s}</button>
              ))}
            </div>

            <AddToCartButton
              product={{ sku: product.sku, name: product.nombre, price: product.precio, imageUrl: product.imagen }}
            />

            <div className="pd-info__perks">
              <div className="pd-perk">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>Envío gratis a partir de 50€</span>
              </div>
              <div className="pd-perk">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Devolución gratuita en 30 días</span>
              </div>
              <div className="pd-perk">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <span>Pago seguro — Visa, Mastercard, PayPal</span>
              </div>
            </div>

            <p className="pd-info__ref">Ref. {product.sku}</p>
          </div>
        </div>

        {/* ── Descripción ── */}
        {product.descripcion && (
          <section className="pd-description">
            <div className="container">
              <h2 className="pd-description__title">Descripción del producto</h2>
              <div className="pd-description__body">
                {product.descripcion.split('\n').map((line, i) =>
                  line.trim() ? <p key={i}>{line.trim()}</p> : null
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Relacionados ── */}
        {related.length > 0 && (
          <section className="pd-related">
            <div className="container">
              <h2 className="pd-related__title">TAMBIÉN TE PUEDE GUSTAR</h2>
              <div className="pd-related__grid">
                {related.map((p) => <ProductCard product={p} key={p.sku} />)}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
