import type { Metadata } from "next";
import Link from "next/link";
import { tbs } from "@/data/games/tbs/meta";
import { AchievementsList } from "./achievements-list";

export const metadata: Metadata = {
  title: `実績一覧 | ${tbs.title} | ゲーム攻略 | Dev Tips`,
  description: `${tbs.title}（${tbs.subtitle}）のゲーム内実績一覧。`,
};

export default function TbsAchievementsPage() {
  return (
    <div>
      <div className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/games" className="hover:underline">ゲーム攻略</Link>
        {" / "}
        <Link href="/games/tbs" className="hover:underline">{tbs.title}</Link>
        {" / "}
        実績一覧
      </div>
      <h1 className="mb-6 text-2xl font-bold">実績一覧</h1>
      <AchievementsList />
    </div>
  );
}
