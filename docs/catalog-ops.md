# Catalog operations (Phase 1+)

## Phase 1 — Catalog registry (`catalogs.json`)

The **manifest** lists each PDF catalog (id, template, status, counts). Product rows remain in **`catalog.json`**.

| File | Purpose |
| --- | --- |
| `data/extracted/catalog.json` | All products + images (search metadata) |
| `data/extracted/catalogs.json` | Registry: which PDFs are ingested and `live` / `disabled` / `draft` |

### Bootstrap manifest from current products

After `npm run ingest:catalog`:

```bash
npm run catalogs:bootstrap
# keep manual edits to displayName / status / notes:
npm run catalogs:bootstrap -- --merge
```

### Publish to production

```bash
npm run catalogs:bootstrap   # if catalogs.json is missing or counts changed
npm run publish:assets
```

Set `CATALOG_MANIFEST_URL` from `vercel-env.hints.txt` (optional if `CATALOG_JSON_URL` is set — the app derives the sibling `catalogs.json` URL).

### API

`GET /api/catalogs` — returns **live** catalogs only (public).

---

## When to add the ~50 PDFs (Gemini embed quota)

Ingest calls Gemini **once per new image** (content-hash skip avoids re-embedding unchanged images).

| Step | Gemini embeds |
| --- | --- |
| Your current 5 PDFs | Already done (~890 images) |
| Each **new** PDF (Phase 2: one at a time) | ≈ number of **new** product images in that PDF |
| `publish:assets` | **0** |
| Customer photo search | **1** per search |
| Re-run full ingest with no PDF changes | **0** (hash skip) |

**Do not drop 50 PDFs into `data/catalogs/` and run full ingest in one day** on the free tier (~1k embeds/day is a common bottleneck).

**Recommended:**

1. Finish **Phase 1** — bootstrap + publish `catalogs.json` for the existing 5 PDFs (no new embeds).
2. Implement **Phase 2** — `ingest` **one PDF at a time**, then bootstrap `--merge`, publish.
3. Add new PDFs in **batches** (e.g. 3–5 catalogs per day) until you see `embeddingsGenerated` in ingest logs stay under your daily cap, or upgrade Gemini billing.
4. Use **`npm run ingest:catalog`** only after Phase 2 supports `--pdf`; until then, add PDFs gradually to the folder and monitor `embeddingsGenerated` on each run.

**Safe order for bulk PDFs:** provide files when Phase 2 single-PDF ingest is ready; ingest **one catalog → verify Qdrant + search → next catalog**.

---

## Roadmap (short)

| Phase | Focus |
| --- | --- |
| **1** (now) | `catalogs.json`, bootstrap, publish, `GET /api/catalogs` |
| **2** | Ingest one PDF + merge products + update manifest |
| **3** | Soft delete: `status: disabled` + Qdrant filter |
| **4** | `/admin` UI (single admin) |
| **5** | Worker for ingest off your laptop |
