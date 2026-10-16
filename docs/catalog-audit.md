# Catalog Audit — Phase 0

**Date:** 2026-09-19  
**Repository:** `/Users/kenilshah/PC/LED`  
**Status:** Five local PDFs ingested (Geo Liting + four GlitterOn 2026). Two templates. Customer photos still missing.

This document records what exists today. Findings below for *Geo Liting Floor & Table Lamps* are from the PDF itself, not from the master prompt’s example products.

---

## 1. Repository findings

### 1.1 Current application architecture

There is no application yet.

| Item | Finding |
| --- | --- |
| Git | Initialized empty repo on `master` |
| Commits | None |
| Tracked files | Phase 0 docs only |
| App code | None |
| `package.json` | Missing |
| `app/` / `src/` | Missing |

This is a **greenfield** project. Later phases must introduce the stack; they cannot reuse an existing Next.js app.

### 1.2 Requested inspection checklist

| # | Question | Result |
| --- | --- | --- |
| 1 | Current application architecture | None. Empty git repo. |
| 2 | Next.js version | Not present. |
| 3 | TypeScript configuration | Not present. |
| 4 | Existing UI framework | Not present. |
| 5 | Existing API structure | Not present. |
| 6 | Existing database | Not present. |
| 7 | Existing storage | Not present. Local filesystem only. |
| 8 | Existing authentication | Not present. |
| 9 | Existing environment-variable conventions | Not present. No `.env`, `.env.example`, or config files. |
| 10 | Existing testing framework | Not present. |
| 11 | Existing deployment configuration | Not present. No Docker Compose, Vercel config, CI, or IaC. |

### 1.3 Local machine context (not part of the repo)

| Tool | Version / note |
| --- | --- |
| Node.js | `v23.10.0` (current, not LTS). Phase 1 should target Node 22 LTS unless a reason appears. |
| npm | `10.9.2` |
| Python | `3.9.6` (system). PyMuPDF 1.26.5 was used **only** to inspect the sample PDF. |
| Docker | Not verified in this audit. Confirm locally before assuming Qdrant can run. |

### 1.4 Files that are not catalogs

| File | Why it does not count |
| --- | --- |
| `Downloads/Master Cursor Prompt — AI LED Catalog Matching Platform.md` | Product brief. |
| `Downloads/LED BG 1-01.jpg` | Branding image. |

No Google Drive local sync folder was found (`~/Library/CloudStorage` empty). Catalogs live in Drive or as ad-hoc Downloads.

The 124 MB sample PDF must **not** be committed to git.

---

## 2. Catalog / PDF investigation

### 2.1 Verdict

**This one catalog can be parsed at product level.** Layout is digital (CorelDRAW), photos are embedded, SKUs and specs are selectable text. OCR is not required.

**It is only one family.** Floor & table lamps, luxury decorative, two-up photographic spreads. Do not assume downlight / outdoor / grid catalogs look like this.

The master prompt examples (`DL-12W`, “2026 Indoor Lighting”) do **not** match this file.

### 2.2 Sample inspected

| Field | Value |
| --- | --- |
| File | `/Users/kenilshah/Downloads/Geo Liting Floor & Table Lamps.pdf` |
| Size | 123.85 MB |
| PDF version | 1.7 |
| Encrypted | No |
| Title / source | `FLOOR.cdr` — CorelDRAW 2022 (`Corel PDF Engine 24.2.0.444`) |
| Created | 2026-02-18 |
| Brand | GEO LITING (cover spelling) |
| Distributor (back cover) | Jalaram Enterprises, Mumbai |
| Page size | 1296 × 864 pt landscape (~18" × 12") |
| Pages | 75 |

Page roles:

- Page 1: cover (no SKU)
- Pages 2–74: product pages (73 pages with Item No + SKU)
- Page 75: back cover / contact (no text layer; logo + Instagram QR)

### 2.3 Investigation checklist (this PDF)

