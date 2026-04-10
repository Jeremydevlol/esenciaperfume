const FEATURES = [
  {
    icon: "/assets/images/icons/feature_icon_1.svg",
    title: "Envío Rápido",
    desc: "Entrega en 24-48h en toda la Península",
  },
  {
    icon: "/assets/images/icons/feature_icon_2.svg",
    title: "100% Originales",
    desc: "Todos nuestros perfumes son auténticos",
  },
  {
    icon: "/assets/images/icons/feature_icon_3.svg",
    title: "Pago Seguro",
    desc: "Transacciones protegidas con SSL",
  },
  {
    icon: "/assets/images/icons/feature_icon_4.svg",
    title: "Devolución Fácil",
    desc: "14 días para devolver sin complicaciones",
  },
  {
    icon: "/assets/images/icons/feature_icon_5.svg",
    title: "Atención al Cliente",
    desc: "Estamos aquí para ayudarte siempre",
  },
];

export function FeatureStrip() {
  return (
    <section>
      <div className="cs_height_100 cs_height_lg_60"></div>
      <div className="container">
        <div className="cs_feature_wrap">
          {FEATURES.map((f) => (
            <div className="cs_feature cs_style_1" key={f.title}>
              <div className="cs_feature_icon cs_center cs_accent_light_bg">
                <img src={f.icon} alt={f.title} />
              </div>
              <div className="cs_feature_right">
                <h3 className="cs_feature_title cs_fs_18 cs_medium mb-0">{f.title}</h3>
                <p className="cs_feature_subtitle cs_fs_14 cs_light mb-0">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="cs_height_100 cs_height_lg_60"></div>
    </section>
  );
}
