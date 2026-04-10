#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Scraper de productos - perfumedigital.es / secretodigital.com
=============================================================
Extrae de cada producto:
  - nombre, marca, categoria, precio_original, precio_actual
  - descripcion (completa con --detalle)
  - imagen_url, url_detalle

Genera: productos_completos.csv

IMPORTANTE (paginación y filas):
  El listado avanza con PASE en saltos de **15** (no uses ~29 como incremento).
  Cada página HTML muestra ~29 ids distintos con solapamiento (~15 repetidos);
  el CSV **deduplica por id** para no generar ~9k filas con el mismo catálogo.
  Los productos se extraen por enlaces `op=descripcion` + tabla con
  `productSpecialPrice` (grid) u oferta destacada de 2 columnas; las miniaturas
  de “más vendidos” usan imagen de la misma fila si el enlace no lleva `<img>`.

Requisitos:
    pip install requests beautifulsoup4

Uso:
    python scraper_productos_perfumedigital.py              # Todas las páginas
    python scraper_productos_perfumedigital.py --paginas 3  # Solo 3 páginas (prueba)
    python scraper_productos_perfumedigital.py --detalle    # Ficha por producto (lento)
    python scraper_productos_perfumedigital.py --paso 15    # Override del salto PASE (por defecto 15)
