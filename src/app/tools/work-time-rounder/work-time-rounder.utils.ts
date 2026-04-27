export function parseTime(str: string): { h: number; m: number } | null {
  const match = str.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

export function formatTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function convertLine(line: string): string {
  if (!line.trim()) return "";

  const delimiter = line.includes("\t") ? "\t" : ",";
  const parts = line.split(/[\t,]/);
  if (parts.length < 2) {
    return `${line} ← エラー: 区切り文字（タブまたはカンマ）が見つかりません`;
  }

  const start = parseTime(parts[0]);
  if (!start) {
    return `${line} ← エラー: 開始時間の形式が正しくありません（例: 9:00）`;
  }

  const end = parseTime(parts[1]);
  if (!end) {
    return `${line} ← エラー: 終了時間の形式が正しくありません（例: 18:00）`;
  }

  const startMin = Math.ceil((start.h * 60 + start.m) / 15) * 15;
  const endMin = Math.floor((end.h * 60 + end.m) / 15) * 15;

  // 3列目以降（備考等）はそのまま引き継ぐ
  const rest = parts.slice(2);
  const converted = [formatTime(startMin), formatTime(endMin), ...rest];
  let result = converted.join(delimiter);

  if (endMin <= startMin) {
    result += " ← 警告: 丸め後の終了時間が開始時間以前になっています";
  }
  return result;
}
