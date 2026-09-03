import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/api/", "/onboarding", "/w/", "/c/", "/o/", "/register/check-email"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
