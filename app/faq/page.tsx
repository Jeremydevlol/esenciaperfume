"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const SECTIONS = [
  {
    heading: "Preguntas Generales",
    faqs: [
      { q: "¿Cómo puedo rastrear mi pedido?", a: "Una vez enviado tu pedido, recibirás un email con el número de seguimiento. Puedes usarlo para rastrear tu envío en tiempo real desde nuestra web." },
      { q: "¿Cuánto tarda en llegar el pedido a domicilio?", a: "El plazo de entrega habitual es de 24 a 48 horas laborables para la Península. Los pedidos realizados antes de las 14:00h se envían el mismo día." },
      { q: "¿Realizáis envíos internacionales?", a: "Sí, enviamos a toda Europa y muchos otros países. Los plazos y costes varían según el destino. Consúltalo en el proceso de compra o contáctanos." },
      { q: "¿Los perfumes son 100% originales?", a: "Sí, todos nuestros perfumes son 100% originales. Trabajamos directamente con distribuidores oficiales y marcas reconocidas. Nunca vendemos imitaciones." },
      { q: "¿Tenéis tienda física?", a: "Esencia Perfume es una tienda 100% online. Esto nos permite ofrecerte los mejores precios, con la comodidad de recibir tu pedido en casa." },
    ],
  },
  {
    heading: "Métodos de Pago",
    faqs: [
      { q: "¿Qué métodos de pago aceptáis?", a: "Aceptamos tarjetas Visa, Mastercard y American Express, PayPal, transferencia bancaria y pago contra reembolso. Todas las transacciones están cifradas con SSL." },
      { q: "¿Puedo pagar con PayPal?", a: "Sí, PayPal es uno de nuestros métodos de pago preferidos. Es rápido, seguro y no necesitas introducir los datos de tu tarjeta en nuestra web." },
      { q: "¿Cómo puedo rastrear mi pedido tras el pago?", a: "Tras confirmar el pago, recibirás un email de confirmación. Cuando sea enviado, recibirás otro email con el número de seguimiento." },
      { q: "¿Puedo pagar contra reembolso?", a: "Sí, ofrecemos pago contra reembolso para envíos en la Península Ibérica. Se aplica un pequeño recargo por este servicio." },
    ],
  },
  {
    heading: "Pedidos y Devoluciones",
    faqs: [
      { q: "¿Puedo cancelar o modificar mi pedido?", a: "Puedes cancelar o modificar tu pedido siempre que no haya sido procesado para el envío. Contáctanos lo antes posible." },
      { q: "¿Cómo realizo un pedido?", a: "Elige tu perfume, añádelo al carrito, selecciona tu método de pago y confirma el pedido. Es muy sencillo. En caso de dudas, no dudes en contactarnos." },
      { q: "¿Cómo puedo devolver un producto?", a: "Aceptamos devoluciones en 14 días desde la recepción del pedido, siempre que el producto esté sin abrir y en su embalaje original." },
      { q: "¿Necesito cuenta para comprar?", a: "Puedes comprar como invitado. Sin embargo, crear una cuenta te permite rastrear pedidos, guardar favoritos y acceder a descuentos exclusivos." },
    ],
  },
];

function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number>(0);
  return (
    <div className="cs_accordians cs_style_1 cs_light cs_type_1">
      {faqs.map((item, i) => (
        <div className={`cs_accordian${open === i ? " active" : ""}`} key={i}>
          <div
            className="cs_accordian_head"
            style={{ cursor: "pointer" }}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <h3 className="cs_accordian_title cs_primary_color cs_fs_24 fw-medium mb-0">
              {item.q}
            </h3>
            <span className="cs_accordian_toggle"></span>
          </div>
          {open === i && (
            <div className="cs_accordian_body">
              <p className="cs_secondary_color fw-light mb-0">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main>
        {/* Breadcrumb */}
        <div
          className="cs_breadcamp_wrap cs_bg_filed cs_center"
          style={{ backgroundImage: "url('/assets/images/breadcamp_bg_3.jpeg')" }}
        >
          <div className="container">
            <div className="cs_breadcamp_in text-center">
              <h1 className="cs_breadcamp_title cs_fs_54 cs_semibold">
                Preguntas Frecuentes
              </h1>
              <ol className="breadcrumb cs_fs_18 mb-0 justify-content-center">
                <li className="breadcrumb-item"><a href="/">Inicio</a></li>
                <li className="breadcrumb-item active">FAQ</li>
              </ol>
            </div>
          </div>
        </div>

        <section>
          <div className="cs_height_120 cs_height_lg_70"></div>
          <div className="container">
            {SECTIONS.map((section) => (
              <div key={section.heading}>
                <div className="row">
                  <div className="col-lg-5">
                    <div className="cs_section_heading cs_style_1">
                      <div className="cs_section_heading_in">
                        <h3 className="cs_section_heading_title cs_fs_54 cs_semibold mb-0">
                          {section.heading}
                        </h3>
                      </div>
                    </div>
                    <div className="cs_height_60 cs_height_lg_50"></div>
                  </div>
                  <div className="col-lg-7">
                    <hr />
                    <FaqAccordion faqs={section.faqs} />
                    <hr />
                  </div>
                </div>
                <div className="cs_height_120 cs_height_lg_70"></div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
