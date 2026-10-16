# Architecture — Phase 0 proposal

**Date:** 2026-09-19  
**Based on:** empty repository + master product brief + inspection of *Geo Liting Floor & Table Lamps.pdf* + current Gemini / Qdrant APIs  
**Scope:** Foundation and Phase 1 only. Later phases are sketched so they can attach without being built now.

There is still no application to extend. Catalog layout is now known **for this one Geo Liting floor/table PDF**. Other Drive catalogs may differ; keep parsers per-template, not one global layout assumption.

Details of the PDF: `docs/catalog-audit.md`.

---

## 1. What this system is

Primary problem:

```text
customer lamp photograph  →  similar catalog products
```

This is **visual retrieval**, not a chatbot, not an agent, and not PDF Q&A.

```text
Catalog product images (extracted JPEGs)
        ↓
Multimodal embeddings (Gemini Embedding 2)
        ↓
Qdrant
        ↑
Customer image embedding
        ↓
Vector similarity search
        ↓
Top candidate products
        ↓
Optional later: AI rerank  (not Phase 1)
```

This sample catalog is decorative **floor and table lamps** with distinct silhouettes. That is a better visual-matching problem than grid downlights, but it is not the whole Drive library.

---

## 2. Stack for a greenfield repo

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js (current stable via `create-next-app`, App Router) | Matches the brief; API + future UI in one process. |
| Language | TypeScript, strict | Default for new Next apps. |
| Styling | Tailwind CSS | Default; shadcn/ui only when Phase 3 UI starts. |
| API | Next.js Route Handlers (`app/api/...`) | No separate backend. |
| PDF extract | **PyMuPDF** (`pymupdf`) from `npm run ingest:catalog` | Already proven on this 124 MB CorelDRAW PDF (embedded JPEGs + text layer). |
| Embeddings | `gemini-embedding-2` via `@google/genai` | Native multimodal image space. |
| Vectors | Qdrant, local Docker `:6333` | Brief’s primary candidate. |
| Product metadata | `data/extracted/catalog.json` + Qdrant payload | Search hydrates from the JSON store. No PostgreSQL yet. |
| Catalog files (Phase 1) | Local `data/catalogs/` (gitignored) | Drive sync is Phase 4. |
| Tests | Vitest | Plus unit tests for SKU/spec parsing. |
| Auth | None in Phase 1 | Ingest is a CLI. Search API is local-only. |

Node on this machine is `v23.10.0`. Prefer **Node 22 LTS**.

Python is used only as the PDF extractor. Search/embed stay in the Next.js process.

---

## 3. Phase 1 target shape

```text
data/catalogs/*.pdf           # Geo Liting sample (gitignored)
        │
        ▼
npm run ingest:catalog
        │
        ├─ extract large JPEGs (skip icons/tiles)
        ├─ parse text layer → itemNo, sku, lamp, size, finish, material, price
        ├─ write data/extracted/{productId}/*.jpg + products.jsonl + catalog.json
        ├─ embed each kept image with gemini-embedding-2
        ├─ create Qdrant collection if missing (size from first embedding)
        └─ upsert points (hash skip; refresh payload on skip)
        │
        ▼
POST /api/search  (multipart image) → hydrate from catalog.json
GET  /api/products/[id]             → structured product record
        │
        ▼
JSON results + docs/retrieval-evaluation.md
```

Do not build the customer UI in Phase 1.

### 3.1 Extraction rules (this catalog)

Validated against the Geo Liting PDF:

1. Skip cover/back (no `Item No`).
2. Keep embedded images with min(width, height) ≥ 400 **and** compressed size ≳ 50 KB. Drop USB/wireless icons and empty overlays (e.g. 6 KB PNG at full-page size).
3. Dominant page: two full-bleed halves → two images, **one productId**.
4. If the text layer has two Item Nos, assign images to spec blocks by bbox x-center (left vs right). Stacked right-hand studios (page 55) use y-center against spec block y.
5. If a page has many small tiles and no large photo (page 67), rasterize the page at ~150 DPI and split, rather than indexing fragments.
6. Parse SKU vs price: if `SKU` matches `^([A-Z0-9-]+?(?:FL|TB|LTFL))(\d{4,})$`, split code / price. Keep raw string too.
7. `productId` = slug of `catalogStem + page + itemNo`. **Do not use SKU as the primary key** (colorways share SKUs; at least one SKU maps to two different items).

No object detection. No OCR for this file.

### 3.2 Proposed repo layout (Phase 1)

