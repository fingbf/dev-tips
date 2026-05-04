import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - ページが見つかりません | Dev Tips",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-6xl font-bold text-zinc-200 dark:text-zinc-700">404</div>
      <h1 className="mb-2 text-xl font-bold">ページが見つかりません</h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        URLが間違っているか、ページが削除された可能性があります。
      </p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
