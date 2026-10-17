import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold tracking-wide text-ink">
          Find the light
        </Link>
        <p className="hidden text-xs text-ink-soft sm:block">Visual catalog match</p>
      </div>
    </header>
  );
}
