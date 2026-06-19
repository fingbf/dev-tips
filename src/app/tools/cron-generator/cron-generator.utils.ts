/**
 * Cron ジェネレーター用ユーティリティ（純粋関数）
 *
 * Quartz の仕様: DOM と DOW はどちらか一方のみ有効。
 * 両方非 * の場合は DOM を ? にして DOW を優先する (AWS/Spring の一般的な慣習)。
 */
export function unixToQuartz(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return expression;
  const [min, hour, dom, month, dow] = parts;
  // Quartz: SEC MIN HOUR DOM MONTH DOW
  // DOM と DOW の競合回避（どちらか一方を ? にしなければならない）:
  //   DOW が * → DOM 側を使う（DOW を ? にする）
  //   DOW が非 * → DOW 側を使う（DOM を ? にする）、DOM*・DOM非* 問わず
  const quartzDow = dow === "*" ? "?" : dow;
  const quartzDom = dow !== "*" ? "?" : dom;
  return `0 ${min} ${hour} ${quartzDom} ${month} ${quartzDow}`;
}

export function quartzToUnix(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 6) return expression;
  const [, min, hour, dom, month, dow] = parts;
  const unixDom = dom === "?" ? "*" : dom;
  const unixDow = dow === "?" ? "*" : dow;
  return `${min} ${hour} ${unixDom} ${month} ${unixDow}`;
}
