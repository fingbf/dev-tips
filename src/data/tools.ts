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
];
