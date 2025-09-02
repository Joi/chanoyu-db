import { CollectionCard, CollectionCardEmpty, CollectionCardSkeleton } from "@/src/components/collection-card";

const data = [
  {
    href: "/objects/hoshino-bowl",
    title: "志野茶碗「羽衣」 — Momoyama-style Shino",
    subtitle:
      "美濃の土の温かみ。Long subtitle example to test wrapping and truncation with multi‑byte JP text.",
    imageUrl: "/images/sample/shino.jpg",
  },
  {
    href: "/objects/raku-nonko",
    title: "楽茶碗（ノンコ）",
    subtitle: "黒楽の柔らかな光沢",
    imageUrl: "/images/sample/raku.jpg",
  },
  {
    href: "/objects/karatsu",
    title: "唐津向付",
    subtitle: "刷毛目と鉄絵の表情",
    imageUrl: null,
  },
];

export default function Page() {
  const loading = false;
  const items = data;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CollectionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return <CollectionCardEmpty />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <CollectionCard
          key={it.href}
          href={it.href}
          title={it.title}
          subtitle={it.subtitle}
          imageUrl={it.imageUrl}
          primaryLabel="Open"
          secondaryLabel="Quick view"
        />
      ))}
    </div>
  );
}


