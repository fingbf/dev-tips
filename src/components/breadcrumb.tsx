import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくずリスト" className="text-sm text-zinc-500 dark:text-zinc-400">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="rounded px-1 py-0.5 transition-colors hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-zinc-900 dark:text-zinc-100">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
