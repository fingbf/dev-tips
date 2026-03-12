import { getAllTips, getCategories } from "@/lib/tips";
import { TipCard } from "@/components/tip-card";
import { CategoryNav } from "@/components/category-nav";

export default function Home() {
  const tips = getAllTips();
  const categories = getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold">Dev Tips</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          開発Tips・スニペット集
        </p>
      </div>

      <CategoryNav categories={categories} />

      {tips.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">
          まだ記事がありません。content/tips/ にMDXファイルを追加してください。
        </p>
      ) : (
        <div className="grid gap-4">
          {tips.map((tip) => (
            <TipCard key={`${tip.category}/${tip.slug}`} tip={tip} />
          ))}
        </div>
      )}
    </div>
  );
}
