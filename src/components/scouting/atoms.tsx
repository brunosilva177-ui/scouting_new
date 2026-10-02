import { Shield } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NA } from "@/lib/scouting/derive";
import { formatSource } from "@/lib/scouting/sources";
import type { FormEntry } from "@/lib/scouting/derive";
import type { SourceRef, Team } from "@/lib/scouting/types";

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("label-kicker", className)}>{children}</p>;
}

export function SectionTitle({
  id,
  letter,
  title,
  subtitle,
  action,
}: {
  id?: string;
  letter?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div id={id} className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
      <div>
        <div className="flex items-center gap-2">
          {letter && (
            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
              {letter}
            </span>
          )}
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SourceNote({ source, className }: { source: SourceRef; className?: string }) {
  return (
    <p className={cn("text-[11px] leading-tight text-muted-foreground", className)}>
      Fonte: {formatSource(source)}
      {source.origin === "exemplo" && " · Exemplo"}
    </p>
  );
}

export function Unavailable({ hint }: { hint?: string }) {
  return (
    <span className="inline-flex items-center rounded border border-dashed border-border px-1.5 py-0.5 text-xs text-muted-foreground">
      {NA}
      {hint ? ` (${hint})` : ""}
    </span>
  );
}

export function OriginTag({ kind }: { kind: "dados" | "analista" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        kind === "dados" ? "bg-data/10 text-data" : "bg-analyst/10 text-analyst",
      )}
    >
      {kind === "dados" ? "Dados automáticos" : "Observação do analista"}
    </span>
  );
}

export function DemoTag() {
  return (
    <span className="inline-flex items-center rounded bg-warning/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">
      Exemplo
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "accent" | "warning";
}) {
  return (
    <div className="panel px-3 py-2.5">
      <Kicker>{label}</Kicker>
      <p
        className={cn(
          "mt-1 font-display text-xl font-semibold tabular-nums",
          tone === "accent" && "text-accent",
          tone === "warning" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Crest({ team, size = 40 }: { team: Team; size?: number }) {
  if (team.crestUrl) {
    return (
      <img
        src={team.crestUrl}
        alt={`Emblema do ${team.name}`}
        width={size}
        height={size}
        className="rounded object-contain"
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded border border-border bg-surface text-surface-foreground"
      style={{ width: size, height: size }}
      title="Emblema não disponível (uso apenas com licença ou upload manual)"
      aria-label={`Emblema não disponível para ${team.name}`}
    >
      <Shield style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.5} />
    </div>
  );
}

export function FormBadges({ entries }: { entries: FormEntry[] }) {
  if (!entries.length) return <Unavailable hint="sem jogos realizados" />;
  return (
    <div className="flex flex-wrap gap-1">
      {[...entries].reverse().map((e) => (
        <span
          key={e.match.id}
          title={`${e.home ? "Casa" : "Fora"} vs ${e.opponent.shortName}: ${e.goalsFor}-${e.goalsAgainst}`}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-primary-foreground",
            e.result === "V" && "bg-win",
            e.result === "E" && "bg-draw",
            e.result === "D" && "bg-loss",
          )}
        >
          {e.result}
        </span>
      ))}
    </div>
  );
}
