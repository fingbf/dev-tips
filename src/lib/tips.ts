import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "tips");

export type CategoryMeta = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  order: number;
};

export type TipFrontmatter = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  created: string;
  updated: string;
};

export type TipEntry = {
  slug: string;
  category: string;
  frontmatter: TipFrontmatter;
  content: string;
};

/** content/tips/ 配下のフォルダを自動スキャンしてカテゴリ一覧を取得 */
export function getCategories(): CategoryMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const dirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  const categories: CategoryMeta[] = [];

  for (const dir of dirs) {
    const metaPath = path.join(CONTENT_DIR, dir.name, "_meta.json");
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      categories.push({
        slug: dir.name,
        name: meta.name ?? dir.name,
        description: meta.description ?? "",
        icon: meta.icon ?? "file",
        order: meta.order ?? 99,
      });
    } else {
      categories.push({
        slug: dir.name,
        name: dir.name,
        description: "",
        icon: "file",
        order: 99,
      });
    }
  }

  return categories.sort((a, b) => a.order - b.order);
}

/** 指定カテゴリの記事一覧を取得 */
export function getTipsByCategory(category: string): TipEntry[] {
  const categoryDir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(categoryDir)) return [];

  const files = fs
    .readdirSync(categoryDir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  return files
    .map((file) => {
      const filePath = path.join(categoryDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);

      return {
        slug: file.replace(/\.mdx?$/, ""),
        category,
        frontmatter: data as TipFrontmatter,
        content,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.frontmatter.created).getTime() -
        new Date(a.frontmatter.created).getTime()
    );
}

/** 全カテゴリの記事を取得（新しい順） */
export function getAllTips(): TipEntry[] {
  const categories = getCategories();
  const allTips: TipEntry[] = [];

  for (const cat of categories) {
    allTips.push(...getTipsByCategory(cat.slug));
  }

  return allTips.sort(
    (a, b) =>
      new Date(b.frontmatter.created).getTime() -
      new Date(a.frontmatter.created).getTime()
  );
}

/** 特定の記事を取得 */
export function getTip(
  category: string,
  slug: string
): TipEntry | undefined {
  const filePath = path.join(CONTENT_DIR, category, `${slug}.mdx`);
  const mdFilePath = path.join(CONTENT_DIR, category, `${slug}.md`);

  const targetPath = fs.existsSync(filePath) ? filePath : mdFilePath;
  if (!fs.existsSync(targetPath)) return undefined;

  const raw = fs.readFileSync(targetPath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    category,
    frontmatter: data as TipFrontmatter,
    content,
  };
}

/** 全記事からタグ一覧を抽出 */
export function getAllTags(): { tag: string; count: number }[] {
  const tips = getAllTips();
  const tagMap = new Map<string, number>();

  for (const tip of tips) {
    for (const tag of tip.frontmatter.tags ?? []) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/** 特定タグの記事を取得 */
export function getTipsByTag(tag: string): TipEntry[] {
  return getAllTips().filter((tip) => tip.frontmatter.tags?.includes(tag));
}
