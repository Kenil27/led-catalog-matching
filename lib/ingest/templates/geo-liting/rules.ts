export const GEO_LITING_RULES = {
  minPixelEdge: 400,
  minBytes: 50_000,
  maxAspectRatio: 5,
  /** Rasterize the page when no keepable embedded photo remains. */
  renderFallbackDpi: 150,
};

export const GEO_LITING_FILE_PATTERN = /geo\s*lit/i;
