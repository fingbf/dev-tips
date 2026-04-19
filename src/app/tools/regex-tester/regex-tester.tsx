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
type SampleCategory = { category: string; items: Sample[] };

const SAMPLE_CATEGORIES: SampleCategory[] = [
  {
    category: "バリデーション",
    items: [
      {
        label: "メールアドレス",
        pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+",
        flags: { g: true, i: true, m: false, s: false },
        testString: "連絡先: info@example.com / support@test.co.jp / invalid@",
      },
      {
        label: "URL",
        pattern: "https?:\\/\\/[\\w/:%#$&?()~.=+\\-]+",
        flags: { g: true, i: true, m: false, s: false },
        testString: "サイト: https://example.com/path?q=1 / http://docs.example.com",
      },
      {
        label: "日付 YYYY-MM-DD",
        pattern: "\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}",
        flags: { g: true, i: false, m: false, s: false },
        testString: "開始: 2024-01-15 / 終了: 2024/12/31 / 不正: 24-1-1",
      },
      {
        label: "IPv4アドレス",
        pattern: "(?:\\d{1,3}\\.){3}\\d{1,3}",
        flags: { g: true, i: false, m: false, s: false },
        testString: "サーバー: 192.168.1.1 / DNS: 8.8.8.8 / localhost: 127.0.0.1",
      },
      {
        label: "HEXカラーコード",
        pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
        flags: { g: true, i: true, m: false, s: false },
        testString: "primary: #FF5733 / secondary: #333 / bg: #1a2b3c / invalid: #GGHHII",
      },
      {
        label: "UUID",
        pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        flags: { g: true, i: true, m: false, s: false },
        testString: "id: 550e8400-e29b-41d4-a716-446655440000 / invalid: 550e8400-e29b-41d",
      },
      {
        label: "セマンティックバージョン",
        pattern: "v?\\d+\\.\\d+\\.\\d+(?:-[a-zA-Z0-9.]+)?(?:\\+[a-zA-Z0-9.]+)?",
        flags: { g: true, i: false, m: false, s: false },
        testString: "リリース: v1.0.0 / v2.3.4-beta.1 / 1.0.0-rc.1+build.123 / 不正: v1.0 / 1.2",
      },
    ],
  },
  {
    category: "テキスト処理",
    items: [
      {
        label: "HTMLタグ除去",
        pattern: "<[^>]*>",
        flags: { g: true, i: true, m: false, s: false },
        testString: "<h1>タイトル</h1><p class=\"lead\">本文テキスト</p><br/>",
      },
      {
        label: "連続空白の正規化",
        pattern: "\\s{2,}",
        flags: { g: true, i: false, m: false, s: false },
        testString: "これは   スペースが    多すぎる\tテキストです。",
      },
      {
        label: "数字を抽出",
        pattern: "-?\\d+(?:\\.\\d+)?",
        flags: { g: true, i: false, m: false, s: false },
        testString: "商品: 1500円 / 割引: -300円 / 税率: 10.5% / 合計: 1320円",
      },
      {
        label: "Markdownリンク",
        pattern: "\\[([^\\]]+)\\]\\(([^)]+)\\)",
        flags: { g: true, i: false, m: false, s: false },
        testString: "[Google](https://google.com) と [GitHub](https://github.com) を参照。",
      },
      {
        label: "ファイル拡張子",
        pattern: "\\.([a-zA-Z0-9]+)$",
        flags: { g: false, i: true, m: true, s: false },
        testString: "index.html\nstyle.css\nscript.min.js\nREADME.md\nimage.PNG\nno-extension",
      },
      {
        label: "空行除去",
        pattern: "^[ \\t]*$",
        flags: { g: true, i: false, m: true, s: false },
        testString: "行1\n\n行2\n\n\n行3\n   \n行4",
      },
    ],
  },
  {
    category: "日本語",
    items: [
      {
        label: "ひらがな",
        pattern: "[\\u3041-\\u3096]+",
        flags: { g: true, i: false, m: false, s: false },
        testString: "日本語のテキスト。ひらがな、カタカナ、漢字が混在しています。",
      },
      {
        label: "カタカナ",
        pattern: "[\\u30A1-\\u30FA]+",
        flags: { g: true, i: false, m: false, s: false },
        testString: "日本語のテキスト。ひらがな、カタカナ、漢字が混在しています。",
      },
      {
        label: "漢字",
        pattern: "[\\u4E00-\\u9FFF]+",
        flags: { g: true, i: false, m: false, s: false },
        testString: "日本語のテキスト。ひらがな、カタカナ、漢字が混在しています。",
      },
      {
        label: "都道府県",
        pattern: "(?:北海道|東京都|大阪府|京都府|(?:青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)県)",
        flags: { g: true, i: false, m: false, s: false },
        testString: "東京都渋谷区 / 大阪府大阪市 / 神奈川県横浜市 / 北海道札幌市 / 沖縄県那覇市 / 不正: 東京区",
      },
    ],
  },
];

