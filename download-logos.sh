#!/bin/bash
# Ejecuta desde la raíz del proyecto: bash download-logos.sh
# Descarga logos de marcas desde Clearbit y los guarda en public/brands/

mkdir -p public/brands

declare -A LOGOS=(
  ["maybelline"]="maybelline.com"
  ["loreal"]="loreal.com"
  ["calvin-klein"]="calvinklein.com"
  ["paco-rabanne"]="pacorabanne.com"
  ["hugo-boss"]="hugoboss.com"
  ["dolce-gabbana"]="dolcegabbana.com"
  ["xerjoff"]="xerjoff.com"
  ["chanel"]="chanel.com"
  ["lancome"]="lancome.com"
  ["elizabeth-arden"]="elizabetharden.com"
  ["guerlain"]="guerlain.com"
  ["biotherm"]="biotherm.com"
  ["giorgio-armani"]="giorgioarmani.com"
  ["montale"]="montale-paris.com"
  ["christian-dior"]="dior.com"
  ["deborah-milano"]="deborahmilano.com"
  ["ysl"]="yslbeauty.com"
  ["donna-karan"]="donnakaran.com"
  ["marionnaud"]="marionnaud.com"
  ["davidoff"]="davidoff.com"
  ["carolina-herrera"]="carolinaherrera.com"
  ["jean-paul-gaultier"]="jeanpaulgaultier.com"
  ["clarins"]="clarins.com"
  ["nike"]="nike.com"
  ["tous"]="tous.com"
  ["versace"]="versace.com"
  ["kenzo"]="kenzo.com"
  ["givenchy"]="givenchy.com"
  ["issey-miyake"]="isseymiyake.com"
  ["valentino"]="valentino.com"
  ["burberry"]="burberry.com"
  ["ralph-lauren"]="ralphlauren.com"
  ["lacoste"]="lacoste.com"
  ["marc-jacobs"]="marcjacobs.com"
  ["prada"]="prada.com"
  ["gucci"]="gucci.com"
  ["hermes"]="hermes.com"
  ["tom-ford"]="tomford.com"
  ["clinique"]="clinique.com"
  ["shiseido"]="shiseido.com"
  ["nivea"]="nivea.com"
  ["garnier"]="garnier.com"
  ["schwarzkopf"]="schwarzkopf.com"
  ["adolfo-dominguez"]="adolfodominguez.com"
  ["azzaro"]="azzaro.com"
  ["cacharel"]="cacharel.com"
  ["mont-blanc"]="montblanc.com"
  ["mugler"]="mugler.com"
  ["diesel"]="diesel.com"
  ["creed"]="creedperfume.com"
  ["jo-malone"]="jomalone.com"
  ["carolina-herrera"]="carolinaherrera.com"
  ["jimmy-choo"]="jimmychoo.com"
  ["michael-kors"]="michaelkors.com"
  ["loewe"]="loewe.com"
)

OK=0
FAIL=0

for slug in "${!LOGOS[@]}"; do
  domain="${LOGOS[$slug]}"
  out="public/brands/${slug}.png"

  # Salta si ya existe y pesa más de 1KB
  if [ -f "$out" ] && [ "$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out" 2>/dev/null)" -gt 1000 ]; then
    echo "  SKIP  $slug (ya existe)"
    ((OK++))
    continue
  fi

  http_code=$(curl -sL --max-time 10 \
    -H "User-Agent: Mozilla/5.0" \
    -w "%{http_code}" \
    -o "$out" \
    "https://logo.clearbit.com/${domain}")

  size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out" 2>/dev/null || echo 0)

  if [ "$http_code" = "200" ] && [ "$size" -gt 500 ]; then
    echo "  OK    $slug ($size bytes)"
    ((OK++))
  else
    rm -f "$out"
    echo "  FAIL  $slug (HTTP $http_code)"
    ((FAIL++))
  fi
done

echo ""
echo "✓ $OK logos descargados  ✗ $FAIL fallaron"
echo ""
echo "Los logos están en public/brands/"
echo "Las marcas sin logo mostrarán la letra inicial como fallback."
