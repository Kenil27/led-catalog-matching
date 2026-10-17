import { POC_MATCH_LEVEL_THRESHOLDS } from "@/lib/search/match-level";

export type RelevanceGateResult<T extends { similarityScore: number }> = {
  results: T[];
  rejected: boolean;
  topSimilarityScore: number;
};

/** Scores below this are treated as unrelated regardless of margin. */
export const HARD_REJECT_BELOW = 0.48;

/** Weak top hit can still pass when it clearly beats the next product. */
export const WEAK_MATCH_MIN_TOP = 0.52;
export const WEAK_MATCH_MIN_MARGIN = 0.035;

/**
 * Drop results when the query is off-topic. Uses a minimum score plus a margin
 * check so phone/camera photos (often 52–58% similar) can pass when one product
 * clearly wins, while random photos with flat scores stay rejected.
 */
export function applyRelevanceGate<T extends { similarityScore: number }>(
  results: T[],
  minScore: number,
): RelevanceGateResult<T> {
  if (results.length === 0) {
    return { results: [], rejected: false, topSimilarityScore: 0 };
  }
  const topSimilarityScore = results[0].similarityScore;
  const secondScore = results[1]?.similarityScore ?? 0;
  const margin = topSimilarityScore - secondScore;

  if (topSimilarityScore < HARD_REJECT_BELOW) {
    return { results: [], rejected: true, topSimilarityScore };
  }

  const passesStrict = topSimilarityScore >= minScore;
  const passesConfidentWeak =
    topSimilarityScore >= WEAK_MATCH_MIN_TOP && margin >= WEAK_MATCH_MIN_MARGIN;

  if (!passesStrict && !passesConfidentWeak) {
    return { results: [], rejected: true, topSimilarityScore };
  }

  const rowFloor = passesStrict ? minScore : WEAK_MATCH_MIN_TOP;
  return {
    results: results.filter((row) => row.similarityScore >= rowFloor),
    rejected: false,
    topSimilarityScore,
  };
}

export const DEFAULT_SEARCH_MIN_SIMILARITY = POC_MATCH_LEVEL_THRESHOLDS.possible;
