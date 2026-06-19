/** OBS Timer ビュー用ユーティリティ（"use client" を持たない純粋関数群） */

/** #[0-9a-fA-F]{6} のみ許可。不正値は安全なデフォルトを返す */
export function sanitizeHexColor(value: string | null, fallback: string): string {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return fallback;
}

/** フォントファミリー許可リスト */
export const ALLOWED_FONT_FAMILIES = [
  "monospace",
  "serif",
  "sans-serif",
  "cursive",
  "fantasy",
] as const;
export type AllowedFontFamily = (typeof ALLOWED_FONT_FAMILIES)[number];

export function sanitizeFontFamily(value: string | null): AllowedFontFamily {
  if (value && (ALLOWED_FONT_FAMILIES as readonly string[]).includes(value)) {
    return value as AllowedFontFamily;
  }
  return "monospace";
}

/** hex が正当でない場合は "transparent" にフォールバック。alpha は [0, 1] にクランプ */
export function hexToRgba(hex: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "transparent";
  const safeAlpha = isNaN(alpha) ? 1 : Math.min(1, Math.max(0, alpha));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}
