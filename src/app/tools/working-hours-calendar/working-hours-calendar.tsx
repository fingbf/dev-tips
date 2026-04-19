"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const DEFAULT_HOURS = 8;

type DayInfo = {
  date: string;
  day: number;
  weekday: number;
  isWorking: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isManualOverride: boolean;
  hours: number;
};

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidDateStr(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
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
  const [defaultHours, setDefaultHours] = useState(() => {
    const h = Number(searchParams.get("h"));
    return h > 0 && h <= 24 ? h : DEFAULT_HOURS;
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
  const [dayHours, setDayHours] = useState<Record<string, number>>(() => {
    const raw = searchParams.get("dh");
    if (!raw) return {};
    return raw.split(",").reduce((acc, s) => {
      const idx = s.lastIndexOf(":");
      if (idx < 0) return acc;
      const date = s.slice(0, idx);
      const h = Number(s.slice(idx + 1));
      if (isValidDateStr(date) && !isNaN(h) && h >= 0 && h <= 24) acc[date] = h;
      return acc;
    }, {} as Record<string, number>);
  });

  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [holidayError, setHolidayError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingHours, setEditingHours] = useState<number>(DEFAULT_HOURS);

  useEffect(() => {
    const cached = sessionStorage.getItem("holidays-jp");
    if (cached) {
      try {
        const parsed: unknown = JSON.parse(cached);
        if (
          typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) &&
          Object.values(parsed).every((s) => typeof s === "string")
        ) {
          setHolidays(parsed as Record<string, string>);
        } else {
          sessionStorage.removeItem("holidays-jp");
        }
      } catch {
        sessionStorage.removeItem("holidays-jp");
      }
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
      y: number; m: number; h: number; rate: number;
      off: Set<string>; on: Set<string>; dh: Record<string, number>;
    }) => {
      const p = new URLSearchParams();
      if (params.y !== initialYear) p.set("y", String(params.y));
      if (params.m !== initialMonth) p.set("m", String(params.m));
      if (params.h !== DEFAULT_HOURS) p.set("h", String(params.h));
      if (params.rate > 0) p.set("rate", String(params.rate));
      if (params.off.size > 0) p.set("off", [...params.off].join(","));
      if (params.on.size > 0) p.set("on", [...params.on].join(","));
      const dhEntries = Object.entries(params.dh);
      if (dhEntries.length > 0) p.set("dh", dhEntries.map(([d, h]) => `${d}:${h}`).join(","));
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
      const newDh: Record<string, number> = {};
      setYear(newYear);
      setMonth(newMonth);
      setOffDays(newOff);
      setOnDays(newOn);
      setDayHours(newDh);
      setEditingDay(null);
      updateUrl({ y: newYear, m: newMonth, h: defaultHours, rate: hourlyRate, off: newOff, on: newOn, dh: newDh });
    },
    [month, year, defaultHours, hourlyRate, updateUrl]
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
      const hours = dayHours[dateStr] ?? defaultHours;
      return { date: dateStr, day, weekday, isWorking, isHoliday, holidayName, isManualOverride, hours };
    });
  }, [year, month, holidays, offDays, onDays, dayHours, defaultHours]);

  const isDefaultOff = useCallback(
    (dateStr: string) => {
      const [y, mo, d] = dateStr.split("-").map(Number);
      const weekday = new Date(y, mo - 1, d).getDay();
      return weekday === 0 || weekday === 6 || dateStr in holidays;
    },
    [holidays]
  );

  const handleDayClick = useCallback(
    (d: DayInfo) => {
      if (!d.isWorking) {
        const newOff = new Set(offDays);
        const newOn = new Set(onDays);
        newOff.delete(d.date);
        if (isDefaultOff(d.date)) newOn.add(d.date);
        setOffDays(newOff);
        setOnDays(newOn);
        updateUrl({ y: year, m: month, h: defaultHours, rate: hourlyRate, off: newOff, on: newOn, dh: dayHours });
      } else {
        setEditingDay(d.date);
        setEditingHours(dayHours[d.date] ?? defaultHours);
      }
    },
    [offDays, onDays, dayHours, defaultHours, isDefaultOff, year, month, hourlyRate, updateUrl]
  );

  const applyDayEdit = useCallback(() => {
    if (!editingDay) return;
    const newDh = { ...dayHours, [editingDay]: editingHours };
    setDayHours(newDh);
    setEditingDay(null);
    updateUrl({ y: year, m: month, h: defaultHours, rate: hourlyRate, off: offDays, on: onDays, dh: newDh });
  }, [editingDay, editingHours, dayHours, year, month, defaultHours, hourlyRate, offDays, onDays, updateUrl]);

  const turnOffEditingDay = useCallback(() => {
    if (!editingDay) return;
    const newOff = new Set(offDays);
    const newOn = new Set(onDays);
    const newDh = { ...dayHours };
    newOn.delete(editingDay);
    if (!isDefaultOff(editingDay)) newOff.add(editingDay);
    delete newDh[editingDay];
    setOffDays(newOff);
    setOnDays(newOn);
    setDayHours(newDh);
    setEditingDay(null);
    updateUrl({ y: year, m: month, h: defaultHours, rate: hourlyRate, off: newOff, on: newOn, dh: newDh });
  }, [editingDay, offDays, onDays, dayHours, isDefaultOff, year, month, defaultHours, hourlyRate, updateUrl]);

  const toggleWeekday = useCallback(
    (wd: number) => {
      const daysOfWeekday = days.filter((d) => d.weekday === wd);
      const allWorking = daysOfWeekday.every((d) => d.isWorking);
      const newOff = new Set(offDays);
      const newOn = new Set(onDays);
      daysOfWeekday.forEach((d) => {
        if (allWorking) {
          newOn.delete(d.date);
          if (!isDefaultOff(d.date)) newOff.add(d.date);
        } else {
          newOff.delete(d.date);
          if (isDefaultOff(d.date)) newOn.add(d.date);
        }
      });
      setOffDays(newOff);
      setOnDays(newOn);
      setEditingDay(null);
      updateUrl({ y: year, m: month, h: defaultHours, rate: hourlyRate, off: newOff, on: newOn, dh: dayHours });
    },
    [days, offDays, onDays, isDefaultOff, dayHours, defaultHours, hourlyRate, year, month, updateUrl]
  );

  const todayStr = useMemo(() => {
    const t = new Date();
    return toDateStr(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }, []);

  const { totalHours, workingDays } = useMemo(() => {
    const working = days.filter((d) => d.isWorking);
    return {
      workingDays: working.length,
      totalHours: working.reduce((sum, d) => sum + d.hours, 0),
    };
  }, [days]);
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
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const headers = ["日付", "曜日", "稼働時間"];
    const dataRows = days.map((d) => [
      d.date,
      WEEKDAYS[d.weekday],
      d.isWorking ? d.hours : 0,
    ]);

    const dataEndRow = dataRows.length + 1;
    const summaryRow = dataRows.length + 3;

    const sheetData: (string | number)[][] = [
      headers,
      ...dataRows,
      [],
      ["稼働日数", `=COUNTIF(C2:C${dataEndRow},">0")`, "", "日"],
      ["総稼働時間", `=SUM(C2:C${dataEndRow})`, "", "時間"],
    ];
    if (hourlyRate > 0) {
      sheetData.push(["月収", `=B${summaryRow + 1}*${hourlyRate}`, "", "円"]);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 12 }, { wch: 6 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, `${year}年${month}月`);
    XLSX.writeFile(wb, `稼働時間_${year}${String(month).padStart(2, "0")}.xlsx`);
  }, [days, hourlyRate, year, month]);

  const editingDayInfo = editingDay ? days.find((d) => d.date === editingDay) : null;

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
          月の稼働日を管理して総稼働時間・月収を算出。曜日をクリックで一括切替、日付をクリックで個別調整。
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

          {/* デフォルト稼働時間 */}
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="default-hours" className="text-zinc-600 dark:text-zinc-400">
              1日の稼働時間
            </label>
            <input
              id="default-hours"
              type="number"
              value={defaultHours}
              min={0.5}
              max={24}
              step={0.5}
              onChange={(e) => {
                const v = Math.min(24, Math.max(0.5, Number(e.target.value)));
                setDefaultHours(v);
                updateUrl({ y: year, m: month, h: v, rate: hourlyRate, off: offDays, on: onDays, dh: dayHours });
              }}
              className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <span className="text-zinc-600 dark:text-zinc-400">時間</span>
          </div>

          {/* 時給 */}
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="hourly-rate" className="text-zinc-600 dark:text-zinc-400">
              時給
            </label>
            <input
              id="hourly-rate"
              type="number"
              value={hourlyRate || ""}
              placeholder="例: 3000"
              min={0}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value));
                setHourlyRate(v);
                updateUrl({ y: year, m: month, h: defaultHours, rate: v, off: offDays, on: onDays, dh: dayHours });
              }}
              className="w-28 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <span className="text-zinc-600 dark:text-zinc-400">円</span>
          </div>
        </div>
      </div>

      {/* カレンダー */}
      <div>
        {/* 曜日ヘッダー（クリックで一括ON/OFF） */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => {
            const daysOfWd = days.filter((d) => d.weekday === i);
            const allWorking = daysOfWd.length > 0 && daysOfWd.every((d) => d.isWorking);
            return (
              <button
                key={w}
                onClick={() => toggleWeekday(i)}
                title={`${w}曜日を一括${allWorking ? "休み" : "稼働"}にする`}
                className={[
                  "rounded py-1 text-center text-xs font-semibold transition-colors",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-zinc-600 dark:text-zinc-400",
                  allWorking ? "underline decoration-dotted" : "",
                ].join(" ")}
              >
                {w}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((d) => {
            const isToday = d.date === todayStr;
            const isEditing = editingDay === d.date;
            const isSun = d.weekday === 0;
            const isSat = d.weekday === 6;
            const hasCustomHours = d.isWorking && dayHours[d.date] !== undefined;

            return (
              <button
                key={d.date}
                onClick={() => handleDayClick(d)}
                title={d.holidayName ?? (d.isWorking ? "クリックで時間調整" : "クリックで稼働日にする")}
                className={[
                  "relative flex flex-col items-center rounded-lg border py-2 text-sm transition-colors cursor-pointer hover:opacity-80",
                  isToday ? "ring-2 ring-blue-500" : "",
                  isEditing ? "ring-2 ring-orange-400" : "",
                  d.isWorking
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50",
                ].filter(Boolean).join(" ")}
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
                {d.isWorking && (
                  <span className={["text-[10px]", hasCustomHours ? "text-orange-500 font-semibold" : "text-zinc-400 dark:text-zinc-500"].join(" ")}>
                    {d.hours}h
                  </span>
                )}
                {d.isManualOverride && !hasCustomHours && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-right text-xs text-zinc-400">
          曜日クリックで一括切替　日付クリックで個別調整　<span className="text-orange-400">■</span>カスタム時間
        </p>
      </div>

      {/* 日別編集パネル */}
      {editingDay && editingDayInfo && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-900/20">
          <p className="mb-3 font-semibold text-sm">
            {editingDay}（{WEEKDAYS[editingDayInfo.weekday]}）の稼働時間を調整
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="editing-hours" className="text-zinc-600 dark:text-zinc-400">稼働時間</label>
              <input
                id="editing-hours"
                type="number"
                value={editingHours}
                min={0.5}
                max={24}
                step={0.5}
                autoFocus
                onChange={(e) => setEditingHours(Math.min(24, Math.max(0.5, Number(e.target.value))))}
                className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <span className="text-zinc-600 dark:text-zinc-400">時間</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyDayEdit}
                className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
              >
                適用
              </button>
              <button
                onClick={turnOffEditingDay}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                休みにする
              </button>
              <button
                onClick={() => setEditingDay(null)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

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
          <p className="mt-1 text-2xl font-bold">{formatHours(totalHours)}</p>
        </div>
        <div className="col-span-2 rounded-lg border border-zinc-200 p-4 text-center md:col-span-1 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">月収（概算）</p>
          <p className="mt-1 text-2xl font-bold">
            {monthlyIncome !== null ? (
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
          className="rounded-lg border border-green-500 bg-green-50 px-4 py-2 text-sm text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
        >
          📊 Excelで出力
        </button>
      </div>

      {/* 使い方 */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="mb-3 font-semibold">使い方</h2>
        <ol className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>1. 年月を選択（土日・祝日は自動で非稼働日になります）</li>
          <li>2. 1日のデフォルト稼働時間を設定</li>
          <li>3. 曜日ヘッダーをクリックするとその曜日を一括ON/OFFできます</li>
          <li>4. 稼働日をクリックすると時間を個別調整できます</li>
          <li>5. 休み日をクリックすると稼働日に変更できます</li>
          <li>6. 時給を入力すると月収の概算が表示されます</li>
          <li>7. 「URLをコピー」で設定を保存・共有できます</li>
          <li>8. 「Excelで出力」で数式付きの帳票をダウンロードできます</li>
        </ol>
      </div>
    </div>
  );
}
