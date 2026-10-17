"use client";

import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { PublicExampleQuery } from "@/lib/catalog/public-types";
import type { PublicSearchResponse } from "@/lib/search/public-types";

type Status = "idle" | "searching" | "done" | "error";

export function SearchPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const resultsSectionRef = useRef<HTMLElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const previewUrl = useRef<string | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [examples, setExamples] = useState<PublicExampleQuery[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | undefined>();
  const [response, setResponse] = useState<PublicSearchResponse | undefined>();

  useEffect(() => {
    void fetch("/api/examples")
      .then((res) => res.json())
      .then((body: { examples?: PublicExampleQuery[] }) => setExamples(body.examples ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  useEffect(() => {
    if (status === "searching") {
      const frame = requestAnimationFrame(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => cancelAnimationFrame(frame);
    }
    if (status === "error" && error) {
      const frame = requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [status, error]);

  function setChosenFile(next: File | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = next ? URL.createObjectURL(next) : undefined;
    setFile(next);
    setPreview(previewUrl.current);
    setResponse(undefined);
    setError(undefined);
    setStatus("idle");
  }

  async function runSearch(body: FormData) {
    setStatus("searching");
    setError(undefined);
    setResponse(undefined);
    try {
      const res = await fetch("/api/search?limit=8", { method: "POST", body });
      const payload = (await res.json()) as PublicSearchResponse & { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(payload.error ?? "Search failed.");
        setResponse(undefined);
        return;
      }
      setResponse(payload);
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Could not reach search.");
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose a photo first.");
      setStatus("error");
      return;
    }
    const body = new FormData();
    body.append("image", file);
    await runSearch(body);
  }

  async function onExample(imageId: string, imageUrl: string) {
    setChosenFile(null);
    setPreview(imageUrl);
    const body = new FormData();
    body.append("catalogImageId", imageId);
    await runSearch(body);
  }

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const dropped = event.dataTransfer.files[0];
            if (dropped) setChosenFile(dropped);
          }}
          className="flex min-h-64 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-brass/50 bg-card px-6 text-center"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected query" className="max-h-80 w-full object-contain" />
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop a photo of the light</p>
              <p className="text-sm text-ink-soft">JPEG, PNG, or WEBP. Nothing is stored after search.</p>
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.webp"
          className="sr-only"
          onChange={(event) => setChosenFile(event.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            const chosen = event.target.files?.[0] ?? null;
            setChosenFile(chosen);
            event.target.value = "";
            if (chosen) {
              const body = new FormData();
              body.append("image", chosen);
              void runSearch(body);
            }
          }}
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-line bg-card px-4 py-2 text-sm"
          >
            Choose photo from gallery
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="rounded-full border border-line bg-card px-4 py-2 text-sm"
          >
            Use camera
          </button>
          <button
            type="submit"
            disabled={status === "searching"}
            className="rounded-full bg-ink px-5 py-2 text-sm text-paper disabled:opacity-60"
          >
            {status === "searching" ? "Searching…" : "Find matches"}
          </button>
        </div>
      </form>

      {error ? (
        <p
          ref={errorRef}
          className="scroll-mt-24 rounded-xl border border-line bg-brass-soft/60 px-4 py-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {status === "searching" || response ? (
        <section
          ref={resultsSectionRef}
          className="scroll-mt-24 space-y-4"
          aria-busy={status === "searching"}
          aria-live="polite"
        >
          {status === "searching" ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-card px-6 py-14">
              <div
                className="size-10 animate-spin rounded-full border-2 border-line border-t-ink"
                aria-hidden
              />
              <p className="text-sm font-medium text-ink">Searching the catalog…</p>
              <p className="text-xs text-ink-soft">Comparing your photo to indexed products</p>
            </div>
          ) : response ? (
            <>
              <div>
                <h2 className="text-xl font-semibold">Closest catalog products</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Labels are uncalibrated similarity buckets, not probabilities. List prices are not shown.
                </p>
              </div>
              {response.meta.relevanceRejected ? (
                <p
                  className="rounded-xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink-soft"
                  role="status"
                >
                  {response.meta.relevanceMessage ??
                    "This photo does not look close enough to any catalog light. Upload a light or use a catalog example."}
                </p>
              ) : response.results.length === 0 ? (
                <p className="text-sm text-ink-soft">No similar products found.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {response.results.map((result) => (
                    <ProductCard key={result.productId} result={result} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      ) : null}

      {examples.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-ink-soft">Try a catalog photo</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {examples.map((example) => (
              <button
                key={example.imageId}
                type="button"
                onClick={() => void onExample(example.imageId, example.imageUrl)}
                className="overflow-hidden rounded-xl border border-line bg-card text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={example.imageUrl} alt="" className="aspect-square w-full object-cover" />
                <span className="block truncate px-2 py-2 text-xs text-ink-soft">{example.productName}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
