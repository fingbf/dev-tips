import type { Metadata } from "next";
import Link from "next/link";
import { tbs } from "@/data/games/tbs/meta";

export const metadata: Metadata = {
  title: "ゲーム攻略 | Dev Tips",
  description: "ゲーム攻略情報・データベース",
  alternates: { canonical: "/games" },
};

const games = [tbs];

export default function GamesPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">ゲーム攻略</h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">攻略情報・データベース</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {games.map((game) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-1 font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
              {game.title}
            </div>
            <div className="mb-2 text-xs text-zinc-400">{game.subtitle}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">{game.description}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {game.pages.map((p) => (
                <span
                  key={p.slug}
                  className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {p.label}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
