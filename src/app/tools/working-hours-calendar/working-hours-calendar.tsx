"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

type DayInfo = {
  date: string;
  day: number;
  weekday: number;
  isWorking: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isManualOverride: boolean;
};

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidTime(v: string): boolean {
  return /^\d{2}:\d{2}$/.test(v);
}

function isValidDateStr(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function calcDailyHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("ja-JP") + "円";
}

function getTodayStr(): string {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

export function WorkingHoursCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [initialYear] = useState(() => new Date().getFullYear());
  const [initialMonth] = useState(() => new Date().getMonth() + 1);

  const [year, setYear] = useState(() => {
    const y = Number(searchParams.get("y"));
    return y >= 2000 && y <= 2100 ? y : new Date().getFullYear();
  });
  const [month, setMonth] = useState(() => {
    const m = Number(searchParams.get("m"));
    return m >= 1 && m <= 12 ? m : new Date().getMonth() + 1;
  });
  const [startHour, setStartHour] = useState(() => {
    const v = searchParams.get("sh") || DEFAULT_START;
    return isValidTime(v) ? v : DEFAULT_START;
  });
  const [endHour, setEndHour] = useState(() => {
    const v = searchParams.get("eh") || DEFAULT_END;
    return isValidTime(v) ? v : DEFAULT_END;
  });
  const [hourlyRate, setHourlyRate] = useState(() => {
    const r = Number(searchParams.get("rate"));
    return r > 0 ? r : 0;
  });
  const [offDays, setOffDays] = useState<Set<string>>(() => {
    const raw = searchParams.get("off");
    return raw ? new Set(raw.split(",").filter(isValidDateStr)) : new Set();
  });
  const [onDays, setOnDays] = useState<Set<string>>(() => {
    const raw = searchParams.get("on");
    return raw ? new Set(raw.split(",").filter(isValidDateStr)) : new Set();
  });

  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [holidayError, setHolidayError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("holidays-jp");
    if (cached) {
      setHolidays(JSON.parse(cached));
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    fetch("https://holidays-jp.github.io/api/v1/date.json", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setHolidays(data);
        sessionStorage.setItem("holidays-jp", JSON.stringify(data));
      })
      .catch(() => setHolidayError(true))
      .finally(() => clearTimeout(timeoutId));
    return () => controller.abort();
  }, []);

  const updateUrl = useCallback(
    (params: {
      y: number;
      m: number;
      sh: string;
      eh: string;
      rate: number;
      off: Set<string>;
      on: Set<string>;
    }) => {
      const p = new URLSearchParams();
      if (params.y !== initialYear) p.set("y", String(params.y));
      if (params.m !== initialMonth) p.set("m", String(params.m));
      if (params.sh !== DEFAULT_START) p.set("sh", params.sh);
      if (params.eh !== DEFAULT_END) p.set("eh", params.eh);
      if (params.rate > 0) p.set("rate", String(params.rate));
      if (params.off.size > 0) p.set("off", [...params.off].join(","));
      if (params.on.size > 0) p.set("on", [...params.on].join(","));
      router.replace(p.toString() ? `?${p.toString()}` : "?", { scroll: false });
    },
    [router, initialYear, initialMonth]
  );

  const changeMonth = useCallback(
    (delta: number) => {
      let newMonth = month + delta;
      let newYear = year;
      if (newMonth > 12) { newMonth = 1; newYear++; }
      if (newMonth < 1) { newMonth = 12; newYear--; }
      const newOff = new Set<string>();
      const newOn = new Set<string>();
      setYear(newYear);
      setMonth(newMonth);
      setOffDays(newOff);
      setOnDays(newOn);
      updateUrl({ y: newYear, m: newMonth, sh: startHour, eh: endHour, rate: hourlyRate, off: newOff, on: newOn });
    },
    [month, year, startHour, endHour, hourlyRate, updateUrl]
  );

  const days = useMemo<DayInfo[]>(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = toDateStr(year, month, day);
      const weekday = new Date(year, month - 1, day).getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const isHoliday = dateStr in holidays;
      const holidayName = holidays[dateStr];
      const defaultOff = isWeekend || isHoliday;
      let isWorking: boolean;
      let isManualOverride = false;
      if (onDays.has(dateStr)) {
        isWorking = true;
        isManualOverride = true;
      } else if (offDays.has(dateStr)) {
        isWorking = false;
        isManualOverride = true;
      } else {
        isWorking = !defaultOff;
      }
      return { date: dateStr, day, weekday, isWorking, isHoliday, holidayName, isManualOverride };
    });
  }, [year, month, holidays, offDays, onDays]);

  const toggleDay = useCallback(
    (dateStr: string, currentlyWorking: boolean) => {
      const newOff = new Set(offDays);
      const newOn = new Set(onDays);
      const weekday = new Date(dateStr).getDay();
      const defaultOff = weekday === 0 || weekday === 6 || dateStr in holidays;

      if (currentlyWorking) {
        newOn.delete(dateStr);
        if (!defaultOff) {
          newOff.add(dateStr);
        }
      } else {
        newOff.delete(dateStr);
        if (defaultOff) {
          newOn.add(dateStr);
        }
      }
      setOffDays(newOff);
      setOnDays(newOn);
      updateUrl({ y: year, m: month, sh: startHour, eh: endHour, rate: hourlyRate, off: newOff, on: newOn });
    },
    [offDays, onDays, holidays, year, month, startHour, endHour, hourlyRate, updateUrl]
  );

  const dailyHours = calcDailyHours(startHour, endHour);
  const isTimeValid = dailyHours > 0;
  const workingDays = days.filter((d) => d.isWorking).length;
  const totalHours = workingDays * dailyHours;
  const monthlyIncome = hourlyRate > 0 ? totalHours * hourlyRate : null;
  const firstWeekday = days[0]?.weekday ?? 0;

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const exportExcel = useCallback(async () => {
    if (!isTimeValid) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const headers = ["日付", "曜日", "稼働"];
    const dataRows = days.map((d) => [
      d.date,
      WEEKDAYS[d.weekday],
      d.isWorking ? 1 : 0,
    ]);

    // Excelの行番号: 1=ヘッダー, 2〜N+1=データ, N+2=空行, N+3=稼働日数, N+4=1日の稼働時間, N+5=総稼働時間
    const dataEndRow = dataRows.length + 1;
    const summaryRow = dataRows.length + 3;

    const sheetData: (string | number)[][] = [
      headers,
      ...dataRows,
      [],
      ["稼働日数", `=COUNTIF(C2:C${dataEndRow},1)`, "日"],
      ["1日の稼働時間", dailyHours, "時間"],
      ["総稼働時間", `=B${summaryRow}*B${summaryRow + 1}`, "時間"],
    ];
    if (hourlyRate > 0) {
      sheetData.push(["月収", `=B${summaryRow + 2}*${hourlyRate}`, "円"]);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 6 }];

    XLSX.utils.book_append_sheet(wb, ws, `${year}年${month}月`);
    XLSX.writeFile(wb, `稼働時間_${year}${String(month).padStart(2, "0")}.xlsx`);
  }, [days, dailyHours, isTimeValid, hourlyRate, year, month]);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-300">
          ツール一覧
        </Link>
        <span className="mx-2">/</span>
        <span>稼働時間カレンダー</span>
      </nav>

      <div>
        <h1 className="mb-1 text-2xl font-bold md:text-3xl">稼働時間カレンダー</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          月の稼働日を管理して総稼働時間・月収を算出。カレンダーをクリックして稼働日を切り替えられます。
        </p>
      </div>

      {holidayError && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          祝日情報の取得に失敗しました。手動で稼働日を設定してください。
        </div>
      )}

      {/* 設定パネル */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-4">
          {/* 月ナビゲーション */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              ◀
            </button>
            <span className="min-w-[7rem] text-center font-semibold">
              {year}年{month}月
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              ▶
            </button>
          </div>

          {/* 時刻設定 */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="start-hour" className="text-zinc-600 dark:text-zinc-400">開始</label>
            <input
              id="start-hour"
              type="time"
              value={startHour}
              onChange={(e) => {
                setStartHour(e.target.value);
                updateUrl({ y: year, m: month, sh: e.target.value, eh: endHour, rate: hourlyRate, off: offDays, on: onDays });
              }}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <label htmlFor="end-hour" className="text-zinc-600 dark:text-zinc-400">終了</label>
            <input
              id="end-hour"
              type="time"
              value={endHour}
              onChange={(e) => {
                setEndHour(e.target.value);
                updateUrl({ y: year, m: month, sh: startHour, eh: e.target.value, rate: hourlyRate, off: offDays, on: onDays });
              }}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
            />
            {!isTimeValid && (
              <span className="text-red-500 text-xs">終了時刻は開始より後にしてください</span>
            )}
          </div>

          {/* 時給 */}
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="hourly-rate" className="text-zinc-600 dark:text-zinc-400">時給</label>
            <input
              id="hourly-rate"
              type="number"
              value={hourlyRate || ""}
              placeholder="例: 3000"
              min={0}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value));
                setHourlyRate(v);
                updateUrl({ y: year, m: month, sh: startHour, eh: endHour, rate: v, off: offDays, on: onDays });
              }}
              className="w-28 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <span className="text-zinc-600 dark:text-zinc-400">円</span>
          </div>
        </div>
      </div>

      {/* カレンダー */}
      <div>
        <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={
                i === 0
                  ? "text-red-500"
                  : i === 6
                  ? "text-blue-500"
                  : "text-zinc-600 dark:text-zinc-400"
              }
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((d) => {
            const isToday = d.date === getTodayStr();
            const isSun = d.weekday === 0;
            const isSat = d.weekday === 6;

            return (
              <button
                key={d.date}
                onClick={() => toggleDay(d.date, d.isWorking)}
                title={d.holidayName}
                className={[
                  "relative flex flex-col items-center rounded-lg border py-2 text-sm transition-colors cursor-pointer hover:opacity-80",
                  isToday ? "ring-2 ring-blue-500" : "",
                  d.isWorking
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className={
                    isSun || d.isHoliday
                      ? "font-semibold text-red-500"
                      : isSat
                      ? "font-semibold text-blue-500"
                      : d.isWorking
                      ? "font-semibold text-zinc-800 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-500"
                  }
                >
                  {d.day}
                </span>
                {d.isHoliday && (
                  <span className="mt-0.5 max-w-full truncate px-0.5 text-[9px] text-red-400">
                    {d.holidayName}
                  </span>
                )}
                {d.isManualOverride && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-right text-xs text-zinc-400">
          クリックで稼働日/休業日を切り替え　●手動変更あり
        </p>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">稼働日数</p>
          <p className="mt-1 text-2xl font-bold">
            {workingDays}<span className="text-sm font-normal">日</span>
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">総稼働時間</p>
          <p className="mt-1 text-2xl font-bold">
            {isTimeValid ? formatHours(totalHours) : "—"}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-zinc-200 p-4 text-center md:col-span-1 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">月収（概算）</p>
          <p className="mt-1 text-2xl font-bold">
            {monthlyIncome !== null && isTimeValid ? (
              formatMoney(monthlyIncome)
            ) : (
              <span className="text-sm font-normal text-zinc-400">時給を入力すると表示</span>
            )}
          </p>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={copyUrl}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          {copied ? "✅ コピーしました" : "🔗 URLをコピー（設定を共有）"}
        </button>
        <button
          onClick={exportExcel}
          disabled={!isTimeValid}
          className={[
            "rounded-lg border border-green-500 bg-green-50 px-4 py-2 text-sm text-green-700",
            "hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40",
            !isTimeValid ? "cursor-not-allowed opacity-50" : "",
          ].join(" ")}
        >
          📊 Excelで出力
        </button>
      </div>

      {/* 使い方 */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="mb-3 font-semibold">使い方</h2>
        <ol className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>1. 年月を選択（土日・祝日は自動で非稼働日になります）</li>
          <li>2. 1日の稼働時間（開始・終了時刻）を設定</li>
          <li>3. 時給を入力すると月収の概算が表示されます</li>
          <li>4. カレンダーのセルをクリックして稼働日/休業日を切り替えられます</li>
          <li>5. 「URLをコピー」で設定を保存・共有できます</li>
          <li>6. 「Excelで出力」で数式付きの帳票をダウンロードできます</li>
        </ol>
      </div>
    </div>
  );
}
