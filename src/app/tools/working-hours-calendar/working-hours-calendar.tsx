"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type ExcelJS from "exceljs";

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

type PaymentKind = {
  id: string;
  emoji: string;
  name: string;
  unit: string;
  pricePerUnit: number; // 1単位あたりの円価値
  note: string;
};

const PAYMENT_KINDS: PaymentKind[] = [
  { id: "cash",        emoji: "💴", name: "現金",      unit: "円",  pricePerUnit: 1,      note: "法定通貨" },
  { id: "donguri",     emoji: "🌰", name: "どんぐり",  unit: "個",  pricePerUnit: 0.1,    note: "森の闇相場レート" },
  { id: "matsubokuri", emoji: "🌲", name: "松ぼっくり", unit: "個",  pricePerUnit: 0.5,    note: "高級品につき" },
  { id: "ichigo",      emoji: "🍓", name: "イチゴ",    unit: "粒",  pricePerUnit: 50,     note: "国産苺・時価" },
  { id: "takoyaki",    emoji: "🐙", name: "たこ焼き",  unit: "個",  pricePerUnit: 150,    note: "大阪本場産8個入" },
  { id: "ramen",       emoji: "🍜", name: "ラーメン",  unit: "杯",  pricePerUnit: 900,    note: "二郎系大盛り" },
  { id: "tanuki",      emoji: "🦝", name: "たぬき",    unit: "匹",  pricePerUnit: 50000,  note: "なつき度・毛並みによる" },
];

function formatPaymentAmount(income: number, kind: PaymentKind): string {
  if (kind.id === "cash") return income.toLocaleString("ja-JP") + "円";
  const amount = income / kind.pricePerUnit;
  if (amount >= 10000) return `約${(amount / 10000).toFixed(1)}万${kind.unit}`;
  if (amount >= 1000) return `約${Math.round(amount / 100) * 100}${kind.unit}`;
  return `約${Math.round(amount)}${kind.unit}`;
}

type StyleSet = {
  grayFill: ExcelJS.Fill;
  blueFill: ExcelJS.Fill;
  headerFill: ExcelJS.Fill;
  border: Partial<ExcelJS.Borders>;
  center: Partial<ExcelJS.Alignment>;
};

const HOLIDAY_SHEET = "祝日";
const EXCEL_RED_FONT = { color: { argb: "FFEF4444" } };
const EXCEL_BLUE_FONT = { color: { argb: "FF3B82F6" } };
// CF fill: fgColor+bgColor 両方指定で Excel バージョン互換性を確保
const CF_HOLIDAY_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE5E7EB" }, bgColor: { argb: "FFE5E7EB" } };
const CF_HOLIDAY_FONT = { color: { argb: "FFEF4444" } };

function addCalendarRow(
  sheet: ExcelJS.Worksheet,
  week: (DayInfo | null)[],
  styles: StyleSet,
  dataSheetName: string,
  year: number,
  month: number,
) {
  const { grayFill, blueFill, border, center } = styles;

  const row = sheet.addRow(["", ...week.map(() => "")]);
  row.height = 52;

  week.forEach((d, i) => {
    const cell = row.getCell(i + 2);
    cell.alignment = { ...center, wrapText: true };
    cell.border = border;
    if (!d) return;

    // 祝日名と稼働時間を VLOOKUP で参照
    const dateRef = `DATE(${year},${month},${d.day})`;
    const vlookup = `IFERROR(VLOOKUP(${dateRef},'${HOLIDAY_SHEET}'!$A:$B,2,FALSE),"")`;
    const hoursLookup = `IFERROR(VLOOKUP(${dateRef},'${dataSheetName}'!$A:$C,3,FALSE),0)`;
    const hoursText = `IF(INT(${hoursLookup})=${hoursLookup},TEXT(${hoursLookup},"0"),TEXT(${hoursLookup},"0.#"))`;
    const hoursF = `IF(${hoursLookup}>0,CHAR(10)&${hoursText}&"h","")`;
    const hoursDisplay = d.hours % 1 === 0 ? String(d.hours) : d.hours.toFixed(1);
    cell.value = {
      formula: `=${d.day}&IF(${vlookup}="","",CHAR(10)&${vlookup})&${hoursF}`,
      result: [
        String(d.day),
        ...(d.holidayName ? [d.holidayName] : []),
        ...(d.isWorking ? [`${hoursDisplay}h`] : []),
      ].join("\n"),
    };

    const isSun = d.weekday === 0;
    const isSat = d.weekday === 6;
    if (!d.isWorking) {
      cell.fill = grayFill;
      cell.font = (isSun || d.isHoliday) ? EXCEL_RED_FONT : isSat ? EXCEL_BLUE_FONT : { color: { argb: "FF9CA3AF" } };
    } else {
      if (isSat) cell.fill = blueFill;
      cell.font = (isSun || d.isHoliday) ? EXCEL_RED_FONT : isSat ? EXCEL_BLUE_FONT : {};
    }

    // 祝日シートに手動追加された祝日も書式反映
    sheet.addConditionalFormatting({
      ref: cell.address,
      rules: [{
        type: "expression",
        priority: 1,
        formulae: [`IFERROR(VLOOKUP(${dateRef},'${HOLIDAY_SHEET}'!$A:$B,2,FALSE),"")<>""`],
        style: { fill: CF_HOLIDAY_FILL, font: CF_HOLIDAY_FONT },
      }],
    });
  });

  // メモ行（各日に1セル）
  const memoRow = sheet.addRow(["メモ", "", "", "", "", "", "", ""]);
  memoRow.height = 24;
  memoRow.getCell(1).font = { size: 8, color: { argb: "FFBDBDBD" } };
  memoRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  for (let c = 2; c <= 8; c++) {
    memoRow.getCell(c).border = border;
  }
}

