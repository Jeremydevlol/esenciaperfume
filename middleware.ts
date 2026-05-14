import { NextRequest, NextResponse } from "next/server";

async function verifyTokenEdge(cookie: string, secret: string): Promise<boolean> {
  const parts = cookie.split(".");
  if (parts.length !== 2) return false;

  const [id, signature] = parts;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(id)),
  );

  let sigBytes: Uint8Array;
  try {
    sigBytes = new Uint8Array(
      (signature.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16)),
    );
  } catch {
    return false;
  }

  if (expected.length !== sigBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected[i] ^ sigBytes[i];
  }
  return diff === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/auth")
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get("admin_session")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET ?? "fallback-dev-secret";

  if (!session || !(await verifyTokenEdge(session, secret))) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
