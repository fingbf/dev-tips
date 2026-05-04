"use client";

import { useState, useMemo } from "react";
import rawItems from "@/data/games/tbs/items.json";
import rawSetEffects from "@/data/games/tbs/set-effects.json";

type SetEffect = { id: number; name: string; color: string; desc: string };
const setEffects = rawSetEffects as Record<string, SetEffect>;

type Item = {
  id: number;
  name: string;
  desc: string;
  rare: number;
  boss: boolean;
  special: boolean;
  emotion: number;
  setTags: { id: number; name: string }[];
  hasIcon: boolean;
  note?: string;
};

const items = rawItems as Item[];

const RARE_LABEL: Record<number, string> = { 0: "ノーマル", 1: "驚異", 2: "流風", 3: "幻想" };
const RARE_CLASS: Record<number, string> = {
  0: "text-zinc-400",
  1: "text-blue-500 dark:text-blue-400",
  2: "text-purple-500 dark:text-purple-400",
  3: "text-yellow-500 dark:text-yellow-400",
};
const EMO_LABEL: Record<number, string> = { 1: "喜", 2: "怒", 3: "哀", 4: "楽" };
const EMO_CLASS: Record<number, string> = {
  1: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  2: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  3: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  4: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

function cleanDesc(text: string) {
  return text
    .replace(/<term=([^>]+)>/g, "[$1]")
    .replace(/<[^>]+>/g, "")
    .replace(/\\t/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

const RARE_OPTIONS = [0, 1, 2, 3] as const;
const EMO_OPTIONS = [0, 1, 2, 3, 4] as const;

export function ItemsTable() {
  const [search, setSearch] = useState("");
  const [rareFilter, setRareFilter] = useState<number | null>(null);
  const [emoFilter, setEmoFilter] = useState<number | null>(null);
  const [bossFilter, setBossFilter] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      if (rareFilter !== null && item.rare !== rareFilter) return false;
      if (emoFilter !== null && item.emotion !== emoFilter) return false;
      if (bossFilter && !item.boss) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.desc.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, rareFilter, emoFilter, bossFilter]);

  return (
    <div>
      {/* フィルター */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="名前・説明で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <div className="flex gap-1">
          {RARE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRareFilter(rareFilter === r ? null : r)}
              className={`rounded px-2 py-1 text-xs font-bold transition-opacity ${RARE_CLASS[r]} ${rareFilter === r ? "opacity-100 ring-1 ring-current" : "opacity-50 hover:opacity-80"}`}
            >
              {RARE_LABEL[r]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {([1, 2, 3, 4] as const).map((e) => (
            <button
              key={e}
              onClick={() => setEmoFilter(emoFilter === e ? null : e)}
              className={`rounded px-2 py-1 text-xs font-bold transition-opacity ${EMO_CLASS[e]} ${emoFilter === e ? "opacity-100 ring-1 ring-current" : "opacity-50 hover:opacity-80"}`}
            >
              {EMO_LABEL[e]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setBossFilter(!bossFilter)}
          className={`rounded px-2 py-1 text-xs font-bold transition-opacity ${bossFilter ? "opacity-100 ring-1 ring-current" : "opacity-50 hover:opacity-80"} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}
        >
          Boss
        </button>
        <span className="ml-auto text-xs text-zinc-400">{filtered.length} 件</span>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <th className="w-8 px-2 py-2 text-right text-zinc-400">#</th>
              <th className="px-3 py-2">名前</th>
              <th className="px-3 py-2">レア</th>
              <th className="px-3 py-2">タグ</th>
              <th className="px-3 py-2">説明</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr
                key={item.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40"
              >
                <td className="px-2 py-2 text-right text-xs text-zinc-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs font-bold ${RARE_CLASS[item.rare]}`}>
                    {RARE_LABEL[item.rare]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {item.emotion > 0 && (
                      <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${EMO_CLASS[item.emotion]}`}>
                        {EMO_LABEL[item.emotion]}
                      </span>
                    )}
                    {item.boss && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Boss
                      </span>
                    )}
                    {item.special && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        特殊
                      </span>
                    )}
                    {item.setTags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="max-w-xs px-3 py-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {item.note && (
                    <div className="mb-1 text-amber-600 dark:text-amber-400">{item.note}</div>
                  )}
                  {cleanDesc(item.desc)}
                  {item.setTags.map((t) => {
                    const ef = setEffects[String(t.id)];
                    if (!ef) return null;
                    return (
                      <div
                        key={t.id}
                        className="mt-1.5 rounded-r border-l-2 px-2 py-1"
                        style={{ borderColor: ef.color, background: `${ef.color}18` }}
                      >
                        <span className="font-bold" style={{ color: ef.color }}>【{ef.name}】</span>{" "}
                        {cleanDesc(ef.desc)}
                      </div>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
