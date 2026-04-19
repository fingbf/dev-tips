import type { Metadata } from "next";
import { Suspense } from "react";
import { LotteryTool } from "./lottery-tool";

export const metadata: Metadata = {
  title: "抽選ツール - ルーレット・順番決め・チーム分け | Dev Tips",
  description:
    "無料の抽選ツール。ルーレット演出で1人を抽選、順番決め、チーム分けに対応。登録不要・ブラウザ完結。配信や飲み会、チーム分けに。",
  keywords: [
    "抽選",
    "ルーレット",
    "ランダム",
    "順番決め",
    "チーム分け",
    "くじ引き",
    "配信",
    "無料",
  ],
  openGraph: {
    title: "抽選ツール - ルーレット・順番決め・チーム分け | Dev Tips",
    description:
      "無料の抽選ツール。ルーレット演出で1人を抽選、順番決め、チーム分けに対応。登録不要・ブラウザ完結。",
    url: "/tools/lottery",
  },
  twitter: {
    title: "抽選ツール - ルーレット・順番決め・チーム分け | Dev Tips",
    description:
      "無料の抽選ツール。ルーレット演出で1人を抽選、順番決め、チーム分けに対応。登録不要・ブラウザ完結。",
  },
  alternates: { canonical: "/tools/lottery" },
};

export default function LotteryPage() {
  return (
    <Suspense>
      <LotteryTool />
    </Suspense>
  );
}
