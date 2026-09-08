import type { MetadataRoute } from "next";
import { INDEXABLE_SITEMAP_PATHS } from "@/lib/security/robots";
import { siteOrigin } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  return INDEXABLE_SITEMAP_PATHS.map((path, index) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.3,
  }));
}
