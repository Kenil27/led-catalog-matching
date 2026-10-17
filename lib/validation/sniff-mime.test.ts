import { describe, expect, it } from "vitest";
import { resolveSearchImageMimeType, sniffImageMimeType } from "@/lib/validation/sniff-mime";

describe("sniffImageMimeType", () => {
  it("detects JPEG when type is missing", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(sniffImageMimeType(bytes)).toBe("image/jpeg");
    expect(resolveSearchImageMimeType(bytes, "")).toBe("image/jpeg");
    expect(resolveSearchImageMimeType(bytes, "application/octet-stream")).toBe("image/jpeg");
  });

  it("detects WEBP from RIFF header when type is missing", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(sniffImageMimeType(bytes)).toBe("image/webp");
  });
});
