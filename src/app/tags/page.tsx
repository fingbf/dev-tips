import { getAllTags } from "@/lib/tips";
import { TagBadge } from "@/components/tag-badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tags | Dev Tips",
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tags</h1>

      {tags.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">
          まだタグがありません。
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <TagBadge key={tag} tag={tag} count={count} />
          ))}
        </div>
      )}
    </div>
  );
}
