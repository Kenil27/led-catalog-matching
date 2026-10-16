import Link from "next/link";
import { MatchBadge } from "@/components/match-badge";
import type { PublicSearchResult } from "@/lib/search/public-types";

export function ProductCard({ result }: { result: PublicSearchResult }) {
  return (
    <Link
      href={`/product/${encodeURIComponent(result.productId)}`}
      className="group overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/5] bg-paper-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.imageUrl}
          alt={result.productName ?? result.itemNo ?? "Catalog product"}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug text-ink">
            {result.productName ?? result.itemNo ?? "Untitled"}
          </h3>
          <MatchBadge level={result.matchLevel} />
        </div>
        <p className="text-sm text-ink-soft">
          {[result.sku, result.finish, result.dimensions].filter(Boolean).join(" · ")}
        </p>
        <p className="text-xs text-low">
          {result.catalogFileName} · p.{result.pageNumber}
        </p>
      </div>
    </Link>
  );
}