// 年間カレンダー用：1ヶ月分のブロックを指定行・列に描画し、使用行数を返す
function addMonthBlock(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  year: number,
  month: number,
  holidays: Record<string, string>,
  styles: StyleSet,
): number {
  const { grayFill, blueFill, headerFill, border, center } = styles;
  const WHITE_BOLD = { color: { argb: "FFFFFFFF" }, bold: true };
  const WD_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

  // 月ヘッダー（7列結合）
  const headerRow = sheet.getRow(startRow);
  headerRow.height = 20;
  const hCell = headerRow.getCell(startCol);
  hCell.value = `${month}月`;
  hCell.font = { ...WHITE_BOLD, size: 11 };
  hCell.alignment = center;
  hCell.fill = headerFill;
  sheet.mergeCells(startRow, startCol, startRow, startCol + 6);

  // 曜日ヘッダー
  const wdRow = sheet.getRow(startRow + 1);
  wdRow.height = 18;
  WD_NAMES.forEach((wd, i) => {
    const cell = wdRow.getCell(startCol + i);
    cell.value = wd;
    cell.fill = headerFill;
    cell.font = i === 0 ? { color: { argb: "FFFCA5A5" }, bold: true }
               : i === 6 ? { color: { argb: "FF93C5FD" }, bold: true }
               : WHITE_BOLD;
    cell.alignment = center;
    cell.border = border;
  });

  // 日付グリッド
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWd = new Date(year, month - 1, 1).getDay();
  let currentRow = startRow + 2;
  let col = firstWd;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = toDateStr(year, month, day);
    const weekday = (firstWd + day - 1) % 7;
    const isHoliday = dateStr in holidays;
    const isRest = weekday === 0 || weekday === 6 || isHoliday;

    const calRow = sheet.getRow(currentRow);
    calRow.height = 30;
    const cell = calRow.getCell(startCol + col);
    cell.alignment = { ...center, wrapText: true };
    cell.border = border;

    // 祝日名を VLOOKUP で参照
    const dateRef = `DATE(${year},${month},${day})`;
    const vlookup = `IFERROR(VLOOKUP(${dateRef},'${HOLIDAY_SHEET}'!$A:$B,2,FALSE),"")`;
    cell.value = {
      formula: `=${day}&IF(${vlookup}="","",CHAR(10)&${vlookup})`,
      result: isHoliday ? `${day}\n${holidays[dateStr]}` : String(day),
    };

    if (isRest) cell.fill = weekday === 6 && !isHoliday ? blueFill : grayFill;
    if (weekday === 0 || isHoliday) cell.font = EXCEL_RED_FONT;
    else if (weekday === 6) cell.font = EXCEL_BLUE_FONT;

    // 祝日シートに手動追加された祝日も書式反映
    sheet.addConditionalFormatting({
      ref: cell.address,
      rules: [{
        type: "expression",
        priority: 1,
        formulae: [`IFERROR(VLOOKUP(${dateRef},'${HOLIDAY_SHEET}'!$A:$B,2,FALSE),"")<>""`],
        style: { fill: CF_HOLIDAY_FILL, font: CF_HOLIDAY_FONT },
      }],
    });

    col++;
    if (col === 7) { col = 0; currentRow++; }
  }
  if (col > 0) currentRow++;

  return currentRow - startRow;
}

