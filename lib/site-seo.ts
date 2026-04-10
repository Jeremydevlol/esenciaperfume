/** Marca y SEO global (sin datos de contacto en metadatos). */

export const SITE_BRAND = "secretodigital.com";
export const SITE_NAME = "Esenciaperfume";

/** ~50 caracteres: keyword + marca (tilde en «más»). */
export const SITE_DEFAULT_TITLE =
  "Perfumes más baratos | secretodigital.com";

export const SITE_DEFAULT_DESCRIPTION =
  "Perfumes y cosmética al mejor precio online. Primeras marcas, envíos rápidos y ofertas. Compra con confianza en secretodigital.com.";

/** Quita sufijos de plantilla (Glowify / tema). */
export function cleanTemplateTitle(raw: string): string {
  return raw
    .replace(/\s*[-|]\s*(Glowify|Esenciaperfume)(\.com)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Segmento de &lt;title&gt; para `metadata.title` (el layout añade ` | secretodigital.com`). */
export function seoTitleSegment(raw: string, maxLen = 48): string {
  const t = cleanTemplateTitle(raw);
  if (!t) return SITE_NAME;
  if (t.length <= maxLen) return t;
  return t.slice(0, Math.max(12, maxLen - 1)).trim() + "…";
}

export function siteUrl(): URL {
  return new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.secretodigital.com",
  );
}

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_BRAND,
    url: siteUrl().origin,
    description: SITE_DEFAULT_DESCRIPTION,
  };
}
