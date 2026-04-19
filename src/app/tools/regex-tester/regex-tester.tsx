"use client";

import { useState, useMemo } from "react";

type FlagKey = "g" | "i" | "m" | "s";

type MatchInfo = {
  fullMatch: string;
  index: number;
  groups: (string | undefined)[];
};

type Segment = {
  text: string;
  isMatch: boolean;
  matchIndex: number;
};

type RegexResult =
  | { ok: true; regex: RegExp }
  | { ok: false; error: string }
  | null;

const MAX_DISPLAY = 100;
const FLAG_LABELS: { key: FlagKey; label: string; title: string }[] = [
  { key: "g", label: "g", title: "global — 全マッチを検索" },
  { key: "i", label: "i", title: "ignoreCase — 大文字小文字を無視" },
  { key: "m", label: "m", title: "multiline — ^ $ を各行に適用" },
  { key: "s", label: "s", title: "dotAll — . が改行にもマッチ" },
];

function buildRegexResult(pattern: string, flags: Record<FlagKey, boolean>): RegexResult {
  if (!pattern) return null;
  const flagStr = (Object.keys(flags) as FlagKey[]).filter((k) => flags[k]).join("");
  try {
    return { ok: true, regex: new RegExp(pattern, flagStr) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "無効な正規表現" };
  }
}

function collectMatches(regex: RegExp, text: string): MatchInfo[] {
  const matches: MatchInfo[] = [];
  if (regex.global) {
    const re = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null && matches.length < MAX_DISPLAY) {
      matches.push({ fullMatch: m[0], index: m.index, groups: m.slice(1) });
      // 空マッチ時は lastIndex を手動で進めて無限ループを防ぐ
      if (m[0] === "") re.lastIndex++;
    }
  } else {
    const re = new RegExp(regex.source, regex.flags);
    const m = re.exec(text);
    if (m) matches.push({ fullMatch: m[0], index: m.index, groups: m.slice(1) });
  }
  return matches;
}

