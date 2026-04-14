import type { Metadata } from "next";
import { CronGenerator } from "./cron-generator";

export const metadata: Metadata = {
  title: "Cron式ジェネレーター | Dev Tips",
  description:
    "GUIでCron式を簡単に組み立てるツール。日本語で意味を解説し、次回実行日時も表示。Unix crontab / Quartz 両対応。ブラウザ完結・登録不要。",
  keywords: [
    "cron",
    "crontab",
    "cron式",
    "ジェネレーター",
    "生成",
    "日本語",
    "Quartz",
    "GitHub Actions",
    "スケジュール",
  ],
};

export default function CronGeneratorPage() {
  return <CronGenerator />;
}
