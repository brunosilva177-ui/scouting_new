import { Kicker } from "./atoms";
import type { ComparisonMetric } from "@/lib/scouting/derive";
import type { Team } from "@/lib/scouting/types";

export function CompareBars({
  metrics,
  home,
  away,
}: {
  metrics: ComparisonMetric[];
  home: Team;
  away: Team;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-data">{home.shortName}</span>
        <span className="text-accent">{away.shortName}</span>
      </div>
      {metrics.map((m) => (
        <div key={m.label} className="print-block">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold tabular-nums text-data">{m.homeDisplay}</span>
            <Kicker className="text-center">{m.label}</Kicker>
            <span className="text-xs font-semibold tabular-nums text-accent">{m.awayDisplay}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            <div className="flex h-2.5 flex-1 justify-end overflow-hidden rounded-l bg-muted">
              <div className="h-full rounded-l bg-data" style={{ width: `${m.homeScore}%` }} />
            </div>
            <div className="flex h-2.5 flex-1 overflow-hidden rounded-r bg-muted">
              <div className="h-full rounded-r bg-accent" style={{ width: `${m.awayScore}%` }} />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{m.hint}</p>
        </div>
      ))}
    </div>
  );
}
