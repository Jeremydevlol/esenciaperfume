#!/usr/bin/env python3
"""
Ejecuta desde la raíz del proyecto:  python3 download-logos.py
Descarga logos desde Clearbit y los guarda en public/brands/
"""
import os, urllib.request, urllib.error

os.makedirs("public/brands", exist_ok=True)

LOGOS = {
    "maybelline":         "maybelline.com",
    "loreal":             "loreal.com",
    "calvin-klein":       "calvinklein.com",
    "paco-rabanne":       "pacorabanne.com",
    "hugo-boss":          "hugoboss.com",
    "dolce-gabbana":      "dolcegabbana.com",
    "xerjoff":            "xerjoff.com",
    "chanel":             "chanel.com",
    "lancome":            "lancome.com",
    "elizabeth-arden":    "elizabetharden.com",
    "guerlain":           "guerlain.com",
    "biotherm":           "biotherm.com",
    "giorgio-armani":     "giorgioarmani.com",
    "montale":            "montale-paris.com",
    "christian-dior":     "dior.com",
    "deborah-milano":     "deborahmilano.com",
    "ysl":                "yslbeauty.com",
    "donna-karan":        "donnakaran.com",
    "marionnaud":         "marionnaud.com",
    "davidoff":           "davidoff.com",
    "carolina-herrera":   "carolinaherrera.com",
    "jean-paul-gaultier": "jeanpaulgaultier.com",
    "clarins":            "clarins.com",
    "nike":               "nike.com",
    "tous":               "tous.com",
    "versace":            "versace.com",
    "kenzo":              "kenzo.com",
    "givenchy":           "givenchy.com",
    "issey-miyake":       "isseymiyake.com",
    "valentino":          "valentino.com",
    "burberry":           "burberry.com",
    "ralph-lauren":       "ralphlauren.com",
    "lacoste":            "lacoste.com",
    "marc-jacobs":        "marcjacobs.com",
    "prada":              "prada.com",
    "gucci":              "gucci.com",
    "hermes":             "hermes.com",
    "tom-ford":           "tomford.com",
    "clinique":           "clinique.com",
    "shiseido":           "shiseido.com",
    "nivea":              "nivea.com",
    "garnier":            "garnier.com",
    "schwarzkopf":        "schwarzkopf.com",
    "adolfo-dominguez":   "adolfodominguez.com",
    "azzaro":             "azzaro.com",
    "cacharel":           "cacharel.com",
    "mont-blanc":         "montblanc.com",
    "mugler":             "mugler.com",
    "diesel":             "diesel.com",
    "creed":              "creedperfume.com",
    "jo-malone":          "jomalone.com",
    "jimmy-choo":         "jimmychoo.com",
    "michael-kors":       "michaelkors.com",
    "loewe":              "loewe.com",
}

ok, fail = 0, 0

for slug, domain in LOGOS.items():
    out = f"public/brands/{slug}.png"
    if os.path.exists(out) and os.path.getsize(out) > 500:
        print(f"  SKIP  {slug}")
        ok += 1
        continue
    url = f"https://logo.clearbit.com/{domain}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        if len(data) > 500:
            with open(out, "wb") as f:
                f.write(data)
            print(f"  OK    {slug}  ({len(data):,} bytes)")
            ok += 1
        else:
            print(f"  FAIL  {slug}  (respuesta vacía)")
            fail += 1
    except Exception as e:
        print(f"  FAIL  {slug}  ({e})")
        fail += 1

print(f"\n✓ {ok} logos   ✗ {fail} fallaron")
print("Logos en public/brands/ — reinicia el servidor si ya estaba corriendo.")
