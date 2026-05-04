import type { Metadata } from "next";
import Link from "next/link";
import { tbs } from "@/data/games/tbs/meta";
import { ItemsTable } from "./items-table";

export const metadata: Metadata = {
  title: `アイテム一覧 | ${tbs.title} | ゲーム攻略 | Dev Tips`,
  description: `${tbs.title}（${tbs.subtitle}）の全プロップ一覧。レア度・感情・セットタグで絞り込み可能。`,
};

export default function TbsItemsPage() {
  return (
    <div>
      <div className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/games" className="hover:underline">ゲーム攻略</Link>
        {" / "}
        <Link href="/games/tbs" className="hover:underline">{tbs.title}</Link>
        {" / "}
        アイテム一覧
      </div>
      <h1 className="mb-6 text-2xl font-bold">アイテム一覧</h1>
      <ItemsTable />
    </div>
  );
}
