"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import cronstrue from "cronstrue/i18n";
import { CronExpressionParser } from "cron-parser";

type CronMode = "unix" | "quartz";

type FieldOption = {
  label: string;
  value: string;
};

const MINUTE_OPTIONS: FieldOption[] = [
  { label: "毎分", value: "*" },
  { label: "5分ごと", value: "*/5" },
  { label: "10分ごと", value: "*/10" },
  { label: "15分ごと", value: "*/15" },
  { label: "30分ごと", value: "*/30" },
  { label: "0分（毎時ちょうど）", value: "0" },
];

const HOUR_OPTIONS: FieldOption[] = [
  { label: "毎時", value: "*" },
  { label: "2時間ごと", value: "*/2" },
  { label: "3時間ごと", value: "*/3" },
  { label: "6時間ごと", value: "*/6" },
  { label: "12時間ごと", value: "*/12" },
];

const DOM_OPTIONS: FieldOption[] = [
  { label: "毎日", value: "*" },
  { label: "1日", value: "1" },
  { label: "15日", value: "15" },
  { label: "月末", value: "L" },
];

const MONTH_OPTIONS: FieldOption[] = [
  { label: "毎月", value: "*" },
  { label: "1月", value: "1" },
  { label: "2月", value: "2" },
  { label: "3月", value: "3" },
  { label: "4月", value: "4" },
  { label: "5月", value: "5" },
  { label: "6月", value: "6" },
  { label: "7月", value: "7" },
  { label: "8月", value: "8" },
  { label: "9月", value: "9" },
  { label: "10月", value: "10" },
  { label: "11月", value: "11" },
  { label: "12月", value: "12" },
  { label: "四半期ごと（1,4,7,10月）", value: "1,4,7,10" },
];

const DOW_OPTIONS: FieldOption[] = [
  { label: "毎日", value: "*" },
  { label: "平日（月〜金）", value: "1-5" },
  { label: "週末（土日）", value: "0,6" },
  { label: "月曜", value: "1" },
  { label: "火曜", value: "2" },
  { label: "水曜", value: "3" },
  { label: "木曜", value: "4" },
  { label: "金曜", value: "5" },
  { label: "土曜", value: "6" },
  { label: "日曜", value: "0" },
];

const PRESETS = [
  { label: "毎分", expression: "* * * * *" },
  { label: "毎時0分", expression: "0 * * * *" },
  { label: "毎日 0:00", expression: "0 0 * * *" },
  { label: "毎日 9:00", expression: "0 9 * * *" },
  { label: "平日 9:00", expression: "0 9 * * 1-5" },
  { label: "毎週月曜 9:00", expression: "0 9 * * 1" },
  { label: "毎月1日 0:00", expression: "0 0 1 * *" },
  { label: "毎年1月1日 0:00", expression: "0 0 1 1 *" },
];

function getDescription(expression: string, mode: CronMode): string {
  try {
    const opts = {
      locale: "ja",
      use24HourTimeFormat: true,
    };
    if (mode === "quartz") {
      return cronstrue.toString(expression, {
        ...opts,
      });
    }
    return cronstrue.toString(expression, opts);
  } catch {
    return "無効なCron式です";
  }
}

function getNextExecutions(
  expression: string,
  count: number
): { dates: Date[]; error: string | null } {
  try {
    const interval = CronExpressionParser.parse(expression, { tz: "Asia/Tokyo" });
    const dates: Date[] = [];
    for (let i = 0; i < count; i++) {
      dates.push(interval.next().toDate());
    }
    return { dates, error: null };
  } catch {
    return { dates: [], error: "次回実行日時を計算できません" };
  }
}

function formatDate(date: Date): string {
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function unixToQuartz(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return expression;
  const [min, hour, dom, month, dow] = parts;
  // Quartz: SEC MIN HOUR DOM MONTH DOW
  // Quartz では DOW に * がある場合は ? を使う（DOM と DOW の競合回避）
  const quartzDow = dow === "*" ? "?" : dow;
  const quartzDom = dom === "*" && quartzDow !== "?" ? "?" : dom;
  return `0 ${min} ${hour} ${quartzDom} ${month} ${quartzDow}`;
}

function quartzToUnix(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 6) return expression;
  const [, min, hour, dom, month, dow] = parts;
  const unixDom = dom === "?" ? "*" : dom;
  const unixDow = dow === "?" ? "*" : dow;
  return `${min} ${hour} ${unixDom} ${month} ${unixDow}`;
}

