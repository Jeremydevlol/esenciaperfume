import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Sobre Nosotros",
};

const VALUES = [
  { title: "Calidad garantizada", desc: "Solo vendemos perfumes 100% originales de distribuidores oficiales." },
  { title: "Satisfacción del cliente", desc: "Tu experiencia de compra es nuestra prioridad número uno." },
  { title: "Confianza y seguridad", desc: "Transacciones seguras y política de devolución transparente." },
  { title: "Atención personalizada", desc: "Equipo de expertos disponible para ayudarte a encontrar tu fragancia." },
];

const MILESTONES = [
  { year: "2018", title: "Inicio", desc: "Fundamos Secreto Digital con la misión de ofrecer perfumes originales al mejor precio." },
  { year: "2020", title: "Expansión", desc: "Ampliamos nuestro catálogo a más de 5.000 referencias de las mejores marcas." },
  { year: "2022", title: "Lanzamiento digital", desc: "Nueva plataforma online con experiencia de compra mejorada y envíos más rápidos." },
  { year: "2024", title: "Miles de clientes", desc: "Más de 50.000 clientes satisfechos en toda España y Europa." },
  { year: "2025", title: "Envíos sostenibles", desc: "Comprometidos con el medio ambiente: packaging reciclado y envíos neutros en carbono." },
];

export default function AboutPage() {
  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main>
        {/* Breadcrumb */}
        <div
          className="cs_breadcamp_wrap cs_bg_filed cs_center"
          style={{ backgroundImage: "url('/assets/images/breadcamp_bg_2.jpeg')" }}
        >
          <div className="container">
            <div className="cs_breadcamp_in text-center">
              <h1 className="cs_breadcamp_title cs_fs_54 cs_semibold">Sobre Nosotros</h1>
              <ol className="breadcrumb cs_fs_18 mb-0 justify-content-center">
                <li className="breadcrumb-item"><a href="/">Inicio</a></li>
                <li className="breadcrumb-item active">Sobre Nosotros</li>
              </ol>
            </div>
          </div>
        </div>

        {/* About section */}
        <section>
          <div className="cs_height_120 cs_height_lg_70"></div>
          <div className="container">
            <div className="row cs_gap_y_40 align-items-center">
              <div className="col-lg-6">
                <img
                  src="/assets/images/about_img_1.jpeg"
                  alt="Sobre Secreto Digital"
                  className="w-100 cs_radius_16"
                />
              </div>
              <div className="col-lg-6">
                <h2 className="cs_secondary_font cs_fs_36 cs_medium mb-4">
                  SOBRE Esencia PERFUME
                </h2>
                <p className="cs_light cs_fs_18 mb-4">
                  Somos una tienda online especializada en perfumería y cosmética, con una
                  amplia selección de las mejores fragancias del mundo. Nuestro objetivo es
                  acercarte los perfumes más exclusivos al mejor precio, con la comodidad de
                  recibirlos en tu casa en 24-48 horas.
                </p>
                <p className="cs_light cs_fs_18 mb-4">
                  En Secreto Digital encontrarás más de 10.000 referencias de perfumes para
                  mujer, hombre y unisex, además de cosméticos y sets de regalo. Trabajamos
                  directamente con distribuidores oficiales para garantizar la autenticidad de
                  cada producto.
                </p>
                <Link href="/shop" className="cs_btn cs_style_1 cs_medium">
                  <span>Ver nuestro catálogo</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="cs_height_120 cs_height_lg_70"></div>
        </section>

        {/* Values */}
        <section className="cs_accent_light_bg">
          <div className="cs_height_100 cs_height_lg_60"></div>
          <div className="container">
            <h2 className="cs_fs_54 cs_semibold text-center mb-5">Nuestros Valores</h2>
            <div className="row cs_gap_y_30">
              {VALUES.map((v) => (
                <div className="col-lg-3 col-sm-6" key={v.title}>
                  <div className="cs_value_box text-center p-4 cs_white_bg cs_radius_16 h-100">
                    <h2 className="cs_value_box_title cs_secondary_font cs_fs_24 cs_medium cs_secondary_color mb-3">
                      {v.title}
                    </h2>
                    <p className="cs_light mb-0">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="cs_height_100 cs_height_lg_60"></div>
        </section>

        {/* Milestones */}
        <section>
          <div className="cs_height_100 cs_height_lg_60"></div>
          <div className="container">
            <h2 className="cs_fs_54 cs_semibold text-center mb-5">Nuestra Historia</h2>
            <div className="row cs_gap_y_30">
              {MILESTONES.map((m) => (
                <div className="col-lg col-md-4 col-sm-6" key={m.year}>
                  <div className="text-center">
                    <div
                      className="cs_accent_bg cs_white_color cs_radius_12 d-inline-flex align-items-center justify-content-center cs_fs_24 cs_semibold mb-3"
                      style={{ width: 70, height: 70 }}
                    >
                      {m.year}
                    </div>
                    <h3 className="cs_fs_24 cs_medium cs_secondary_color cs_secondary_font mb-2">
                      {m.title}
                    </h3>
                    <p className="cs_light cs_fs_15 mb-0">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="cs_height_100 cs_height_lg_60"></div>
        </section>

        {/* CTA */}
        <section
          className="cs_bg_filed cs_center text-center"
          style={{ backgroundImage: "url('/assets/images/cta_bg_2.jpeg')", minHeight: 320 }}
        >
          <div className="container py-5">
            <h2 className="cs_cta_title cs_white_color cs_fs_54 cs_semibold mb-4">
              Tu fragancia perfecta está aquí
            </h2>
            <Link href="/shop" className="cs_btn cs_style_1 cs_medium cs_fs_18">
              Ver todos los perfumes
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
