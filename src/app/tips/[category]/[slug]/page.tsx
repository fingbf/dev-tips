import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategories, getTipsByCategory, getTip } from "@/lib/tips";
import { TagBadge } from "@/components/tag-badge";
import { Breadcrumb } from "@/components/breadcrumb";
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
  const categories = getCategories();
  const cat = categories.find((c) => c.slug === category);

  return (
    <article className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Top", href: "/" },
            { label: cat?.name ?? category, href: `/tips/${category}` },
            { label: frontmatter.title },
          ]}
        />
        <h1 className="mt-3 text-2xl font-bold md:text-3xl">
          {frontmatter.title}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <time dateTime={frontmatter.created}>{frontmatter.created}</time>
          {frontmatter.updated !== frontmatter.created && (
            <span>(更新: {frontmatter.updated})</span>
          )}
        </div>
        {frontmatter.description && (
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            {frontmatter.description}
          </p>
        )}
        {frontmatter.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
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
          className="rounded-md px-3 py-2 text-blue-600 transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:text-blue-400 dark:hover:bg-zinc-800"
        >
          ← {cat?.name ?? category} の記事一覧
        </Link>
        <Link
          href="/"
          className="rounded-md px-3 py-2 text-blue-600 transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:text-blue-400 dark:hover:bg-zinc-800"
        >
          ← トップに戻る
        </Link>
      </div>
    </article>
  );
}
