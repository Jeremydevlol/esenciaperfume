"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TOP_MARCAS from "@/data/top-marcas.json";
import { getBrandLogoUrl } from "@/data/brand-logos";

type NavLink = { label: string; href: string };
type NavCol  = { heading?: string; links: NavLink[] };
type NavItem = {
  label: string;
  href: string;
  accent?: boolean;   // resaltar (ej. Ofertas)
  cols?: NavCol[];    // columnas del mega-menu
  brands?: boolean;   // dropdown especial con marcas
};

const CATEGORIES: NavItem[] = [
  {
    label: "MARCAS",
    href: "/marcas",
    brands: true,
  },
  {
    label: "PERFUMES",
    href: "/shop?cat=mujer",
    cols: [
      {
        heading: "Por género",
        links: [
          { label: "Perfumes Mujer",    href: "/shop?cat=mujer" },
          { label: "Perfumes Hombre",   href: "/shop?cat=hombre" },
          { label: "Infantiles",        href: "/shop?cat=infantil" },
        ],
      },
      {
        heading: "Colecciones",
        links: [
          { label: "Nicho & Exclusivos",       href: "/shop?cat=nicho" },
          { label: "Descatalogados & Rarezas", href: "/shop?cat=descatalogados" },
          { label: "Outlet Perfumería",        href: "/shop?cat=outlet" },
        ],
      },
    ],
  },
  {
    label: "COSMETICA",
    href: "/shop?cat=cosmeticos",
    cols: [
      {
        heading: "Mujer",
        links: [
          { label: "Cosmética Mujer",    href: "/shop?cat=cosmetica-mujer" },
          { label: "Tratamiento Rostro", href: "/shop?cat=rostro" },
          { label: "Contorno de Ojos",   href: "/shop?cat=ojos" },
          { label: "Tratamiento Cuerpo", href: "/shop?cat=cuerpo" },
        ],
      },
      {
        heading: "Hombre",
        links: [
          { label: "Cosmética Hombre", href: "/shop?cat=cosmetica-hombre" },
          { label: "After Shave & Body", href: "/shop?cat=aftershave" },
        ],
      },
    ],
  },
  {
    label: "MAQUILLAJE",
    href: "/shop?cat=maquillaje",
  },
  {
    label: "CABELLO",
    href: "/shop?cat=cabello",
  },
  {
    label: "SOLARES",
    href: "/shop?cat=solares",
  },
  {
    label: "HIGIENE",
    href: "/shop?cat=cuidado",
  },
  {
    label: "MAN",
    href: "/shop?cat=hombre",
    cols: [
      {
        links: [
          { label: "Perfumes Hombre",    href: "/shop?cat=hombre" },
          { label: "Cosmética Hombre",   href: "/shop?cat=cosmetica-hombre" },
          { label: "After Shave & Body", href: "/shop?cat=aftershave" },
        ],
      },
    ],
  },
  {
    label: "OFERTAS",
    href: "/shop?sort=descuento",
    accent: true,
  },
];

const TOP_BRANDS = (TOP_MARCAS as { marca: string; count: number }[]).slice(0, 24);

/** Mini-logo para el dropdown de MARCAS en CatNav */
function BrandLogoChip({ marca }: { marca: string }) {
  const logoUrl = getBrandLogoUrl(marca);
  const [failed, setFailed] = useState(false);

  return (
    <Link
      href={`/shop?marca=${encodeURIComponent(marca)}`}
      className="cat-nav__brand-logo-chip"
      title={marca}
    >
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt={marca}
          className="cat-nav__brand-logo-img"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <span className="cat-nav__brand-logo-text">{marca}</span>
      )}
    </Link>
  );
}

export function CatNav() {
  const pathname = usePathname();

  return (
    <nav className="cat-nav" aria-label="Categorías">
      <div className="cat-nav__inner">
        {CATEGORIES.map((cat) => {
          const hasDropdown = !!(cat.cols || cat.brands);
          const isActive = pathname?.includes(cat.href.split("?")[0]) && cat.href !== "/";

          return (
            <div key={cat.label} className="cat-nav__item">
              <Link
                href={cat.href}
                className={[
                  "cat-nav__link",
                  isActive ? "cat-nav__link--active" : "",
                  cat.accent ? "cat-nav__link--accent" : "",
                  hasDropdown ? "cat-nav__link--has-sub" : "",
                ].filter(Boolean).join(" ")}
              >
                {cat.label}
                {hasDropdown && (
                  <svg className="cat-nav__chevron" width="9" height="6" viewBox="0 0 9 6" fill="none">
                    <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Link>

              {/* ── Dropdown de columnas ── */}
              {cat.cols && (
                <div className="cat-nav__dropdown cat-nav__dropdown--cols">
                  <div className="cat-nav__dropdown-inner">
                    {cat.cols.map((col, ci) => (
                      <div key={ci} className="cat-nav__col">
                        {col.heading && (
                          <p className="cat-nav__col-heading">{col.heading}</p>
                        )}
                        <ul>
                          {col.links.map((l) => (
                            <li key={l.href}>
                              <Link href={l.href} className="cat-nav__sub-link">
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Dropdown de marcas con logos ── */}
              {cat.brands && (
                <div className="cat-nav__dropdown cat-nav__dropdown--brands">
                  <div className="cat-nav__dropdown-inner">
                    <p className="cat-nav__col-heading">Marcas más buscadas</p>
                    <div className="cat-nav__brands-logo-grid">
                      {TOP_BRANDS.map(({ marca }) => (
                        <BrandLogoChip key={marca} marca={marca} />
                      ))}
                    </div>
                    <Link href="/marcas" className="cat-nav__brands-all">
                      Ver todas las marcas →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
