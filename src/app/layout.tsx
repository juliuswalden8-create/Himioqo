import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@/components/google-analytics";
import { Toaster } from "@/components/ui/sonner";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { siteOrigin } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const m = dict.marketing.meta;
  return {
    title: {
      default: m.title,
      template: "%s · Homioqo",
    },
    description: m.description,
    metadataBase: new URL(siteOrigin()),
    applicationName: "Homioqo",
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
    icons: {
      icon: [
        { url: "/brand/icon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: "/",
      siteName: "Homioqo",
      locale,
      type: "website",
      images: [{ url: "/landing/hero-guest-scan.jpg", alt: dict.marketing.hero.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: m.ogTitle,
      description: m.ogDescription,
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale.split("-")[0] ?? "sv"} className={manrope.variable}>
      <head>
        <GoogleAnalytics />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
