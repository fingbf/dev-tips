"use client";

import { useState, useMemo } from "react";
import rawAchievements from "@/data/games/tbs/achievements.json";

type Achievement = {
  id: number;
  name: string;
  desc: string;
};

const achievements = rawAchievements as Achievement[];

export function AchievementsList() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return achievements;
    return achievements.filter(
      (a) => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    );
  }, [search]);

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
        <span className="ml-auto text-xs text-zinc-400">{filtered.length} 件</span>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {filtered.map((a) => (
            <li key={a.id} className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
              <div className="mb-0.5 font-medium">{a.name}</div>
              <div className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{a.desc}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
