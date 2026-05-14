import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/brand-logo?domain=chanel.com
 *
 * Proxy server-side a la Clearbit Logo API para evitar bloqueos CORS/CSP
 * en el navegador. El servidor Next.js hace la petición y reenvía la imagen.
 *
 * Cache: 7 días (CDN + browser). Si Clearbit falla, devuelve 204 (sin imagen).
 */
export const runtime = "nodejs";

// Dominios permitidos para evitar abusos
const ALLOWED_TLDS = [".com", ".es", ".fr", ".it", ".co.uk", ".net", ".org", ".eu", ".de"];

function isDomainAllowed(domain: string): boolean {
  if (!domain || domain.length > 100) return false;
  // Solo letras, números, puntos y guiones
  if (!/^[a-z0-9.-]+$/.test(domain)) return false;
  return ALLOWED_TLDS.some((tld) => domain.endsWith(tld));
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain")?.toLowerCase().trim();

  if (!domain || !isDomainAllowed(domain)) {
    return new NextResponse(null, { status: 400 });
  }

  const url = `https://logo.clearbit.com/${domain}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SecretoDigital/1.0)",
        Accept: "image/*",
      },
      next: { revalidate: 60 * 60 * 24 * 7 }, // cache 7 días
    });

    if (!res.ok || !res.body) {
      return new NextResponse(null, { status: 204 });
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, max-age=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
