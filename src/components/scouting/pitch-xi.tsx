import { Crest, Kicker, OriginTag } from "./atoms";
import { cn } from "@/lib/utils";
import type { LikelyXI } from "@/lib/scouting/derive";
import type { Team } from "@/lib/scouting/types";

export function PitchXI({ team, xi }: { team: Team; xi: LikelyXI }) {
  return (
    <div className="panel overflow-hidden print-block">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Crest team={team} size={34} />
          <div>
            <p className="font-semibold leading-tight">{team.shortName}</p>
            <p className="text-xs text-muted-foreground">Sistema previsto: {xi.formation}</p>
          </div>
        </div>
        <div className="text-right">
          <Kicker>Confiança</Kicker>
          <p
            className={cn(
              "font-display text-sm font-semibold capitalize",
              xi.confidence === "alta" && "text-win",
              xi.confidence === "média" && "text-warning-foreground",
              xi.confidence === "baixa" && "text-destructive",
            )}
          >
            {xi.confidence}
          </p>
        </div>
      </div>

      <div className="relative bg-pitch p-3">
        <div className="pointer-events-none absolute inset-3 rounded border border-pitch-line" />
        <div className="pointer-events-none absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-pitch-line" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pitch-line" />
        <div className="relative flex flex-col gap-3">
          {xi.rows.map((row, i) => (
            <div key={`${row.position}-${i}`} className="flex flex-wrap items-start justify-center gap-2">
              {row.players.map((p) => (
                <div
                  key={p.player.id}
                  className="w-[86px] rounded bg-card/95 px-1.5 py-1 text-center shadow-card"
                >
                  <p className="font-display text-xs font-bold tabular-nums">{p.player.shirt ?? "-"}</p>
                  <p className="truncate text-[11px] font-medium leading-tight" title={p.player.name}>
                    {p.player.name}
                  </p>
                  <p className="text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(p.probability * 100)}%
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 px-4 py-3">
        <OriginTag kind="dados" />
        <p className="text-[11px] text-muted-foreground">{xi.confidenceReason}</p>
        <div>
          <Kicker>Banco provável</Kicker>
          <p className="mt-1 text-xs leading-relaxed">
            {xi.bench.length
              ? xi.bench
                  .map((b) => `${b.player.name} (${b.player.detailedPosition}, ${Math.round(b.probability * 100)}%)`)
                  .join(" · ")
              : "Dados não disponíveis"}
          </p>
        </div>
        <div>
          <Kicker>Alternativas táticas</Kicker>
          <p className="mt-1 text-xs">
            {team.altFormations.length ? team.altFormations.join(" · ") : "Dados não disponíveis"}
          </p>
        </div>
      </div>
    </div>
  );
}
