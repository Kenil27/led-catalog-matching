import { SearchPanel } from "@/components/search-panel";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">Catalog match</p>
        <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Photograph a lamp. We&apos;ll find the closest catalog pieces.
        </h1>
        <p className="text-ink-soft">
          This is visual retrieval, not a quote tool. Matches are similar catalog products — not a
          guarantee of the same SKU.
        </p>
      </div>
      <SearchPanel />
    </main>
  );
}
