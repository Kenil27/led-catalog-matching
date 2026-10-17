import sharp from "sharp";
import { appConfig } from "@/lib/config";
import { resolveSearchImageMimeType } from "@/lib/validation/sniff-mime";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type ValidatedImage = {
  bytes: Buffer;
  mimeType: "image/jpeg" | "image/png";
  width: number;
  height: number;
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export async function validateSearchImage(input: {
  bytes: Uint8Array;
  mimeType: string;
  byteLength: number;
}): Promise<ValidatedImage> {
  if (input.byteLength <= 0) {
    throw new ImageValidationError("Empty file.");
  }
  if (input.byteLength > appConfig.maxUploadBytes) {
    throw new ImageValidationError(`File exceeds ${appConfig.maxUploadBytes} bytes.`);
  }
  let mime = resolveSearchImageMimeType(input.bytes, input.mimeType).toLowerCase();
  let pipeline = sharp(Buffer.from(input.bytes), { failOn: "error" }).rotate();
  let meta = await pipeline.metadata();
  const declared = input.mimeType.trim().toLowerCase();
  const canInferMime = !declared || declared === "application/octet-stream";
  if (!ALLOWED_MIME.has(mime) && canInferMime) {
    const detectedFormat = meta.format;
    if (detectedFormat === "heif") {
      mime = "image/heic";
    } else if (detectedFormat === "jpeg") {
      mime = "image/jpeg";
    } else if (detectedFormat === "png") {
      mime = "image/png";
    } else if (detectedFormat === "webp") {
      mime = "image/webp";
    }
  }
  if (!ALLOWED_MIME.has(mime)) {
    throw new ImageValidationError("Unsupported image type. Use JPEG, PNG, or WEBP.");
  }
  let width = meta.width ?? 0;
  let height = meta.height ?? 0;

  if (width < appConfig.minUploadDimension || height < appConfig.minUploadDimension) {
    throw new ImageValidationError(
      `Image is too small. Minimum edge is ${appConfig.minUploadDimension}px.`,
    );
  }

  const maxEdge = appConfig.maxUploadDimension;
  if (width > maxEdge || height > maxEdge) {
    pipeline = pipeline.resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    });
    meta = await pipeline.metadata();
    width = meta.width ?? width;
    height = meta.height ?? height;
  }

  const outputMime: ValidatedImage["mimeType"] =
    mime === "image/png" ? "image/png" : "image/jpeg";
  // Gemini accepts JPEG/PNG only; HEIC/WebP from phone camera are normalized to JPEG.
  const bytes =
    outputMime === "image/png"
      ? await pipeline.png().toBuffer()
      : await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  const outMeta = await sharp(bytes).metadata();

  return {
    bytes,
    mimeType: outputMime,
    width: outMeta.width ?? width,
    height: outMeta.height ?? height,
  };
}
