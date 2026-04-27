import { describe, it, expect } from "vitest";
import { parseTime, formatTime, convertLine } from "./work-time-rounder.utils";

// 開始時間: 15分単位切り上げ（ceil）
// m=0 → 0, m=1〜15 → 15, m=16〜30 → 30, m=31〜45 → 45, m=46〜59 → 0(次の時間)
function expectedStartMin(h: number, m: number): number {
  return Math.ceil((h * 60 + m) / 15) * 15;
}

// 終了時間: 15分単位切り下げ（floor）
// m=0〜14 → 0, m=15〜29 → 15, m=30〜44 → 30, m=45〜59 → 45
function expectedEndMin(h: number, m: number): number {
  return Math.floor((h * 60 + m) / 15) * 15;
}

describe("parseTime", () => {
  it("正常: 1桁時刻", () => expect(parseTime("9:05")).toEqual({ h: 9, m: 5 }));
  it("正常: 2桁時刻", () => expect(parseTime("18:47")).toEqual({ h: 18, m: 47 }));
  it("正常: 0時", () => expect(parseTime("0:00")).toEqual({ h: 0, m: 0 }));
  it("正常: 23:59", () => expect(parseTime("23:59")).toEqual({ h: 23, m: 59 }));
  it("正常: 前後スペース除去", () => expect(parseTime("  9:00  ")).toEqual({ h: 9, m: 0 }));
  it("エラー: 区切りなし", () => expect(parseTime("900")).toBeNull());
  it("エラー: 文字含む", () => expect(parseTime("abc")).toBeNull());
  it("エラー: 空文字", () => expect(parseTime("")).toBeNull());
  it("エラー: 時間が24以上", () => expect(parseTime("24:00")).toBeNull());
  it("エラー: 分が60以上", () => expect(parseTime("9:60")).toBeNull());
  it("エラー: 分が1桁", () => expect(parseTime("9:5")).toBeNull());
});

describe("formatTime", () => {
  it("0分", () => expect(formatTime(0)).toBe("0:00"));
  it("9:00", () => expect(formatTime(9 * 60)).toBe("9:00"));
  it("9:15", () => expect(formatTime(9 * 60 + 15)).toBe("9:15"));
  it("18:45", () => expect(formatTime(18 * 60 + 45)).toBe("18:45"));
  it("23:59", () => expect(formatTime(23 * 60 + 59)).toBe("23:59"));
  it("分を2桁ゼロ埋め", () => expect(formatTime(9 * 60 + 5)).toBe("9:05"));
});

describe("開始時間 切り上げ — 全60分パターン (h=9)", () => {
  const H = 9;

  // m=0: ぴったり → 変化なし
  it("m=0 → 9:00", () => {
    const min = expectedStartMin(H, 0);
    expect(formatTime(min)).toBe("9:00");
  });

  // m=1〜15: 15分に切り上げ
  for (let m = 1; m <= 15; m++) {
    it(`m=${m} → 9:15`, () => {
      const min = expectedStartMin(H, m);
      expect(formatTime(min)).toBe("9:15");
    });
  }

  // m=16〜30: 30分に切り上げ
  for (let m = 16; m <= 30; m++) {
    it(`m=${m} → 9:30`, () => {
      const min = expectedStartMin(H, m);
      expect(formatTime(min)).toBe("9:30");
    });
  }

  // m=31〜45: 45分に切り上げ
  for (let m = 31; m <= 45; m++) {
    it(`m=${m} → 9:45`, () => {
      const min = expectedStartMin(H, m);
      expect(formatTime(min)).toBe("9:45");
    });
  }

  // m=46〜59: 次の時間(10:00)に切り上げ
  for (let m = 46; m <= 59; m++) {
    it(`m=${m} → 10:00`, () => {
      const min = expectedStartMin(H, m);
      expect(formatTime(min)).toBe("10:00");
    });
  }
});

describe("終了時間 切り下げ — 全60分パターン (h=18)", () => {
  const H = 18;

  // m=0〜14: 0分に切り下げ
  for (let m = 0; m <= 14; m++) {
    it(`m=${m} → 18:00`, () => {
      const min = expectedEndMin(H, m);
      expect(formatTime(min)).toBe("18:00");
    });
  }

  // m=15〜29: 15分に切り下げ
  for (let m = 15; m <= 29; m++) {
    it(`m=${m} → 18:15`, () => {
      const min = expectedEndMin(H, m);
      expect(formatTime(min)).toBe("18:15");
    });
  }

  // m=30〜44: 30分に切り下げ
  for (let m = 30; m <= 44; m++) {
    it(`m=${m} → 18:30`, () => {
      const min = expectedEndMin(H, m);
      expect(formatTime(min)).toBe("18:30");
    });
  }

  // m=45〜59: 45分に切り下げ
  for (let m = 45; m <= 59; m++) {
    it(`m=${m} → 18:45`, () => {
      const min = expectedEndMin(H, m);
      expect(formatTime(min)).toBe("18:45");
    });
  }
});

describe("convertLine — 境界値・特殊ケース", () => {
  it("タブ区切り: 変換される", () =>
    expect(convertLine("9:03\t18:47")).toBe("9:15\t18:45"));

  it("カンマ区切り: 変換される", () =>
    expect(convertLine("9:03,18:47")).toBe("9:15,18:45"));

  it("ぴったり15分: 変化なし", () =>
    expect(convertLine("9:00\t18:00")).toBe("9:00\t18:00"));

  it("ぴったり15分の境界: 9:15→9:15, 18:15→18:15", () =>
    expect(convertLine("9:15\t18:15")).toBe("9:15\t18:15"));

  it("ぴったり30分: 変化なし", () =>
    expect(convertLine("9:30\t18:30")).toBe("9:30\t18:30"));

  it("ぴったり45分: 変化なし", () =>
    expect(convertLine("9:45\t18:45")).toBe("9:45\t18:45"));

  it("開始 m=46〜: 次の時間に繰り上がる", () =>
    expect(convertLine("9:46\t18:00")).toBe("10:00\t18:00"));

  it("3列目（備考）を引き継ぐ", () =>
    expect(convertLine("9:05,18:47,備考")).toBe("9:15,18:45,備考"));

  it("3列目以降複数列を引き継ぐ", () =>
    expect(convertLine("9:05\t18:47\t備考\t8h")).toBe("9:15\t18:45\t備考\t8h"));

  it("空行: 空文字を返す", () =>
    expect(convertLine("")).toBe(""));

  it("スペースのみ: 空文字を返す", () =>
    expect(convertLine("   ")).toBe(""));

  it("丸め後に終了≦開始: 警告付き", () => {
    const result = convertLine("9:01\t9:14");
    expect(result).toContain("9:15");
    expect(result).toContain("9:00");
    expect(result).toContain("警告");
  });

  it("丸め後に終了=開始: 警告付き", () => {
    const result = convertLine("9:01\t9:15");
    expect(result).toContain("警告");
  });

  it("区切り文字なし: エラーメッセージ", () =>
    expect(convertLine("900")).toContain("エラー"));

  it("開始時間が不正: エラーメッセージ", () =>
    expect(convertLine("abc\t18:00")).toContain("エラー"));

  it("終了時間が不正: エラーメッセージ", () =>
    expect(convertLine("9:00\txyz")).toContain("エラー"));

  it("複数行を独立して変換", () => {
    const lines = ["9:03\t18:47", "8:52\t17:33"].map(convertLine);
    expect(lines[0]).toBe("9:15\t18:45");
    expect(lines[1]).toBe("9:00\t17:30");
  });
});
