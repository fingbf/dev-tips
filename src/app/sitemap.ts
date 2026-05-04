import { MetadataRoute } from "next";
import { tools } from "@/data/tools";
import { tbs } from "@/data/games/tbs/meta";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.SITE_URL || "https://dev-tips-fingbfs-projects.vercel.app";

  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/tools`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/games`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/games/${tbs.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ];

  for (const tool of tools) {
    entries.push({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const page of tbs.pages) {
    entries.push({
      url: `${baseUrl}/games/${tbs.slug}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
