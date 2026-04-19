import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkingHoursCalendar } from "./working-hours-calendar";

export const metadata: Metadata = {
  title: "稼働時間カレンダー | Dev Tips",
  description:
    "月の稼働日・稼働時間を管理して総稼働時間と月収を算出。日本の祝日を自動除外。Excel出力でそのまま管理帳票に使える。登録不要・無料。",
  keywords: [
    "稼働時間",
    "稼働日",
    "月収計算",
    "時給計算",
    "フリーランス",
    "勤務時間",
    "カレンダー",
    "祝日",
    "Excel",
    "エクセル",
  ],
  openGraph: {
    title: "稼働時間カレンダー | Dev Tips",
    description:
      "月の稼働日・稼働時間を管理して総稼働時間と月収を算出。日本の祝日を自動除外。Excel出力対応。",
    url: "/tools/working-hours-calendar",
  },
  twitter: {
    title: "稼働時間カレンダー | Dev Tips",
    description:
      "月の稼働日・稼働時間を管理して総稼働時間と月収を算出。日本の祝日を自動除外。Excel出力対応。",
  },
  alternates: { canonical: "/tools/working-hours-calendar" },
};

export default function WorkingHoursCalendarPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-8 text-center text-zinc-400">読み込み中...</div>}>
      <WorkingHoursCalendar />
    </Suspense>
  );
}
