import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
  getOrganizationJsonLd,
  siteUrl,
} from "@/lib/site-seo";
import { CartProvider } from "@/lib/cart-context";
import { CartSidebar } from "@/components/CartSidebar";
import { EntryPopup } from "@/components/EntryPopup";
import { CartToast } from "@/components/CartToast";
import { GoogleAnalytics } from "@/components/tracking/GoogleAnalytics";
import { MetaPixel } from "@/components/tracking/MetaPixel";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: "%s | Secreto Digital",
  },
  description: SITE_DEFAULT_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "64x64" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    siteName: "Secreto Digital",
    locale: "es_ES",
    type: "website",
  },
};

const orgJsonLd = JSON.stringify(getOrganizationJsonLd());

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning data-color-scheme="light">
      <head>
        <meta name="color-scheme" content="light" />
        {/* Template CSS — Bootstrap, FontAwesome, Slick, style.css */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/fontawesome.min.css" />
        <link rel="stylesheet" href="/assets/css/slick.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        {/* globals.css (importado arriba) se carga después y sobreescribe overflow-x: clip */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: orgJsonLd }}
        />
      </head>
      <body suppressHydrationWarning>
        <CartProvider>
          {children}
          <CartSidebar />
          <CartToast />
          <EntryPopup />
        </CartProvider>
        <GoogleAnalytics />
        <MetaPixel />
      </body>
    </html>
  );
}
