"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const SECTIONS = [
  {
    heading: "Envíos y Entregas",
    faqs: [
      {
        q: "¿A qué zonas realizáis envíos?",
        a: "Servimos pedidos a España Peninsular y Portugal Continental. No realizamos envíos a las islas Canarias, Açores ni Madeira debido al alto precio de los gastos de envío. Gracias por vuestra comprensión.",
      },
      {
        q: "¿Cuánto tarda en llegar el pedido?",
        a: "El pedido tarda entre 24 y 48 horas (España Peninsular), siempre que se realice antes de las 16:00 h. Solo se computan días laborales — no se reparte en fines de semana ni festivos. Si realizas el pedido el viernes pasadas las 16:00 h, no saldrá de nuestros almacenes hasta el lunes por la mañana. Trabajamos con MRW, una de las empresas de reparto urgente a domicilio más prestigiosas. Si tienes cualquier incidencia con la entrega, contacta con MRW en el número 91 829 66 89 (imprescindible tener a mano el número de pedido).",
      },
      {
        q: "¿Cuándo son gratuitos los gastos de envío y cuánto cuestan?",
        a: "Si tu compra es de 100 € o más, los gastos de envío son completamente gratuitos. Para cantidades menores, los gastos de envío son de 5,99 €.",
      },
    ],
  },
  {
    heading: "Productos",
    faqs: [
      {
        q: "¿Los perfumes son 100% originales?",
        a: "Sí, todos nuestros productos son 100% originales y auténticos. Trabajamos directamente con distribuidores oficiales y marcas reconocidas. Nunca vendemos imitaciones ni falsificaciones. Ten en cuenta que las fotografías de todos los productos son ilustrativas y Esencia Perfumes no se hace responsable de que el producto sea exactamente igual si el fabricante cambia el formato.",
      },
      {
        q: "¿Qué diferencia hay entre los productos «REGULAR» y los productos «@»?",
        a: "Los productos con @ en el nombre se envían en caja blanca o caja genérica (blanca o marrón) en vez de su embalaje original. Son exactamente iguales que los productos regulares en cuanto a contenido, pero presentan pequeños desperfectos en el envoltorio exterior de la caja. En ocasiones, en marcas como Nike o en fragancias infantiles, pueden ir incluso sin ningún tipo de caja. En raras ocasiones puede faltarles el tapón. Evidentemente el precio es mucho más reducido que el regular; por lo demás, todo es igual. Las fotografías que ilustran los productos @ son ilustrativas para poder identificar el producto y no corresponden al envoltorio genérico, sino al del producto regular.",
      },
      {
        q: "¿Tenéis productos que no aparecen en la web?",
        a: "Sí, existen productos que no están incluidos en nuestra página, algunos incluso ya descatalogados. Sin embargo, Esencia Perfumes hace todo lo posible por ponerlos a tu alcance a través de nuestra extensa red de proveedores. Puedes realizar la consulta — estaremos encantados de atenderte.",
      },
    ],
  },
  {
    heading: "Métodos de Pago",
    faqs: [
      {
        q: "¿Qué formas de pago puedo utilizar?",
        a: "Puedes pagar de dos formas: (1) Mediante PayPal o tarjeta de crédito — una vez finalizado el pedido puedes tramitar la compra a través de la pasarela de pagos segura, con tu cuenta de PayPal o directamente con tu tarjeta de crédito si no tienes cuenta en PayPal. (2) Mediante contra reembolso — pagas en efectivo al recibir el pedido en tu domicilio.",
      },
      {
        q: "¿Cómo funciona el pago contra reembolso?",
        a: "Con el contra reembolso puedes comprar sin ningún riesgo, ya que no pagas nada hasta que no recibes el pedido. Si eliges esta modalidad, ten el importe exacto preparado cuando llegue el repartidor, ya que no suelen llevar cambio.",
      },
      {
        q: "¿Tiene algún recargo el contra reembolso?",
        a: "El contra reembolso no tiene ningún tipo de recargo. Ten en cuenta que realizar un pedido contra reembolso te compromete a recogerlo. Si realizas dos pedidos contra reembolso el mismo día para la misma dirección, el sistema solo enviará el último que realices; el otro se cancelará automáticamente.",
      },
      {
        q: "¿Qué pasa si no recojo un pedido contra reembolso?",
        a: "Al comprar en Esencia Perfumes te comprometes a aceptar los pedidos realizados. No recoger un pedido contra reembolso es un incumplimiento contractual con consecuencias legales. Por favor, solo escoge esta modalidad si estás seguro de que lo vas a recoger.",
      },
    ],
  },
  {
    heading: "Cambios y Devoluciones",
    faqs: [
      {
        q: "¿Puedo cancelar o modificar mi pedido?",
        a: "Una vez que pulsas el botón finalizar en la web, no es posible modificar ni anular tu pedido, ya que todos los pedidos se preparan a los pocos minutos de ser realizados y son paletizados. Si necesitas comunicarte con nosotros, puedes hacerlo desde el apartado «Mis pedidos» o por correo electrónico, indicando siempre tu número de pedido.",
      },
      {
        q: "¿Cuánto tiempo tengo para hacer cambios o reclamaciones?",
        a: "Una vez recibida la mercancía, si no quedas satisfecho o has recibido algo erróneamente, puedes ponerte en contacto con nosotros en los tres días hábiles posteriores a la recepción. Siempre que los productos no hayan sido abiertos ni desprecintados, se llevará a cabo la devolución del importe o el cambio lo antes posible.",
      },
      {
        q: "¿Quién corre con el coste de la devolución?",
        a: "El coste del transporte de la devolución corre a cargo del cliente, salvo que se trate de un error de envío por nuestra parte (en cuyo caso el porte es gratuito). La devolución tiene un coste de 5,99 € de porte + 3 € de gastos de gestión y almacén. Si quieres cambiar un producto por otro diferente, tendrás un gasto de dos portes (ida y vuelta) + 3 € de gastos de gestión y almacén.",
      },
      {
        q: "¿Cómo se realiza el reembolso?",
        a: "Para pedidos pagados con tarjeta de crédito o PayPal, el importe se abonará en la misma tarjeta o cuenta de PayPal con la que se realizó el pago, una vez recibido y comprobado el producto. Para pedidos pagados contra reembolso, se necesita una cuenta de PayPal para hacer el ingreso; de lo contrario, el importe quedará como saldo a favor para futuras compras, ya que no es posible enviar efectivo a través de transporte.",
      },
    ],
  },
  {
    heading: "Contacto",
    faqs: [
      {
        q: "¿Puedo hacer consultas o gestionar mi pedido por teléfono?",
        a: "Sí, puedes contactar con nosotros en cualquier momento. Si no logras comunicarte a la primera, puede ser que nuestras líneas estén ocupadas — vuelve a intentarlo o envíanos un correo con tu número de teléfono y nos pondremos en contacto contigo lo antes posible.",
      },
    ],
  },
];

