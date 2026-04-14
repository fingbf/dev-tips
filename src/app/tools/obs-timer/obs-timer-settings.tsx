"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Theme = "default" | "gaming" | "cute" | "minimal" | "retro";

const THEMES: { value: Theme; label: string }[] = [
  { value: "default", label: "スタンダード" },
  { value: "gaming", label: "ゲーミング" },
  { value: "cute", label: "かわいい" },
  { value: "minimal", label: "ミニマル" },
  { value: "retro", label: "レトロ" },
];

const FONT_OPTIONS = [
  { value: "monospace", label: "Monospace（等幅）" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Arial', sans-serif", label: "Arial" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Impact', sans-serif", label: "Impact" },
];

const COLOR_PRESETS = [
  { value: "#000000", label: "黒" },
  { value: "#ffffff", label: "白" },
  { value: "#00ff00", label: "緑" },
  { value: "#ff6b9d", label: "ピンク" },
  { value: "#00d4ff", label: "水色" },
  { value: "#ffd700", label: "ゴールド" },
  { value: "#ff4444", label: "赤" },
  { value: "#a855f7", label: "紫" },
];

export function OBSTimerSettings() {
  const [color, setColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(72);
  const [fontFamily, setFontFamily] = useState("monospace");
  const [theme, setTheme] = useState<Theme>("default");
  const [showDate, setShowDate] = useState(true);
  const [showDow, setShowDow] = useState(true);
  const [showSeconds, setShowSeconds] = useState(true);
  const [dateFormat, setDateFormat] = useState("ja");
  const [bgColor, setBgColor] = useState("transparent");
  const [bgOpacity, setBgOpacity] = useState(100);
  const [bgPadding, setBgPadding] = useState(0);
  const [bgRound, setBgRound] = useState(0);
  const [copied, setCopied] = useState(false);

  const generatedUrl = useMemo(() => {
    const base =
      typeof window !== "undefined"
        ? `${window.location.origin}/tools/obs-timer/view`
        : "/tools/obs-timer/view";

    const params = new URLSearchParams();

    if (color !== "#ffffff") params.set("color", color);
    if (fontSize !== 72) params.set("fontSize", String(fontSize));
    if (fontFamily !== "monospace") params.set("fontFamily", fontFamily);
    if (theme !== "default") params.set("theme", theme);
    if (!showDate) params.set("showDate", "false");
    if (!showDow) params.set("showDow", "false");
    if (!showSeconds) params.set("showSeconds", "false");
    if (dateFormat !== "ja") params.set("dateFormat", dateFormat);
    if (bgColor !== "transparent") {
      params.set("bgColor", bgColor);
      if (bgOpacity !== 100) params.set("bgOpacity", String(bgOpacity));
      if (bgPadding !== 0) params.set("bgPadding", String(bgPadding));
      if (bgRound !== 0) params.set("bgRound", String(bgRound));
    }

    return `${base}?${params.toString()}`;
  }, [
    color,
    fontSize,
    fontFamily,
    theme,
    showDate,
    showDow,
    showSeconds,
    dateFormat,
    bgColor,
    bgOpacity,
    bgPadding,
    bgRound,
  ]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* パンくず */}
      <nav className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">
          Dev Tips
        </Link>
        <span className="mx-2">/</span>
        <Link
          href="/tools"
          className="hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          Tools
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900 dark:text-zinc-100">
          OBS配信用クロック
        </span>
      </nav>

      {/* タイトル */}
      <div>
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">
          OBS配信用クロック
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          OBSのブラウザソースに貼るだけ。日付・曜日・秒付きの時計を配信画面に表示。登録不要・完全無料。
        </p>
      </div>

      {/* 表示内容 */}
      <Section title="表示内容">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDate}
              onChange={(e) => setShowDate(e.target.checked)}
              className="rounded"
            />
            <span>日付を表示</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDow}
              onChange={(e) => setShowDow(e.target.checked)}
              className="rounded"
            />
            <span>曜日を表示</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showSeconds}
              onChange={(e) => setShowSeconds(e.target.checked)}
              className="rounded"
            />
            <span>秒を表示</span>
          </label>
          <div className="mt-2">
            <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">
              日付の形式
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDateFormat("ja")}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  dateFormat === "ja"
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                2026/04/14 (月)
              </button>
              <button
                onClick={() => setDateFormat("en")}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  dateFormat === "en"
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                Mon, Apr 14, 2026
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* デザイン設定 */}
      <Section title="デザイン">
        {/* テーマ */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            テーマ
          </label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  theme === t.value
                    ? "border-blue-500 bg-blue-50 font-medium dark:border-blue-400 dark:bg-blue-950"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 色 */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            文字色
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === c.value
                    ? "border-blue-500 scale-110"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-0"
              title="カスタム色"
            />
          </div>
        </div>

        {/* フォント */}
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              フォント
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              フォントサイズ: {fontSize}px
            </label>
            <input
              type="range"
              min={24}
              max={200}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </Section>

      {/* 背景設定 */}
      <Section title="背景">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              背景色
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBgColor("transparent")}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs transition-transform hover:scale-110 ${
                  bgColor === "transparent"
                    ? "border-blue-500 scale-110"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
                style={{
                  background:
                    "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/12px 12px",
                }}
                title="透過"
              />
              {[
                { value: "#000000", label: "黒" },
                { value: "#1a1a2e", label: "ダークネイビー" },
                { value: "#2d2d2d", label: "ダークグレー" },
                { value: "#ffffff", label: "白" },
                { value: "#0a0a0a", label: "ほぼ黒" },
              ].map((c) => (
                <button
                  key={c.value}
                  onClick={() => setBgColor(c.value)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    bgColor === c.value
                      ? "border-blue-500 scale-110"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
              <input
                type="color"
                value={bgColor === "transparent" ? "#000000" : bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border-0"
                title="カスタム色"
              />
            </div>
          </div>

          {bgColor !== "transparent" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  不透明度: {bgOpacity}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={bgOpacity}
                  onChange={(e) => setBgOpacity(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-zinc-400">
                  <span>半透明</span>
                  <span>不透明</span>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    内側の余白: {bgPadding}px
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={bgPadding}
                    onChange={(e) => setBgPadding(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    角丸: {bgRound}px
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={bgRound}
                    onChange={(e) => setBgRound(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* プレビュー */}
      <Section title="プレビュー">
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
            OBSでの表示イメージ
          </div>
          <div className="flex items-center justify-center bg-zinc-900 p-8">
            <iframe
              src={generatedUrl}
              className="border-0"
              style={{
                width: "600px",
                height: "200px",
                background: "transparent",
              }}
              title="クロックプレビュー"
            />
          </div>
        </div>
      </Section>

      {/* URL生成 */}
      <Section title="OBSに貼るURL">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-3 flex gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-zinc-900 px-4 py-3 text-sm text-emerald-400 dark:bg-zinc-800">
              {generatedUrl}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {copied ? "Copied!" : "URLをコピー"}
            </button>
          </div>
        </div>
      </Section>

      {/* 使い方 */}
      <Section title="使い方">
        <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          <ol className="list-inside list-decimal space-y-2">
            <li>上の設定でクロックをカスタマイズ</li>
            <li>「URLをコピー」ボタンをクリック</li>
            <li>
              OBS Studio を開き、ソースの追加から
              <strong>「ブラウザ」</strong>を選択
            </li>
            <li>URLにコピーしたURLを貼り付け</li>
            <li>
              幅・高さを設定（推奨: 幅 <code>600</code>、高さ{" "}
              <code>150</code>）
            </li>
          </ol>

          <div className="rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
            <p className="font-medium">Tips</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>
                操作不要。常にリアルタイムの時刻・日付・曜日を表示します
              </li>
              <li>
                背景を半透明にすると、ゲーム画面の上に重ねても見やすくなります
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
