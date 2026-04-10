"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Cuánto tarda en llegar mi pedido?",
    a: "Los pedidos realizados antes de las 14:00h se envían el mismo día. El plazo de entrega habitual es de 24 a 48 horas laborables para la Península. Las Islas y zonas especiales pueden tener plazos diferentes.",
  },
  {
    q: "¿Los perfumes son 100% originales?",
    a: "Sí, todos nuestros perfumes son 100% originales y provienen directamente de distribuidores oficiales y marcas reconocidas. Nunca vendemos imitaciones ni productos falsificados.",
  },
  {
    q: "¿Cuáles son los métodos de pago aceptados?",
    a: "Aceptamos tarjetas Visa, Mastercard y American Express, PayPal, transferencia bancaria y pago contra reembolso. Todas las transacciones están cifradas y son completamente seguras.",
  },
  {
    q: "¿Puedo devolver un producto?",
    a: "Aceptamos devoluciones en un plazo de 14 días desde la recepción del pedido, siempre que el producto esté sin abrir y en su embalaje original. Contáctanos y te guiaremos en el proceso.",
  },
  {
    q: "¿Realizáis envíos internacionales?",
    a: "Sí, enviamos a toda Europa y a muchos otros países. Los gastos de envío y plazos de entrega varían según el destino. Consulta las tarifas en el proceso de compra.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section className="cs_accent_light_bg cs_sibling_newsletter">
      <div className="cs_height_150 cs_height_lg_80"></div>
      <div className="container">
        <div className="row">
          <div className="col-lg-5">
            <div className="cs_section_heading cs_style_1">
              <div className="cs_section_heading_in">
                <h3 className="cs_section_heading_title cs_fs_54 cs_semibold mb-0">
                  ¿Tienes dudas?<br />
                  Aquí están<br />
                  las respuestas.
                </h3>
              </div>
            </div>
            <div className="cs_height_60 cs_height_lg_50"></div>
          </div>
          <div className="col-lg-7">
            <div className="cs_accordians cs_style_1 cs_light">
              {FAQS.map((faq, i) => (
                <div
                  className={`cs_accordian${open === i ? " active" : ""}`}
                  key={i}
                >
                  <div
                    className="cs_accordian_head"
                    onClick={() => setOpen(open === i ? -1 : i)}
                    style={{ cursor: "pointer" }}
                  >
                    <h3 className="cs_accordian_title cs_primary_color cs_fs_24 fw-medium mb-0">
                      {faq.q}
                    </h3>
                    <span className="cs_accordian_toggle"></span>
                  </div>
                  {open === i && (
                    <div className="cs_accordian_body">
                      <p className="cs_secondary_color fw-light mb-0">{faq.a}</p>
                    </div>
                  )}
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
