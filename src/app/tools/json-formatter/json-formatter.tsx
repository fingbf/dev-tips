"use client";

import { useState, useCallback, useRef, useEffect } from "react";

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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">JSON整形ツール</h1>
          <p className="text-sm text-gray-400">
            JSONを整形・圧縮・バリデーション。
            <span className="inline-flex items-center gap-1 ml-2 text-green-400">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              入力データはサーバーに送信されません（ブラウザ内で完結）
            </span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400" aria-label="インデントサイズ">
            <span>インデント:</span>
            <button
              aria-pressed={indent === 2}
              onClick={() => setIndent(2)}
              className={`px-3 py-1 rounded ${indent === 2 ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"}`}
            >
              2スペース
            </button>
            <button
              aria-pressed={indent === 4}
              onClick={() => setIndent(4)}
              className={`px-3 py-1 rounded ${indent === 4 ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"}`}
            >
              4スペース
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={handlePaste}
              className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              クリップボードから貼り付け
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              クリア
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-400">入力</span>
            {sizeWarning && (
              <p className="text-xs text-yellow-400">入力が大きいため、整形に時間がかかる場合があります</p>
            )}
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
                setSizeWarning(e.target.value.length > MAX_WARN_SIZE);
              }}
              placeholder='{"key": "value"} を貼り付けてください'
              className="flex-1 min-h-[400px] bg-gray-900 border border-gray-700 rounded p-3 font-mono text-sm text-gray-100 resize-none focus:outline-none focus:border-blue-500"
              spellCheck={false}
            />
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">出力</span>
              {output && (
                <button
                  onClick={handleCopy}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {copied ? "コピーしました！" : "コピー"}
                </button>
              )}
            </div>
            <div
              tabIndex={0}
              className={`flex-1 min-h-[400px] bg-gray-900 border rounded p-3 font-mono text-sm whitespace-pre overflow-auto focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                error ? "border-red-500 text-red-400" : "border-gray-700 text-gray-100"
              }`}
            >
              {error ? (
                <div className="text-red-400">
                  <div className="font-semibold mb-1">JSONエラー</div>
                  <div>{error}</div>
                </div>
              ) : (
                output || <span className="text-gray-600">整形結果がここに表示されます</span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleFormat}
            disabled={!input.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded font-medium transition-colors"
          >
            整形
          </button>
          <button
            onClick={handleMinify}
            disabled={!input.trim()}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded font-medium transition-colors"
          >
            圧縮（Minify）
          </button>
        </div>
      </div>
    </div>
  );
}
