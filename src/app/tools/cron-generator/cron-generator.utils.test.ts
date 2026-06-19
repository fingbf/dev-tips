import { describe, it, expect } from "vitest";
import { unixToQuartz, quartzToUnix } from "./cron-generator.utils";

describe("unixToQuartz", () => {
  // DOM=* DOW=* → DOW を ? にし DOM は * のまま（毎日実行）
  it("* * * * * → 0 * * * * ?", () =>
    expect(unixToQuartz("* * * * *")).toBe("0 * * * * ?"));

  // DOM=* DOW指定 → DOM を ? にして DOW を使う
  it("0 9 * * 1 → 0 0 9 ? * 1（月曜9時）", () =>
    expect(unixToQuartz("0 9 * * 1")).toBe("0 0 9 ? * 1"));

  it("0 9 * * 1-5 → 0 0 9 ? * 1-5（平日9時）", () =>
    expect(unixToQuartz("0 9 * * 1-5")).toBe("0 0 9 ? * 1-5"));

  // DOM指定 DOW=* → DOW を ? にして DOM を使う
  it("0 0 1 * * → 0 0 0 1 * ?（毎月1日）", () =>
    expect(unixToQuartz("0 0 1 * *")).toBe("0 0 0 1 * ?"));

  it("0 0 15 * * → 0 0 0 15 * ?（毎月15日）", () =>
    expect(unixToQuartz("0 0 15 * *")).toBe("0 0 0 15 * ?"));

  // DOM指定 DOW指定 → 両方非*: 旧バグケース。DOM を ? にして DOW を優先
  it("0 9 1 * 1（DOM=1 DOW=1）→ DOW優先で 0 0 9 ? * 1", () =>
    expect(unixToQuartz("0 9 1 * 1")).toBe("0 0 9 ? * 1"));

  // フィールド数不一致はそのまま返す
  it("フィールド数が5でない → そのまま返す", () =>
    expect(unixToQuartz("0 9 1 *")).toBe("0 9 1 *"));
});

describe("quartzToUnix", () => {
  it("0 * * ? * ? → * * * * *", () =>
    expect(quartzToUnix("0 * * ? * ?")).toBe("* * * * *"));

  it("0 0 9 ? * 1 → 0 9 * * 1", () =>
    expect(quartzToUnix("0 0 9 ? * 1")).toBe("0 9 * * 1"));

  it("0 0 0 1 * ? → 0 0 1 * *", () =>
    expect(quartzToUnix("0 0 0 1 * ?")).toBe("0 0 1 * *"));

  // フィールド数不一致はそのまま返す
  it("フィールド数が6でない → そのまま返す", () =>
    expect(quartzToUnix("0 9 * * 1")).toBe("0 9 * * 1"));
});
