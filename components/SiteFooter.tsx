import Link from "next/link";

export function SiteFooter() {
  return (
    <>
<footer className="cs_footer cs_style_1 cs_primary_color cs_light cs_white_bg">
        <div className="cs_height_150 cs_height_lg_80"></div>
        <div className="container">
          <div className="text-center">
            <img
              src="/assets/images/logo-main.png"
              alt="Esencia Perfumes"
              style={{ height: 140, width: "auto", objectFit: "contain", display: "inline-block" }}
            />
          </div>

          <div className="cs_footer_row">
            {/* Contacto */}
            <div className="cs_footer_col">
              <div className="cs_footer_widget">
                <h2 className="cs_widget_title cs_secondary_font cs_semibold cs_fs_16 text-uppercase">
                  INFORMACIÓN DE CONTACTO
                </h2>
                <ul className="cs_contact_widget cs_mp_0">
                  <li>
                    <i>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M17.2324 13.9201C16.0242 12.8867 14.798 12.2608 13.6047 13.2926L12.8921 13.9162C12.3707 14.3689 11.4014 16.484 7.65346 12.1726C3.90634 7.86665 6.1362 7.19621 6.65834 6.74743L7.37483 6.12304C8.56195 5.08889 8.11395 3.78704 7.25776 2.44694L6.74107 1.63524C5.88098 0.29826 4.94439-0.579789 3.75415 0.452797L3.11102 1.01475C2.58498 1.39797 1.11454 2.64363 0.757853 5.01007C0.328585 7.84948 1.68273 11.101 4.78517 14.6686C7.88371 18.2378 10.9175 20.0306 13.7912 19.9993C16.1795 19.9736 17.6219 18.692 18.073 18.2261L18.7184 17.6633C19.9056 16.6315 19.168 15.581 17.959 14.5453L17.2324 13.9201Z" fill="currentColor"/>
                      </svg>
                    </i>
                    <span className="cs_light">esenciaperfume.com</span>
                  </li>
                  <li>
                    <i>
                      <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M1.29341 13.0642C1.54501 13.1854 1.82301 13.2502 2.10761 13.2502H15.875C16.0806 13.2502 16.2828 13.2164 16.4742 13.1518L11.0422 7.47281C10.7594 7.74421 10.5068 7.98641 10.296 8.18781C9.57121 8.88121 8.42881 8.88121 7.70401 8.18781C7.45421 7.94901 7.14441 7.65181 6.79501 7.31641L1.29341 13.0642Z" fill="currentColor"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M17.3198 1.42969C16.5204 2.20029 13.9042 4.72209 11.9436 6.60649L17.461 12.3747C17.6484 12.0777 17.75 11.7315 17.75 11.3747V2.62469C17.75 2.18669 17.5968 1.76449 17.3198 1.42969Z" fill="currentColor"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M0.671405 1.41992C0.389005 1.75632 0.232605 2.18272 0.232605 2.62532V11.3753C0.232605 11.6551 0.295205 11.9285 0.412605 12.1767L5.8936 6.45032C3.9758 4.60612 1.506 2.22492 0.671405 1.41992Z" fill="currentColor"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M1.8044 0.7748L8.568 7.2844C8.8096 7.5156 9.1904 7.5156 9.432 7.2844C10.9856 5.7982 14.8192 2.1044 16.1956 0.7776C16.0904 0.7594 15.9832 0.75 15.875 0.75H2.1076C2.0054 0.75 1.904 0.7584 1.8044 0.7748Z" fill="currentColor"/>
                      </svg>
                    </i>
                    <span className="cs_light">info@esenciaperfume.com</span>
                  </li>
                  <li>
                    <i>
                      <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                        <path d="M6.99999 0C3.32405 0 0.333313 2.99074 0.333313 6.66668C0.333313 7.7702 0.609211 8.86434 1.1337 9.8348L6.63542 19.7852C6.70866 19.9178 6.84823 20 6.99999 20C7.15175 20 7.29132 19.9178 7.36456 19.7852L12.8683 9.83152C13.3908 8.86434 13.6667 7.77016 13.6667 6.66664C13.6667 2.99074 10.6759 0 6.99999 0ZM6.99999 10C5.16202 10 3.66667 8.50465 3.66667 6.66668C3.66667 4.82871 5.16202 3.33336 6.99999 3.33336C8.83796 3.33336 10.3333 4.82871 10.3333 6.66668C10.3333 8.50465 8.83796 10 6.99999 10Z" fill="currentColor"/>
                      </svg>
                    </i>
                    España · Tienda Online
                  </li>
                </ul>
              </div>
            </div>

            {/* Mi cuenta */}
            <div className="cs_footer_col">
              <div className="cs_footer_widget">
                <h2 className="cs_widget_title cs_secondary_font cs_semibold cs_fs_16 text-uppercase">
                  MI CUENTA
                </h2>
                <ul className="cs_menu_widget cs_mp_0">
                  <li><Link href="/login">Iniciar sesión</Link></li>
                  <li><Link href="/signup">Crear cuenta</Link></li>
                  <li><Link href="/wishlist">Lista de deseos</Link></li>
                  <li><Link href="#">Rastrear pedido</Link></li>
                  <li><Link href="/contact">Ayuda</Link></li>
                </ul>
              </div>
            </div>

            {/* Información */}
            <div className="cs_footer_col">
              <div className="cs_footer_widget">
                <h2 className="cs_widget_title cs_secondary_font cs_semibold cs_fs_16 text-uppercase">
                  INFORMACIÓN
                </h2>
                <ul className="cs_menu_widget cs_mp_0">
                  <li><Link href="#">Información de envío</Link></li>
                  <li><Link href="/blog">Blog de perfumería</Link></li>
                  <li><Link href="/faq">Preguntas frecuentes</Link></li>
                  <li><Link href="/contact">Contáctanos</Link></li>
                  <li><Link href="/about">Sobre nosotros</Link></li>
                </ul>
              </div>
            </div>

            {/* Atención al cliente */}
            <div className="cs_footer_col">
              <div className="cs_footer_widget">
                <h2 className="cs_widget_title cs_secondary_font cs_semibold cs_fs_16 text-uppercase">
                  ATENCIÓN AL CLIENTE
                </h2>
                <ul className="cs_menu_widget cs_mp_0">
                  <li><Link href="#">Envíos y devoluciones</Link></li>
                  <li><Link href="#">Compra segura</Link></li>
                  <li><Link href="#">Envío internacional</Link></li>
                  <li><Link href="#">Programa de afiliados</Link></li>
                  <li><Link href="/contact">Contacto</Link></li>
                </ul>
              </div>
            </div>

            {/* Pagos y envíos */}
            <div className="cs_footer_col">
              <div className="cs_footer_widget">
                <h2 className="cs_widget_title cs_secondary_font cs_semibold cs_fs_16 text-uppercase">
                  PAGOS Y ENVÍOS
                </h2>
                <ul className="cs_menu_widget cs_mp_0">
                  <li><Link href="#">Términos y condiciones</Link></li>
                  <li><Link href="#">Métodos de pago</Link></li>
                  <li><Link href="#">Guía de envíos</Link></li>
                  <li><Link href="#">Zonas de envío</Link></li>
                  <li><Link href="#">Tiempos de entrega</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="cs_bottom_footer d-flex justify-content-center cs_fs_14">
            <ul className="cs_footer_links cs_mp_0">
              <li><Link href="#">Política de privacidad</Link></li>
              <li><Link href="#">Términos y condiciones</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}
