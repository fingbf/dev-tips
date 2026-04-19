"use client";

import { useState, useMemo, useRef, useEffect } from "react";

type FlagKey = "g" | "i" | "m" | "s";
type TabKey = "match" | "replace";

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

const FLAG_DEFS: { key: FlagKey; label: string; desc: string }[] = [
  { key: "g", label: "g", desc: "全マッチ" },
  { key: "i", label: "i", desc: "大小無視" },
  { key: "m", label: "m", desc: "複数行" },
  { key: "s", label: "s", desc: ". が改行含む" },
];

const GROUP_COLORS = [
  "bg-yellow-200 dark:bg-yellow-700",
  "bg-blue-200 dark:bg-blue-700",
  "bg-green-200 dark:bg-green-700",
  "bg-pink-200 dark:bg-pink-700",
  "bg-orange-200 dark:bg-orange-700",
  "bg-purple-200 dark:bg-purple-700",
];
const GROUP_TEXT_COLORS = [
  "text-yellow-700 dark:text-yellow-300",
  "text-blue-700 dark:text-blue-300",
  "text-green-700 dark:text-green-300",
  "text-pink-700 dark:text-pink-300",
  "text-orange-700 dark:text-orange-300",
  "text-purple-700 dark:text-purple-300",
];

type Sample = { label: string; pattern: string; flags: Record<FlagKey, boolean>; testString: string };
const SAMPLES: Sample[] = [
  {
    label: "メールアドレス",
    pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+",
    flags: { g: true, i: true, m: false, s: false },
    testString: "お問い合わせは info@example.com または support@test.co.jp まで。",
  },
  {
    label: "電話番号",
    pattern: "\\d{2,4}-\\d{2,4}-\\d{4}",
    flags: { g: true, i: false, m: false, s: false },
    testString: "TEL: 03-1234-5678 / FAX: 06-9876-5432",
  },
  {
    label: "日付",
    pattern: "\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}",
    flags: { g: true, i: false, m: false, s: false },
    testString: "開始日: 2024-01-15 終了日: 2024/12/31",
  },
  {
    label: "URLマッチ",
    pattern: "https?:\\/\\/[\\w/:%#$&?()~.=+\\-]+",
    flags: { g: true, i: true, m: false, s: false },
    testString: "公式サイト: https://example.com/path?q=1 ドキュメント: http://docs.example.com",
  },
  {
    label: "HTMLタグ除去",
    pattern: "<[^>]*>",
    flags: { g: true, i: true, m: false, s: false },
    testString: "<h1>タイトル</h1><p class=\"lead\">本文テキスト</p>",
  },
  {
    label: "数字のみ抽出",
    pattern: "\\d+",
    flags: { g: true, i: false, m: false, s: false },
    testString: "商品A: 1500円 / 商品B: 2800円 / 合計: 4300円",
  },
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

function applyReplace(regex: RegExp, text: string, replacement: string): string {
  try {
    const re = new RegExp(regex.source, regex.flags);
    return text.replace(re, replacement);
  } catch {
    return text;
  }
}

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({ g: true, i: false, m: false, s: false });
  const [testString, setTestString] = useState("");
  const [replacement, setReplacement] = useState("");
  const [tab, setTab] = useState<TabKey>("match");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const toggleFlag = (key: FlagKey) => setFlags((f) => ({ ...f, [key]: !f[key] }));

  const applySample = (s: Sample) => {
    setPattern(s.pattern);
    setFlags(s.flags);
    setTestString(s.testString);
    setReplacement("");
  };

  const result: RegexResult = useMemo(() => buildRegexResult(pattern, flags), [pattern, flags]);

  const matches: MatchInfo[] = useMemo(() => {
    if (!result || !result.ok || !testString) return [];
    return collectMatches(result.regex, testString);
  }, [result, testString]);

  const segments: Segment[] = useMemo(() => {
    if (!testString) return [];
    return buildSegments(testString, matches);
  }, [testString, matches]);

  const replaceResult: string | null = useMemo(() => {
    if (!result || !result.ok || !testString) return null;
    return applyReplace(result.regex, testString, replacement);
  }, [result, testString, replacement]);

  const groupCount = useMemo(() => {
    if (matches.length === 0) return 0;
    return Math.max(...matches.map((m) => m.groups.length));
  }, [matches]);

  useEffect(() => {
    const ta = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!ta || !mirror) return;
    const sync = () => { mirror.scrollTop = ta.scrollTop; mirror.scrollLeft = ta.scrollLeft; };
    ta.addEventListener("scroll", sync);
    return () => ta.removeEventListener("scroll", sync);
  }, []);

  const isError = result !== null && !result.ok;
  const matchCount = matches.length;
  const hasPattern = pattern.length > 0;
  const showHighlight = hasPattern && !isError && tab === "match";

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div>
        <h1 className="mb-1 text-2xl font-bold md:text-3xl">正規表現テスター</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          JavaScript RegExp でリアルタイム検証。マッチ・置換両対応。ブラウザ内完結。
        </p>
      </div>

      {/* サンプル */}
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => applySample(s)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* パターン入力バー */}
      <div className="rounded-lg border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">EXPRESSION</span>
          {hasPattern && !isError && (
            <span className={[
              "ml-auto text-xs px-2 py-0.5 rounded-full font-medium",
              matchCount > 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
            ].join(" ")}>
              {matchCount > 0 ? `${matchCount} match${matchCount > 1 ? "es" : ""}` : "no match"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 px-3 py-2">
          <span className="font-mono text-lg text-zinc-400 select-none">/</span>
          <input
            id="regex-pattern"
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="\d+"
            spellCheck={false}
            autoComplete="off"
            className={[
              "flex-1 bg-transparent font-mono text-base focus:outline-none",
              isError ? "text-red-500 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100",
            ].join(" ")}
          />
          <span className="font-mono text-lg text-zinc-400 select-none">/</span>
          <div className="flex gap-1 ml-1">
            {FLAG_DEFS.map(({ key, label, desc }) => (
              <button
                key={key}
                type="button"
                aria-pressed={flags[key]}
                title={desc}
                onClick={() => toggleFlag(key)}
                className={[
                  "px-2 py-0.5 rounded font-mono text-sm font-bold transition-colors",
                  flags[key]
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {isError && (
          <div className="px-3 py-2 border-t border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 rounded-b-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              ⚠ {(result as { ok: false; error: string }).error}
            </p>
          </div>
        )}
        <div className="flex gap-4 px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800">
          {FLAG_DEFS.map(({ key, label, desc }) => (
            <span key={key} className={[
              "text-xs",
              flags[key] ? "text-blue-600 dark:text-blue-400 font-medium" : "text-zinc-400",
            ].join(" ")}>
              <span className="font-mono">{label}</span>: {desc}
            </span>
          ))}
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {([["match", "マッチ確認"], ["replace", "置換"]] as [TabKey, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* メインエリア */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* 左: テスト文字列 */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">TEST STRING</span>
            </div>
            <div className="relative bg-white dark:bg-zinc-900">
              <div
                ref={mirrorRef}
                aria-hidden="true"
                className="absolute inset-0 px-3 py-3 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden pointer-events-none select-none"
                style={{ lineHeight: "1.5rem" }}
              >
                {showHighlight && testString
                  ? segments.map((seg, i) =>
                      seg.isMatch ? (
                        <mark key={i} className={`${GROUP_COLORS[0]} text-transparent rounded-sm`}>
                          {seg.text || " "}
                        </mark>
                      ) : (
                        <span key={i} className="text-transparent">{seg.text}</span>
                      )
                    )
                  : null}
              </div>
              <textarea
                ref={textareaRef}
                id="regex-test-string"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="テスト対象のテキストをここに入力..."
                spellCheck={false}
                rows={10}
                className="relative w-full bg-transparent px-3 py-3 font-mono text-sm focus:outline-none resize-none"
                style={{
                  lineHeight: "1.5rem",
                  caretColor: "currentColor",
                  color: showHighlight && testString ? "transparent" : undefined,
                }}
              />
            </div>
          </div>

          {/* 置換タブ: 置換文字列入力 + 結果 */}
          {tab === "replace" && (
            <>
              <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">REPLACEMENT</span>
                  <span className="ml-2 text-xs text-zinc-400">キャプチャグループは $1, $2 ... で参照可</span>
                </div>
                <input
                  type="text"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  placeholder="例: $1-$2  または  置換後の文字列"
                  spellCheck={false}
                  className="w-full bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm focus:outline-none"
                />
              </div>
              <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">RESULT</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 px-3 py-3 font-mono text-sm whitespace-pre-wrap break-words min-h-[80px]">
                  {replaceResult !== null
                    ? replaceResult || <span className="text-zinc-400 italic">（空文字列）</span>
                    : <span className="text-zinc-400">パターンとテスト文字列を入力してください</span>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 右: マッチ詳細 + クイックリファレンス */}
        <div className="w-full lg:w-72 shrink-0 space-y-3">
          {/* マッチ情報（マッチタブのみ） */}
          {tab === "match" && (
            <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">MATCH INFORMATION</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
                {!hasPattern ? (
                  <p className="px-3 py-4 text-sm text-zinc-400">パターンを入力してください</p>
                ) : isError ? (
                  <p className="px-3 py-4 text-sm text-red-400">正規表現が無効です</p>
                ) : matchCount === 0 ? (
                  <p className="px-3 py-4 text-sm text-zinc-400">
                    {testString ? "マッチなし" : "テスト文字列を入力してください"}
                  </p>
                ) : (
                  matches.map((m, i) => (
                    <div key={i} className="px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${GROUP_COLORS[0]} ${GROUP_TEXT_COLORS[0]}`}>
                          Match {i + 1}
                        </span>
                        <span className="text-xs text-zinc-400">{m.index}–{m.index + m.fullMatch.length}</span>
                      </div>
                      <p className="font-mono text-sm text-zinc-800 dark:text-zinc-200 break-all">
                        {m.fullMatch || <span className="text-zinc-400 italic text-xs">（空文字列）</span>}
                      </p>
                      {m.groups.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {m.groups.map((g, gi) => (
                            <div key={gi} className="flex items-center gap-2">
                              <span className={`text-xs px-1 py-0.5 rounded font-mono ${GROUP_COLORS[gi + 1] ?? GROUP_COLORS[GROUP_COLORS.length - 1]} ${GROUP_TEXT_COLORS[gi + 1] ?? GROUP_TEXT_COLORS[GROUP_TEXT_COLORS.length - 1]}`}>
                                G{gi + 1}
                              </span>
                              <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300 break-all">
                                {g === undefined ? <span className="text-zinc-400">未参加</span> : g || <span className="text-zinc-400 italic">空</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {matchCount >= MAX_DISPLAY && (
                  <p className="px-3 py-2 text-xs text-zinc-400">※ {MAX_DISPLAY}件以上（表示は最大{MAX_DISPLAY}件）</p>
                )}
              </div>
            </div>
          )}

          {/* クイックリファレンス */}
          <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">QUICK REFERENCE</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono space-y-1 text-zinc-600 dark:text-zinc-400">
              {[
                [".", "改行以外の任意の1文字"],
                ["\\d", "数字 [0-9]"],
                ["\\w", "英数字・アンダースコア"],
                ["\\s", "空白・タブ・改行"],
                ["^", "行頭"],
                ["$", "行末"],
                ["*", "0回以上"],
                ["+", "1回以上"],
                ["?", "0または1回"],
                ["(...)", "キャプチャグループ"],
                ["$1, $2", "グループ参照（置換時）"],
                ["|", "OR"],
              ].map(([sym, desc]) => (
                <div key={sym} className="flex gap-2">
                  <span className="w-16 shrink-0 text-zinc-800 dark:text-zinc-200">{sym}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
