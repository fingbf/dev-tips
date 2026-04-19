"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";

type IndentSize = 2 | 4;
const MAX_WARN_SIZE = 500_000;

function processJson(input: string, indent: IndentSize | undefined): { result: string; error: string | null } {
  try {
    const parsed = JSON.parse(input);
    return { result: JSON.stringify(parsed, null, indent), error: null };
  } catch (e) {
    return { result: "", error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<IndentSize>(2);
  const [copied, setCopied] = useState(false);
  const [sizeWarning, setSizeWarning] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleFormat = useCallback(() => {
    if (!input.trim()) return;
    const { result, error } = processJson(input, indent);
    setOutput(result);
    setError(error);
  }, [input, indent]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) return;
    const { result, error } = processJson(input, undefined);
    setOutput(result);
    setError(error);
  }, [input]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
    setSizeWarning(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      // フォールバック
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

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setOutput("");
      setError(null);
      setSizeWarning(text.length > MAX_WARN_SIZE);
    } catch {
      // 権限拒否の場合は無視（ユーザーは手動でペーストできる）
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* パンくず */}
      <nav className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">
          Dev Tips
        </Link>
        <span className="mx-2">/</span>
        <Link href="/tools" className="hover:text-zinc-700 dark:hover:text-zinc-200">
          ツール
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900 dark:text-zinc-100">JSON整形ツール</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">JSON整形ツール</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          JSONを整形・圧縮・バリデーション。
          <span className="inline-flex items-center gap-1 ml-2 text-green-600 dark:text-green-400">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            入力データはサーバーに送信されません（ブラウザ内で完結）
          </span>
        </p>
      </div>

      <div className="max-w-6xl">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400" aria-label="インデントサイズ">
            <span>インデント:</span>
            <button
              aria-pressed={indent === 2}
              onClick={() => setIndent(2)}
              className={`px-3 py-1 rounded ${indent === 2 ? "bg-blue-600 text-white" : "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"}`}
            >
              2スペース
            </button>
            <button
              aria-pressed={indent === 4}
              onClick={() => setIndent(4)}
              className={`px-3 py-1 rounded ${indent === 4 ? "bg-blue-600 text-white" : "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"}`}
            >
              4スペース
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={handlePaste}
              className="px-3 py-1.5 text-sm border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              クリップボードから貼り付け
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              クリア
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">入力</span>
            {sizeWarning && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">入力が大きいため、整形に時間がかかる場合があります</p>
            )}
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
                setSizeWarning(e.target.value.length > MAX_WARN_SIZE);
              }}
              placeholder='{"key": "value"} を貼り付けてください'
              className="flex-1 min-h-[400px] border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900 rounded p-3 font-mono text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              spellCheck={false}
            />
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">出力</span>
              {output && (
                <button
                  onClick={handleCopy}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {copied ? "コピーしました！" : "コピー"}
                </button>
              )}
            </div>
            <div
              tabIndex={0}
              className={`flex-1 min-h-[400px] border rounded p-3 font-mono text-sm whitespace-pre overflow-auto focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                error
                  ? "border-red-400 bg-white text-red-500 dark:border-red-500 dark:bg-zinc-900 dark:text-red-400"
                  : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              }`}
            >
              {error ? (
                <div>
                  <div className="font-semibold mb-1">JSONエラー</div>
                  <div>{error}</div>
                </div>
              ) : (
                output || <span className="text-zinc-400 dark:text-zinc-600">整形結果がここに表示されます</span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleFormat}
            disabled={!input.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 rounded font-medium transition-colors text-white"
          >
            整形
          </button>
          <button
            onClick={handleMinify}
            disabled={!input.trim()}
            className="px-6 py-2.5 border border-zinc-300 bg-white hover:bg-zinc-50 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 rounded font-medium transition-colors"
          >
            圧縮（Minify）
          </button>
        </div>
      </div>
    </div>
  );
}
