"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function parseParams(params: URLSearchParams) {
  return {
    color: params.get("color") ?? "#ffffff",
    fontSize: parseInt(params.get("fontSize") ?? "72", 10),
    fontFamily: params.get("fontFamily") ?? "monospace",
    showDate: params.get("showDate") !== "false",
    showDow: params.get("showDow") !== "false",
    showSeconds: params.get("showSeconds") !== "false",
    bgColor: params.get("bgColor") ?? "transparent",
    bgOpacity: parseInt(params.get("bgOpacity") ?? "100", 10),
    bgPadding: parseInt(params.get("bgPadding") ?? "0", 10),
    bgRound: parseInt(params.get("bgRound") ?? "0", 10),
    theme: params.get("theme") ?? "default",
    dateFormat: params.get("dateFormat") ?? "ja",
  };
}

const DOW_JA = ["日", "月", "火", "水", "木", "金", "土"];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDateJa(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const dow = DOW_JA[date.getDay()];
  return `${y}/${m}/${d} (${dow})`;
}

function formatDateEn(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dow = dows[date.getDay()];
  const m = months[date.getMonth()];
  const d = date.getDate();
  const y = date.getFullYear();
  return `${dow}, ${m} ${d}, ${y}`;
}

function formatTime(date: Date, showSeconds: boolean): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  return showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
}



function getThemeStyles(
  theme: string,
  color: string,
  fontSize: number,
): React.CSSProperties {
  const base: React.CSSProperties = {
    color,
    fontSize: `${fontSize}px`,
    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
  };

  switch (theme) {
    case "gaming":
      return {
        ...base,
        textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`,
        letterSpacing: "4px",
      };
    case "cute":
      return {
        ...base,
        textShadow:
          "2px 2px 0px rgba(255,182,193,0.7), 4px 4px 0px rgba(255,105,180,0.3)",
        letterSpacing: "2px",
      };
    case "minimal":
      return {
        ...base,
        textShadow: "none",
        fontWeight: 300,
        letterSpacing: "2px",
      };
    case "retro":
      return {
        ...base,
        textShadow: "3px 3px 0px rgba(0,0,0,0.8)",
        letterSpacing: "6px",
        fontFamily: "monospace",
      };
    default:
      return base;
  }
}

export function OBSTimerView() {
  const searchParams = useSearchParams();
  const config = parseParams(searchParams);
  const [now, setNow] = useState(new Date());

  // 親レイアウトのヘッダー・フッターを隠す
  useEffect(() => {
    document.body.style.background = "transparent";
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    const main = document.querySelector("main");
    if (header) header.style.display = "none";
    if (footer) footer.style.display = "none";
    if (main) {
      main.style.padding = "0";
      main.style.maxWidth = "none";
    }
    return () => {
      document.body.style.background = "";
      if (header) header.style.display = "";
      if (footer) footer.style.display = "";
      if (main) {
        main.style.padding = "";
        main.style.maxWidth = "";
      }
    };
  }, []);

  // 毎秒更新
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const themeStyles = getThemeStyles(config.theme, config.color, config.fontSize);
  const dateStr =
    config.dateFormat === "en" ? formatDateEn(now) : formatDateJa(now);

  const mainDisplay = formatTime(now, config.showSeconds);

  // 背景スタイルの計算
  const hasBg = config.bgColor !== "transparent";
  const bgStyle: React.CSSProperties = hasBg
    ? {
        backgroundColor: hexToRgba(config.bgColor, config.bgOpacity / 100),
        padding: `${config.bgPadding}px`,
        borderRadius: `${config.bgRound}px`,
      }
    : {};

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "transparent",
        fontFamily: config.fontFamily,
        userSelect: "none",
      }}
    >
      <div style={bgStyle}>
        {/* 日付・曜日 */}
        {(config.showDate || config.showDow) && (
          <div
            style={{
              ...themeStyles,
              fontSize: `${config.fontSize * 0.3}px`,
              marginBottom: "4px",
              opacity: 0.8,
              textAlign: "center",
            }}
          >
            {config.showDate && config.showDow && dateStr}
            {config.showDate &&
              !config.showDow &&
              dateStr.replace(/\s*\(.\)/, "")}
            {!config.showDate &&
              config.showDow &&
              `(${DOW_JA[now.getDay()]})`}
          </div>
        )}

        {/* メイン表示 */}
        <div style={{ ...themeStyles, textAlign: "center" }}>
          {mainDisplay}
        </div>
      </div>
    </div>
  );
}
