export type MatchLevel = "high" | "possible" | "low";

/**
 * Uncalibrated Phase 1 POC buckets. These are NOT production thresholds
 * and MUST NOT be treated as probabilities.
 */
export const POC_MATCH_LEVEL_THRESHOLDS = {
  high: 0.75,
  possible: 0.6,
} as const;

export function matchLevelFromScore(similarityScore: number): MatchLevel {
  if (similarityScore >= POC_MATCH_LEVEL_THRESHOLDS.high) return "high";
  if (similarityScore >= POC_MATCH_LEVEL_THRESHOLDS.possible) return "possible";
  return "low";
}
