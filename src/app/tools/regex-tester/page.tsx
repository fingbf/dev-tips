import type { Metadata } from "next";
import { RegexTester } from "./regex-tester";

export const metadata: Metadata = {
  title: "正規表現テスター | Dev Tips",
  description:
    "正規表現のマッチをリアルタイムでハイライト表示。マッチ位置・キャプチャグループも一覧確認。JavaScript の RegExp をブラウザ内で完結。登録不要・無料。",
  keywords: [
    "正規表現",
    "regex",
    "正規表現テスター",
    "正規表現チェッカー",
    "JavaScript",
    "RegExp",
    "マッチ",
    "ハイライト",
    "開発ツール",
  ],
  openGraph: {
    title: "正規表現テスター | Dev Tips",
    description:
      "正規表現のマッチをリアルタイムでハイライト表示。マッチ位置・キャプチャグループも一覧確認。",
    url: "/tools/regex-tester",
  },
  twitter: {
    title: "正規表現テスター | Dev Tips",
    description:
      "正規表現のマッチをリアルタイムでハイライト表示。マッチ位置・キャプチャグループも一覧確認。",
  },
  alternates: { canonical: "/tools/regex-tester" },
};

export default function RegexTesterPage() {
  return <RegexTester />;
}
