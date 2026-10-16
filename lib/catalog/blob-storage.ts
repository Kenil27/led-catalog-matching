import { get } from "@vercel/blob";
import { appConfig } from "@/lib/config";

export function blobCatalogEnabled(): boolean {
  return Boolean(appConfig.blobReadWriteToken && appConfig.blobPrefix);
}

export function usesPrivateBlobCatalog(): boolean {
  return blobCatalogEnabled() && appConfig.blobStoreAccess === "private";
}

export function blobCatalogPathname(relativePath: string): string {
  const prefix = appConfig.blobPrefix.replace(/^\/+|\/+$/g, "");
  const rel = relativePath.replace(/^\/+/, "");
  return `${prefix}/${rel}`;
}

async function readBlob(pathname: string): Promise<Extract<Awaited<ReturnType<typeof get>>, { statusCode: 200 }>> {
  const result = await get(pathname, {
    access: appConfig.blobStoreAccess,
    token: appConfig.blobReadWriteToken,
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`Blob not found: ${pathname}`);
  }
  return result;
}

export async function readBlobText(pathname: string): Promise<string> {
  const result = await readBlob(pathname);
  return new Response(result.stream).text();
}

export async function readBlobBytes(pathname: string): Promise<{ bytes: Buffer; contentType: string }> {
  const result = await readBlob(pathname);
  const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
  return {
    bytes,
    contentType: result.blob.contentType ?? "application/octet-stream",
  };
}