```text
app/
  api/search/route.ts
lib/
  embeddings/          # EmbeddingProvider + Gemini
  qdrant/
  search/
  ingest/
    parse-catalog-text.ts   # SKU/spec regex (unit-tested)
    map-images.ts
  validation/image.ts
scripts/
  ingest-catalog.ts         # npm entry; calls Python extract then embed
  extract_pdf.py            # pymupdf: images + page text
data/
  catalogs/                 # gitignored PDFs
  extracted/                # gitignored derived images
  queries/                  # customer photos when available
docs/
  catalog-audit.md
  architecture.md
  retrieval-evaluation.md
```

```ts
interface EmbeddingProvider {
  readonly modelId: string;
  embedImage(input: { bytes: Uint8Array; mimeType: string }): Promise<number[]>;
}
```

Create the Qdrant collection using `vector.length` from the first successful embed.

---

## 4. Embedding design

### 4.1 Model

| Setting | Phase 1 default | Notes |
| --- | --- | --- |
| Model | `gemini-embedding-2` | Multimodal; image bytes via `Part.from_bytes`. |
| Input | One extracted catalog photo per vector | Lifestyle and studio shots are both useful. |
| `output_dimensionality` | `768` via env | Range 128–3072; 768/1536/3072 recommended. |
| Distance | Qdrant `Cosine` | Embedding 2 L2-normalizes default and truncated dims. |
| Task prefixes | None | Image-only; `task_type` is not supported on embedding 2. |

Gemini API image embeds document **PNG and JPEG**. Convert WEBP/HEIC before calling.

Do not send the whole catalog PDF to `embedContent`.

### 4.2 Collection

Name: `catalog_products` (overridable).

Payload:

```ts
{
  productId: string;          // catalog + page + itemNo
  sku?: string;               // not unique
  itemNo?: string;            // display title
  productName?: string;       // unused on this catalog
  lamp?: string;              // e.g. 1XE27 — socket, not wattage
  dimensions?: string;
  finish?: string;
  material?: string;
  listPrice?: string;         // catalog digits only; not live price
  category?: "floor" | "table" | "unknown";
  extras?: string[];          // usb, wirelessCharger
  view?: "lifestyle" | "studio" | "page";
  catalogFileId: string;
  catalogFileName: string;
  pageNumber: number;
  imagePath: string;
  embeddingModel: string;
  contentHash: string;
}
```

Infer `category` from SKU suffix (`FL` / `TB`) when present; page 40 shows a table lamp with an `FL` SKU, so this is a hint not a guarantee.

Dedup: `sha256` of image bytes. Skip when hash + model already indexed.

### 4.3 Search API

`POST /api/search`

- `multipart/form-data` field `image`
- Validate MIME (`image/jpeg`, `image/png`, `image/webp`), size, dimensions
- Convert WEBP → JPEG if needed
- Return top 5/10; do **not** treat score as a probability

```json
{
  "results": [
    {
      "productId": "...",
      "sku": "Y019210FL",
      "itemNo": "012910",
      "productName": "012910",
      "lamp": "Led",
      "dimensions": "D350MM X H1220MM",
      "finish": "Brown",
      "material": "Metal + Pla",
      "score": 0.94,
      "confidence": "high",
      "imageUrl": "...",
      "catalogFileName": "Geo Liting Floor & Table Lamps.pdf",
      "pageNumber": 2
    }
  ]
}
```

Collapse multiple views of the same `productId` so the customer sees products, not duplicate lifestyle/studio rows (keep the higher score).

---

## 5. Environment (proposed)

Server-only.

```bash
GEMINI_API_KEY=
EMBEDDING_MODEL=gemini-embedding-2
EMBEDDING_DIMENSIONS=768
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=catalog_products
CATALOG_PDF_DIR=./data/catalogs
EXTRACTED_DIR=./data/extracted
MAX_UPLOAD_BYTES=10485760
```

