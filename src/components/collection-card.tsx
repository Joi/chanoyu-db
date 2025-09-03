"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type CollectionCardProps = {
  href: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  className?: string;
};

export function CollectionCard({
  href,
  title,
  subtitle,
  imageUrl,
  imageAlt = "",
  onPrimary,
  onSecondary,
  primaryLabel = "Open",
  secondaryLabel = "Quick view",
  className = "",
}: CollectionCardProps) {
  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${className}`}>
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-ring">
        <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 400px, 100vw"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted">No image</div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="mb-2">
          <Link href={href} className="line-clamp-2 text-base font-medium leading-snug hover:underline">
            {title}
          </Link>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {(onPrimary || onSecondary) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {onPrimary ? (
              <Button size="sm" onClick={onPrimary} aria-label={primaryLabel}>
                {primaryLabel}
              </Button>
            ) : null}
            {onSecondary ? (
              <Button size="sm" variant="secondary" onClick={onSecondary} aria-label={secondaryLabel}>
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CollectionCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton className="mb-1 h-4 w-5/6" />
        <Skeleton className="h-8 w-40" />
      </CardContent>
    </Card>
  );
}

export function CollectionCardEmpty({ message = "No items yet" }: { message?: string }) {
  return <Card className="grid place-items-center p-8 text-muted-foreground">{message}</Card>;
}