// 任意の年月の DayInfo 配列を生成（カスタムデータなし = デフォルト設定）
function generateMonthDays(
  y: number,
  m: number,
  holidays: Record<string, string>,
  defaultHours: number,
  offDays = new Set<string>(),
  onDays = new Set<string>(),
  dayHoursMap: Record<string, number> = {},
): DayInfo[] {
  const daysInMonth = new Date(y, m, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = toDateStr(y, m, day);
    const weekday = new Date(y, m - 1, day).getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isHoliday = dateStr in holidays;
    const defaultOff = isWeekend || isHoliday;
    let isWorking: boolean;
    let isManualOverride = false;
    if (onDays.has(dateStr)) { isWorking = true; isManualOverride = true; }
    else if (offDays.has(dateStr)) { isWorking = false; isManualOverride = true; }
    else { isWorking = !defaultOff; }
    return {
      date: dateStr, day, weekday, isWorking, isHoliday,
      holidayName: holidays[dateStr], isManualOverride,
      hours: dayHoursMap[dateStr] ?? defaultHours,
    };
  });
}

// データシート参照なし版カレンダー行（年間出力用）
function addCalendarRowStatic(
  sheet: ExcelJS.Worksheet,
  week: (DayInfo | null)[],
  styles: StyleSet,
  year: number,
  month: number,
  unifiedDataSheet?: string,
) {
  const { grayFill, blueFill, border, center } = styles;

  const row = sheet.addRow(["", ...week.map(() => "")]);
  row.height = 52;

  week.forEach((d, i) => {
    const cell = row.getCell(i + 2);
    cell.alignment = { ...center, wrapText: true };
    cell.border = border;
    if (!d) return;

    const dateRef = `DATE(${year},${month},${d.day})`;
    const vlookup = `IFERROR(VLOOKUP(${dateRef},'${HOLIDAY_SHEET}'!$A:$B,2,FALSE),"")`;
    const hoursDisplay = d.hours % 1 === 0 ? String(d.hours) : d.hours.toFixed(1);
    let hoursStr: string;
    if (unifiedDataSheet) {
      const hoursLookup = `IFERROR(VLOOKUP(${dateRef},'${unifiedDataSheet}'!$A:$D,4,FALSE),0)`;
      const hoursText = `IF(INT(${hoursLookup})=${hoursLookup},TEXT(${hoursLookup},"0"),TEXT(${hoursLookup},"0.#"))`;
      hoursStr = `&IF(${hoursLookup}>0,CHAR(10)&${hoursText}&"h","")`;
    } else {
      hoursStr = d.isWorking ? `&CHAR(10)&"${hoursDisplay}h"` : "";
    }
    cell.value = {
      formula: `=${d.day}&IF(${vlookup}="","",CHAR(10)&${vlookup})${hoursStr}`,
      result: [
        String(d.day),
        ...(d.holidayName ? [d.holidayName] : []),
        ...(d.isWorking ? [`${hoursDisplay}h`] : []),
      ].join("\n"),
    };

    const isSun = d.weekday === 0;
    const isSat = d.weekday === 6;
    if (!d.isWorking) {
      cell.fill = grayFill;
      cell.font = (isSun || d.isHoliday) ? EXCEL_RED_FONT : isSat ? EXCEL_BLUE_FONT : { color: { argb: "FF9CA3AF" } };
    } else {
      if (isSat) cell.fill = blueFill;
      cell.font = (isSun || d.isHoliday) ? EXCEL_RED_FONT : isSat ? EXCEL_BLUE_FONT : {};
    }

    // 祝日シートに手動追加された祝日も書式反映
    sheet.addConditionalFormatting({
      ref: cell.address,
      rules: [{
        type: "expression",
        priority: 1,
        formulae: [`IFERROR(VLOOKUP(${dateRef},'${HOLIDAY_SHEET}'!$A:$B,2,FALSE),"")<>""`],
        style: { fill: CF_HOLIDAY_FILL, font: CF_HOLIDAY_FONT },
      }],
    });
  });

  // メモ行
  const memoRow = sheet.addRow(["メモ", "", "", "", "", "", "", ""]);
  memoRow.height = 24;
  memoRow.getCell(1).font = { size: 8, color: { argb: "FFBDBDBD" } };
  memoRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  for (let c = 2; c <= 8; c++) memoRow.getCell(c).border = border;
}

