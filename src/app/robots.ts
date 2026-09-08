import type { MetadataRoute } from "next";
import { REQUIRED_ROBOTS_DISALLOW } from "@/lib/security/robots";
import { siteOrigin } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...REQUIRED_ROBOTS_DISALLOW],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
