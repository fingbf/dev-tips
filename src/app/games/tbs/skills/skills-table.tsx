"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import rawSkills from "@/data/games/tbs/skills.json";

type Skill = {
  id: number;
  name: string;
  desc: string;
  levelCount: number;
  levelRares: number[];
  characters: number[];
  special: boolean;
  emotion: number;
  type: number;
  hasIcon: boolean;
};

const skills = rawSkills as Skill[];

const TYPE_LABEL: Record<number, string> = { 0: "通常", 1: "通常", 3: "パッシブ", 4: "天賦" };
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

const SECTIONS: { charId: number; label: string }[] = [
  { charId: 1,   label: "秦こころ" },
  { charId: 106, label: "藤原妹紅" },
  { charId: 0,   label: "汎用" },
];

const TYPE_OPTIONS = [0, 3, 4] as const;

function cleanDesc(text: string) {
  return text
    .replace(/<term=([^>]+)>/g, "[$1]")
    .replace(/<[^>]+>/g, "")
    .replace(/\\t/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40">
      <td className="px-3 py-2 text-center">
        {skill.hasIcon ? (
          <Image
            src={`/games/tbs/icons/skills/${skill.id}.png`}
            alt={skill.name}
            width={40}
            height={40}
            className="mx-auto"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>
      <td className="px-3 py-2 font-medium">{skill.name}</td>
      <td className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
        {TYPE_LABEL[skill.type]}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-0.5">
          {skill.levelRares.map((r, i) => (
            <span key={i} className={`text-xs font-bold ${RARE_CLASS[r]}`}>
              {skill.levelCount > 1 ? `Lv${i + 1}: ` : ""}{RARE_LABEL[r]}
            </span>
          ))}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {skill.emotion > 0 && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${EMO_CLASS[skill.emotion]}`}>
              {EMO_LABEL[skill.emotion]}
            </span>
          )}
          {skill.special && (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              特殊
            </span>
          )}
        </div>
      </td>
      <td className="max-w-xs px-3 py-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {cleanDesc(skill.desc)}
      </td>
    </tr>
  );
}

export function SkillsTable() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<number | null>(null);

  const sections = useMemo(() => {
    const q = search.toLowerCase();
    return SECTIONS.map(({ charId, label }) => {
      const list = skills.filter((s) => {
        const inChar = charId === 0
          ? s.characters.length === 0 || s.characters.includes(0)
          : s.characters.includes(charId);
        if (!inChar) return false;
        // type=1 は「通常」扱い (TYPE_LABEL同じ) なのでまとめてフィルタ
        if (typeFilter !== null) {
          const match = typeFilter === 0 ? (s.type === 0 || s.type === 1) : s.type === typeFilter;
          if (!match) return false;
        }
        if (q && !s.name.toLowerCase().includes(q) && !s.desc.toLowerCase().includes(q)) return false;
        return true;
      });
      return { charId, label, list };
    }).filter((s) => s.list.length > 0);
  }, [search, typeFilter]);

  const totalCount = sections.reduce((n, s) => n + s.list.length, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="名前・説明で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <div className="flex gap-1">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={`rounded px-2 py-1 text-xs font-bold transition-opacity ${typeFilter === t ? "opacity-100 ring-1 ring-zinc-500" : "opacity-50 hover:opacity-80"} bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-zinc-400">{totalCount} 件</span>
      </div>

      <div className="flex flex-col gap-6">
        {sections.map(({ label, list }) => (
          <div key={label}>
            <h2 className="mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {label}
              <span className="ml-2 font-normal text-zinc-400">{list.length} 件</span>
            </h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                    <th className="w-14 px-3 py-2 text-center">アイコン</th>
                    <th className="px-3 py-2">名前</th>
                    <th className="px-3 py-2">種別</th>
                    <th className="px-3 py-2">レア</th>
                    <th className="px-3 py-2">タグ</th>
                    <th className="px-3 py-2">説明</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((skill) => (
                    <SkillRow key={skill.id} skill={skill} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