// 1ヶ月分の全カレンダーシートを構築するヘルパー
function buildMonthSheet(
  sheet: ExcelJS.Worksheet,
  monthDays: DayInfo[],
  styles: StyleSet,
  y: number,
  m: number,
  sheetYear: number,
  sheetMonth: number,
  headerFill: ExcelJS.Fill,
  summaryFill: ExcelJS.Fill,
  whiteBold: { color: { argb: string }; bold: boolean },
  hourlyRate: number,
  useDataRef: boolean,
  dataSheetName: string,
  unifiedDataSheet?: string,
) {
  const { border, center } = styles;
  sheet.columns = [
    { width: 2 }, { width: 11 }, { width: 11 }, { width: 11 },
    { width: 11 }, { width: 11 }, { width: 11 }, { width: 11 },
  ];

  // タイトル
  const titleRow = sheet.addRow(["", `${y}年${m}月 稼働カレンダー`]);
  titleRow.height = 24;
  sheet.mergeCells(`B${titleRow.number}:H${titleRow.number}`);
  const titleCell = titleRow.getCell("B");
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = center;
  sheet.addRow([]);

  // 曜日ヘッダー
  const wdRow = sheet.addRow(["", "日", "月", "火", "水", "木", "金", "土"]);
  wdRow.height = 22;
  wdRow.eachCell((cell, colNum) => {
    if (colNum === 1) return;
    cell.fill = headerFill;
    cell.font = colNum === 2 ? { ...whiteBold, color: { argb: "FFFCA5A5" } }
              : colNum === 8 ? { ...whiteBold, color: { argb: "FF93C5FD" } }
              : whiteBold;
    cell.alignment = center;
    cell.border = border;
  });

  // カレンダーグリッド
  const firstWd = monthDays[0]?.weekday ?? 0;
  let week: (DayInfo | null)[] = Array(firstWd).fill(null);
  for (const d of monthDays) {
    week.push(d);
    if (week.length === 7) {
      if (useDataRef) addCalendarRow(sheet, week, styles, dataSheetName, sheetYear, sheetMonth);
      else addCalendarRowStatic(sheet, week, styles, sheetYear, sheetMonth, unifiedDataSheet);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    if (useDataRef) addCalendarRow(sheet, week, styles, dataSheetName, sheetYear, sheetMonth);
    else addCalendarRowStatic(sheet, week, styles, sheetYear, sheetMonth, unifiedDataSheet);
  }

  sheet.addRow([]);

  // サマリー
  const mWorkingDays = monthDays.filter((d) => d.isWorking).length;
  const mTotalHours = monthDays.filter((d) => d.isWorking).reduce((s, d) => s + d.hours, 0);
  const dataRange = useDataRef ? `'${dataSheetName}'!C2:C${monthDays.length + 1}` : null;

  const workingDaysVal = unifiedDataSheet
    ? { formula: `=COUNTIFS('${unifiedDataSheet}'!$B:$B,${m},'${unifiedDataSheet}'!$D:$D,">0")`, result: mWorkingDays }
    : dataRange ? { formula: `=COUNTIF(${dataRange},">0")`, result: mWorkingDays } : mWorkingDays;
  const totalHoursVal = unifiedDataSheet
    ? { formula: `=SUMIF('${unifiedDataSheet}'!$B:$B,${m},'${unifiedDataSheet}'!$D:$D)`, result: mTotalHours }
    : dataRange ? { formula: `=SUM(${dataRange})`, result: mTotalHours } : mTotalHours;

  const sr1 = sheet.addRow(["", "稼働日数", workingDaysVal, "日"]);
  const sr2 = sheet.addRow(["", "総稼働時間", totalHoursVal, "時間"]);
  [sr1, sr2].forEach((r) => {
    r.height = 20;
    ["B", "C", "D"].forEach((col) => { r.getCell(col).fill = summaryFill; });
    r.getCell("B").font = { bold: true };
    r.getCell("C").font = { bold: true };
  });
  if (hourlyRate > 0) {
    const sr3 = sheet.addRow(["", "月収（概算）",
      (unifiedDataSheet || dataRange)
        ? { formula: `=C${sr2.number}*${hourlyRate}`, result: mTotalHours * hourlyRate }
        : mTotalHours * hourlyRate,
      "円"]);
    sr3.height = 20;
    ["B", "C", "D"].forEach((col) => { sr3.getCell(col).fill = summaryFill; });
    sr3.getCell("B").font = { bold: true };
    sr3.getCell("C").font = { bold: true };
    sr3.getCell("C").numFmt = "#,##0";
  }
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
  const [humorMode, setHumorMode] = useState(false);
  const [directPaymentAmount, setDirectPaymentAmount] = useState(0);
  const [paymentKindId, setPaymentKindId] = useState("cash");

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
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
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

  const days = useMemo<DayInfo[]>(
    () => generateMonthDays(year, month, holidays, defaultHours, offDays, onDays, dayHours),
    [year, month, holidays, defaultHours, offDays, onDays, dayHours]
  );

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

  // 現物支給モード用計算
  const selectedPaymentKind = PAYMENT_KINDS.find((k) => k.id === paymentKindId) ?? PAYMENT_KINDS[0];
  const incomeInYen = humorMode && directPaymentAmount > 0
    ? directPaymentAmount * selectedPaymentKind.pricePerUnit
    : null;
  const humorIncome = incomeInYen ?? monthlyIncome;
  const humorHourlyRate = incomeInYen !== null && totalHours > 0
    ? incomeInYen / totalHours
    : hourlyRate;

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  // 共通スタイル生成（月間・年間出力で使い回す）
  const buildExcelStyles = useCallback(async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const styles: StyleSet = {
      grayFill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } },
      blueFill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } },
      headerFill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } },
      border: {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      },
      center: { horizontal: "center", vertical: "middle" },
    };
    const SUMMARY_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };
    const WHITE_BOLD = { color: { argb: "FFFFFFFF" }, bold: true as const };
    return { ExcelJS, wb, styles, SUMMARY_FILL, WHITE_BOLD };
  }, []);

  // 祝日シートを追加
  const addHolidaySheet = useCallback((wb: import("exceljs").Workbook, styles: StyleSet, whiteBold: { color: { argb: string }; bold: boolean }) => {
    const sheet = wb.addWorksheet(HOLIDAY_SHEET);
    sheet.columns = [
      { header: "日付", key: "date", width: 14 },
      { header: "祝日名", key: "name", width: 22 },
    ];
    const hHdr = sheet.getRow(1);
    hHdr.height = 20;
    hHdr.eachCell((cell) => {
      cell.fill = styles.headerFill;
      cell.font = whiteBold;
      cell.alignment = styles.center;
      cell.border = styles.border;
    });
    const yearHolidays = Object.entries(holidays)
      .filter(([date]) => date.startsWith(`${year}-`))
      .sort(([a], [b]) => a.localeCompare(b));
    for (const [dateStr, name] of yearHolidays) {
      const [hy, hmo, hd] = dateStr.split("-").map(Number);
      const hRow = sheet.addRow({ date: new Date(Date.UTC(hy, hmo - 1, hd)), name });
      hRow.height = 18;
      hRow.getCell("date").numFmt = "yyyy/mm/dd";
      hRow.getCell("date").alignment = styles.center;
      hRow.eachCell((cell) => { cell.border = styles.border; });
    }
  }, [holidays, year]);

  // 年間シートを追加
  const addAnnualSheet = useCallback((wb: import("exceljs").Workbook, styles: StyleSet) => {
    const annualSheet = wb.addWorksheet("年間");
    const MONTH_COL_W = 7;
    const COL_GAP = 2;
    const MONTHS_PER_ROW = 3;
    annualSheet.getColumn(1).width = 1.5;
    for (let g = 0; g < MONTHS_PER_ROW; g++) {
      const base = 2 + g * (MONTH_COL_W + COL_GAP);
      for (let c = 0; c < MONTH_COL_W; c++) annualSheet.getColumn(base + c).width = 5;
      if (g < MONTHS_PER_ROW - 1) {
        for (let c = 0; c < COL_GAP; c++) annualSheet.getColumn(base + MONTH_COL_W + c).width = 1.5;
      }
    }
    const yearTitleRow = annualSheet.addRow([`${year}年 年間休日カレンダー`]);
    yearTitleRow.height = 26;
    const totalCols = 1 + MONTHS_PER_ROW * (MONTH_COL_W + COL_GAP) - COL_GAP;
    annualSheet.mergeCells(1, 1, 1, totalCols);
    const ytCell = yearTitleRow.getCell(1);
    ytCell.font = { bold: true, size: 15 };
    ytCell.alignment = styles.center;
    annualSheet.addRow([]);
    let currentStartRow = 3;
    for (let groupIdx = 0; groupIdx < 4; groupIdx++) {
      let maxRows = 0;
      for (let mIdx = 0; mIdx < MONTHS_PER_ROW; mIdx++) {
        const m = groupIdx * MONTHS_PER_ROW + mIdx + 1;
        const startCol = 2 + mIdx * (MONTH_COL_W + COL_GAP);
        const rowsUsed = addMonthBlock(annualSheet, currentStartRow, startCol, year, m, holidays, styles);
        maxRows = Math.max(maxRows, rowsUsed);
      }
      currentStartRow += maxRows + 2;
    }
  }, [year, holidays]);

  const exportExcel = useCallback(async () => {
    const { ExcelJS, wb, styles, SUMMARY_FILL, WHITE_BOLD } = await buildExcelStyles();
    const DATA_SHEET_NAME = "データ";
    const { grayFill, headerFill, border: allBorder, center: CENTER } = styles;

    // シート1: カレンダー
    const calSheet = wb.addWorksheet("カレンダー");
    buildMonthSheet(calSheet, days, styles, year, month, year, month, headerFill, SUMMARY_FILL, WHITE_BOLD, hourlyRate, true, DATA_SHEET_NAME);

    // シート2: データ
    const dataSheet = wb.addWorksheet(DATA_SHEET_NAME);
    dataSheet.columns = [
      { header: "日付", key: "date", width: 14 },
      { header: "曜日", key: "wd", width: 7 },
      { header: "稼働時間", key: "hours", width: 11 },
    ];
    const dataHeaderRow = dataSheet.getRow(1);
    dataHeaderRow.height = 20;
    dataHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = WHITE_BOLD;
      cell.alignment = CENTER;
      cell.border = allBorder;
    });
    for (const d of days) {
      const [dy, dm, dd] = d.date.split("-").map(Number);
      const row = dataSheet.addRow({ date: new Date(Date.UTC(dy, dm - 1, dd)), wd: WEEKDAYS[d.weekday], hours: d.isWorking ? d.hours : 0 });
      row.height = 18;
      row.getCell("date").numFmt = "yyyy/mm/dd";
      row.getCell("date").alignment = CENTER;
      const isSun = d.weekday === 0;
      const isSat = d.weekday === 6;
      row.getCell("date").font = (isSun || d.isHoliday) ? EXCEL_RED_FONT : isSat ? EXCEL_BLUE_FONT : {};
      row.getCell("wd").font = (isSun || d.isHoliday) ? EXCEL_RED_FONT : isSat ? EXCEL_BLUE_FONT : {};
      row.getCell("wd").alignment = CENTER;
      row.getCell("hours").alignment = CENTER;
      row.eachCell((cell) => {
        if (!d.isWorking) cell.fill = grayFill;
        cell.border = allBorder;
      });
    }
    const dataEndRow = days.length + 1;
    // 祝日シート手動追加対応: 範囲一括CF（行単位ルールを1本に集約）
    dataSheet.addConditionalFormatting({
      ref: `A2:C${dataEndRow}`,
      rules: [{
        type: "expression",
        priority: 1,
        formulae: [`IFERROR(VLOOKUP($A2,'${HOLIDAY_SHEET}'!$A:$B,2,FALSE),"")<>""`],
        style: { fill: CF_HOLIDAY_FILL, font: CF_HOLIDAY_FONT },
      }],
    });
    dataSheet.addRow([]);
    const ds1 = dataSheet.addRow(["稼働日数", "", { formula: `=COUNTIF(C2:C${dataEndRow},">0")`, result: workingDays }, "日"]);
    const ds2 = dataSheet.addRow(["総稼働時間", "", { formula: `=SUM(C2:C${dataEndRow})`, result: totalHours }, "時間"]);
    [ds1, ds2].forEach((r) => {
      r.getCell(1).font = { bold: true };
      r.getCell(3).font = { bold: true };
      r.fill = SUMMARY_FILL;
    });
    if (hourlyRate > 0) {
      const ds3 = dataSheet.addRow(["月収（概算）", "", { formula: `=C${ds2.number}*${hourlyRate}`, result: totalHours * hourlyRate }, "円"]);
      ds3.getCell(1).font = { bold: true };
      ds3.getCell(3).font = { bold: true, color: { argb: "FF059669" } };
      ds3.getCell(3).numFmt = "#,##0";
      ds3.fill = SUMMARY_FILL;
    }

    // シート3: 祝日 / シート4: 年間
    addHolidaySheet(wb, styles, WHITE_BOLD);
    addAnnualSheet(wb, styles);

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `稼働時間_${year}${String(month).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [days, hourlyRate, year, month, workingDays, totalHours, holidays, buildExcelStyles, addHolidaySheet, addAnnualSheet]);

  const exportAnnualExcel = useCallback(async () => {
    const { wb, styles, SUMMARY_FILL, WHITE_BOLD } = await buildExcelStyles();
    const { headerFill, grayFill, border: allBorder, center: CENTER } = styles;
    const UNIFIED_DATA_SHEET = "データ";

    // 全12ヶ月のDayInfoを収集
    const allMonthDays: DayInfo[][] = [];
    for (let m = 1; m <= 12; m++) {
      allMonthDays.push(m === month ? days : generateMonthDays(year, m, holidays, defaultHours));
    }

    // 12ヶ月分のカレンダーシート（統合データシートをVLOOKUP参照）
    for (let m = 1; m <= 12; m++) {
      const sheet = wb.addWorksheet(`${m}月`);
      buildMonthSheet(sheet, allMonthDays[m - 1], styles, year, m, year, m, headerFill, SUMMARY_FILL, WHITE_BOLD, hourlyRate, false, "", UNIFIED_DATA_SHEET);
    }

    // 統合データシート（全月・全日の一覧）
    const dataSheet = wb.addWorksheet(UNIFIED_DATA_SHEET);
    dataSheet.columns = [
      { header: "日付", key: "date", width: 14 },
      { header: "月", key: "month", width: 6 },
      { header: "曜日", key: "wd", width: 7 },
      { header: "稼働時間", key: "hours", width: 11 },
    ];
    const dataHeaderRow = dataSheet.getRow(1);
    dataHeaderRow.height = 20;
    dataHeaderRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = WHITE_BOLD;
      cell.alignment = CENTER;
      cell.border = allBorder;
    });
    for (let m = 1; m <= 12; m++) {
      for (const d of allMonthDays[m - 1]) {
        const [dy, dm, dd] = d.date.split("-").map(Number);
        const row = dataSheet.addRow({
          date: new Date(Date.UTC(dy, dm - 1, dd)),
          month: m,
          wd: WEEKDAYS[d.weekday],
          hours: d.isWorking ? d.hours : 0,
        });
        row.height = 18;
        row.getCell("date").numFmt = "yyyy/mm/dd";
        row.getCell("date").alignment = CENTER;
        row.getCell("wd").alignment = CENTER;
        row.getCell("hours").alignment = CENTER;
        const isSun = d.weekday === 0;
        const isSat = d.weekday === 6;
        row.getCell("date").font = (isSun || d.isHoliday) ? EXCEL_RED_FONT : isSat ? EXCEL_BLUE_FONT : {};
        row.getCell("wd").font = (isSun || d.isHoliday) ? EXCEL_RED_FONT : isSat ? EXCEL_BLUE_FONT : {};
        row.eachCell((cell) => {
          if (!d.isWorking) cell.fill = grayFill;
          cell.border = allBorder;
        });
      }
    }
    // 祝日シート手動追加対応: 範囲一括CF（行単位ルールを1本に集約）
    const annualDataEndRow = dataSheet.lastRow?.number ?? 1;
    dataSheet.addConditionalFormatting({
      ref: `A2:D${annualDataEndRow}`,
      rules: [{
        type: "expression",
        priority: 1,
        formulae: [`IFERROR(VLOOKUP($A2,'${HOLIDAY_SHEET}'!$A:$B,2,FALSE),"")<>""`],
        style: { fill: CF_HOLIDAY_FILL, font: CF_HOLIDAY_FONT },
      }],
    });

    // 祝日 / 年間
    addHolidaySheet(wb, styles, WHITE_BOLD);
    addAnnualSheet(wb, styles);

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `稼働時間_${year}年間.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [year, month, days, holidays, defaultHours, hourlyRate, buildExcelStyles, addHolidaySheet, addAnnualSheet]);

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
      <div className={[
        "rounded-lg border p-4",
        humorMode
          ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900",
      ].join(" ")}>
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

          {/* 時給 / 現物支給モード */}
          {humorMode ? (
            <>
              {/* 支給形態セレクター */}
              <div className="flex items-center gap-2 text-sm">
                <label className="text-amber-700 dark:text-amber-400">支給形態</label>
                <select
                  value={paymentKindId}
                  onChange={(e) => { setPaymentKindId(e.target.value); setDirectPaymentAmount(0); }}
                  className="rounded border border-amber-300 px-2 py-1 dark:border-amber-600 dark:bg-zinc-800"
                >
                  {PAYMENT_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.emoji} {k.name}</option>
                  ))}
                </select>
              </div>

              {/* 月収入力（選択単位） */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label htmlFor="direct-income" className="text-amber-700 dark:text-amber-400">
                  月収
                </label>
                <input
                  id="direct-income"
                  type="number"
                  value={directPaymentAmount || ""}
                  placeholder="金額を入力"
                  min={0}
                  onChange={(e) => setDirectPaymentAmount(Math.max(0, Number(e.target.value)))}
                  className="w-32 rounded border border-amber-300 px-2 py-1 dark:border-amber-600 dark:bg-zinc-800"
                />
                <span className="text-amber-700 dark:text-amber-400">{selectedPaymentKind.unit}</span>
                {incomeInYen !== null && selectedPaymentKind.id !== "cash" && (
                  <span className="text-xs text-amber-600 dark:text-amber-500">
                    = {formatMoney(incomeInYen)}
                  </span>
                )}
                {humorHourlyRate > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-500">
                    （時給換算: {Math.round(humorHourlyRate).toLocaleString("ja-JP")}円/h）
                  </span>
                )}
              </div>
            </>
          ) : (
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
          )}

          {/* 現物支給モードトグル */}
          <button
            onClick={() => { setHumorMode((v) => !v); setDirectPaymentAmount(0); setPaymentKindId("cash"); }}
            title={humorMode ? "通常モードに戻す" : "現物支給モードを試す"}
            className={[
              "ml-auto rounded-lg border px-3 py-1 text-sm transition-colors",
              humorMode
                ? "border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-800/30 dark:text-amber-300"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            {humorMode ? "🌰 現物支給 ON" : "🌰"}
          </button>
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
        <div className={[
          "col-span-2 rounded-lg border p-4 text-center md:col-span-1",
          humorMode
            ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
            : "border-zinc-200 dark:border-zinc-700",
        ].join(" ")}>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {humorMode
              ? `${selectedPaymentKind.emoji} 現物支給（${selectedPaymentKind.name}）`
              : "月収（概算）"}
          </p>
          {humorMode ? (
            directPaymentAmount > 0 ? (() => {
              const perHour = totalHours > 0
                ? directPaymentAmount / totalHours
                : null;
              const perHourStr = perHour !== null
                ? perHour >= 1
                  ? `${Math.round(perHour).toLocaleString("ja-JP")}${selectedPaymentKind.unit}/h`
                  : `${perHour.toFixed(2)}${selectedPaymentKind.unit}/h`
                : null;
              return (
                <>
                  <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {directPaymentAmount.toLocaleString("ja-JP")}
                    <span className="text-sm font-normal">{selectedPaymentKind.unit}</span>
                  </p>
                  {perHourStr && (
                    <p className="mt-0.5 text-sm text-amber-500 dark:text-amber-500">
                      {perHourStr}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-amber-500 dark:text-amber-600">
                    {selectedPaymentKind.id !== "cash" && `≈ ${formatMoney(incomeInYen!)} / `}
                    ※{selectedPaymentKind.note}
                  </p>
                </>
              );
            })() : (
              <p className="mt-1 text-sm text-zinc-400">月収を入力すると表示</p>
            )
          ) : monthlyIncome !== null ? (
            <p className="mt-1 text-2xl font-bold">{formatMoney(monthlyIncome)}</p>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">時給を入力すると表示</p>
          )}
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
          📊 月間Excel出力
        </button>
        <button
          onClick={exportAnnualExcel}
          className="rounded-lg border border-teal-500 bg-teal-50 px-4 py-2 text-sm text-teal-700 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/40"
        >
          📅 年間Excel出力（12ヶ月）
        </button>
      </div>
      <p className="text-xs text-zinc-400">
        ※ 年間出力は現在表示中の月のカスタム設定のみ反映されます
      </p>

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
          <li>7. 🌰 現物支給モード：支給形態を選んで月収を個数で入力すると時給換算（個数/h）を表示</li>
          <li>8. 「URLをコピー」で設定を保存・共有できます</li>
          <li>9. 「Excelで出力」で数式付きの帳票をダウンロードできます</li>
        </ol>
      </div>
    </div>
  );
}
