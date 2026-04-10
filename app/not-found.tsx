import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_DEFAULT_DESCRIPTION } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: SITE_DEFAULT_DESCRIPTION,
};

export default function NotFound() {
  return (
    <div>
      <SiteHeader />
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <p style={{ fontSize: 80, fontWeight: 700, color: "#ebebeb", lineHeight: 1, margin: "0 0 8px" }}>404</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: "0 0 16px" }}>Página no encontrada</h1>
          <p style={{ fontSize: 15, color: "#666", margin: "0 0 32px", lineHeight: 1.6 }}>
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#111",
              color: "#fff",
              padding: "13px 32px",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textDecoration: "none",
              textTransform: "uppercase",
              borderRadius: 2,
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