export function CronGenerator() {
  const [mode, setMode] = useState<CronMode>("unix");
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [dom, setDom] = useState("*");
  const [month, setMonth] = useState("*");
  const [dow, setDow] = useState("*");
  const [manualInput, setManualInput] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [copied, setCopied] = useState(false);

  const unixExpression = useMemo(() => {
    if (isManual) {
      if (mode === "quartz") {
        return quartzToUnix(manualInput);
      }
      return manualInput;
    }
    return `${minute} ${hour} ${dom} ${month} ${dow}`;
  }, [isManual, manualInput, mode, minute, hour, dom, month, dow]);

  const displayExpression = useMemo(() => {
    if (isManual) return manualInput;
    if (mode === "quartz") {
      return unixToQuartz(`${minute} ${hour} ${dom} ${month} ${dow}`);
    }
    return `${minute} ${hour} ${dom} ${month} ${dow}`;
  }, [isManual, manualInput, mode, minute, hour, dom, month, dow]);

  const description = useMemo(
    () => getDescription(displayExpression, mode),
    [displayExpression, mode]
  );

  const nextExecutions = useMemo(
    () => getNextExecutions(unixExpression, 5),
    [unixExpression]
  );

  const applyPreset = useCallback(
    (expression: string) => {
      const parts = expression.split(" ");
      if (parts.length === 5) {
        setMinute(parts[0]);
        setHour(parts[1]);
        setDom(parts[2]);
        setMonth(parts[3]);
        setDow(parts[4]);
        setIsManual(false);
      }
    },
    []
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(displayExpression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayExpression]);

  const fieldLabels = mode === "unix"
    ? ["分", "時", "日", "月", "曜日"]
    : ["秒", "分", "時", "日", "月", "曜日"];

  const expressionParts = displayExpression.trim().split(/\s+/);

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
          Cron式ジェネレーター
        </span>
      </nav>

      {/* タイトル */}
      <div>
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">
          Cron式ジェネレーター
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          GUIでCron式を組み立て。日本語で意味を解説し、次回実行日時も表示します。
        </p>
      </div>

      {/* モード切替 */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setMode("unix");
            setIsManual(false);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "unix"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          Unix / crontab
        </button>
        <button
          onClick={() => {
            setMode("quartz");
            setIsManual(false);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "quartz"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          Quartz / Spring
        </button>
      </div>

      {/* 結果表示 */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        {/* Cron式 */}
        <div className="mb-3 flex items-center gap-3">
          <code className="flex-1 rounded-md bg-zinc-900 px-4 py-3 font-mono text-lg text-emerald-400 dark:bg-zinc-800">
            {displayExpression}
          </code>
          <button
            onClick={handleCopy}
            className="rounded-md bg-zinc-200 px-3 py-2 text-sm transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* フィールド分解表示 */}
        <div className="mb-3 flex gap-1 overflow-x-auto">
          {expressionParts.map((part, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-md bg-white px-3 py-1 text-xs dark:bg-zinc-800"
            >
              <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                {part}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {fieldLabels[i] ?? ""}
              </span>
            </div>
          ))}
        </div>

        {/* 日本語解説 */}
        <p className="text-base font-medium text-zinc-800 dark:text-zinc-200">
          {description}
        </p>
      </div>

      {/* プリセット */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          プリセット
        </h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.expression}
              onClick={() => applyPreset(preset.expression)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* GUI入力 / 手動入力 切替 */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsManual(false)}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            !isManual
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          GUI入力
        </button>
        <button
          onClick={() => {
            setIsManual(true);
            setManualInput(displayExpression);
          }}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            isManual
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          手動入力
        </button>
      </div>

      {isManual ? (
        /* 手動入力 */
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Cron式を入力（{mode === "unix" ? "5フィールド" : "6フィールド"}）
          </label>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={mode === "unix" ? "* * * * *" : "0 * * * * ?"}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 font-mono text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
      ) : (
        /* GUI入力 */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FieldSelect
            label="分"
            value={minute}
            onChange={setMinute}
            options={MINUTE_OPTIONS}
            allowCustom
          />
          <FieldSelect
            label="時"
            value={hour}
            onChange={setHour}
            options={HOUR_OPTIONS}
            allowCustom
          />
          <FieldSelect
            label="日"
            value={dom}
            onChange={setDom}
            options={DOM_OPTIONS}
            allowCustom
          />
          <FieldSelect
            label="月"
            value={month}
            onChange={setMonth}
            options={MONTH_OPTIONS}
            allowCustom
          />
          <FieldSelect
            label="曜日"
            value={dow}
            onChange={setDow}
            options={DOW_OPTIONS}
            allowCustom
          />
        </div>
      )}

      {/* 次回実行日時 */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">次回実行日時（JST）</h2>
        {nextExecutions.error ? (
          <p className="text-sm text-red-500">{nextExecutions.error}</p>
        ) : (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
            {nextExecutions.dates.map((date, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2 ${
                  i > 0
                    ? "border-t border-zinc-200 dark:border-zinc-700"
                    : ""
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {i + 1}
                </span>
                <span className="font-mono text-sm">{formatDate(date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 使い方解説 */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">Cron式の書き方</h2>
        <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          <div>
            <h3 className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">
              Unix crontab（5フィールド）
            </h3>
            <code className="block rounded bg-zinc-200 px-3 py-2 font-mono dark:bg-zinc-800">
              分 時 日 月 曜日
            </code>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">
              Quartz / Spring（6フィールド）
            </h3>
            <code className="block rounded bg-zinc-200 px-3 py-2 font-mono dark:bg-zinc-800">
              秒 分 時 日 月 曜日
            </code>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-zinc-900 dark:text-zinc-100">
              特殊文字
            </h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-300 dark:border-zinc-600">
                  <th className="py-1 pr-4 font-medium">記号</th>
                  <th className="py-1 font-medium">意味</th>
                  <th className="py-1 pl-4 font-medium">例</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <td className="py-1 pr-4">*</td>
                  <td className="py-1 font-sans">すべての値</td>
                  <td className="py-1 pl-4">毎分、毎時</td>
                </tr>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <td className="py-1 pr-4">*/n</td>
                  <td className="py-1 font-sans">n間隔</td>
                  <td className="py-1 pl-4">*/5 → 5分ごと</td>
                </tr>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <td className="py-1 pr-4">a-b</td>
                  <td className="py-1 font-sans">範囲</td>
                  <td className="py-1 pl-4">1-5 → 月〜金</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">a,b,c</td>
                  <td className="py-1 font-sans">リスト</td>
                  <td className="py-1 pl-4">1,15 → 1日と15日</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="mb-2 font-medium text-zinc-900 dark:text-zinc-100">
              よく使われるシーン
            </h3>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>crontab</strong> — Linux / macOS のタスクスケジューラ
              </li>
              <li>
                <strong>GitHub Actions</strong> —{" "}
                <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
                  schedule.cron
                </code>
              </li>
              <li>
                <strong>Vercel Cron Jobs</strong> —{" "}
                <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
                  vercel.json
                </code>
              </li>
              <li>
                <strong>Spring Scheduler</strong> —{" "}
                <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
                  @Scheduled(cron = &quot;...&quot;)
                </code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* フィールド選択コンポーネント */
function FieldSelect({
  label,
  value,
  onChange,
  options,
  allowCustom,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FieldOption[];
  allowCustom?: boolean;
}) {
  const isCustom = !options.some((o) => o.value === value);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        value={isCustom ? "__custom__" : value}
        onChange={(e) => {
          if (e.target.value === "__custom__") return;
          onChange(e.target.value);
        }}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} ({opt.value})
          </option>
        ))}
        {allowCustom && (
          <option value="__custom__">カスタム値...</option>
        )}
      </select>
      {allowCustom && isCustom && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="例: 0,30 or 1-5"
        />
      )}
    </div>
  );
}
