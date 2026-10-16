#!/usr/bin/env python3
"""Template-agnostic PDF dump: page text, line bboxes, embedded images."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import fitz


def extract(pdf_path: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    images_dir = out_dir / "embedded"
    images_dir.mkdir(exist_ok=True)
    doc = fitz.open(pdf_path)
    pages = []
    for index in range(doc.page_count):
        page = doc[index]
        lines = []
        payload = page.get_text("dict")
        for block in payload.get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                text = "".join(span.get("text", "") for span in line.get("spans", []))
                if not text.strip():
                    continue
                lines.append({"text": text, "bbox": [round(v, 2) for v in line["bbox"]]})
        images = []
        info_by_xref = {item.get("xref"): item for item in page.get_image_info(xrefs=True)}
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                extracted = doc.extract_image(xref)
            except Exception:
                continue
            ext = extracted.get("ext") or "bin"
            blob = extracted.get("image") or b""
            rel = f"embedded/p{index + 1:03d}-xref{xref}.{ext}"
            (out_dir / rel).write_bytes(blob)
            info = info_by_xref.get(xref, {})
            bbox = info.get("bbox") or [0, 0, 0, 0]
            images.append(
                {
                    "xref": xref,
                    "bbox": [round(v, 2) for v in bbox],
                    "width": extracted.get("width") or info.get("width") or 0,
                    "height": extracted.get("height") or info.get("height") or 0,
                    "byteSize": len(blob),
                    "ext": ext,
                    "path": str(out_dir / rel),
                }
            )
        pages.append(
            {
                "pageNumber": index + 1,
                "width": page.rect.width,
                "height": page.rect.height,
                "text": page.get_text("text") or "",
                "lines": lines,
                "images": images,
            }
        )
    result = {
        "pdfPath": str(pdf_path),
        "fileName": pdf_path.name,
        "pageCount": doc.page_count,
        "pages": pages,
    }
    (out_dir / "raw.json").write_text(json.dumps(result))
    doc.close()
    return result


def render_pages(pdf_path: Path, out_dir: Path, pages: list[int], dpi: int) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    renders_dir = out_dir / "renders"
    renders_dir.mkdir(exist_ok=True)
    doc = fitz.open(pdf_path)
    scale = dpi / 72
    results = []
    for page_number in pages:
        page = doc[page_number - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        rel = f"renders/page-{page_number:03d}.png"
        pix.save(str(out_dir / rel))
        results.append(
            {
                "pageNumber": page_number,
                "imagePath": str(out_dir / rel),
                "width": pix.width,
                "height": pix.height,
                "pageWidth": page.rect.width,
                "pageHeight": page.rect.height,
            }
        )
    (out_dir / "renders.json").write_text(json.dumps(results))
    doc.close()
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["extract", "render"])
    parser.add_argument("pdf")
    parser.add_argument("out_dir")
    parser.add_argument("--pages", default="", help="comma-separated 1-based page numbers")
    parser.add_argument("--dpi", type=int, default=150)
    args = parser.parse_args()
    pdf_path = Path(args.pdf)
    out_dir = Path(args.out_dir)
    if args.command == "extract":
        extract(pdf_path, out_dir)
        return 0
    pages = [int(p) for p in args.pages.split(",") if p.strip()]
    if not pages:
        raise SystemExit("--pages is required for render")
    render_pages(pdf_path, out_dir, pages, args.dpi)
    return 0


if __name__ == "__main__":
    sys.exit(main())
