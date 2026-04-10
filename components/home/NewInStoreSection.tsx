import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { TiendaProducto } from "@/lib/tienda-types";

type Props = { products: TiendaProducto[] };

export function NewInStoreSection({ products }: Props) {
  // Left column: 3 small cards; right column: 1 large + 2 small
  const left = products.slice(0, 3);
  const right = products.slice(3, 6);

  return (
    <section>
      <div className="cs_height_140 cs_height_lg_70"></div>
      <div className="container">
        <div className="cs_section_heading cs_style_1">
          <div className="cs_section_heading_in">
            <h3 className="cs_section_heading_title cs_fs_54 cs_semibold mb-0">
              NOVEDADES EN TIENDA
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
          {/* Left: 3 small cards */}
          <div className="col-xxl-7">
            <div className="row cs_row_gap_10 cs_new_item_list">
              {left.map((p) => (
                <div className="col-lg-4 col-sm-6" key={p.sku}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
          {/* Right: 3 cards stacked */}
          <div className="col-xxl-5">
            <div className="row cs_row_gap_10">
              {right.map((p) => (
                <div className="col-lg-6 col-sm-6" key={p.sku}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="cs_height_150 cs_height_lg_80"></div>
    </section>
  );
}
