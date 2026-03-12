import { notFound } from "next/navigation";
import { getAllTags, getTipsByTag } from "@/lib/tips";
import { TipCard } from "@/components/tip-card";

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  return { title: `#${tag} | Dev Tips` };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const tips = getTipsByTag(decodedTag);

  if (tips.length === 0) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">#{decodedTag}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {tips.length} 件の記事
      </p>

      <div className="grid gap-4">
        {tips.map((tip) => (
          <TipCard key={`${tip.category}/${tip.slug}`} tip={tip} />
        ))}
      </div>
    </div>
  );
}
