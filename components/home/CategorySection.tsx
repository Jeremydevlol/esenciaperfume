import Link from "next/link";

const CATEGORIES = [
  {
    img: "/assets/images/category_img_1.jpeg",
    title: "Perfumes\nMujer",
    desc: "Las fragancias femeninas más exclusivas de las mejores marcas.",
  },
  {
    img: "/assets/images/category_img_2.jpeg",
    title: "Perfumes\nHombre",
    desc: "Encuentra tu fragancia masculina perfecta entre cientos de referencias.",
  },
  {
    img: "/assets/images/category_img_3.jpeg",
    title: "Unisex &\nNovedades",
    desc: "Fragancias unisex y los últimos lanzamientos de la temporada.",
  },
];

export function CategorySection() {
  return (
    <section>
      <div className="cs_height_115 cs_height_lg_65"></div>
      <div className="container">
        <div className="row cs_gap_y_30">
          {CATEGORIES.map((cat) => (
            <div className="col-lg-4" key={cat.title}>
              <div
                className="cs_category cs_style_1 cs_bg_filed"
                style={{ backgroundImage: `url('${cat.img}')` }}
              >
                <div className="cs_category_info text-center">
                  <h2 className="cs_category_title cs_fs_54 cs_semibold">
                    {cat.title.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < cat.title.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </h2>
                  <p className="cs_category_subtitle cs_light mb-0">{cat.desc}</p>
                  <div className="cs_category_btn">
                    <Link href="/shop" className="cs_btn cs_style_1 cs_fs_18 cs_medium">
                      Comprar ahora
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="cs_height_150 cs_height_lg_80"></div>
    </section>
  );
}