function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  function toggle(i: number) {
    setOpen((prev) => (prev === i ? null : i));
  }

  return (
    <div className="faq-accordion">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`faq-accordion__item${isOpen ? " faq-accordion__item--open" : ""}`}>
            <button
              type="button"
              className="faq-accordion__q"
              onClick={() => toggle(i)}
              onTouchEnd={(e) => { e.preventDefault(); toggle(i); }}
              aria-expanded={isOpen}
            >
              <span>{item.q}</span>
              <svg
                className={`faq-accordion__arrow${isOpen ? " faq-accordion__arrow--open" : ""}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isOpen && (
              <div className="faq-accordion__a">
                <p>{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
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
                <li className="breadcrumb-item"><Link href="/">Inicio</Link></li>
                <li className="breadcrumb-item active">FAQ</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Intro banner */}
        <div className="faq-intro">
          <div className="container">
            <p className="faq-intro__text">
              Si tienes alguna duda, lee nuestras preguntas frecuentes. Puedes contactar con nosotros desde nuestra{" "}
              <Link href="/contact" className="faq-intro__link">página de contacto</Link>{" "}
              o consultar la sección que necesites.
            </p>
            <div className="faq-intro__notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>
                <strong>Importante:</strong> Servimos pedidos a España y Portugal. No realizamos envíos a Canarias, Açores ni Madeira debido al alto coste de los gastos de envío.
              </span>
            </div>
          </div>
        </div>

        {/* Secciones FAQ */}
        <section className="faq-section">
          <div className="container">
            {SECTIONS.map((section) => (
              <div key={section.heading} className="faq-section__block">
                <h2 className="faq-section__heading">{section.heading}</h2>
                <FaqAccordion faqs={section.faqs} />
              </div>
            ))}

            {/* CTA final */}
            <div className="faq-cta">
              <p className="faq-cta__text">¿No encontraste lo que buscabas?</p>
              <Link href="/contact" className="faq-cta__btn">Contactar con nosotros</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
