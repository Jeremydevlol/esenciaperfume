"use client";

const FALLBACK = "/assets/images/product_1.png";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export function ProductDetailImage({ src, alt, className }: Props) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="eager"
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src.endsWith("product_1.png")) return;
        el.src = FALLBACK;
      }}
    />
  );
}
