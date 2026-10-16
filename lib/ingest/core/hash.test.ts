import { describe, expect, it } from "vitest";
import { hashKey, partitionByHash, sha256Bytes } from "@/lib/ingest/core/hash";

describe("image hashing", () => {
  it("hashes bytes with sha256", () => {
    expect(sha256Bytes(new Uint8Array([1, 2, 3]))).toBe(
      "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81",
    );
  });

  it("skips images already indexed for the same model", () => {
    const items = [
      { contentHash: "aaa", name: "new" },
      { contentHash: "bbb", name: "old" },
    ];
    const indexed = new Set([hashKey("bbb", "gemini-embedding-2")]);
    const { toEmbed, skipped } = partitionByHash(items, indexed, "gemini-embedding-2");
    expect(toEmbed.map((item) => item.name)).toEqual(["new"]);
    expect(skipped.map((item) => item.name)).toEqual(["old"]);
  });

  it("does not skip the same hash for a different model", () => {
    const items = [{ contentHash: "bbb" }];
    const indexed = new Set([hashKey("bbb", "other-model")]);
    const { toEmbed, skipped } = partitionByHash(items, indexed, "gemini-embedding-2");
    expect(toEmbed).toHaveLength(1);
    expect(skipped).toHaveLength(0);
  });
});
