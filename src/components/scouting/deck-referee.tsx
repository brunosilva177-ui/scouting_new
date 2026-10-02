import { benchCardAnalysis, disciplineLeaders, goalPeriods, lastHeadToHead, minuteLabel, PERIODS } from "@/lib/scouting/discipline";
import { formatSource } from "@/lib/scouting/sources";
import { matchSource, eventsSource } from "@/lib/scouting/discipline";
import type { Team } from "@/lib/scouting/types";

const ICON: Record<string, string> = { goal: "⚽", own_goal: "⚽ (AG)", yellow: "🟨", second_yellow: "🟨🟥", red: "🟥" };

/** Conteúdo da página "Último confronto" do Deck (cronograma sem substituições). */
export function DeckLastMatch({ home, away }: { home: Team; away: Team }) {
  const h = lastHeadToHead(home.id, away.id);
  if (!h) return <p className="deck-muted text-[13px]">Dados não disponíveis — sem confronto oficial nas fichas FPF.</p>;
  const ev = h.items.filter((e) => e.type !== "sub");
  const pos = (m: number) => `${Math.min(100, (m / 95) * 100)}%`;
  return (
    <div>
      <p className="text-[15px] font-semibold">{h.match.home} {h.match.homeGoals}–{h.match.awayGoals} {h.match.away}</p>
      <p className="deck-muted text-[11px]">Época {h.match.season} · J{h.match.round} · {h.match.date} · {h.match.venue}</p>
      <div className="deck-card relative mt-3 h-28">
        <div className="absolute inset-x-4 top-1/2 h-px" style={{ background: "#e8b93a" }} />
        <div className="absolute inset-x-4 inset-y-0">
          {[0, 15, 30, 45, 60, 75, 90].map((m) => (
            <span key={m} className="deck-muted absolute top-1/2 -translate-x-1/2 pt-1 text-[9px]" style={{ left: pos(m) }}>{m}'</span>
          ))}
          {ev.map((e, i) => (
            <div key={i} className="absolute -translate-x-1/2 text-center" style={{ left: pos(e.minute), [e.teamId === h.match.homeId ? "top" : "bottom"]: 4 }}>
              <div className="text-[12px] leading-none">{ICON[e.type]}</div>
              <div className="max-w-[64px] truncate text-[8px]" style={{ color: e.enteredAt !== undefined ? "#e8b93a" : undefined }}>{minuteLabel(e)} {e.player?.split(" ").slice(-1)[0]}</div>
            </div>
          ))}
        </div>
      </div>
      <table className="mt-3 w-full text-[11px]">
        <tbody>
          {ev.map((e, i) => (
            <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
              <td className="py-0.5 pr-2">{minuteLabel(e)}</td><td className="pr-2">{ICON[e.type]}</td>
              <td className="pr-2">{e.team === "home" ? h.match.home : h.match.away}</td><td className="pr-2 font-semibold">{e.player}</td>
              <td className="deck-muted">{e.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="deck-muted mt-2 text-[9px]">Fonte: {formatSource(matchSource(h.match))}</p>
    </div>
  );
}

/** Conteúdo da página "Disciplina e períodos" do Deck. */
export function DeckDiscipline({ home, away }: { home: Team; away: Team }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {[home, away].map((t) => {
          const d = disciplineLeaders(t.id);
          const b = benchCardAnalysis(t.id);
          const g = goalPeriods(t.id);
          return (
            <div key={t.id} className="deck-card">
              <p className="deck-h3">{t.shortName} — últimos {d.matches.length} jogos oficiais</p>
              {!d.matches.length ? <p className="deck-muted mt-2 text-[12px]">Dados não disponíveis</p> : (
                <>
                  <table className="mt-2 w-full text-[11px]">
                    <tbody>
                      {d.players.slice(0, 5).map((p) => (
                        <tr key={p.player}><td className="font-semibold">{p.player}</td><td>🟨{p.yellow}{p.secondYellow ? ` 🟨🟥${p.secondYellow}` : ""}{p.red ? ` 🟥${p.red}` : ""}</td><td className="deck-muted">{p.asSub ? "suplente" : ""} {p.minutes.join(", ")}</td></tr>
                      ))}
                      {!d.players.length && <tr><td className="deck-muted">Sem cartões.</td></tr>}
                    </tbody>
                  </table>
                  {b && <p className="mt-2 text-[11px]"><b>Suplentes:</b> {b.season.benchCards}/{b.season.totalCards} cartões na época ({b.season.share ?? 0}%) · últimos 5: {b.last5.benchCards}/{b.last5.totalCards} · <b style={{ color: b.last5.pattern || b.season.pattern ? "#d05353" : undefined }}>{b.last5.pattern || b.season.pattern ? "padrão" : "sem padrão"}</b></p>}
                  {g && (
                    <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[9px]">
                      {PERIODS.map((lab, i) => (
                        <div key={lab} className="rounded p-0.5" style={{ background: "rgba(255,255,255,.05)" }}>
                          <div className="deck-muted">{lab}</div><div style={{ color: "#5fbf8f" }}>+{g.season.scored[i]}</div><div style={{ color: "#d05353" }}>−{g.season.conceded[i]}</div><div>🟨{g.season.cards[i]}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {g && <p className="deck-muted mt-1 text-[10px]">{g.season.scope}: marca mais {g.season.peakScored ?? "—"} · sofre mais {g.season.peakConceded ?? "—"} · cartões {g.season.peakCards ?? "—"}</p>}
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="deck-muted mt-2 text-[9px]">Fonte: {formatSource(eventsSource)} · 2026/27 tem prioridade quando houver jogos; até lá, dados de 2025/26.</p>
    </div>
  );
}
