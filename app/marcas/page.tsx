import type { Metadata } from "next";
import Link from "next/link";
import { getMarcasNormalizadas } from "@/lib/tienda-products";
import { siteUrl, SITE_DEFAULT_DESCRIPTION } from "@/lib/site-seo";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarcasGrid } from "@/components/MarcasGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Todas las Marcas | Secreto Digital",
  description: `Explora todas las marcas de perfumería disponibles en Secreto Digital. ${SITE_DEFAULT_DESCRIPTION}`,
  alternates: { canonical: `${siteUrl().origin}/marcas` },
};

export default function MarcasPage() {
  const marcas = getMarcasNormalizadas();

  // Agrupar por primera letra
  const groups: Record<string, { marca: string; count: number }[]> = {};
  for (const item of marcas) {
    const letter = item.marca[0].toUpperCase();
    // Números y caracteres especiales → grupo "#"
    const key = /[A-ZÁÉÍÓÚÑÜ]/.test(letter) ? letter : "#";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  // Ordenar claves: # al final, luego A-Z
  const keys = Object.keys(groups).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b, "es");
  });

  const totalMarcas = marcas.length;

  return (
    <div>
      <SiteHeader />
      <main>
        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <div className="container">
            <ol className="pd-breadcrumb__list">
              <li><Link href="/">Inicio</Link></li>
              <li><svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1l4 4-4 4" stroke="#999" strokeWidth="1.4" strokeLinecap="round"/></svg></li>
              <li aria-current="page">Marcas</li>
            </ol>
          </div>
        </div>

        {/* Hero */}
        <div className="marcas-hero">
          <div className="container">
            <h1 className="marcas-hero__title">Todas las Marcas</h1>
            <p className="marcas-hero__sub">{totalMarcas} marcas disponibles</p>
          </div>
        </div>

        {/* Grid interactivo con búsqueda */}
        <section className="marcas-section">
          <div className="container">
            <MarcasGrid groups={groups} letters={keys} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
