import { MATCH_LEVEL_LABEL } from "@/lib/search/labels";
import type { MatchLevel } from "@/lib/search/match-level";

const TONE: Record<MatchLevel, string> = {
  high: "bg-high/10 text-high",
  possible: "bg-brass-soft text-possible",
  low: "bg-paper-2 text-low",
};

export function MatchBadge({ level }: { level: MatchLevel }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TONE[level]}`}>
      {MATCH_LEVEL_LABEL[level]}
    </span>
  );
}
