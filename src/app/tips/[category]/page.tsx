import { notFound } from "next/navigation";
import { getCategories, getTipsByCategory } from "@/lib/tips";
import { TipCard } from "@/components/tip-card";
import { CategoryNav } from "@/components/category-nav";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  return getCategories().map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const categories = getCategories();
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return {};
  return { title: `${cat.name} | Dev Tips` };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const categories = getCategories();
  const cat = categories.find((c) => c.slug === category);
  if (!cat) notFound();

  const tips = getTipsByCategory(category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold">{cat.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{cat.description}</p>
      </div>

      <CategoryNav categories={categories} current={category} />

      {tips.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">
          このカテゴリにはまだ記事がありません。
        </p>
      ) : (
        <div className="grid gap-4">
          {tips.map((tip) => (
            <TipCard key={tip.slug} tip={tip} />
          ))}
        </div>
      )}
    </div>
  );
}
