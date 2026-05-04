import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dev Tips",
  description: "無料オンラインツール・ゲーム攻略",
  alternates: { canonical: "/" },
};

const sections = [
  {
    href: "/tools",
    emoji: "🛠",
    label: "ツール",
    desc: "ブラウザ完結・登録不要の無料オンラインツール",
  },
  {
    href: "/games",
    emoji: "🎮",
    label: "ゲーム攻略",
    desc: "攻略情報・データベース",
  },
];

export default function Home() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Dev Tips</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-3 text-4xl">{s.emoji}</div>
            <div className="mb-1 text-lg font-bold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
              {s.label}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
