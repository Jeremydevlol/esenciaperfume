import type { Metadata } from "next";
import { Suspense } from "react";
import { getTiendaProductos } from "@/lib/tienda-products";
import { SITE_DEFAULT_DESCRIPTION } from "@/lib/site-seo";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShopCatalog } from "@/components/shop/ShopCatalog";

export const metadata: Metadata = {
  title: "Tienda de Perfumes | Esencia Perfumes",
  description: SITE_DEFAULT_DESCRIPTION,
};

export default function ShopPage() {
  const products = getTiendaProductos();

  return (
    <div>
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
                Nuestra Colección de Perfumes
              </h1>
              <ol className="breadcrumb cs_fs_18 mb-0 justify-content-center">
                <li className="breadcrumb-item"><a href="/">Inicio</a></li>
                <li className="breadcrumb-item active">Tienda</li>
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
