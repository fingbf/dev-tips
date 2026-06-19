import { describe, it, expect } from "vitest";
import {
  sanitizeHexColor,
  sanitizeFontFamily,
  hexToRgba,
} from "./obs-timer-view.utils";

describe("sanitizeHexColor", () => {
  // 正当な hex 値は通過
  it("正当な6桁hex (#ffffff) → そのまま返す", () =>
    expect(sanitizeHexColor("#ffffff", "#000000")).toBe("#ffffff"));
  it("正当な6桁hex (#1A2B3C) → そのまま返す", () =>
    expect(sanitizeHexColor("#1A2B3C", "#000000")).toBe("#1A2B3C"));
  it("正当な6桁hex (#000000) → そのまま返す", () =>
    expect(sanitizeHexColor("#000000", "#ffffff")).toBe("#000000"));

  // 不正値はフォールバック
  it("CSS注入文字列 → フォールバック", () =>
    expect(sanitizeHexColor("red; background: url(evil)", "#ffffff")).toBe("#ffffff"));
  it("expression() → フォールバック", () =>
    expect(sanitizeHexColor("#fff; color: expression(alert(1))", "#ffffff")).toBe("#ffffff"));
  it("3桁hex (#fff) → フォールバック", () =>
    expect(sanitizeHexColor("#fff", "#ffffff")).toBe("#ffffff"));
  it("#なし (ffffff) → フォールバック", () =>
    expect(sanitizeHexColor("ffffff", "#ffffff")).toBe("#ffffff"));
  it("空文字 → フォールバック", () =>
    expect(sanitizeHexColor("", "#ffffff")).toBe("#ffffff"));
  it("null → フォールバック", () =>
    expect(sanitizeHexColor(null, "#ffffff")).toBe("#ffffff"));
  it("transparent はフォールバックとして有効", () =>
    expect(sanitizeHexColor(null, "transparent")).toBe("transparent"));
});

describe("sanitizeFontFamily", () => {
  it("monospace → そのまま返す", () =>
    expect(sanitizeFontFamily("monospace")).toBe("monospace"));
  it("serif → そのまま返す", () =>
    expect(sanitizeFontFamily("serif")).toBe("serif"));
  it("sans-serif → そのまま返す", () =>
    expect(sanitizeFontFamily("sans-serif")).toBe("sans-serif"));
  it("cursive → そのまま返す", () =>
    expect(sanitizeFontFamily("cursive")).toBe("cursive"));
  it("fantasy → そのまま返す", () =>
    expect(sanitizeFontFamily("fantasy")).toBe("fantasy"));

  // 許可リスト外はデフォルト
  it("CSS注入文字列 → monospace", () =>
    expect(sanitizeFontFamily("Arial; color: red")).toBe("monospace"));
  it("任意文字列 (Impact) → monospace", () =>
    expect(sanitizeFontFamily("Impact")).toBe("monospace"));
  it("空文字 → monospace", () =>
    expect(sanitizeFontFamily("")).toBe("monospace"));
  it("null → monospace", () =>
    expect(sanitizeFontFamily(null)).toBe("monospace"));
});

describe("hexToRgba", () => {
  it("正当なhex + alpha=1 → rgba文字列", () =>
    expect(hexToRgba("#ffffff", 1)).toBe("rgba(255, 255, 255, 1)"));
  it("正当なhex + alpha=0.5 → rgba文字列", () =>
    expect(hexToRgba("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)"));
  it("正当なhex + alpha=0 → rgba文字列", () =>
    expect(hexToRgba("#ff0000", 0)).toBe("rgba(255, 0, 0, 0)"));

  // alpha クランプ
  it("alpha > 1 → 1 にクランプ", () =>
    expect(hexToRgba("#ffffff", 2)).toBe("rgba(255, 255, 255, 1)"));
  it("alpha < 0 → 0 にクランプ", () =>
    expect(hexToRgba("#ffffff", -0.5)).toBe("rgba(255, 255, 255, 0)"));
  it("alpha = NaN → 1 にフォールバック", () =>
    expect(hexToRgba("#ffffff", NaN)).toBe("rgba(255, 255, 255, 1)"));

  // 不正 hex はサイレント崩壊せず transparent を返す
  it("不正hex (NaN生成) → transparent", () =>
    expect(hexToRgba("red", 1)).toBe("transparent"));
  it("3桁hex → transparent", () =>
    expect(hexToRgba("#fff", 1)).toBe("transparent"));
  it("空文字 → transparent", () =>
    expect(hexToRgba("", 1)).toBe("transparent"));
});
