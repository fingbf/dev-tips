"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type LotteryMode = "single" | "order" | "team";

const MODES: { value: LotteryMode; label: string; description: string }[] = [
  {
    value: "single",
    label: "抽選",
    description: "リストからランダムに当選者を選ぶ",
  },
  {
    value: "order",
    label: "順番決め",
    description: "全員の順番をシャッフルして決める",
  },
  {
    value: "team",
    label: "チーム分け",
    description: "メンバーをチームにランダム振り分け",
  },
];

const SLOT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function divideIntoTeams(items: string[], teamCount: number): string[][] {
  const shuffled = shuffle(items);
  const teams: string[][] = Array.from({ length: teamCount }, () => []);
  shuffled.forEach((item, i) => {
    teams[i % teamCount].push(item);
  });
  return teams;
}

export function LotteryTool() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LotteryMode>("single");
  const [input, setInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [teamCount, setTeamCount] = useState(2);
  const [winnerCount, setWinnerCount] = useState(1);

  // 抽選結果
  const [result, setResult] = useState<string | null>(null);
  const [multiResult, setMultiResult] = useState<string[]>([]);
  const [orderResult, setOrderResult] = useState<string[]>([]);
  const [teamResult, setTeamResult] = useState<string[][]>([]);

  // アニメーション
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotDisplay, setSlotDisplay] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アンマウント時のクリーンアップ (C-2)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // URLパラメータから項目を復元
  useEffect(() => {
    const itemsParam = searchParams.get("items");
    if (itemsParam) {
      const MAX_ITEMS = 100;
      const decoded = decodeURIComponent(itemsParam).split(",").filter(Boolean).slice(0, MAX_ITEMS);
      if (decoded.length > 0) {
        setItems(decoded);
      }
    }
  }, [searchParams]);

  const MAX_ITEMS = 100;

  const addItem = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setItems((prev) => {
      if (prev.length >= MAX_ITEMS || prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setInput("");
  }, [input]);

  const addBulk = useCallback((text: string) => {
    const parsed = text
      .split(/[,\n、]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length > 0) {
      setItems((prev) => {
        const unique = parsed.filter((s) => !prev.includes(s));
        return [...prev, ...unique].slice(0, MAX_ITEMS);
      });
    }
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setResult(null);
    setMultiResult([]);
    setOrderResult([]);
    setTeamResult([]);
  }, []);

  const startLottery = useCallback(() => {
    if (items.length < 2) return;
    setIsSpinning(true);
    setResult(null);
    setMultiResult([]);
    setOrderResult([]);
    setTeamResult([]);

    const totalTicks = 20 + Math.floor(Math.random() * 10);
    const effectiveWinners = Math.min(winnerCount, items.length);

    function tick(count: number) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      setSlotDisplay(randomItem);

      if (count >= totalTicks) {
        setIsSpinning(false);

        switch (mode) {
          case "single": {
            const shuffled = shuffle(items);
            const winners = shuffled.slice(0, effectiveWinners);
            if (effectiveWinners === 1) {
              setSlotDisplay(winners[0]);
              setResult(winners[0]);
            } else {
              setSlotDisplay(winners[0]);
              setMultiResult(winners);
            }
            break;
          }
          case "order": {
            const shuffled = shuffle(items);
            setOrderResult(shuffled);
            setSlotDisplay(shuffled[0]);
            break;
          }
          case "team": {
            const teams = divideIntoTeams(items, teamCount);
            setTeamResult(teams);
            setSlotDisplay("");
            break;
          }
        }
        return;
      }

      timeoutRef.current = setTimeout(() => tick(count + 1), 60 + count * 8);
    }
    tick(0);
  }, [items, mode, teamCount, winnerCount]);

  // 共有URL生成
  const shareUrl =
    typeof window !== "undefined" && items.length > 0
      ? `${window.location.origin}/tools/lottery?items=${encodeURIComponent(items.join(","))}`
      : "";

  const [shareCopied, setShareCopied] = useState(false);
  const handleShareCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* パンくず */}
      <nav className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">
          Dev Tips
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900 dark:text-zinc-100">抽選ツール</span>
      </nav>

      {/* タイトル */}
      <div>
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">抽選ツール</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          ルーレット演出で抽選・順番決め・チーム分け。登録不要・完全無料。
        </p>
      </div>

      {/* モード選択 */}
      <div className="grid gap-3 md:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => {
              setMode(m.value);
              setResult(null);
              setMultiResult([]);
              setOrderResult([]);
              setTeamResult([]);
            }}
            className={`rounded-lg border p-4 text-left transition-all ${
              mode === m.value
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            }`}
          >
            <div className="mb-1 font-medium">{m.label}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {m.description}
            </div>
          </button>
        ))}
      </div>

      {/* 当選人数（1人抽選モード） */}
      {mode === "single" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            当選人数
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setWinnerCount(n)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  winnerCount === n
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                {n}人
              </button>
            ))}
          </div>
        </div>
      )}

      {/* チーム数（チーム分けモード） */}
      {mode === "team" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            チーム数
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setTeamCount(n)}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  teamCount === n
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                {n}チーム
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 項目入力 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          項目を追加（{items.length}件）
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder="名前やお題を入力してEnter"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
          />
          <button
            onClick={addItem}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            追加
          </button>
        </div>
        <div className="mt-2 flex gap-3">
          <button
            onClick={() => setShowBulk(!showBulk)}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {showBulk ? "閉じる" : "一括入力"}
          </button>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-red-500 hover:underline"
            >
              全て削除
            </button>
          )}
        </div>
        {showBulk && (
          <div className="mt-2">
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={"1行に1つ、またはカンマ区切りで入力\n例:\n田中\n佐藤\n鈴木"}
              rows={5}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
            />
            <button
              onClick={() => {
                if (bulkInput.trim()) {
                  addBulk(bulkInput);
                  setBulkInput("");
                  setShowBulk(false);
                }
              }}
              className="mt-1 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              まとめて追加
            </button>
          </div>
        )}
      </div>

      {/* 項目リスト */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: SLOT_COLORS[i % SLOT_COLORS.length] }}
            >
              {item}
              <button
                onClick={() => removeItem(i)}
                className="ml-1 rounded-full p-0.5 text-white/70 hover:text-white"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 抽選エリア */}
      <div className="rounded-xl border-2 border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        {/* スロット表示 */}
        {(isSpinning || result || orderResult.length > 0) && (
          <div
            className={`mb-6 text-4xl font-bold md:text-6xl ${
              isSpinning ? "animate-pulse" : ""
            }`}
            style={{
              color: result
                ? SLOT_COLORS[items.indexOf(result) % SLOT_COLORS.length]
                : undefined,
            }}
          >
            {slotDisplay || "..."}
          </div>
        )}

        {/* 抽選ボタン */}
        <button
          onClick={startLottery}
          disabled={items.length < 2 || isSpinning}
          className={`rounded-xl px-8 py-4 text-lg font-bold text-white transition-all ${
            items.length < 2
              ? "cursor-not-allowed bg-zinc-400"
              : isSpinning
                ? "cursor-wait bg-yellow-500"
                : "bg-blue-600 shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95"
          }`}
        >
          {isSpinning
            ? "抽選中..."
            : items.length < 2
              ? "2つ以上の項目を追加してください"
              : mode === "single"
                ? winnerCount === 1 ? "抽選する" : `${Math.min(winnerCount, items.length)}人を抽選する`
                : mode === "order"
                  ? "順番を決める"
                  : "チーム分けする"}
        </button>

        {/* 結果: 1人抽選 */}
        {result && !isSpinning && multiResult.length === 0 && (
          <div className="mt-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">結果</p>
            <p
              className="mt-1 text-3xl font-bold"
              style={{
                color:
                  SLOT_COLORS[items.indexOf(result) % SLOT_COLORS.length],
              }}
            >
              {result}
            </p>
          </div>
        )}

        {/* 結果: 複数人抽選 */}
        {multiResult.length > 0 && !isSpinning && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              当選者（{multiResult.length}人）
            </p>
            <div className="mx-auto max-w-sm space-y-2">
              {multiResult.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-zinc-800"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      backgroundColor:
                        SLOT_COLORS[items.indexOf(item) % SLOT_COLORS.length],
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 結果: 順番決め */}
        {orderResult.length > 0 && !isSpinning && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              順番
            </p>
            <div className="mx-auto max-w-sm space-y-2">
              {orderResult.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-zinc-800"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      backgroundColor: SLOT_COLORS[i % SLOT_COLORS.length],
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 結果: チーム分け */}
        {teamResult.length > 0 && !isSpinning && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              チーム分け結果
            </p>
            <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-2">
              {teamResult.map((team, i) => (
                <div
                  key={i}
                  className="rounded-lg border-2 bg-white p-4 dark:bg-zinc-800"
                  style={{
                    borderColor: SLOT_COLORS[i % SLOT_COLORS.length],
                  }}
                >
                  <h3
                    className="mb-2 font-bold"
                    style={{ color: SLOT_COLORS[i % SLOT_COLORS.length] }}
                  >
                    チーム {i + 1}
                  </h3>
                  <div className="space-y-1">
                    {team.map((member, j) => (
                      <p key={j} className="text-sm">
                        {member}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 共有URL */}
      {items.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            この項目リストを共有
          </label>
          <div className="flex gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {shareUrl}
            </code>
            <button
              onClick={handleShareCopy}
              className="shrink-0 rounded-md bg-zinc-200 px-3 py-2 text-xs transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {shareCopied ? "Copied!" : "コピー"}
            </button>
          </div>
        </div>
      )}

      {/* 使い方 */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">使い方</h2>
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <ol className="list-inside list-decimal space-y-1">
            <li>名前やお題を入力して「追加」（一括入力も可）</li>
            <li>モードを選択（1人抽選 / 順番決め / チーム分け）</li>
            <li>「抽選する」ボタンをクリック</li>
            <li>ルーレット演出の後、結果が表示されます</li>
          </ol>
          <div className="mt-3 rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
            <p className="font-medium">こんな場面で</p>
            <ul className="mt-1 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>配信で視聴者を抽選・お題決め</li>
              <li>飲み会の座席決め・罰ゲーム抽選</li>
              <li>チーム分け・発表順の決定</li>
              <li>今日のランチ、何食べる？</li>
            </ul>
          </div>
        </div>
      </div>

      {/* アルゴリズムについて */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">公平性について</h2>
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            このツールは<strong>Fisher-Yatesシャッフルアルゴリズム</strong>を使用しています。
            配列の末尾から先頭に向かって、各要素をランダムな位置の要素と交換することで、
            全ての並び順が均等な確率で出現することが数学的に保証されています。
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-900 p-4 text-xs text-zinc-300">
{`function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}`}
          </pre>
          <p className="mt-3">
            乱数の生成にはブラウザ標準の<code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">Math.random()</code>を使用しており、
            全ての処理はブラウザ内で完結します（サーバーへのデータ送信は一切ありません）。
          </p>
        </div>
      </div>
    </div>
  );
}
