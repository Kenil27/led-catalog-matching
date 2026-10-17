# LED catalog matching

Visual catalog search: upload a light photo → similar products from ingested PDF catalogs.

## Local setup

```bash
cp .env.example .env   # GEMINI_API_KEY, QDRANT_URL
python3 -m venv .venv
.venv/bin/pip install -r requirements-ingest.txt
npm install
docker run -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

Put PDFs in `data/catalogs/` (gitignored), then:

```bash
npm run ingest:catalog
npm run dev
```

Open `http://localhost:3000` for the customer UI, or `POST /api/search` with multipart `image`.

## Production (Vercel + Qdrant Cloud + Blob)

See **[docs/deploy-vercel.md](docs/deploy-vercel.md)** for the full checklist:

1. Ingest locally with `QDRANT_URL` pointing at **Qdrant Cloud**
2. `npm run publish:assets` → Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
3. Deploy to Vercel with `CATALOG_JSON_URL`, `CATALOG_ASSET_BASE_URL`, and API keys

Smoke test: `GET /api/health`

## Scripts

| Command                    | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `npm run ingest:catalog`   | Extract PDFs, embed, upsert Qdrant, write `catalog.json` |
| `npm run catalogs:bootstrap` | Build `catalogs.json` registry from `catalog.json`     |
| `npm run publish:assets`   | Upload images + catalog + manifest to Vercel Blob        |
| `npm run evaluate:holdout` | Catalog holdout retrieval metrics                        |
