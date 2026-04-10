import type { Metadata } from "next";
import { Suspense } from "react";
import { getTiendaProductos } from "@/lib/tienda-products";
import { SITE_DEFAULT_DESCRIPTION, siteUrl } from "@/lib/site-seo";
import { CATEGORIAS } from "@/lib/tienda-types";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShopCatalog } from "@/components/shop/ShopCatalog";

// Descripciones SEO por categoría — como druni, optimizadas para búsquedas
const CAT_SEO: Record<string, { title: string; description: string }> = {
  mujer:          { title: "Perfumes de Mujer", description: "Compra perfumes de mujer de las mejores marcas al mejor precio. Amplia selección de fragancias femeninas: florales, orientales, frescas y más." },
  hombre:         { title: "Perfumes de Hombre", description: "Perfumes de hombre online al mejor precio. Encuentra las mejores colonias y fragancias masculinas de primeras marcas." },
  nicho:          { title: "Perfumes de Nicho", description: "Descubre los perfumes de nicho más exclusivos. Fragancias únicas de marcas independientes y luxury. Compra online con envío rápido." },
  infantil:       { title: "Perfumes Infantiles", description: "Perfumes y colonias para bebés y niños. Fragancias suaves y especiales para los más pequeños al mejor precio." },
  outlet:         { title: "Outlet de Perfumería", description: "Outlet de perfumes y cosméticos con hasta un 70% de descuento. Aprovecha las mejores ofertas en perfumería online." },
  cosmeticos:     { title: "Cosmética y Belleza", description: "Productos de cosmética y belleza al mejor precio. Maquillaje, tratamientos y cuidado personal de las mejores marcas." },
  maquillaje:     { title: "Maquillaje", description: "Compra maquillaje online de las mejores marcas. Bases, labiales, máscaras de pestañas y más a precios increíbles." },
  descatalogados: { title: "Descatalogados y Rarezas", description: "Perfumes descatalogados y de edición limitada. Encuentra esas joyas olvidadas que ya no se fabrican." },
  aftershave:     { title: "After Shave y Body", description: "After shave y productos body de las mejores marcas. Cuida tu piel después del afeitado al mejor precio." },
};

type ShopPageProps = { searchParams: Promise<{ cat?: string; q?: string; sort?: string; page?: string; marca?: string }> };

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const { cat, marca } = await searchParams;
  const catSeo = cat ? CAT_SEO[cat] : null;
  const catLabel = cat ? (CATEGORIAS.find(c => c.slug === cat)?.label ?? cat) : "Tienda";
  const base = siteUrl().origin;

  if (marca) {
    const marcaUp = marca.toUpperCase();
    return {
      title: `${marcaUp} | Perfumes y Cosméticos`,
      description: `Compra perfumes y cosméticos de ${marcaUp} al mejor precio. Envío rápido a España y Portugal.`,
      alternates: { canonical: `${base}/shop?marca=${encodeURIComponent(marca)}` },
    };
  }

  return {
    title: catSeo?.title ?? `${catLabel} | Perfumes Online`,
    description: catSeo?.description ?? SITE_DEFAULT_DESCRIPTION,
    alternates: { canonical: `${base}/shop${cat ? `?cat=${cat}` : ""}` },
    openGraph: {
      title: catSeo?.title ?? catLabel,
      description: catSeo?.description ?? SITE_DEFAULT_DESCRIPTION,
    },
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { cat, marca } = await searchParams;
  const products = getTiendaProductos();
  const base = siteUrl().origin;
  const catLabel = cat ? (CATEGORIAS.find(c => c.slug === cat)?.label ?? cat) : "Tienda";
  const pageTitle = marca ? marca.toUpperCase() : (CAT_SEO[cat ?? ""]?.title ?? "Nuestra Colección de Perfumes");

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: catLabel, item: `${base}/shop${cat ? `?cat=${cat}` : ""}` },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />

      <main>
        {/* Hero banner */}
        <div
          className="cs_breadcamp_wrap cs_bg_filed cs_center"
          style={{ backgroundImage: "url('/assets/images/banner5.png')" }}
        >
          <div className="container">
            <div className="cs_breadcamp_in text-center">
              <h1 className="cs_breadcamp_title cs_fs_54 cs_semibold">
                {pageTitle}
              </h1>
              <ol className="breadcrumb cs_fs_18 mb-0 justify-content-center">
                <li className="breadcrumb-item"><a href="/">Inicio</a></li>
                <li className="breadcrumb-item active">{catLabel}</li>
              </ol>
            </div>
          </div>
        </div>

        <section>
          <div className="cs_height_80 cs_height_lg_50"></div>
          <div className="container">
            <Suspense fallback={
              <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
                Cargando productos...
              </div>
            }>
              <ShopCatalog products={products} />
            </Suspense>
          </div>
          <div className="cs_height_100 cs_height_lg_60"></div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
