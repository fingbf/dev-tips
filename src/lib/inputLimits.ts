/**
 * dev-tips の各ツール共通の入力サイズ上限定数。
 *
 * 目的: 巨大入力で UI スレッドがフリーズする DoS 的事故を防ぐ。
 * これらの上限は「人間が手入力 / 業務利用で現実的に必要な範囲」を超えた値で、
 * 超過時はツール側で早期 reject するかトリミングする。
 *
 * 更新する場合は実利用ケースを確認してから引き上げること。
 */

/** 1 MiB。JSON / 正規表現 / 一括変換系入力の汎用上限 */
export const MAX_TEXT_BYTES = 1_048_576;

/** 50,000 文字。一般的なテキスト入力欄の上限 */
export const MAX_TEXT_CHARS = 50_000;

/** Cron 式の妥当な最大長 (Quartz でも 100 文字未満が現実的) */
export const MAX_CRON_CHARS = 256;

/** 正規表現パターンの最大長 (ReDoS 防止) */
export const MAX_REGEX_PATTERN_CHARS = 2_000;

/** 抽選ツールの 1 項目あたり最大文字数 */
export const MAX_LOTTERY_ITEM_CHARS = 200;

/** 抽選ツールの最大項目数 (URL 共有を含む) */
export const MAX_LOTTERY_ITEMS = 200;

/** work-time-rounder の最大行数 (1 行 = 1 時刻入力) */
export const MAX_TIME_ROUND_LINES = 1_000;

/** 稼働カレンダーのカスタム勤務時間上書き最大件数 (= 1 ヶ月の日数) */
export const MAX_CALENDAR_DH_ENTRIES = 31;

/** UI フリーズ防止のためのデバウンス時間 (ms) */
export const INPUT_DEBOUNCE_MS = 300;
