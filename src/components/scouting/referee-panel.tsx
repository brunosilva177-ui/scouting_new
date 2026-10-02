import { SectionTitle, SourceNote, Unavailable } from "@/components/scouting/atoms";
import {
  benchCardAnalysis,
  disciplineLeaders,
  eventsSource,
  goalPeriods,
  lastHeadToHead,
  matchSource,
  minuteLabel,
  PERIODS,
  refereeFocus,
  type TimelineItem,
} from "@/lib/scouting/discipline";
import type { Team } from "@/lib/scouting/types";
import { cn } from "@/lib/utils";

const ICON: Record<string, string> = { goal: "⚽", own_goal: "⚽", yellow: "🟨", second_yellow: "🟨🟥", red: "🟥", sub: "⇄" };
const LABEL: Record<string, string> = { goal: "Golo", own_goal: "Autogolo", yellow: "Amarelo", second_yellow: "2.º amarelo", red: "Vermelho", sub: "Substituição" };

export function RefereePanel({ home, away }: { home: Team; away: Team }) {
  const h2h = lastHeadToHead(home.id, away.id);
  return (
    <div className="space-y-8">
      <section className="panel p-5">
        <SectionTitle letter="★" title="Último confronto entre as equipas" subtitle="Cronograma oficial de golos, cartões e substituições" />
        {!h2h ? (
          <p className="text-sm"><Unavailable hint="sem confronto oficial registado nas fichas FPF disponíveis" /></p>
        ) : (
          <>
            <p className="mb-1 text-sm font-semibold">
              {h2h.match.home} {h2h.match.homeGoals ?? "-"}–{h2h.match.awayGoals ?? "-"} {h2h.match.away}
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Época {h2h.match.season} · Jornada {h2h.match.round} · {h2h.match.date} {h2h.match.time ?? ""} · {h2h.match.venue}
              {!h2h.match.eventsMatchScore && " · Atenção: o resultado oficial difere dos golos da ficha (provável decisão administrativa)."}
            </p>
            <Timeline items={h2h.items} homeId={h2h.match.homeId} />
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr><th className="py-1 pr-3">Min.</th><th className="pr-3">Evento</th><th className="pr-3">Equipa</th><th className="pr-3">Jogador</th><th>Considerações</th></tr>
                </thead>
                <tbody>
                  {h2h.items.map((e, i) => (
                    <tr key={i} className={cn("border-t border-border", e.type !== "sub" && "font-medium")}>
                      <td className="py-1.5 pr-3 tabular-nums">{minuteLabel(e)}</td>
                      <td className="pr-3">{ICON[e.type]} {LABEL[e.type]}{e.score ? ` (${e.score})` : ""}</td>
                      <td className="pr-3">{e.team === "home" ? h2h.match.home : h2h.match.away}</td>
                      <td className="pr-3">{e.type === "sub" ? `Entra ${e.playerIn ?? "?"} · sai ${e.playerOut ?? "?"}` : e.player}</td>
                      <td className="text-xs text-muted-foreground">{e.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SourceNote source={matchSource(h2h.match)} className="mt-3" />
          </>
        )}
      </section>

      <section className="panel p-5">
        <SectionTitle title="Focos para a equipa de arbitragem" subtitle="Leitura automática dos dados oficiais" />
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {[...refereeFocus(home.id, home.shortName), ...refereeFocus(away.id, away.shortName)].map((t) => <li key={t}>{t}</li>)}
          {!refereeFocus(home.id, home.shortName).length && !refereeFocus(away.id, away.shortName).length && <li><Unavailable /></li>}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {[home, away].map((t) => <TeamDiscipline key={t.id} team={t} />)}
      </div>
      <SourceNote source={eventsSource} />
      <p className="text-[11px] text-muted-foreground">
        Época 2026/27 tem prioridade assim que houver jogos oficiais; até lá, os dados são de 2025/26 e cada jogo indica a sua época.
        Alguns jogadores podem ter mudado de clube desde então.
      </p>
    </div>
  );
}

function Timeline({ items, homeId }: { items: TimelineItem[]; homeId: string }) {
  const pos = (m: number) => `${Math.min(100, (m / 95) * 100)}%`;
  const key = items.filter((e) => e.type !== "sub");
  const subs = items.filter((e) => e.type === "sub");
  return (
    <div className="relative h-36 rounded border border-border bg-surface">
      <div className="absolute inset-x-3 top-1/2 h-px bg-border" />
      <div className="absolute inset-x-3 top-0 bottom-0">
        {[0, 15, 30, 45, 60, 75, 90].map((m) => (
          <div key={m} className="absolute top-1/2 -translate-x-1/2 text-[10px] text-muted-foreground" style={{ left: pos(m) }}>
            <div className={cn("mx-auto h-2 w-px bg-muted-foreground", m === 45 && "h-4 -mt-1")} />{m}'
          </div>
        ))}
        {subs.map((e, i) => (
          <div key={`s${i}`} title={`${minuteLabel(e)} entra ${e.playerIn}`} className={cn("absolute -translate-x-1/2 text-[10px] text-muted-foreground", e.teamId === homeId ? "top-[38%]" : "top-[54%]")} style={{ left: pos(e.minute) }}>⇄</div>
        ))}
        {key.map((e, i) => (
          <div key={i} className={cn("absolute -translate-x-1/2 text-center", e.teamId === homeId ? "top-1" : "bottom-1")} style={{ left: pos(e.minute + (e.added ? 0.5 : 0)) }}>
            <div className="text-sm leading-none">{ICON[e.type]}</div>
            <div className={cn("max-w-[70px] truncate text-[9px] leading-tight", e.enteredAt !== undefined && "font-bold text-warning")}>{minuteLabel(e)} {e.player?.split(" ").slice(-1)[0]}</div>
          </div>
        ))}
      </div>
      <span className="absolute left-1 top-1 text-[9px] font-semibold uppercase text-muted-foreground">Casa</span>
      <span className="absolute bottom-1 left-1 text-[9px] font-semibold uppercase text-muted-foreground">Fora</span>
    </div>
  );
}

function TeamDiscipline({ team }: { team: Team }) {
  const d = disciplineLeaders(team.id);
  const b = benchCardAnalysis(team.id);
  const g = goalPeriods(team.id);
  return (
    <section className="panel p-5">
      <SectionTitle title={team.name} subtitle={d.matches.length ? `Últimos ${d.matches.length} jogos oficiais (${d.matches.map((m) => `${m.season} J${m.round}`).join(", ")})` : "Sem jogos oficiais registados"} />
      {!d.matches.length ? (
        <Unavailable hint="sem fichas oficiais desta equipa na 1.ª Divisão" />
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jogadores mais sancionados</p>
            {d.players.length ? (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th>Jogador</th><th>🟨</th><th>🟨🟥</th><th>🟥</th><th>Suplente</th><th>Minutos</th></tr></thead>
                <tbody>
                  {d.players.slice(0, 6).map((p) => (
                    <tr key={p.player} className="border-t border-border">
                      <td className="py-1 font-medium">{p.player}</td><td>{p.yellow}</td><td>{p.secondYellow}</td><td>{p.red}</td>
                      <td>{p.asSub ? `${p.asSub}×` : "—"}</td><td className="text-xs text-muted-foreground">{p.minutes.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-sm text-muted-foreground">Sem cartões nos últimos 5 jogos.</p>}
          </div>

          {b && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suplentes sancionados após entrar</p>
              {[b.last5, b.season].map((s) => (
                <p key={s.scope} className="text-sm">
                  <span className="font-medium">{s.scope}:</span> {s.benchCards} de {s.totalCards} cartões ({s.share ?? 0}%) em {s.matchesWithBenchCard}/{s.matches} jogos
                  {s.avgMinutesAfterEntry !== null && ` · média ${s.avgMinutesAfterEntry} min após entrar`}
                  {" · "}<span className={cn("font-semibold", s.pattern ? "text-destructive" : "text-muted-foreground")}>{s.pattern ? "Padrão identificado" : "Sem padrão"}</span>
                </p>
              ))}
              {b.last5.cases.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {b.last5.cases.map((c) => `${c.player} (entrou ${c.enteredAt}', cartão ${c.minute}, ${c.season} J${c.round})`).join("; ")}
                </p>
              )}
            </div>
          )}

          {g && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Golos e cartões por período</p>
              {[g.last5, g.season].map((p) => (
                <div key={p.scope} className="mb-3">
                  <p className="mb-1 text-xs">{p.scope} ({p.matches} jogos)</p>
                  <div className="grid grid-cols-6 gap-1 text-center text-[11px]">
                    {PERIODS.map((lab, i) => (
                      <div key={lab} className="rounded bg-surface p-1">
                        <div className="text-muted-foreground">{lab}</div>
                        <div className="font-semibold text-data">+{p.scored[i]}</div>
                        <div className="font-semibold text-destructive">−{p.conceded[i]}</div>
                        <div>🟨 {p.cards[i]}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Marca mais: {p.peakScored ?? "—"} · Sofre mais: {p.peakConceded ?? "—"} · Mais cartões: {p.peakCards ?? "—"}
                    {p.inconsistent > 0 && ` · ${p.inconsistent} jogo(s) com resultado oficial diferente da ficha`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
