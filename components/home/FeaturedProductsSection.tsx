import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { TiendaProducto } from "@/lib/tienda-types";

type Props = { products: TiendaProducto[] };

export function FeaturedProductsSection({ products }: Props) {
  // Show up to 6 featured products in a responsive grid
  const featured = products.slice(0, 6);

  return (
    <section>
      <div className="cs_height_140 cs_height_lg_70"></div>
      <div className="container">
        <div className="cs_section_heading cs_style_1">
          <div className="cs_section_heading_in">
            <h3 className="cs_section_heading_title cs_fs_54 cs_semibold mb-0">
              PRODUCTOS DESTACADOS
            </h3>
          </div>
          <div className="cs_section_heading_right">
            <Link className="cs_text_btn cs_accent_color cs_medium cs_fs_24" href="/shop">
              <span>Ver todos</span>
            </Link>
          </div>
        </div>
        <div className="cs_height_60 cs_height_lg_50"></div>
        <div className="row cs_gap_y_40">
          {featured.map((p) => (
            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6" key={p.sku}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
      <div className="cs_height_140 cs_height_lg_75"></div>
    </section>
  );
}
