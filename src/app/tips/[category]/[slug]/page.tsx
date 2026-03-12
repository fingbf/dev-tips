import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategories, getTipsByCategory, getTip } from "@/lib/tips";
import { TagBadge } from "@/components/tag-badge";
import { MDXRemote } from "@/components/mdx-remote";

type Props = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateStaticParams() {
  const categories = getCategories();
  const params: { category: string; slug: string }[] = [];

  for (const cat of categories) {
    const tips = getTipsByCategory(cat.slug);
    for (const tip of tips) {
      params.push({ category: cat.slug, slug: tip.slug });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props) {
  const { category, slug } = await params;
  const tip = getTip(category, slug);
  if (!tip) return {};
  return {
    title: `${tip.frontmatter.title} | Dev Tips`,
    description: tip.frontmatter.description,
  };
}

export default async function TipPage({ params }: Props) {
  const { category, slug } = await params;
  const tip = getTip(category, slug);
  if (!tip) notFound();

  const { frontmatter, content } = tip;

  return (
    <article className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href={`/tips/${category}`}
            className="rounded bg-zinc-100 px-2 py-0.5 font-medium transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {category}
          </Link>
          <time dateTime={frontmatter.created}>{frontmatter.created}</time>
          {frontmatter.updated !== frontmatter.created && (
            <span>(更新: {frontmatter.updated})</span>
          )}
        </div>
        <h1 className="text-3xl font-bold">{frontmatter.title}</h1>
        {frontmatter.description && (
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            {frontmatter.description}
          </p>
        )}
        {frontmatter.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {frontmatter.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <div className="prose max-w-none dark:prose-invert">
        <MDXRemote source={content} />
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <div className="flex gap-4 text-sm">
        <Link
          href={`/tips/${category}`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          ← {category} の記事一覧
        </Link>
        <Link
          href="/"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          ← トップに戻る
        </Link>
      </div>
    </article>
  );
}