function buildSegments(text: string, matches: MatchInfo[]): Segment[] {
  if (matches.length === 0) return [{ text, isMatch: false, matchIndex: -1 }];
  const segments: Segment[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const { index, fullMatch } = matches[i];
    if (index < cursor) continue;
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), isMatch: false, matchIndex: -1 });
    }
    segments.push({ text: fullMatch, isMatch: true, matchIndex: i });
    cursor = index + (fullMatch.length || 1);
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false, matchIndex: -1 });
  }
  return segments;
}

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({ g: true, i: false, m: false, s: false });
  const [testString, setTestString] = useState("");

  const toggleFlag = (key: FlagKey) => setFlags((f) => ({ ...f, [key]: !f[key] }));

  const result: RegexResult = useMemo(() => buildRegexResult(pattern, flags), [pattern, flags]);

  const matches: MatchInfo[] = useMemo(() => {
    if (!result || !result.ok || !testString) return [];
    return collectMatches(result.regex, testString);
  }, [result, testString]);

  const segments: Segment[] = useMemo(() => {
    if (!testString) return [];
    return buildSegments(testString, matches);
  }, [testString, matches]);

  const groupCount = useMemo(() => {
    if (matches.length === 0) return 0;
    return Math.max(...matches.map((m) => m.groups.length));
  }, [matches]);

  const hasPattern = pattern.length > 0;
  const isError = result !== null && !result.ok;
  const matchCount = matches.length;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="mb-1 text-2xl font-bold md:text-3xl">正規表現テスター</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          JavaScript の RegExp でリアルタイムマッチ確認。ブラウザ内完結・入力データはサーバーに送信されません。
        </p>
      </div>

      {/* パターン入力 */}
      <div className="space-y-2">
        <label htmlFor="regex-pattern" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          パターン
        </label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-400">/</span>
          <input
            id="regex-pattern"
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="例: \d+"
            spellCheck={false}
            className={[
              "flex-1 rounded border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2",
              isError
                ? "border-red-400 focus:ring-red-300 dark:border-red-500 dark:focus:ring-red-700"
                : "border-zinc-300 focus:ring-blue-300 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-blue-700",
            ].join(" ")}
          />
          <span className="font-mono text-zinc-400">/</span>
          {/* フラグトグル */}
          <div className="flex gap-1">
            {FLAG_LABELS.map(({ key, label, title }) => (
              <button
                key={key}
                type="button"
                aria-pressed={flags[key]}
                title={title}
                onClick={() => toggleFlag(key)}
                className={[
                  "w-8 h-8 rounded font-mono text-sm font-medium transition-colors",
                  flags[key]
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {isError && (
          <p className="text-sm text-red-500 dark:text-red-400">
            ⚠ {(result as { ok: false; error: string }).error}
          </p>
        )}
      </div>

      {/* テスト文字列 */}
      <div className="space-y-2">
        <label htmlFor="regex-test-string" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          テスト文字列
        </label>
        <textarea
          id="regex-test-string"
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="マッチ対象のテキストを入力"
          spellCheck={false}
          rows={6}
          className="w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-blue-700"
        />
      </div>

      {/* ハイライトプレビュー */}
      {testString && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">プレビュー</span>
            {hasPattern && !isError && (
              <span className={[
                "text-xs px-2 py-0.5 rounded-full font-medium",
                matchCount > 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
              ].join(" ")}>
                {matchCount > 0 ? `${matchCount}件マッチ` : "マッチなし"}
              </span>
            )}
          </div>
          <div className="min-h-[120px] rounded border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm whitespace-pre-wrap break-all dark:border-zinc-600 dark:bg-zinc-900">
            {segments.map((seg, i) =>
              seg.isMatch ? (
                <mark
                  key={i}
                  className="rounded-sm bg-yellow-300 text-black dark:bg-yellow-500 dark:text-black"
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </div>
        </div>
      )}

      {/* マッチ一覧 */}
      {matchCount > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">マッチ一覧</span>
          <div className="overflow-x-auto rounded border border-zinc-300 dark:border-zinc-600">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">#</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">マッチ</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">開始</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">終了</th>
                  {Array.from({ length: groupCount }, (_, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                      グループ{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {matches.map((m, i) => (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                    <td className="px-3 py-2 font-mono">
                      <mark className="rounded-sm bg-yellow-200 px-0.5 text-black dark:bg-yellow-600 dark:text-black">
                        {m.fullMatch || <span className="text-zinc-400 italic">（空文字列）</span>}
                      </mark>
                    </td>
                    <td className="px-3 py-2 text-zinc-500 tabular-nums">{m.index}</td>
                    <td className="px-3 py-2 text-zinc-500 tabular-nums">{m.index + m.fullMatch.length}</td>
                    {m.groups.map((g, gi) => (
                      <td key={gi} className="px-3 py-2 font-mono text-zinc-600 dark:text-zinc-300">
                        {g === undefined ? <span className="text-zinc-400">—</span> : g || <span className="text-zinc-400 italic">（空）</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {matchCount >= MAX_DISPLAY && (
            <p className="text-xs text-zinc-400">※ {MAX_DISPLAY}件以上マッチしています（表示は最大{MAX_DISPLAY}件）</p>
          )}
        </div>
      )}

      {/* 使い方 */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="mb-3 font-semibold">使い方</h2>
        <ol className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>1. パターン欄に正規表現を入力（スラッシュは不要）</li>
          <li>2. フラグボタンで <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">g</code> <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">i</code> <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">m</code> <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">s</code> を切り替え</li>
          <li>3. テスト文字列欄にマッチ対象のテキストを入力</li>
          <li>4. プレビューでマッチ箇所がハイライト表示されます</li>
          <li>5. マッチ一覧でキャプチャグループや位置を確認できます</li>
        </ol>
      </div>
    </div>
  );
}
