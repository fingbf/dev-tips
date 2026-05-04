import Link from "next/link";
import type { Metadata } from "next";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "開発ツール | Dev Tips",
  description:
    "開発者向けの無料オンラインツール集。ブラウザ完結・登録不要で今すぐ使えます。",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">開発ツール</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          ブラウザ完結・登録不要の開発者向け無料ツール
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group rounded-lg border border-zinc-200 p-5 transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:shadow-zinc-900/50"
          >
            <div className="mb-2 text-3xl">{tool.icon}</div>
            <h2 className="mb-2 text-xl font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
              {tool.name}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
