/**
 * Tipos y constantes compartidos — seguros para importar en Client Components
 * (sin imports de 'fs' ni Node.js)
 */

export interface TiendaProducto {
  sku:          string;
  nombre:       string;
  marca:        string;
  categoria:    string;
  tipo:         string;   // "Regular" | "Tester"
  ml:           string;
  precio:       number;
  pvp:          number | null;
  descuento:    number | null;
  imagen:       string;
  url_origen:   string;
  descripcion?: string;
  nicho?:       boolean;
}

export interface CategoriaInfo {
  slug:  string;
  label: string;
}

export const CATEGORIAS: CategoriaInfo[] = [
  { slug: "mujer",            label: "Perfumes Mujer" },
  { slug: "hombre",           label: "Perfumes Hombre" },
  { slug: "infantil",         label: "Perfumes Infantiles" },
  { slug: "outlet",           label: "Outlet Perfumería" },
  { slug: "descatalogados",   label: "Descatalogados y Rarezas" },
  { slug: "aftershave",       label: "After Shave & Body" },
  { slug: "maquillaje",       label: "Maquillaje" },
  { slug: "cosmetica-mujer",  label: "Cosmética Mujer" },
  { slug: "cosmetica-hombre", label: "Cosmética Hombre" },
  { slug: "cabello",          label: "Cuidado Cabello" },
  { slug: "rostro",           label: "Tratamiento Rostro" },
  { slug: "ojos",             label: "Contorno de Ojos" },
  { slug: "cuerpo",           label: "Tratamiento Cuerpo" },
  { slug: "solares",          label: "Solares" },
  { slug: "cuidado",          label: "Cuidado Personal" },
  { slug: "gafas",            label: "Gafas de Sol" },
];
