/**
 * Build data/extracted/catalogs.json from catalog.json (group by catalogFileId).
 * Preserves displayName, status, notes, ingestedAt when merging an existing manifest.
 */
import { loadLocalEnvFile } from "@/lib/config";
import { bootstrapManifestFromCatalogJson } from "@/lib/catalog/manifest-io";

loadLocalEnvFile();

async function main(): Promise<void> {
  const merge = process.argv.includes("--merge");
  const { manifest, path: written } = await bootstrapManifestFromCatalogJson({
    mergeExisting: merge,
  });
  console.log(`Wrote ${written} (${manifest.catalogs.length} catalogs).`);
  for (const entry of manifest.catalogs) {
    console.log(
      `  ${entry.status.padEnd(8)} ${entry.catalogFileId} — ${entry.productCount} products, ${entry.imageCount} images (${entry.templateId})`,
    );
  }
  if (!merge) {
    console.log("\nTip: re-run with --merge after editing displayName/status/notes to keep your edits.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
