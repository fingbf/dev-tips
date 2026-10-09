import type { Metadata } from "next";
import { ToolGrid } from "@/components/tool-grid";

export const metadata: Metadata = {
  title: "Dev Tips",
  description: "開発者向けの無料ツール集",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">Dev Tips</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          ブラウザ完結・登録不要の開発者向け無料ツール。入力データはサーバーに送信されません。
        </p>
      </div>

      <ToolGrid />
    </div>
  );
}
