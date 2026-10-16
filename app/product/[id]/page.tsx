import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProduct } from "@/lib/catalog/public";
import { ensureCatalogLoaded } from "@/lib/catalog/store";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureCatalogLoaded();
  const product = getPublicProduct(decodeURIComponent(id));
  if (!product) notFound();

  const hero = product.images.find((image) => image.view === "studio") ?? product.images[0];
  const specs = [
    ["Item", product.itemNo],
    ["SKU", product.sku],
    ["Codes", product.productCodes?.join(" / ")],
    ["Size", product.dimensions],
    ["Material", product.material],
    ["Finish", product.finish],
    ["Light", product.lamp],
    ["Wattage", product.wattage],
    ["Category", product.category !== "unknown" ? product.category : undefined],
    ["Catalog", `${product.catalogFileName} · p.${product.pageNumber}`],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <Link href="/" className="text-sm text-brass hover:underline">
        ← Back to search
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-3xl border border-line bg-card">
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.url} alt={product.productName} className="w-full object-contain" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-ink-soft">No image</div>
            )}
          </div>
          {product.images.length > 1 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {product.images.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.imageId}
                  src={image.url}
                  alt={`${product.productName} ${image.view}`}
                  className="aspect-square rounded-xl border border-line object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brass">{product.category}</p>
            <h1 className="mt-2 font-serif text-4xl text-ink">{product.productName}</h1>
          </div>
          <dl className="divide-y divide-line rounded-2xl border border-line bg-card">
            {specs.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[7rem_1fr] gap-3 px-4 py-3 text-sm">
                <dt className="text-ink-soft">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-low">
            Catalog list prices are not shown. Ask sales for current price and availability.
          </p>
        </div>
      </div>
    </main>
  );
}
