import type { Metadata } from "next";
import { OBSTimerSettings } from "./obs-timer-settings";

export const metadata: Metadata = {
  title: "OBS配信用クロック | Dev Tips",
  description:
    "OBSのブラウザソースで使える無料クロック。現在時刻（日付・曜日・秒付き）・配信経過時間・カウントダウン対応。URLをコピーするだけで配信画面に表示。登録不要。",
  keywords: [
    "OBS",
    "時計",
    "クロック",
    "配信",
    "ブラウザソース",
    "現在時刻",
    "経過時間",
    "カウントダウン",
    "VTuber",
    "ゲーム配信",
  ],
  openGraph: {
    title: "OBS配信用クロック | Dev Tips",
    description:
      "OBSのブラウザソースで使える無料クロック。現在時刻・配信経過時間・カウントダウン対応。URLをコピーするだけで使える。",
    url: "/tools/obs-timer",
  },
  twitter: {
    title: "OBS配信用クロック | Dev Tips",
    description:
      "OBSのブラウザソースで使える無料クロック。現在時刻・配信経過時間・カウントダウン対応。URLをコピーするだけで使える。",
  },
  alternates: { canonical: "/tools/obs-timer" },
};

export default function OBSTimerPage() {
  return <OBSTimerSettings />;
}
