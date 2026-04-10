import Link from "next/link";

const POSTS = [
  {
    category: "PERFUMES MUJER",
    img: "/assets/images/blog/post_1.jpeg",
    title: "Los 10 perfumes femeninos más vendidos de la temporada",
    date: "5 de enero, 2026",
  },
  {
    category: "GUÍA DE COMPRA",
    img: "/assets/images/blog/post_2.jpeg",
    title: "Cómo elegir el perfume perfecto según tu personalidad",
    date: "20 de febrero, 2026",
  },
  {
    category: "TENDENCIAS",
    img: "/assets/images/blog/post_3.jpeg",
    title: "Los perfumes de nicho que arrasan en 2026",
    date: "15 de marzo, 2026",
  },
];

export function BlogSection() {
  return (
    <section>
      <div className="container">
        <div className="cs_section_heading cs_style_1 justify-content-center">
          <div className="cs_section_heading_in">
            <h3 className="cs_section_heading_title cs_fs_54 cs_semibold mb-0">
              CONSEJOS Y TENDENCIAS EN PERFUMERÍA
            </h3>
          </div>
        </div>
        <div className="cs_height_60 cs_height_lg_50"></div>
        <div className="row cs_gap_y_30">
          {POSTS.map((post) => (
            <div className="col-lg-4" key={post.title}>
              <div className="cs_post cs_style_1">
                <div className="cs_post_category text-uppercase cs_accent_color cs_light text-center cs_accent_light_bg">
                  {post.category}
                </div>
                <div className="cs_post_thumb_wrap">
                  <Link
                    href="/blog"
                    className="cs_post_thumb cs_bg_filed"
                    style={{ backgroundImage: `url('${post.img}')` }}
                  />
                </div>
                <div className="cs_post_info">
                  <h2 className="cs_post_title cs_fs_24 cs_medium cs_secondary_font">
                    <Link href="/blog">{post.title}</Link>
                  </h2>
                  <div className="cs_post_meta cs_light">
                    <span>
                      <i className="fa-solid fa-clock"></i> {post.date}
                    </span>
                    <span>
                      <i className="fa-solid fa-circle-user"></i> Esencia Perfume
                    </span>
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
