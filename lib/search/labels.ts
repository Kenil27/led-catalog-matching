import type { MatchLevel } from "@/lib/search/match-level";

export const MATCH_LEVEL_LABEL: Record<MatchLevel, string> = {
  high: "Close match",
  possible: "Possible match",
  low: "Low similarity",
};
