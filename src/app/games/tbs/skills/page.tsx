import type { Metadata } from "next";
import Link from "next/link";
import { tbs } from "@/data/games/tbs/meta";
import { SkillsTable } from "./skills-table";

export const metadata: Metadata = {
  title: `スキル一覧 | ${tbs.title} | ゲーム攻略 | Dev Tips`,
  description: `${tbs.title}（${tbs.subtitle}）の全スキル一覧。キャラクター・種別で絞り込み可能。`,
};

export default function TbsSkillsPage() {
  return (
    <div>
      <div className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/games" className="hover:underline">ゲーム攻略</Link>
        {" / "}
        <Link href="/games/tbs" className="hover:underline">{tbs.title}</Link>
        {" / "}
        スキル一覧
      </div>
      <h1 className="mb-6 text-2xl font-bold">スキル一覧</h1>
      <SkillsTable />
    </div>
  );
}
