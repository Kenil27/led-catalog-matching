import { SearchPanel } from "@/components/search-panel";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">Find the light</h1>
      <SearchPanel />
    </main>
  );
}
