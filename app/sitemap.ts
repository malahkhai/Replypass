import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteConfig.url, priority: 1, changeFrequency: "weekly" },
    { url: `${siteConfig.url}/creators`, priority: 0.8, changeFrequency: "monthly" },
  ];
}
