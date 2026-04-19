import type { Metadata } from "next";
import { JsonFormatter } from "./json-formatter";

export const metadata: Metadata = {
  title: "JSON整形ツール | Dev Tips",
  description:
    "JSONを貼り付けるだけで整形・圧縮・バリデーション。入力データはサーバーに送信されず、ブラウザ内で完結。登録不要・無料。",
  keywords: [
    "JSON",
    "整形",
    "フォーマット",
    "バリデーション",
    "beautify",
    "prettify",
    "minify",
    "開発ツール",
  ],
  openGraph: {
    title: "JSON整形ツール | Dev Tips",
    description:
      "JSONを貼り付けるだけで整形・圧縮・バリデーション。入力データはサーバーに送信されず、ブラウザ内で完結。",
    siteName: "Dev Tips",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "JSON整形ツール | Dev Tips",
    description:
      "JSONを貼り付けるだけで整形・圧縮・バリデーション。入力データはサーバーに送信されず、ブラウザ内で完結。",
  },
};

export default function JsonFormatterPage() {
  return <JsonFormatter />;
}
