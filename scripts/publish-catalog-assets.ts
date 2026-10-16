/**
 * Upload catalog.json + product images to Vercel Blob for production.
 * Requires BLOB_READ_WRITE_TOKEN (Vercel dashboard → Storage → Blob).
 *
 * Set BLOB_STORE_ACCESS=private if the store is private (default: public).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { assetKeyFromImagePath } from "@/lib/catalog/asset-path";
import { appConfig, loadLocalEnvFile } from "@/lib/config";
import type { CatalogRecord } from "@/lib/catalog/store";

loadLocalEnvFile();

const PREFIX = (process.env.BLOB_PREFIX ?? appConfig.blobPrefix).replace(/^\/+|\/+$/g, "");
const ACCESS = appConfig.blobStoreAccess;

async function main(): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required. Create a Blob store in Vercel and copy the token.");
  }

  console.log(`Blob store access mode: ${ACCESS}`);

  const catalogFile = path.join(appConfig.extractedDir, "catalog.json");
  const raw = JSON.parse(await fs.readFile(catalogFile, "utf8")) as { products: CatalogRecord[] };
  const products = raw.products ?? [];
  if (products.length === 0) {
    throw new Error(`No products in ${catalogFile}. Run npm run ingest:catalog first.`);
  }

  let uploaded = 0;
  let assetBaseUrl: string | undefined;
  const seen = new Set<string>();

  for (const product of products) {
    for (const image of product.images) {
      const key = image.assetKey ?? assetKeyFromImagePath(image.imagePath);
      if (seen.has(key)) continue;
      seen.add(key);

      const filePath = path.isAbsolute(image.imagePath)
        ? image.imagePath
        : path.join(process.cwd(), image.imagePath);
      const bytes = await fs.readFile(filePath);
      const blobPath = `${PREFIX}/${key}`;
      const result = await put(blobPath, bytes, {
        access: ACCESS,
        addRandomSuffix: false,
        contentType: key.endsWith(".png") ? "image/png" : "image/jpeg",
      });
      if (ACCESS === "public" && !assetBaseUrl) {
        assetBaseUrl = result.url.slice(0, result.url.length - `/${key}`.length);
      }
      image.assetKey = key;
      uploaded += 1;
      if (uploaded % 25 === 0) {
        console.log(`uploaded ${uploaded} images…`);
      }
    }
  }

  const catalogPayload = JSON.stringify({ products }, null, 2);
  const catalogBlob = await put(`${PREFIX}/catalog.json`, catalogPayload, {
    access: ACCESS,
    addRandomSuffix: false,
    contentType: "application/json",
  });

  const deployHints = path.join(appConfig.extractedDir, "vercel-env.hints.txt");
  const shared = [
    "# Set these in Vercel → Project → Settings → Environment Variables",
    `BLOB_STORE_ACCESS=${ACCESS}`,
    `BLOB_PREFIX=${PREFIX}`,
    "BLOB_READ_WRITE_TOKEN=<same token you used locally — required on Vercel for private stores>",
    "QDRANT_URL=<from Qdrant Cloud cluster>",
    "QDRANT_API_KEY=<from Qdrant Cloud>",
    "GEMINI_API_KEY=<your key>",
    `QDRANT_COLLECTION=${appConfig.qdrantCollection}`,
    "",
    `# Uploaded ${uploaded} unique images, ${products.length} products.`,
  ];

  const hints =
    ACCESS === "public"
      ? [
          ...shared.slice(0, 1),
          `CATALOG_JSON_URL=${catalogBlob.url}`,
          `CATALOG_ASSET_BASE_URL=${assetBaseUrl ?? `https://<blob-host>/${PREFIX}`}`,
          ...shared.slice(1),
        ].join("\n")
      : [
          ...shared.slice(0, 1),
          "# Private store: do NOT set CATALOG_JSON_URL / CATALOG_ASSET_BASE_URL.",
          "# The app loads catalog.json and images from Blob using the token + prefix above.",
          ...shared.slice(1),
        ].join("\n");

  await fs.writeFile(deployHints, hints);

  console.log(hints);
  console.log(`\nWrote ${deployHints}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
