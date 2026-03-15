import Link from "next/link";

type TagBadgeProps = {
  tag: string;
  count?: number;
};

export function TagBadge({ tag, count }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${tag}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      #{tag}
      {count !== undefined && (
        <span className="text-zinc-400 dark:text-zinc-500">({count})</span>
      )}
    </Link>
  );
}
