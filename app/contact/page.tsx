import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Contáctanos",
};

export default function ContactPage() {
  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main>
        {/* Breadcrumb */}
        <div
          className="cs_breadcamp_wrap cs_bg_filed cs_center"
          style={{ backgroundImage: "url('/assets/images/breadcamp_bg_4.jpeg')" }}
        >
          <div className="container">
            <div className="cs_breadcamp_in text-center">
              <h1 className="cs_breadcamp_title cs_fs_54 cs_semibold">Contáctanos</h1>
              <ol className="breadcrumb cs_fs_18 mb-0 justify-content-center">
                <li className="breadcrumb-item"><a href="/">Inicio</a></li>
                <li className="breadcrumb-item active">Contacto</li>
              </ol>
            </div>
          </div>
        </div>

        <section>
          <div className="cs_height_120 cs_height_lg_70"></div>
          <div className="container">
            <div className="row cs_gap_y_40">
              {/* Formulario */}
              <div className="col-lg-6">
                <h2 className="cs_fs_36 cs_medium text-uppercase cs_secondary_font mb-4">
                  ESCRÍBENOS
                </h2>
                <form action="#" className="cs_contact_form">
                  <div className="row cs_gap_y_24">
                    <div className="col-sm-6">
                      <label className="cs_form_label cs_fs_14 cs_light">Tu nombre</label>
                      <input type="text" className="cs_form_field" placeholder="Nombre completo" />
                    </div>
                    <div className="col-sm-6">
                      <label className="cs_form_label cs_fs_14 cs_light">Tu email</label>
                      <input type="email" className="cs_form_field" placeholder="email@ejemplo.com" />
                    </div>
                    <div className="col-12">
                      <label className="cs_form_label cs_fs_14 cs_light">Asunto</label>
                      <input type="text" className="cs_form_field" placeholder="¿En qué podemos ayudarte?" />
                    </div>
                    <div className="col-12">
                      <label className="cs_form_label cs_fs_14 cs_light">Tu mensaje</label>
                      <textarea
                        className="cs_form_field"
                        rows={6}
                        placeholder="Escribe aquí tu mensaje..."
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="cs_btn cs_style_1 cs_medium">
                        <span>Enviar mensaje</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Info de contacto */}
              <div className="col-lg-5 offset-lg-1">
                <div
                  className="cs_contact_info_wrap cs_primary_bg cs_white_color cs_radius_16 p-5"
                >
                  <h2 className="cs_normal cs_fs_36 cs_secondary_font mb-4">
                    INFORMACIÓN DE CONTACTO
                  </h2>
                  <ul className="cs_contact_info_list cs_mp_0 cs_light">
                    <li className="d-flex align-items-start gap-3 mb-4">
                      <img src="/assets/images/icons/contact_icon_1.svg" alt="" style={{ marginTop: 4 }} />
                      <div>
                        <b className="d-block cs_fs_16">Tienda Online</b>
                        <span>www.esenciaperfume.com</span>
                      </div>
                    </li>
                    <li className="d-flex align-items-start gap-3 mb-4">
                      <img src="/assets/images/icons/contact_icon_2.svg" alt="" style={{ marginTop: 4 }} />
                      <div>
                        <b className="d-block cs_fs_16">Email</b>
                        <a href="mailto:info@esenciaperfume.com" className="cs_white_color">
                          info@esenciaperfume.com
                        </a>
                      </div>
                    </li>
                    <li className="d-flex align-items-start gap-3 mb-4">
                      <img src="/assets/images/icons/contact_icon_3.svg" alt="" style={{ marginTop: 4 }} />
                      <div>
                        <b className="d-block cs_fs_16">Horario de Atención</b>
                        <span>Lunes – Viernes: 9:00 – 18:00</span><br />
                        <span>Sábados: 10:00 – 14:00</span>
                      </div>
                    </li>
                  </ul>
                  <div className="cs_header_social mt-4">
                    <a href="#" className="cs_white_color" aria-label="Facebook">
                      <i className="fa-brands fa-facebook-f"></i>
                    </a>
                    <a href="#" className="cs_white_color" aria-label="Instagram">
                      <i className="fa-brands fa-instagram"></i>
                    </a>
                    <a href="#" className="cs_white_color" aria-label="Twitter">
                      <i className="fa-brands fa-x-twitter"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="cs_height_120 cs_height_lg_70"></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
