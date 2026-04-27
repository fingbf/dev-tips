"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { convertLine } from "./work-time-rounder.utils";

function convert(input: string): string {
  return input.split("\n").map(convertLine).join("\n");
}

export function WorkTimeRounder() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const output = convert(input);

  const handleClear = useCallback(() => setInput(""), []);

  const handleCopy = useCallback(async () => {
    if (!output.trim()) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      // navigator.clipboard が使えない環境（非httpsなど）向けフォールバック
      const el = document.createElement("textarea");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      el.value = output;
      document.body.appendChild(el);
      try {
        el.select();
        document.execCommand("copy");
      } finally {
        document.body.removeChild(el);
      }
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [output]);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">
          Dev Tips
        </Link>
        <span className="mx-2">/</span>
        <Link href="/tools" className="hover:text-zinc-700 dark:hover:text-zinc-200">
          ツール
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900 dark:text-zinc-100">時間丸め変換</span>
      </nav>

      <div>
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">時間丸め変換ツール</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          開始時間を15分単位で切り上げ、終了時間を15分単位で切り下げて変換します。
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">入力形式</p>
          <p>
            1行に「開始時間
            <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded mx-0.5">Tab</span>
            終了時間」または「開始時間
            <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded mx-0.5">,</span>
            終了時間」で入力。複数行対応。
          </p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            例: <span className="font-mono">9:05{"\t"}18:47</span>
            {" → "}
            <span className="font-mono">9:15{"\t"}18:45</span>
          </p>
        </div>

        {/* 2カラムエディタ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 入力 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">入力</span>
              <button
                onClick={handleClear}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                クリア
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"9:05\t18:47\n8:52\t17:33\n10:00,19:20"}
              className="flex-1 min-h-[400px] border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900 rounded p-3 font-mono text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              spellCheck={false}
            />
          </div>

          {/* 出力 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">変換結果</span>
              {output.trim() && (
                <button
                  onClick={handleCopy}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {copied ? "コピーしました！" : "コピー"}
                </button>
              )}
            </div>
            <textarea
              readOnly
              value={output}
              placeholder="変換結果がここに表示されます"
              className="flex-1 min-h-[400px] border border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50 rounded p-3 font-mono text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 text-sm text-zinc-600 dark:text-zinc-400">
          <p className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">変換ルール</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              開始時間: 15分単位で
              <strong className="text-zinc-800 dark:text-zinc-200">切り上げ</strong>
              （例: 9:03 → 9:15、9:00 → 9:00）
            </li>
            <li>
              終了時間: 15分単位で
              <strong className="text-zinc-800 dark:text-zinc-200">切り下げ</strong>
              （例: 18:47 → 18:45、18:00 → 18:00）
            </li>
            <li>区切り文字（タブ・カンマ）はそのまま引き継ぎます</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            ※ 丸め処理の適用は、就業規則・労使協定の内容をご確認のうえご利用ください。
          </p>
        </div>
      </div>
    </div>
  );
}
