export type Tool = {
  slug: string;
  name: string;
  description: string;
  icon: string;
};

export const tools: Tool[] = [
  {
    slug: "cron-generator",
    name: "Cron式ジェネレーター",
    description:
      "GUIでCron式を組み立て、日本語で意味を解説。次回実行日時も表示。Unix / Quartz 両対応。",
    icon: "⏰",
  },
  {
    slug: "obs-timer",
    name: "OBS配信用クロック",
    description:
      "OBSブラウザソースで使える無料クロック。現在時刻・配信経過時間・カウントダウン対応。URLをコピーするだけ。",
    icon: "🎬",
  },
  {
    slug: "lottery",
    name: "抽選ツール",
    description:
      "ルーレット演出で抽選・順番決め・チーム分け。配信、飲み会、チーム分けに。登録不要。",
    icon: "🎯",
  },
  {
    slug: "json-formatter",
    name: "JSON整形ツール",
    description:
      "JSONを貼り付けるだけで整形・圧縮・バリデーション。入力データはサーバーに送信されず、ブラウザ内で完結。登録不要・無料。",
    icon: "📋",
  },
  {
    slug: "working-hours-calendar",
    name: "稼働時間カレンダー",
    description:
      "月の稼働日・稼働時間を管理して総稼働時間と月収を算出。祝日自動除外・Excel出力対応。登録不要・無料。",
    icon: "📅",
  },
  {
    slug: "regex-tester",
    name: "正規表現テスター",
    description:
      "正規表現のマッチをリアルタイムでハイライト表示。マッチ位置・キャプチャグループも一覧確認。ブラウザ内完結・登録不要。",
    icon: "🔍",
  },
  {
    slug: "work-time-rounder",
    name: "時間丸め変換ツール",
    description:
      "開始時間を15分単位で切り上げ・終了時間を15分単位で切り下げ。タブ/カンマ区切りで複数行を一括変換。ブラウザ内完結・登録不要。",
    icon: "🕐",
  },
];