const QUICK_REFERENCE = [
  {
    title: "文字クラス",
    rows: [
      [".", "改行以外の任意の1文字"],
      ["\\d", "数字 [0-9]"],
      ["\\D", "数字以外"],
      ["\\w", "英数字・アンダースコア"],
      ["\\W", "\\w 以外"],
      ["\\s", "空白・タブ・改行"],
      ["\\S", "空白以外"],
      ["[abc]", "a, b, c のいずれか"],
      ["[^abc]", "a, b, c 以外"],
      ["[a-z]", "a〜z の範囲"],
    ],
  },
  {
    title: "量指定子",
    rows: [
      ["*", "0回以上（最長）"],
      ["+", "1回以上（最長）"],
      ["?", "0または1回"],
      ["{n}", "ちょうどn回"],
      ["{n,}", "n回以上"],
      ["{n,m}", "n〜m回"],
      ["*?", "0回以上（最短）"],
      ["+?", "1回以上（最短）"],
    ],
  },
  {
    title: "アンカー",
    rows: [
      ["^", "行頭（m: 各行頭）"],
      ["$", "行末（m: 各行末）"],
      ["\\b", "単語の境界"],
      ["\\B", "単語の境界以外"],
    ],
  },
  {
    title: "グループ",
    rows: [
      ["(...)", "キャプチャグループ"],
      ["(?:...)", "非キャプチャ"],
      ["(?=...)", "肯定先読み"],
      ["(?!...)", "否定先読み"],
      ["(?<=...)", "肯定後読み"],
      ["(?<!...)", "否定後読み"],
      ["|", "OR（どちらか）"],
    ],
  },
  {
    title: "エスケープ",
    rows: [
      ["\\.", "ピリオド（文字）"],
      ["\\(", "括弧（文字）"],
      ["\\\\", "バックスラッシュ"],
      ["\\n", "改行"],
      ["\\t", "タブ"],
      ["\\uXXXX", "Unicode文字"],
    ],
  },
  {
    title: "置換参照",
    rows: [
      ["$1, $2", "キャプチャグループ"],
      ["$&", "マッチ全体"],
      ["$`", "マッチより前"],
      ["$'", "マッチより後"],
      ["$$", "$ リテラル"],
    ],
  },
] as { title: string; rows: string[][] }[];

type WorkerStatus = "idle" | "running" | "timeout";

