/** Stable object key under the asset CDN prefix (e.g. products/…/studio.jpg). */
export function assetKeyFromImagePath(imagePath: string): string {
  const normalized = imagePath.replace(/\\/g, "/");
  const productsIdx = normalized.indexOf("/products/");
  if (productsIdx >= 0) {
    return normalized.slice(productsIdx + 1);
  }
  if (normalized.startsWith("products/")) {
    return normalized;
  }
  return normalized.replace(/^\/+/, "");
}

export function publicAssetUrl(baseUrl: string, assetKey: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const key = assetKey.replace(/^\/+/, "");
  return `${base}/${key}`;
}
