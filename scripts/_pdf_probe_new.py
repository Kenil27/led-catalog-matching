#!/usr/bin/env python3
"""Probe catalog PDFs: pages, text, images, sample renders."""
import json
import sys
from collections import Counter
from pathlib import Path

import fitz

pdf_path = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)

doc = fitz.open(pdf_path)
n = doc.page_count
print("FILE", pdf_path.name)
print("pages", n)
print("meta", json.dumps(doc.metadata, default=str))
print("page0", doc[0].rect.width, doc[0].rect.height)

sample_idxs = sorted({0, 1, 2, 3, max(0, n // 2), max(0, n - 2), max(0, n - 1)})
sample_idxs = [i for i in sample_idxs if i < n]

text_lens = []
images_per_page = []
pages_with_item = 0
pages_with_sku = 0
for i in range(n):
    page = doc[i]
    text = page.get_text("text") or ""
    text_lens.append(len(text.strip()))
    images_per_page.append(len(page.get_images(full=True)))
    if "Item No" in text or "Item No:" in text:
        pages_with_item += 1
    if "SKU" in text:
        pages_with_sku += 1

print("pages_with_item", pages_with_item)
print("pages_with_sku", pages_with_sku)
print("text_len_min_max_avg", min(text_lens), max(text_lens), round(sum(text_lens) / n, 1))
print("images_per_page_min_max_avg", min(images_per_page), max(images_per_page), round(sum(images_per_page) / n, 2))
print("empty_text_pages", sum(1 for t in text_lens if t == 0))

for i in sample_idxs:
    page = doc[i]
    text = page.get_text("text") or ""
    (out_dir / f"page-{i+1:03d}.txt").write_text(text)
    pix = page.get_pixmap(matrix=fitz.Matrix(1.1, 1.1), alpha=False)
    pix.save(str(out_dir / f"page-{i+1:03d}.png"))
    print(f"--- page {i+1} text ---")
    print(text[:800])
    print()

doc.close()
