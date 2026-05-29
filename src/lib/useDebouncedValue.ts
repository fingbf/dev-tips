import { useEffect, useState } from "react";

/**
 * 値の更新を delay ms 遅延させる汎用 debounce フック。
 *
 * 用途: 重い同期処理 (cron 解析, RegExp コンパイル, 大量行変換 等) を
 * 入力ごとに走らせないようにする。typeahead ペースト時の UI フリーズ防止。
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