| Question | Finding |
| --- | --- |
| Page count | 75 |
| Product density per page | Usually **1 product**, two photos (lifestyle left, studio right). **7 pages** show 2 products/variants (17, 40, 55, 56, 65, 66, 67). |
| Image format | Embedded **JPEG** (146, `DCTDecode`) and **PNG** (66, `FlateDecode` / `LZWDecode`). Photographic RGB, 8-bit. Typical large stills ~1800×2400 or ~3600×2400. |
| Images embedded? | Yes. 212 unique xrefs. 1–16 images/page (median 2). Extra images are icons, tiles, or tiny overlays. |
| Scanned pages? | **No.** Digital layout from CorelDRAW. Photos are placed images, not a flat scan of a printed page. |
| OCR needed? | **No** for metadata. Text layer is selectable. Overlay text is also drawn on the page; the extracted JPEGs themselves are **clean** (no burned-in spec block). |
| SKU available? | **Yes** on 73/75 pages. Pattern like `Y019210FL`, `Y97700TB`, occasionally `Z3204FL`. Suffix `FL` = floor (37), `TB` = table (36). Price digits are often concatenated: `SKU : Y50LTFL220000` → SKU `Y50LTFL` + price `220000`. |
| Product-name consistency | **There is no marketing product name.** Identity is `Item No` + `SKU`. Item No formats are inconsistent: `012910`, `029-1F`, `TL 05`, `00779-BK`, `GET-MK01`, `0046-T GR`. |
| Specification format | Fixed labels: `Item No`, `Lamp`, `Size`, `Finish`, `Material`, `SKU`, plus a list price. Optional icons/text: USB, “Wirless Charger” (typo in source). **No wattage, CCT, lumens, IP, or cut-out.** `Lamp` is a socket/count (`1XE27`, `3XG9`, `Led`), not watts. Size is `D…MM X H…MM` or `W… X L… X H…`. |
| Predictable region? | **Yes for the dominant template.** Landscape split at x = 50%: left lifestyle, right studio, specs as text on the right (or on each half when two products share a page). |
| Multiple products on one page? | Minority. Two SKUs (floor+table pair, or two models) or two Item Nos sharing one SKU (colorways). |
| Extract product images directly? | **Yes.** Large JPEGs extract as clean product/lifestyle photos. Filter out small tiles/icons (e.g. min edge &lt; 400 px or &lt; ~50 KB). |
| Page rendering necessary? | **Not for the common 2-image spread.** Needed as fallback when CorelDRAW slices a photo into many tiles (page 67 has 16 xrefs). |

### 2.4 Layout templates observed

**Template A — default (most pages 2–74)**

```text
┌─────────────────────┬─────────────────────┐
│ Lifestyle / in-situ │ Studio / plain wall │
│ full-bleed half     │ full-bleed half     │
│                     │ + spec text overlay │
└─────────────────────┴─────────────────────┘
One product. Two vectors, same productId.
```

**Template B — two products, one each half** (e.g. pages 17, 40)

Left and right are different SKUs. Specs sit on each photo. Still extractable as two large images if each half is one xref (page 17: 2 images).

**Template C — one lifestyle + stacked studios** (e.g. page 55)

Left: one in-situ shot. Right: two studio shots (related models/shades), each with its own spec block.

**Template D — tiled / many xrefs** (page 67: 16 images)

Same family, two finishes (`0021 BR` / `0021 GR`) sharing SKU `Y1200TB`. Photos are sliced. Prefer **page render + split** (or assemble tiles) instead of embedding 16 fragments.

Cover/back are not products.

### 2.5 Identity and data-quality notes

- **SKU is not a unique product key.** Colorways share SKU (`Y1200TB`, `Y0613TB`, `Y5004TB`). At least one SKU (`Z3204FL`) appears on two pages with **different Item Nos, sizes, materials, and prices** (p.29 vs p.34) — treat as a catalog error; do not merge them.
- **Use `catalog + page + itemNo` as `productId`.** Store SKU as a field.
- Item No is the best display title until a real name exists.
- Prices in the PDF are list prices (e.g. `240000`). Not live inventory/quote data. Do not show them as “current price” in customer UI.
- Text glitches: `Wirless`, `Pla` vs `PLA`, `Metal +Marble`, `1X27` vs `1XE27`, SKU glued to price.
- Finish/Item No can disagree (e.g. `00779-WH` with Finish `Black` on page 55).

### 2.6 Indexing recommendation for this catalog

Grain: **product image**, not whole PDF, not whole page as the only unit.