function buildRegexResult(pattern: string, flags: Record<FlagKey, boolean>): RegexResult {
  if (!pattern) return null;
  const flagStr = (Object.keys(flags) as FlagKey[]).filter((k) => flags[k]).join("");
  try {
    return { ok: true, regex: new RegExp(pattern, flagStr) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "無効な正規表現" };
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
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>("idle");
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [replaceResult, setReplaceResult] = useState<string | null>(null);

  // debounce: 300ms 後にワーカーへ投げる入力をまとめる
  const [debouncedInputs, setDebouncedInputs] = useState({ pattern, flags, testString, replacement });
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInputs({ pattern, flags, testString, replacement });
    }, 300);
    return () => clearTimeout(timer);
  }, [pattern, flags, testString, replacement]);

  // Worker: debounced 入力が変わったら別スレッドで正規表現を実行
  useEffect(() => {
    const { pattern: p, flags: f, testString: t, replacement: r } = debouncedInputs;

    if (!p || !t) {
      setWorkerStatus("idle");
      setMatches([]);
      setSegments([]);
      setReplaceResult(null);
      return;
    }

    // 前回の Worker とタイムアウトをクリア
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (workerRef.current) workerRef.current.terminate();

    const flagStr = (Object.keys(f) as FlagKey[]).filter((k) => f[k]).join("");
    const worker = new Worker(new URL("./regex.worker.ts", import.meta.url));
    workerRef.current = worker;
    setWorkerStatus("running");

    // アンマウントや次の effect 起動時に古いコールバックが state を更新しないようにするフラグ
    let isCancelled = false;

    const clearResults = () => {
      setMatches([]);
      setSegments([]);
      setReplaceResult(null);
    };

    // 500ms 以内に応答がなければ強制終了
    timeoutRef.current = setTimeout(() => {
      if (isCancelled) return;
      worker.terminate();
      workerRef.current = null;
      setWorkerStatus("timeout");
      clearResults();
    }, 500);

    worker.onmessage = (e: MessageEvent) => {
      if (isCancelled) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      worker.terminate();
      workerRef.current = null;
      if (e.data.ok) {
        setMatches(e.data.matches);
        setSegments(e.data.segments);
        setReplaceResult(e.data.replaceResult);
      } else {
        clearResults();
      }
      setWorkerStatus("idle");
    };

    worker.onerror = () => {
      if (isCancelled) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      worker.terminate();
      workerRef.current = null;
      clearResults();
      setWorkerStatus("idle");
    };

    worker.postMessage({ pattern: p, flagStr, text: t, replacement: r });

    return () => {
      isCancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      worker.terminate();
      workerRef.current = null;
    };
  }, [debouncedInputs]);

  const toggleFlag = (key: FlagKey) => setFlags((f) => ({ ...f, [key]: !f[key] }));

  const applySample = (s: Sample) => {
    setPattern(s.pattern);
    setFlags(s.flags);
    setTestString(s.testString);
    setReplacement("");
    setOpenCategory(null);
  };

  // エラー表示はパターン入力に即時反映（debounce なし）
  const result: RegexResult = useMemo(() => buildRegexResult(pattern, flags), [pattern, flags]);

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
  const showHighlight = hasPattern && !isError && tab === "match" && workerStatus === "idle" && segments.length > 0;

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
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">SAMPLES</span>
          <span className="text-xs text-zinc-400">カテゴリを選んでパターンを読み込む</span>
        </div>
        <div className="flex flex-wrap gap-2 px-3 py-2">
          {SAMPLE_CATEGORIES.map((cat) => (
            <div key={cat.category} className="relative">
              <button
                type="button"
                onClick={() => setOpenCategory(openCategory === cat.category ? null : cat.category)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  openCategory === cat.category
                    ? "border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-400"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                {cat.category} ▾
              </button>
              {openCategory === cat.category && (
                <div className="absolute left-0 top-8 z-20 min-w-[180px] rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  {cat.items.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => applySample(s)}
                      className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* パターン入力バー */}
      <div className="rounded-lg border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">EXPRESSION</span>
          {hasPattern && !isError && (
            <span className={[
              "ml-auto text-xs px-2 py-0.5 rounded-full font-medium",
              workerStatus === "timeout"
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                : workerStatus === "running"
                ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                : matchCount > 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
            ].join(" ")}>
              {workerStatus === "timeout"
                ? "⚠ timeout"
                : workerStatus === "running"
                ? "..."
                : matchCount > 0
                ? `${matchCount} match${matchCount > 1 ? "es" : ""}`
                : "no match"}
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
            <div className="flex items-center px-3 py-2 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">TEST STRING</span>
              <span className="ml-2 text-xs text-zinc-400">自由に入力・編集できます</span>
              {testString && (
                <button
                  type="button"
                  onClick={() => setTestString("")}
                  title="クリア"
                  className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  ✕ クリア
                </button>
              )}
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
                        <mark key={i} className={`${GROUP_COLORS[0]} text-zinc-900 dark:text-zinc-100 rounded-sm`}>
                          {seg.text || " "}
                        </mark>
                      ) : (
                        <span key={i} className="text-zinc-900 dark:text-zinc-100">{seg.text}</span>
                      )
                    )
                  : null}
              </div>
              <textarea
                ref={textareaRef}
                id="regex-test-string"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="テスト対象のテキストをここに入力...&#10;（サンプルを読み込んだ後も自由に編集できます）"
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
                  <span className="ml-2 text-xs text-zinc-400">キャプチャグループは $1, $2 ... で参照可。g フラグなしは最初の1件のみ置換</span>
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
                  {workerStatus === "timeout" ? (
                    <span className="text-orange-500 dark:text-orange-400">⚠ タイムアウト: パターンが複雑すぎます</span>
                  ) : replaceResult !== null ? (
                    replaceResult || <span className="text-zinc-400 italic">（空文字列）</span>
                  ) : (
                    <span className="text-zinc-400">パターンとテスト文字列を入力してください</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 右: マッチ詳細 + クイックリファレンス */}
        <div className="w-full lg:w-72 shrink-0 space-y-3">
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
                ) : workerStatus === "timeout" ? (
                  <p className="px-3 py-4 text-sm text-orange-500 dark:text-orange-400">
                    ⚠ タイムアウト: パターンが複雑すぎます
                  </p>
                ) : workerStatus === "running" ? (
                  <p className="px-3 py-4 text-sm text-zinc-400">計算中...</p>
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
            <div className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-mono">
              {QUICK_REFERENCE.map(({ title, rows }) => (
                <div key={title}>
                  <div className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-sans font-medium tracking-wide text-[10px] uppercase">
                    {title}
                  </div>
                  <div className="px-3 py-1 space-y-0.5 text-zinc-600 dark:text-zinc-400">
                    {rows.map(([sym, desc]) => (
                      <div key={sym} className="flex gap-2">
                        <span className="w-20 shrink-0 text-zinc-800 dark:text-zinc-200">{sym}</span>
                        <span className="font-sans">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
