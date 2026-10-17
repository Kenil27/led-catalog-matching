import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { ImageValidationError, validateSearchImage } from "@/lib/validation/image";

async function png(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 20, b: 20 } },
  })
    .png()
    .toBuffer();
}

describe("image validation", () => {
  it("accepts a PNG in range", async () => {
    const bytes = await png(200, 200);
    const result = await validateSearchImage({
      bytes,
      mimeType: "image/png",
      byteLength: bytes.byteLength,
    });
    expect(result.mimeType).toBe("image/png");
    expect(result.width).toBe(200);
  });

  it("accepts camera JPEG when File.type is empty", async () => {
    const bytes = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 40, g: 40, b: 40 } },
    })
      .jpeg()
      .toBuffer();
    const result = await validateSearchImage({
      bytes,
      mimeType: "",
      byteLength: bytes.byteLength,
    });
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.width).toBe(400);
  });

  it("converts WEBP to JPEG", async () => {
    const webp = await sharp({
      create: { width: 120, height: 120, channels: 3, background: { r: 8, g: 8, b: 8 } },
    })
      .webp()
      .toBuffer();
    const result = await validateSearchImage({
      bytes: webp,
      mimeType: "image/webp",
      byteLength: webp.byteLength,
    });
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("accepts WEBP when File.type is empty", async () => {
    const webp = await sharp({
      create: { width: 200, height: 200, channels: 3, background: { r: 12, g: 12, b: 12 } },
    })
      .webp()
      .toBuffer();
    const result = await validateSearchImage({
      bytes: webp,
      mimeType: "",
      byteLength: webp.byteLength,
    });
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.width).toBe(200);
  });

  it("rejects empty, huge, tiny, and non-image types", async () => {
    await expect(
      validateSearchImage({ bytes: new Uint8Array(), mimeType: "image/jpeg", byteLength: 0 }),
    ).rejects.toBeInstanceOf(ImageValidationError);

    const tiny = await png(32, 32);
    await expect(
      validateSearchImage({ bytes: tiny, mimeType: "image/png", byteLength: tiny.byteLength }),
    ).rejects.toThrow(/too small/);

    await expect(
      validateSearchImage({ bytes: await png(80, 80), mimeType: "image/gif", byteLength: 100 }),
    ).rejects.toThrow(/Unsupported/);

    await expect(
      validateSearchImage({
        bytes: new Uint8Array([1, 2, 3]),
        mimeType: "image/jpeg",
        byteLength: 20 * 1024 * 1024,
      }),
    ).rejects.toThrow(/exceeds/);
  });
});
