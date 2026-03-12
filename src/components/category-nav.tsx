import Link from "next/link";
import type { CategoryMeta } from "@/lib/tips";

type CategoryNavProps = {
  categories: CategoryMeta[];
  current?: string;
};

export function CategoryNav({ categories, current }: CategoryNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/"
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          !current
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/tips/${cat.slug}`}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            current === cat.slug
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