```bash
docker run -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

---

## 6. Phased architecture (later)

```text
Phase 1  this PDF → extract → embed → Qdrant → search API + evaluation
Phase 2  structured catalog.json records; search hydrates metadata from that store
Phase 3  customer UI
Phase 4  Google Drive sync (manual)
Phase 5  worker only if ingest of many 100MB+ CorelDRAW PDFs is too slow
Phase 6  internal catalog agent
Phase 7  image + text assistant
```

List price is already in the PDF. Live price/stock/quote still wait for a business data source.

### 6.0 Phase 2 (now)

- `catalog.json` is the structured product source of truth (itemNo, SKU / productCodes, specs, image paths).
- Qdrant stores vectors + enough payload to rank; `/api/search` hydrates names/specs from `catalog.json`.
- `GET /api/products/[id]` returns one record. No Postgres.
- Two ingest templates: `geo-liting` and `glitteron-2026`. Do not assume one layout.

### 6.0b Phase 3 (customer UI)

- `/` upload or camera → `POST /api/search` (Gemini embed). Catalog examples reuse an indexed vector (no second embed).
- Results are products, not duplicate image rows. Match labels are buckets (`Close match` / `Possible match` / `Low similarity`), not probabilities.
- `GET /api/media/[imageId]` serves extracted files from `catalog.json` only (path confined). No list prices in the UI.
- Query photos are not saved.

### 6.1 Mental model

| Pattern | Use for | When |
| --- | --- | --- |
| Vector search | Photo → similar products | Now |
| RAG | Questions about a known product | After retrieval works |
| Agent | Internal Drive / index ops | After pipeline is deterministic |

---

## 7. What Phase 1 should add

- Next.js + TypeScript + Tailwind
- `@google/genai`
- `@qdrant/js-client-rest`
- `sharp`
- Vitest
- `pymupdf` (Python extractor script)

Not Phase 1: OCR/tesseract, `googleapis`, Redis, BullMQ, Prisma, PostgreSQL, LangChain, agents, shadcn/ui, object-detection models.

---

## 8. What must not be added yet

- Redis / BullMQ
- Extra microservices / Kubernetes
- LangChain / RAG frameworks
- Agent frameworks
- PostgreSQL / Prisma
- Google Drive client
- Customer UI
- Object detection
- Fine-tuning
- Permanent storage of customer photos
- Committing the 124 MB PDF

---

## 9. Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| One catalog family only | Downlight grid catalogs may need a different extractor | Keep template-specific rules; inspect the next PDF before generalizing. |
| Domain gap | Studio/lifestyle catalog shots ≠ customer phone photos | Need ~10 real query photos; do not call catalog self-retrieval “customer accuracy”. |
| SKU not unique | Variants and possible catalog errors | `productId` = catalog + page + itemNo. |
| Tiled pages | Naive xref extract indexes fragments | Size filter + page-render fallback. |
| Spec overlay vs photo | Text sits on the page, not in the JPEG | Embed extracted JPEGs; parse text separately. |
| Hardcoded vector size | API dim can change | Collection size from first embedding. |
| Gemini format limits | WEBP/HEIC fail if sent raw | `sharp` convert. |
| Cost | 100+ images × 768-d is still small; more catalogs will grow | Log embed count; hash skip. |
| Over-claiming scores | Cosine ≠ probability | Raw score + coarse label. |

---

## 10. Security (PoC)

- Untrusted uploads: MIME, size, dimensions, no path traversal, no URL fetch.
- Keys server-side only.
- Delete temp query files after search.
- Gitignore `data/catalogs/`, `data/extracted/`, `.env`.

---

## 11. Testing and observability

**Unit:** image validation; SKU/price split; spec regex; left/right image-to-block mapping; productId slug; confidence buckets; hash skip.

**Integration:** Qdrant upsert/search; optional live Gemini.

**Retrieval eval:**

```text
query-image → expected productId (itemNo)
top-1 / top-3 / top-5
```

Until customer photos exist, evaluate a **holdout of extracted catalog images** (e.g. lifestyle query → same product’s studio vector) and label it as such in `docs/retrieval-evaluation.md`.

Log ingest: pages, images kept/dropped, products, embeds, failures, duration.  
Log search: top score, latency. Do not keep query images.

---

## 12. Definition of done — Phase 1

1. Local Qdrant collection exists with observed embedding size.
2. `npm run ingest:catalog` reads the Geo Liting PDF, extracts large product photos, parses Item No/SKU/specs, and upserts 20–50+ vectors with hash skip.
3. `POST /api/search` returns top 5/10 in the JSON shape above (including `itemNo`).
4. Evaluation set run: catalog holdout now; customer photos when provided.
5. `docs/retrieval-evaluation.md` reports top-1/3/5 and states whether visual retrieval looks viable **for this catalog**.
6. Embedding provider behind an interface; vector size not hardcoded apart from env + API response.
7. No UI, workers, Redis, Drive, agent, or RAG.
8. Lint/typecheck and Phase 1 tests pass (including catalog text-parser tests).

Still blocked for a **customer-photo** claim: labeled field images. Still unverified: other catalog PDF templates.
