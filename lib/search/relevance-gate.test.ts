import { describe, expect, it } from "vitest";
import { applyRelevanceGate } from "@/lib/search/relevance-gate";

describe("relevance gate", () => {
  it("returns empty when the best score is below the floor with no margin", () => {
    const out = applyRelevanceGate(
      [
        { id: "a", similarityScore: 0.52 },
        { id: "b", similarityScore: 0.51 },
      ],
      0.6,
    );
    expect(out.rejected).toBe(true);
    expect(out.results).toHaveLength(0);
  });

  it("hard-rejects very low scores", () => {
    const out = applyRelevanceGate([{ id: "a", similarityScore: 0.42 }], 0.6);
    expect(out.rejected).toBe(true);
  });

  it("allows a confident weak camera-style match", () => {
    const out = applyRelevanceGate(
      [
        { id: "a", similarityScore: 0.56 },
        { id: "b", similarityScore: 0.48 },
      ],
      0.6,
    );
    expect(out.rejected).toBe(false);
    expect(out.results.map((r) => r.id)).toEqual(["a"]);
  });

  it("keeps hits at or above the floor when the best score passes", () => {
    const out = applyRelevanceGate(
      [
        { id: "a", similarityScore: 0.72 },
        { id: "b", similarityScore: 0.61 },
        { id: "c", similarityScore: 0.55 },
      ],
      0.6,
    );
    expect(out.rejected).toBe(false);
    expect(out.results.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