"""

from __future__ import annotations

import argparse
import csv
import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# ── Configuración ──────────────────────────────────────────────────────────────
BASE_URL = "https://perfumedigital.es/index.php"
SALIDA_CSV = "productos_completos.csv"
DELAY_LISTA = 1.0
DELAY_DETALLE = 0.8
MAX_REINTENTOS = 3
TOTAL_PAGINAS = 339
# Verificado: index.php?PASE=0 → página 1, PASE=15 → página 2 (productos distintos).
PRODUCTOS_POR_PAGINA = 15

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Referer": "https://perfumedigital.es/index.php",
}

session = requests.Session()
session.headers.update(HEADERS)


def get_html(url, params=None, data=None, method="GET"):
    for intento in range(1, MAX_REINTENTOS + 1):
        try:
            if method == "POST":
                r = session.post(url, data=data, timeout=20)
            else:
                r = session.get(url, params=params, timeout=20)
            r.raise_for_status()
            r.encoding = r.apparent_encoding or "utf-8"
            return r.text
        except requests.RequestException as e:
            print(f"  ⚠ Error (intento {intento}/{MAX_REINTENTOS}): {e}")
            if intento < MAX_REINTENTOS:
                time.sleep(3 * intento)
    return None


def limpiar(texto):
    if not texto:
        return ""
    return re.sub(r"\s+", " ", texto).strip()


def extraer_precio(texto):
    precios = re.findall(r"(\d+[.,]\d{2})\s*€?", texto)
    if len(precios) >= 2:
        return precios[0].replace(",", "."), precios[1].replace(",", ".")
    if len(precios) == 1:
        return "", precios[0].replace(",", ".")
    return "", ""


def _total_paginas_desde_html(html: str, soup: BeautifulSoup) -> int | None:
    """El sitio usa 'Página <b>1</b> de 339'; el texto plano ya normaliza a 'Página 1 de 339'."""
    page_nums = re.findall(r"Página\s+[\d.]+\s+de\s+(\d+)", soup.get_text())
    if page_nums:
        return max(int(x) for x in page_nums)
    m = re.search(r"Página\s*<b>\s*\d+\s*</b>\s*de\s*(\d+)", html, re.I)
    if m:
        return int(m.group(1))
    return None


def _smallest_table_with_special_price(a):
    """Sub-tabla de un producto del grid (imagen + Marca + productSpecialPrice)."""
    tab = a.find_parent("table")
    while tab:
        if tab.find("span", class_=re.compile(r"productSpecialPrice")):
            return tab
        tab = tab.find_parent("table")
    return None


def _precios_marca_desde_tabla_producto(tab) -> tuple[str, str, str, str]:
    sp = tab.find("span", class_=re.compile(r"productSpecialPrice"))
    txt = sp.get_text(" ", strip=True) if sp else ""
    po, pa = extraer_precio(txt)
    marca = ""
    for em in tab.find_all("i"):
        prev = em.find_previous(string=re.compile(r"Marca", re.I))
        if prev:
            marca = limpiar(em.get_text())
            break
    if not marca:
        em0 = tab.find("i")
        if em0:
            marca = limpiar(em0.get_text())
    return po, pa, marca, txt


def _precios_desde_oferta_destacada(a) -> tuple[str, str]:
    """Bloque 'oferta del día': fila con 2 <td> (foto + columna Precio:)."""
    el = a
    for _ in range(14):
        if el is None:
            break
        if getattr(el, "name", None) == "tr":
            tds = el.find_all("td", recursive=False)
            row_txt = el.get_text(" ", strip=True)
            if "Precio:" in row_txt and len(tds) >= 2 and len(row_txt) < 400:
                return extraer_precio(row_txt)
        el = el.parent
    return "", ""


def parsear_listado(html, pase):
    """
    Extrae productos desde enlaces op=descripcion (ids únicos por página).
    El listado mezcla: oferta destacada, grid con productSpecialPrice, y lista
    'más vendidos' con miniaturas; no usar solo <td>+img+<b> (falla nombres en alt
    de la imagen y mezcla con el menú).
    """
    soup = BeautifulSoup(html, "html.parser")
    productos = []

    total_pages = _total_paginas_desde_html(html, soup)

    # id -> lista de candidatos (enlace + metadatos) para elegir mejor imagen/nombre
    candidatos: dict[str, list] = {}

    for a in soup.find_all("a", href=True):
        if "op=descripcion" not in a["href"]:
            continue
        m = re.search(r"[?&]id=(\d+)", a["href"])
        if not m:
            continue
        pid = m.group(1)

        img = a.find("img", src=re.compile(r"catalog/", re.I))
        nombre_cand = ""
        width = -1
        if img:
            w = img.get("width") or "0"
            width = int(w) if str(w).isdigit() else -1
            nombre_cand = limpiar(img.get("alt") or img.get("title") or "")
        else:
            nombre_cand = limpiar(a.get_text())

        if not nombre_cand or re.fullmatch(r"\d+[.,]\d{2}\s*€?", nombre_cand):
            continue

        candidatos.setdefault(pid, []).append((a, img, width, nombre_cand))

    by_id: dict[str, dict] = {}

    def score(cand):
        _a, img, width, _n = cand
        if img and width >= 100:
            return (3, width)
        if img and width > 0:
            return (2, width)
        if img:
            return (1, 0)
        return (0, len(_n))

    for pid, cands in candidatos.items():
        if not cands:
            continue
        best = max(cands, key=score)
        a, img, width, nombre_cand = best

        nombre = re.sub(r"\s*@\s*$", "", nombre_cand).strip()
        img_url = ""
        if img:
            src = img.get("src", "")
            img_url = src if src.startswith("http") else urljoin("https://perfumedigital.es/", src)

        precio_orig = precio_actual = marca = ""
        if img and width >= 100:
            tab = _smallest_table_with_special_price(a)
            if tab:
                precio_orig, precio_actual, marca, _ = _precios_marca_desde_tabla_producto(tab)
            else:
                precio_orig, precio_actual = _precios_desde_oferta_destacada(a)

        by_id[pid] = {
            "id_producto": pid,
            "nombre": nombre,
            "marca": marca,
            "categoria": "",
            "precio_orig": precio_orig,
            "precio_actual": precio_actual,
            "desc_corta": (nombre or "")[:500],
            "descripcion": "",
            "imagen_url": img_url,
            "url_detalle": "",
        }

    # Imagen en fila (p. ej. miniatura en <td> vecino; el <a> solo lleva el texto)
    for pid, cur in by_id.items():
        if cur.get("imagen_url"):
            continue
        for a in soup.find_all("a", href=re.compile(rf"op=descripcion.*[?&]id={re.escape(pid)}")):
            tr = a.find_parent("tr")
            if not tr:
                continue
            row_img = tr.find("img", src=re.compile(r"catalog/", re.I))
            if row_img:
                src = row_img.get("src", "")
                cur["imagen_url"] = (
                    src if src.startswith("http") else urljoin("https://perfumedigital.es/", src)
                )
                break

    for pid, cur in by_id.items():
        if not cur.get("nombre"):
            continue
        productos.append(cur)

    def sort_key(p):
        try:
            return int(p["id_producto"] or 0)
        except ValueError:
            return 0

    productos.sort(key=sort_key)
    return productos, total_pages


def parsear_detalle(html, url_detalle):
    soup = BeautifulSoup(html, "html.parser")
    body_text = soup.get_text(" ", strip=False)

    nombre = ""
    for td in soup.find_all("td"):
        t = limpiar(td.get_text())
        if td.find("em") and 10 < len(t) < 200 and "\n" not in t[:50]:
            if not any(kw in t for kw in ["Perfumes para", "Maquillaje", "Solares", "Outlet"]):
                nombre = t
                break

    marca_m = re.search(r"Marca:\s*([^\n>]+?)(?:\s*>>>|\n)", body_text)
    cat_m = re.search(r"Categor[ií]a:\s*([^\n]+)", body_text)
    marca = limpiar(marca_m.group(1)) if marca_m else ""
    categoria = limpiar(cat_m.group(1)) if cat_m else ""

    precio_block_m = re.search(r"Precio:\s*([\d.,]+)\s*([\d.,]+)\s*€", body_text)
    if precio_block_m:
        precio_orig = precio_block_m.group(1).replace(",", ".")
        precio_actual = precio_block_m.group(2).replace(",", ".")
    else:
        iva_idx = body_text.find("IVA incluido")
        if iva_idx > -1:
            fragment = body_text[max(0, iva_idx - 80) : iva_idx]
            precios_found = re.findall(r"(\d+[.,]\d{2})", fragment)
            precio_orig = precios_found[0].replace(",", ".") if len(precios_found) >= 2 else ""
            precio_actual = precios_found[-1].replace(",", ".") if precios_found else ""
        else:
            precio_orig, precio_actual = "", ""

    desc = ""
    desc_start_m = re.search(
        r"(Fecha de creaci[oó]n|Historia:|Descripci[oó]n del perfume:)", body_text
    )
    iva_idx = body_text.find("IVA incluido")
    if desc_start_m and iva_idx > desc_start_m.start():
        desc = limpiar(body_text[desc_start_m.start() : iva_idx])
    elif desc_start_m:
        desc = limpiar(body_text[desc_start_m.start() : desc_start_m.start() + 2000])

    imagen_url = ""
    for img in soup.find_all("img", src=re.compile(r"catalog/", re.I)):
        src = img.get("src", "")
        imagen_url = src if src.startswith("http") else urljoin("https://perfumedigital.es/", src)
        break

    return {
        "nombre": nombre,
        "marca": marca,
        "categoria": categoria,
        "precio_orig": precio_orig,
        "precio_actual": precio_actual,
        "descripcion": desc,
        "imagen_url": imagen_url,
        "url_detalle": url_detalle,
    }


def ids_en_pagina(productos):
    return tuple(sorted(p.get("id_producto") or "" for p in productos))


def main():
    parser = argparse.ArgumentParser(description="Scraper completo perfumedigital.es")
    parser.add_argument("--paginas", type=int, default=0, help="Limitar a N páginas (0 = todas)")
    parser.add_argument("--detalle", action="store_true", help="Descargar ficha de cada producto")
    parser.add_argument(
        "--paso",
        type=int,
        default=PRODUCTOS_POR_PAGINA,
        help=f"Incremento PASE entre páginas (por defecto {PRODUCTOS_POR_PAGINA})",
    )
    args = parser.parse_args()
    paso = max(1, args.paso)

    print("=" * 60)
    print("  Scraper perfumedigital.es — Productos completos")
    print("=" * 60)
    print(f"  Modo: {'Detalle por producto' if args.detalle else 'Solo listado (rápido)'}")
    print(f"  Incremento PASE: {paso} (recomendado 15)")
    print(f"  Salida: {SALIDA_CSV}")
    print("=" * 60)

    print("\n📄 Cargando página 1...")
    html1 = get_html(BASE_URL, params={"PASE": 0})
    if not html1:
        print("❌ Error al conectar con la web.")
        return

    prods_p1, total_pages = parsear_listado(html1, 0)
    total_pages = total_pages or TOTAL_PAGINAS
    if args.paginas > 0:
        total_pages = min(args.paginas, total_pages)

    print(f"   Total páginas (según web): {total_pages}")
    print(f"   Productos detectados en HTML (página 1): {len(prods_p1)}")
    print(
        f"   → Usando PASE = (n-1)*{paso} (no usar {len(prods_p1)} como paso; ver docstring)."
    )

    campos = [
        "nombre",
        "marca",
        "categoria",
        "precio_orig",
        "precio_actual",
        "desc_corta",
        "descripcion",
        "imagen_url",
        "url_detalle",
    ]

    prev_ids = None
    all_products = []
    ids_globales: set[str] = set()
    duplicados_saltados = 0

    with open(SALIDA_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        writer.writeheader()

        for page_num in range(1, total_pages + 1):
            pase = (page_num - 1) * paso
            print(
                f"\r📄 Página {page_num}/{total_pages}  (PASE={pase})  "
                f"[acumulado: {len(all_products)} productos]",
                end="",
                flush=True,
            )

            if page_num == 1:
                productos = prods_p1
            else:
                html = get_html(
                    BASE_URL,
                    params={
                        "PASE": pase,
                        "marca": "",
                        "buscado": "",
                        "ID_CATEGORIA": "",
                        "ORDEN": "",
                        "precio1": "",
                        "precio2": "",
                    },
                )
                if not html:
                    print(f"\n  ⚠ Saltando página {page_num}")
                    continue
                productos, _ = parsear_listado(html, pase)

            cur_ids = ids_en_pagina(productos)
            if prev_ids is not None and cur_ids == prev_ids:
                print(
                    f"\n  ⚠ Página {page_num}: mismos id_producto que la anterior. "
                    f"Revisa --paso (¿debe ser 15?). Parando."
                )
                break
            prev_ids = cur_ids

            nuevos = []
            for prod in productos:
                pid = str(prod.get("id_producto") or "")
                if pid and pid in ids_globales:
                    duplicados_saltados += 1
                    continue
                if pid:
                    ids_globales.add(pid)
                nuevos.append(prod)
            productos = nuevos

            for prod in productos:
                if args.detalle and prod["id_producto"]:
                    id_p = prod["id_producto"]
                    if id_p.startswith("/"):
                        url_det = "https://perfumedigital.es" + id_p
                    else:
                        url_det = f"https://perfumedigital.es/index.php?op=descripcion&id={id_p}"

                    html_det = get_html(url_det)
                    if html_det:
                        det = parsear_detalle(html_det, url_det)
                        for k in [
                            "nombre",
                            "marca",
                            "categoria",
                            "precio_orig",
                            "precio_actual",
                            "descripcion",
                            "imagen_url",
                            "url_detalle",
                        ]:
                            if det.get(k):
                                prod[k] = det[k]
                    time.sleep(DELAY_DETALLE)
                else:
                    id_p = prod["id_producto"]
                    prod["url_detalle"] = (
                        f"https://perfumedigital.es/index.php?op=descripcion&id={id_p}"
                        if id_p and not str(id_p).startswith("/")
                        else ("https://perfumedigital.es" + id_p if id_p else "")
                    )

            writer.writerows(productos)
            f.flush()
            all_products.extend(productos)
            time.sleep(DELAY_LISTA)

    print(f"\n\n✅ Completado. Total filas escritas: {len(all_products)}")
    if duplicados_saltados:
        print(f"   (filas omitidas por id duplicado entre páginas: {duplicados_saltados})")
    print(f"💾 CSV: {SALIDA_CSV}")
    if not args.detalle:
        print("\n💡 Para descripción completa: --detalle")


if __name__ == "__main__":
    main()