1. Extract embedded images with MuPDF (`pymupdf` validated on this file).
2. Keep images above a size threshold (large JPEGs). Drop icons/overlays/tiles.
3. Attach each kept image to the page’s parsed text record(s).
4. Typical page → 2 embeddings (lifestyle + studio) for one `productId`.
5. Two-product page → map left/right image to left/right spec block by x-center.
6. If a page has no large un-sliced photo, rasterize the page (and split halves) as fallback.
7. Skip pages 1 and 75.

Do **not** add object detection for this PDF. Regions are already full-bleed halves.

Do **not** embed the 75-page PDF as one Gemini document.

### 2.7 Phase 1 dataset from this file alone

| Need | This PDF |
| --- | --- |
| 20–50 catalog images | **Yes.** 73 product pages × ~2 large photos ≈ 100+ usable stills. Phase 1 can use a 20–50 subset or ingest all large images. |
| ~10 customer/reference photos | **Still missing.** No field photographs were provided. Catalog-to-catalog nearest-neighbor is not a customer-photo test. |
| Other catalog families | **Still missing.** Need at least one denser/grid catalog (e.g. downlights) and/or outdoor if those exist in Drive. |

### 2.8 Still required from the business

1. 2–4 more PDFs with **different layouts** if the Drive library is not all Geo Liting floor/table spreads.
2. ~10 real customer phone photos of lamps (labeled with Item No / SKU if known).
3. Confirmation whether SKU collisions (same SKU, different products) are errors or a known scheme.

### 2.9 Ingest observation (Phase 1)

Many product pages store **one full-bleed JPEG of the whole spread**, not two xrefs. Geo Liting ingest splits that image into left/right halves (lifestyle / studio, or left product / right product).

Measured extract (all five PDFs):

| Catalog | Pages | Products | Images |
| --- | --- | --- | --- |
| Geo Liting Floor & Table Lamps.pdf | 75 | 80 | 154 |
| Ceiling Lights 2026.pdf | 38 | 34 | 114 |
| Chandelier Lights 2026.pdf | 79 | 73 | 234 |
| Chandelier Lights Luxe 2026.pdf | 105 | 98 | 293 |
| Floor Lamp 2026.pdf | 36 | 32 | 95 |
| **Total** | **333** | **317** | **890** |

Geo Liting: 71 products have both lifestyle and studio views. GlitterOn pages typically keep 3 photos (studio hero + lifestyle/detail). 0 raster fallbacks. Index mosaics without a Product Code are skipped.

### 2.10 Additional catalogs — GlitterOn 2026

Four more PDFs are **not** Geo Liting. They are GlitterOn “Series 2026” catalogs produced in Canva (portrait A4). Do not run the Geo Liting parser on them.

| File | Pages | Brand | Notes |
| --- | --- | --- | --- |
| Ceiling Lights 2026.pdf | 38 | GlitterOn | Cover, about, mosaic index, then 1 product/page |
| Chandelier Lights 2026.pdf | 79 | GlitterOn | Same template |
| Chandelier Lights Luxe 2026.pdf | 105 | GlitterOn | Same template |
| Floor Lamp 2026.pdf | 36 | GlitterOn | Same template |

Product pages use:

```text
Model name (e.g. LM8302, D654-5, ALS264-L3)
Size / Material / Body Colour / Light Source / Wattage
Product Code : CLD… / CHLD… / FLD…   (one or more size variants)
QR (“Tap or Scan”)
```

Layout: lifestyle + detail stills on top, studio hero below, specs in the footer. Index mosaics (pages 3–4) have **no** Product Code and must not be indexed. Identity is `catalog + page + model name`. Product Code is SKU (not unique when one page lists several sizes).

---

## 3. Implications for Phase 1

| Decision | Recommendation after this PDF |
| --- | --- |
| Product-level PDF parsing? | **Yes, for this template.** Regex on the text layer + large-image extract. |
| Page-level indexing? | Fallback only (tiled pages). |
| Object detection / layout ML? | **No.** |
| OCR? | **No** for this file. |
| Ingest input? | This PDF on local disk (`data/catalogs/`, gitignored), not a hand-cropped folder and not Drive yet. |
| Retrieval evaluation? | Can measure catalog-image holdout. **Customer-photo accuracy is blocked** until query photos exist. |
| Drive, workers, UI, agent, RAG? | Still no. |

See `docs/architecture.md` for the updated Phase 1 design.
