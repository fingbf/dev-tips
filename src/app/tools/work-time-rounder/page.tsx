import type { Metadata } from "next";
import { WorkTimeRounder } from "./work-time-rounder";

export const metadata: Metadata = {
  title: "時間丸め変換ツール | Dev Tips",
  description:
    "開始時間を15分単位で切り上げ・終了時間を15分単位で切り下げ。タブ区切り・カンマ区切りで複数行を一括変換。ブラウザ内完結・登録不要・無料。",
  keywords: [
    "時間",
    "丸め",
    "切り上げ",
    "切り下げ",
    "15分",
    "時刻変換",
    "開発ツール",
  ],
  openGraph: {
    title: "時間丸め変換ツール | Dev Tips",
    description:
      "開始時間を15分単位で切り上げ・終了時間を15分単位で切り下げ。タブ/カンマ区切りで複数行を一括変換。",
    siteName: "Dev Tips",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "時間丸め変換ツール | Dev Tips",
    description:
      "開始時間を15分単位で切り上げ・終了時間を15分単位で切り下げ。タブ/カンマ区切りで複数行を一括変換。",
  },
};

export default function WorkTimeRounderPage() {
  return <WorkTimeRounder />;
}
