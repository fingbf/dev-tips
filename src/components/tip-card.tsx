import Link from "next/link";
import { TagBadge } from "./tag-badge";
import type { TipEntry } from "@/lib/tips";

type TipCardProps = {
  tip: TipEntry;
};

export function TipCard({ tip }: TipCardProps) {
  const { slug, category, frontmatter } = tip;

  return (
    <article className="group rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
      <Link href={`/tips/${category}/${slug}`} className="block">
        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium dark:bg-zinc-800">
            {category}
          </span>
          <time dateTime={frontmatter.created}>{frontmatter.created}</time>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
          {frontmatter.title}
        </h3>
        {frontmatter.description && (
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            {frontmatter.description}
          </p>
        )}
      </Link>
      {frontmatter.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {frontmatter.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
