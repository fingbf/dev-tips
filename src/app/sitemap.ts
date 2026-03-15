import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.SITE_URL || "https://dev-tips.example.com";
  const tipsDir = path.join(process.cwd(), "content", "tips");
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const categories = fs
    .readdirSync(tipsDir)
    .filter((f) => fs.statSync(path.join(tipsDir, f)).isDirectory());

  for (const category of categories) {
    entries.push({
      url: `${baseUrl}/tips/${category}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const catDir = path.join(tipsDir, category);
    const articles = fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));
    for (const article of articles) {
      const slug = article.replace(".mdx", "");
      const stat = fs.statSync(path.join(catDir, article));
      entries.push({
        url: `${baseUrl}/tips/${category}/${slug}`,
        lastModified: stat.mtime,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
