import termsData from "@/data/games/tbs/terms.json";

const TERMS = termsData as Record<string, string>;
const TAG_RE = /(<term=[^>]+>|<(?:data|damage|attr|dps)=[^>]+>|<br>)/gi;

type Params = Record<string, number | string>;

function formatVal(v: number | string): string {
  if (typeof v === "string") return v; // "×2.5+25" など
  return String(v);
}

export function DescText({ raw, params }: { raw: string; params?: Params }) {
  if (!raw) return null;
  const parts = raw.split(TAG_RE);
  return (
    <span className="whitespace-pre-line text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
      {parts.map((part, i) => {
        const termMatch = part.match(/^<term=([^>]+)>$/i);
        if (termMatch) {
          const name = TERMS[termMatch[1].toUpperCase()] ?? termMatch[1];
          return (
            <span key={i} className="mx-0.5 rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {name}
            </span>
          );
        }
        const dataMatch = part.match(/^<(?:data|damage|attr|dps)=([^>]+)>$/i);
        if (dataMatch) {
          const key = dataMatch[1];
          const val = params?.[key];
          if (val !== undefined) {
            return (
              <span key={i} className="font-medium text-zinc-600 dark:text-zinc-300">
                {formatVal(val)}
              </span>
            );
          }
          return <span key={i} className="text-zinc-300 dark:text-zinc-600">?</span>;
        }
        if (/^<br>$/i.test(part)) return "\n";
        return part;
      })}
    </span>
  );
}

/** 複数レベルのスキル用: レベルごとにパラメータが異なる場合は "Lv1:X / Lv2:Y" 形式でマージ */
export function mergeSkillParams(levelParams: Params[]): Params {
  if (levelParams.length === 0) return {};
  if (levelParams.length === 1) return levelParams[0];
  const merged: Params = {};
  const keys = new Set(levelParams.flatMap((p) => Object.keys(p)));
  for (const key of keys) {
    const vals = levelParams.map((p) => p[key]).filter((v) => v !== undefined);
    const unique = [...new Set(vals.map(String))];
    merged[key] = unique.length === 1 ? vals[0] : unique.join(" / ");
  }
  return merged;
}
