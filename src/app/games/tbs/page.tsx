import type { Metadata } from "next";
import Link from "next/link";
import { tbs } from "@/data/games/tbs/meta";

export const metadata: Metadata = {
  title: `${tbs.title} | ゲーム攻略 | Dev Tips`,
  description: `${tbs.title}（${tbs.subtitle}）の攻略データベース。アイテム・スキルの一覧。`,
  alternates: { canonical: `/games/${tbs.slug}` },
};

export default function TbsPage() {
  return (
    <div>
      <div className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/games" className="hover:underline">ゲーム攻略</Link>
        {" / "}
        {tbs.title}
      </div>
      <h1 className="mb-1 text-2xl font-bold">{tbs.title}</h1>
      <p className="mb-8 text-sm text-zinc-400">{tbs.subtitle}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {tbs.pages.map((p) => (
          <Link
            key={p.slug}
            href={`/games/tbs/${p.slug}`}
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-2 text-3xl">{p.emoji}</div>
            <div className="font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
              {p.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
