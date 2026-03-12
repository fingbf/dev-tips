import Link from "next/link";

type TagBadgeProps = {
  tag: string;
  count?: number;
};

export function TagBadge({ tag, count }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${tag}`}
      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      #{tag}
      {count !== undefined && (
        <span className="text-zinc-400 dark:text-zinc-500">({count})</span>
      )}
    </Link>
  );
}
