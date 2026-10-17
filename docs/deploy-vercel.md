# Deploy to Vercel + Qdrant Cloud + Blob assets

Production splits **indexing** (local) from **serving** (Vercel).

```text
Local machine                         Cloud
─────────────                         ─────
PDFs → ingest → Qdrant Cloud    →    Vercel Next.js (UI + /api/search)
     → publish → Vercel Blob    →    catalog.json + ~735MB images (CDN)
```

Extracted assets are **not** in git (~735MB). Only URLs and env vars point at them.

---

## 1. Qdrant Cloud

1. Create a free cluster at [cloud.qdrant.io](https://cloud.qdrant.io).
2. Copy **Cluster URL** and **API key**.
3. On your Mac, point ingest at the cloud cluster:

```bash
# .env (local only — do not commit)
QDRANT_URL=https://xxxx.cloud.qdrant.io
QDRANT_API_KEY=your-key
GEMINI_API_KEY=your-key
```

4. Run ingest once (uses Gemini embed quota; hash-skip on re-runs):

```bash
npm run ingest:catalog
```

Confirm the collection `catalog_products` exists and holds your vectors.

---

## 2. Vercel Blob (catalog + images)

1. In the Vercel project (or team), create a **Blob** store.
2. Create a token with **Read/Write** → `BLOB_READ_WRITE_TOKEN`.

### Public vs private store

| Store type | Publish | Vercel env after publish |
| --- | --- | --- |
| **Public** (recommended for demo) | `BLOB_STORE_ACCESS=public` (default) | `CATALOG_JSON_URL` + `CATALOG_ASSET_BASE_URL` — images load directly from Blob CDN |
| **Private** | `BLOB_STORE_ACCESS=private` | `BLOB_PREFIX`, `BLOB_STORE_ACCESS=private`, `BLOB_READ_WRITE_TOKEN` on Vercel — images served via `/api/media` (no public CDN URLs) |

If you already created a **private** store, you do **not** need a new store. Publish with:

```bash
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
export BLOB_STORE_ACCESS=private
npm run publish:assets
```

3. Publish from your machine after ingest:

```bash
export BLOB_READ_WRITE_TOKEN=vercel_blob_...
# optional: export BLOB_STORE_ACCESS=private
npm run publish:assets
```

This uploads all product images and `catalog.json`, then writes  
`data/extracted/vercel-env.hints.txt` with the exact env values to copy.

Optional: `BLOB_PREFIX=led-catalog` (default) changes the folder prefix in Blob.

---

## 3. Vercel project

1. Import the GitHub repo (or `vercel` CLI).
2. **Settings → Environment Variables** (Production + Preview):

| Variable | Example |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studio key |
| `QDRANT_URL` | Qdrant Cloud HTTPS URL |
| `QDRANT_API_KEY` | Qdrant API key |
| `QDRANT_COLLECTION` | `catalog_products` |
| `CATALOG_JSON_URL` | Public store only — from `vercel-env.hints.txt` |
| `CATALOG_MANIFEST_URL` | Optional — `catalogs.json` on Blob; auto-derived from `CATALOG_JSON_URL` if omitted |
| `CATALOG_ASSET_BASE_URL` | Public store only — from `vercel-env.hints.txt` |
| `BLOB_STORE_ACCESS` | `private` if using a private Blob store |
| `BLOB_PREFIX` | `led-catalog` (match publish) |
| `BLOB_READ_WRITE_TOKEN` | Required for **private** store on Vercel (read catalog + images) |
| `EMBEDDING_MODEL` | `gemini-embedding-2` (optional) |
| `EMBEDDING_DIMENSIONS` | `768` (optional) |

Do **not** set `EXTRACTED_DIR` on Vercel unless debugging; production uses remote catalog + CDN.

3. Deploy. Framework preset: **Next.js**. Node **22+**.

4. Smoke test:

```bash
curl https://your-app.vercel.app/api/health
```

Expect `"ok": true`, `"products": 317`, `"qdrantReady": true`.

5. Open `/` and try a **catalog example** (no Gemini embed). Then try a **photo upload** (1 embed per search).

---

## 4. Updating catalogs later

1. Add PDFs under `data/catalogs/`.
2. `npm run ingest:catalog` (local, `QDRANT_URL` = cloud).
3. `npm run catalogs:bootstrap` then `npm run publish:assets` (refresh Blob + JSON URLs if changed).
4. Redeploy Vercel only if env vars changed (otherwise Blob + Qdrant updates are live immediately).

New PDF layouts still need a new ingest **template** before ingest.

---

## 5. Gemini free tier (reminder)

- Limits are **per Google project**, shared by every user of your deployed app.
- Each **customer photo search** ≈ 1 embed request.
- **Catalog examples** on the home page ≈ 0 embeds (vector already in Qdrant).
- Full re-ingest ≈ one embed per catalog image (~890/day budget risk).
- Check live caps in [AI Studio → Rate limits](https://aistudio.google.com/).

---

## 6. Troubleshooting

| Symptom | Check |
| --- | --- |
| `/api/health` `products: 0` | `CATALOG_JSON_URL` wrong or Blob not public |
| Images 404 | `CATALOG_ASSET_BASE_URL` must match Blob prefix (no trailing slash) |
| Search 500 on Qdrant | `QDRANT_URL` / API key / collection name |
| Search 429 | Gemini daily or RPM limit; use catalog examples to demo |
| Works locally, not on Vercel | Missing env vars on Production environment |
