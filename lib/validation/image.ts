import sharp from "sharp";
import { appConfig } from "@/lib/config";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

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
  const mime = input.mimeType.toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new ImageValidationError("Unsupported image type. Use JPEG, PNG, or WEBP.");
  }

  const pipeline = sharp(Buffer.from(input.bytes), { failOn: "error" });
  const meta = await pipeline.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < appConfig.minUploadDimension || height < appConfig.minUploadDimension) {
    throw new ImageValidationError(
      `Image is too small. Minimum edge is ${appConfig.minUploadDimension}px.`,
    );
  }
  if (width > appConfig.maxUploadDimension || height > appConfig.maxUploadDimension) {
    throw new ImageValidationError(
      `Image is too large. Maximum edge is ${appConfig.maxUploadDimension}px.`,
    );
  }

  if (mime === "image/webp") {
    const jpeg = await pipeline.jpeg({ quality: 90 }).toBuffer();
    const converted = await sharp(jpeg).metadata();
    return {
      bytes: jpeg,
      mimeType: "image/jpeg",
      width: converted.width ?? width,
      height: converted.height ?? height,
    };
  }

  return {
    bytes: Buffer.from(input.bytes),
    mimeType: mime === "image/png" ? "image/png" : "image/jpeg",
    width,
    height,
  };
}
