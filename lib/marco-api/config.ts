/**
 * Configuración del sistema de Marco — perfumedigital.es
 *
 * Marco no tiene API REST. Su sistema es PHP y servimos datos
 * scrapeando las páginas HTML directamente.
 */

export const PERFUMEDIGITAL = {
  baseUrl: "https://perfumedigital.es",

  endpoints: {
    /** Catálogo general paginado — devuelve HTML con productos */
    catalog: "/exportadatos.php",
    /** Detalle de producto — ?op=descripcion&id=XXXXX */
    productDetail: "/exportadatos.php?op=descripcion&id=",
    /** Productos por marca — ?op=formulario&marca=XXXX */
    byBrand: "/exportadatos.php?op=formulario&marca=",
    /** Log de cambios de stock en tiempo real */
    stockLog: "/LOGTOTAL.php",
  },

  /** Intervalo de poll del log de stock (ms) — default 5 min */
  stockPollInterval: 5 * 60 * 1000,

  /** Intervalo de sincronización completa (ms) — default 6h */
  fullSyncInterval: 6 * 60 * 60 * 1000,
};
