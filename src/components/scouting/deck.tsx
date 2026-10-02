import type { ReactNode } from "react";
import {
  ageBuckets,
  comparison,
  computeStandings,
  computeTeamStats,
  dataEstimate,
  depthByPosition,
  fmt,
  headToHead,
  keyPlayers,
  lastFormStreaks,
  likelyXI,
  matchKeys,
  squad,
  teamForm,
} from "@/lib/scouting/derive";
import { formatSource } from "@/lib/scouting/sources";
import { DeckDiscipline, DeckLastMatch } from "@/components/scouting/deck-referee";
import { POSITION_LABEL, type AnalystNotes, type Dataset, type Match, type Player, type Position, type Team } from "@/lib/scouting/types";

const NA = "Dados não disponíveis";

/* --------------------------------- átomos --------------------------------- */

function DeckPage({
  index,
  total,
  section,
  children,
}: {
  index: number;
  total: number;
  section: string;
  children: ReactNode;
}) {
  return (
    <section className="deck-page" data-deck-page={index}>
      <header className="deck-head">
        <span>
          <span className="deck-mark">◆</span> Departamento de análise e prospeção
        </span>
        <span>{section}</span>
      </header>
      <div className="mt-6 flex-1 overflow-hidden">{children}</div>
      <footer className="deck-foot">
        <span>Relatório confidencial — uso interno</span>
        <span className="deck-num">
          {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </footer>
    </section>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="deck-h2">{title}</h2>
      {subtitle && <p className="deck-sub mt-1">{subtitle}</p>}
    </div>
  );
}

function Block({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`deck-card ${className ?? ""}`}>
      <p className="deck-h3">{title}</p>
      <div className="mt-2.5 text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="deck-card" style={{ padding: "10px 12px" }}>
      <p className="deck-kicker" style={{ color: "#93a4c0" }}>
        {label}
      </p>
      <p className="deck-stat mt-1">{value}</p>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return <p className="deck-muted">{NA}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i} className="flex gap-2">
          <span className="deck-gold">▸</span>
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

function Crest({ short, size = 76 }: { short: string; size?: number }) {
  return (
    <div className="deck-crest" style={{ width: size, height: size * 1.12, fontSize: size * 0.3 }}>
      {short.slice(0, 4).toUpperCase()}
    </div>
  );
}

function FormRow({ results }: { results: string[] }) {
  if (!results.length) return <span className="deck-muted">{NA}</span>;
  return (
    <span className="inline-flex gap-1">
      {results.map((r, i) => (
        <span
          key={`${r}-${i}`}
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold ${
            r === "V" ? "deck-badge-win" : r === "D" ? "deck-badge-loss" : "deck-badge-draw"
          }`}
          style={{ color: "#f2f5fa" }}
        >
          {r}
        </span>
      ))}
    </span>
  );
}

function Banner({ label, text }: { label: string; text: string }) {
  return (
    <div className="deck-banner mt-4">
      <p className="deck-kicker">{label}</p>
      <p className="mt-1 text-[13px]" style={{ color: "#f2f5fa" }}>
        {text}
      </p>
    </div>
  );
}

/* --------------------------------- páginas -------------------------------- */

export function ScoutingDeck({
  ds,
  match,
  home,
  away,
  notes,
  lineups,
}: {
  ds: Dataset;
  match: Match;
  home: Team;
  away: Team;
  notes?: Record<string, AnalystNotes> | undefined;
  lineups?: Record<string, string[]> | undefined;
}) {
  const seasonId = match.seasonId;
  const season = ds.seasons.find((s) => s.id === seasonId)!;
  const competition = ds.competitions.find((c) => c.id === season.competitionId)!;
  const standings = computeStandings(ds, seasonId);
  const hRow = standings.find((r) => r.team.id === home.id)!;
  const aRow = standings.find((r) => r.team.id === away.id)!;
  const metrics = comparison(ds, seasonId, home, away);
  const estimate = dataEstimate(ds, seasonId, home, away);
  const keys = matchKeys(ds, seasonId, home, away);
  const h2h = headToHead(ds, home.id, away.id);
  const currentSeasonHasMatches = hRow.played > 0 || aRow.played > 0;
  const total = 16;

  const kickoff = match.kickoff
    ? new Date(match.kickoff).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
    : NA;

  return (
    <div className="deck">
      {/* 1 — Capa */}
      <section className="deck-page" data-deck-page={1}>
        <header className="deck-head">
          <span>
            <span className="deck-mark">◆</span> Departamento de análise e prospeção
          </span>
          <span className="deck-gold">Confidencial</span>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="deck-kicker">Scouting report</p>
          <h1 className="deck-h1 mt-3">Análise de adversário</h1>
          <div className="deck-rule mt-5" style={{ width: 180 }} />
          <div className="mt-8 flex items-center justify-center gap-10">
            <div className="flex flex-col items-center gap-3">
              <Crest short={home.shortName} />
              <p className="deck-sub" style={{ maxWidth: 220 }}>
                {home.name}
              </p>
            </div>
            <div>
              <p className="deck-h1" style={{ fontSize: 34 }}>
                VS
              </p>
              <p className="deck-kicker mt-1">{match.round}.ª Jornada</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Crest short={away.shortName} />
              <p className="deck-sub" style={{ maxWidth: 220 }}>
                {away.name}
              </p>
            </div>
          </div>
          <div className="mt-9 grid grid-cols-3 gap-4" style={{ width: 760 }}>
            {[
              ["Competição", `${competition.name} ${season.label}`],
              ["Data", kickoff],
              ["Jornada", `${match.round}.ª de ${season.rounds}`],
            ].map(([l, v]) => (
              <div key={l} className="deck-card deck-card-gold text-center">
                <p className="deck-kicker">{l}</p>
                <p className="mt-1 text-[14px] font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <p className="deck-muted mt-6 text-[11px]">
            {competition.association} · {match.venue ?? "Campo não disponível"} · Fonte: {formatSource(match.source)}
            {ds.isDemo ? " · Dados de exemplo" : ""}
          </p>
        </div>
        <footer className="deck-foot">
          <span>Relatório confidencial — uso interno</span>
          <span className="deck-num">01 / {total}</span>
        </footer>
      </section>

      {/* 2 — Enquadramento competitivo */}
      <DeckPage index={2} total={total} section="Enquadramento competitivo">
        <PageTitle title={`${competition.name} ${season.label}`} subtitle="Enquadramento competitivo e contexto do confronto" />
        <div className="grid grid-cols-3 gap-4">
          <Block title="Contexto da jornada" className="col-span-2">
            <p>{currentSeasonHasMatches
              ? `Jornada ${match.round} de ${season.rounds}. ${home.shortName} ocupa o ${hRow.position}.º lugar com ${hRow.points} pontos; ${away.shortName} ocupa o ${aRow.position}.º lugar com ${aRow.points} pontos.`
              : `Jornada ${match.round} de ${season.rounds}. A classificação de 2026/27 ainda não está disponível porque não existem jogos realizados.`}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-3">
              <Stat label={`${home.shortName} pos.`} value={hRow.played ? `${hRow.position}.º` : NA} />
              <Stat label={`${home.shortName} pts`} value={hRow.played ? hRow.points : NA} />
              <Stat label={`${away.shortName} pos.`} value={aRow.played ? `${aRow.position}.º` : NA} />
              <Stat label={`${away.shortName} pts`} value={aRow.played ? aRow.points : NA} />
            </div>
          </Block>
          <Block title="Formato">
            <Bullets
              items={[
                "Vitória 3 pontos | Empate 1 ponto",
                `Campeonato a duas voltas — ${season.rounds} jornadas`,
                "Classificação apurada após cada jornada",
              ]}
            />
          </Block>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Block title="Confrontos diretos">
            {h2h.length ? (
              <ul className="space-y-1 tabular-nums">
                {h2h.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    Jornada {m.round}: {ds.teams.find((t) => t.id === m.homeTeamId)!.shortName} {m.homeGoals}–{m.awayGoals}{" "}
                    {ds.teams.find((t) => t.id === m.awayTeamId)!.shortName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="deck-muted">{NA} (sem confrontos registados nesta época)</p>
            )}
          </Block>
          <Block title="Profundidade comparada">
            {[home, away].map((t) => {
              const n = squad(ds, t.id).length;
              return (
                <div key={t.id} className="mb-2">
                  <div className="flex justify-between text-[12px]">
                    <span>{t.shortName}</span>
                    <span className="tabular-nums">{n} jogadores</span>
                  </div>
                  <div className="deck-track mt-1">
                    <div className={t.id === home.id ? "deck-fill-a" : "deck-fill-b"} style={{ width: `${Math.min(100, n * 3)}%` }} />
                  </div>
                </div>
              );
            })}
          </Block>
        </div>
        <Banner
          label="Destaque"
          text={
            h2h.length
              ? `Histórico direto registado: ${h2h.length} confronto(s) nesta base de dados.`
              : "Sem confronto direto registado nesta época — leitura feita apenas por indicadores da época em curso."
          }
        />
      </DeckPage>

      {/* 3 — Contexto histórico e preparação */}
      <ContextPage ds={ds} teams={[home, away]} total={total} />

      {/* 4 e 6 — Perfil de equipa */}
      {[home, away].map((team, i) => (
        <TeamProfilePage key={team.id} ds={ds} seasonId={seasonId} team={team} index={i === 0 ? 4 : 6} total={total} />
      ))}

      {/* 5 e 7 — Plantéis */}
      {[home, away].map((team, i) => (
        <SquadPage key={team.id} ds={ds} team={team} index={i === 0 ? 5 : 7} total={total} />
      ))}

      {/* 7 — Jogadores-chave */}
      <DeckPage index={8} total={total} section="Jogadores-chave">
        <PageTitle title="Jogadores-chave" subtitle="Seleção automática por minutos, participações em golos e utilização" />
        <div className="grid grid-cols-2 gap-4">
          {[home, away].map((team) => (
            <Block key={team.id} title={team.shortName}>
              <div className="space-y-2">
                {keyPlayers(squad(ds, team.id), 5).map((k) => (
                  <div key={k.player.id} className="flex items-start justify-between gap-3 border-b pb-2" style={{ borderColor: "#1f3a63" }}>
                    <div>
                      <p className="text-[13px] font-semibold">
                        {k.player.shirt ?? "-"} · {k.player.name}
                      </p>
                      <p className="deck-muted text-[11px]">
                        {k.player.detailedPosition} · {k.player.age ?? "n/d"} anos · {k.reasons[0] ?? "Utilização regular"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="deck-gold text-[15px] font-bold tabular-nums">{k.contributions}</p>
                      <p className="deck-muted text-[10px]">G+A</p>
                    </div>
                  </div>
                ))}
              </div>
            </Block>
          ))}
        </div>
      </DeckPage>

      {/* 8 e 9 — Onzes prováveis */}
      {[home, away].map((team, i) => (
        <XIPage
          key={team.id}
          ds={ds}
          seasonId={seasonId}
          team={team}
          override={lineups?.[team.id]}
          index={i === 0 ? 9 : 10}
          total={total}
        />
      ))}

      {/* 10 — Comparação */}
      <DeckPage index={11} total={total} section="Comparação das equipas">
        <PageTitle title="Comparação das equipas" subtitle="Indicadores calculados a partir dos jogos já realizados" />
        <div className="deck-card">
          <div className="mb-3 flex justify-between text-[12px] font-semibold">
            <span style={{ color: "#5b9bd5" }}>{home.shortName}</span>
            <span className="deck-gold">{away.shortName}</span>
          </div>
          <div className="space-y-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="tabular-nums" style={{ color: "#5b9bd5" }}>
                    {m.homeDisplay}
                  </span>
                  <span className="deck-muted">{m.label}</span>
                  <span className="deck-gold tabular-nums">{m.awayDisplay}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="deck-track flex-1" style={{ transform: "scaleX(-1)" }}>
                    <div className="deck-fill-a" style={{ width: `${m.homeScore}%` }} />
                  </div>
                  <div className="deck-track flex-1">
                    <div className="deck-fill-b" style={{ width: `${m.awayScore}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Block title="Estimativa baseada em dados">
            {estimate ? (
              <p>
                {home.shortName} {estimate.home}% · Empate {estimate.draw}% · {away.shortName} {estimate.away}%. Fatores considerados:{" "}
                {estimate.factors.join(", ")}. Estimativa indicativa, não é uma previsão garantida.
              </p>
            ) : (
              <p className="deck-muted">{NA} (jogos insuficientes para estimativa)</p>
            )}
          </Block>
        </div>
      </DeckPage>

      {/* 11 — Análise tática */}
      <DeckPage index={12} total={total} section="Análise tática">
        <PageTitle title="Análise tática" subtitle="Dados automáticos e observação do analista, sempre identificados" />
        <div className="grid grid-cols-2 gap-4">
          {[home, away].map((team) => {
            const st = computeTeamStats(ds, seasonId, team.id);
            const streaks = lastFormStreaks(teamForm(ds, seasonId, team.id, 10));
            const n = notes?.[team.id];
            const analyst = (
              [
                ["Pressão", n?.pressao],
                ["Construção", n?.construcao],
                ["Transição", n?.transicao],
                ["Organização defensiva", n?.organizacaoDefensiva],
                ["Bolas paradas", n?.bolasParadas],
                ["Zonas", n?.zonas],
              ] as Array<[string, string | undefined]>
            ).filter(([, v]) => v && v.trim());
            return (
              <div key={team.id} className="space-y-3">
                <Block title={`${team.shortName} · dados automáticos`}>
                  <Bullets
                    items={[
                      `Sistema mais utilizado: ${team.mainFormation ?? NA}`,
                      `Alternativas: ${team.altFormations.join(", ") || NA}`,
                      `Casa ${st.home.points} pts / ${st.home.played} j. · Fora ${st.away.points} pts / ${st.away.played} j.`,
                      `Sem marcar: ${streaks.noScore} jogo(s) · A sofrer: ${streaks.conceding} jogo(s)`,
                    ]}
                  />
                </Block>
                <Block title={`${team.shortName} · observação do analista`}>
                  {analyst.length ? (
                    <ul className="space-y-1.5">
                      {analyst.map(([l, v]) => (
                        <li key={l}>
                          <span className="deck-gold">{l}:</span> {v}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="deck-muted">Sem notas do analista registadas para este jogo.</p>
                  )}
                </Block>
              </div>
            );
          })}
        </div>
      </DeckPage>

      {/* 12 — Chaves do jogo */}
      <DeckPage index={13} total={total} section="Chaves do jogo">
        <PageTitle title="Chaves do jogo" subtitle="Fatores determinantes gerados a partir dos dados disponíveis" />
        <div className="grid grid-cols-2 gap-3">
          {keys.slice(0, 6).map((k) => (
            <div
              key={k.title}
              className="deck-card"
              style={{ borderLeft: `3px solid ${k.kind === "alerta" ? "#d05353" : "#e8b93a"}` }}
            >
              <p className="deck-kicker" style={{ color: k.kind === "alerta" ? "#d05353" : "#e8b93a" }}>
                {k.kind === "alerta" ? "Sinal de alerta" : "Chave"}
              </p>
              <p className="mt-1 text-[13px] font-semibold">{k.title}</p>
              <p className="deck-muted mt-1 text-[12px] leading-snug">{k.detail}</p>
            </div>
          ))}
        </div>
      </DeckPage>

      {/* Arbitragem — último confronto e disciplina */}
      <DeckPage index={14} total={total} section="Arbitragem — último confronto">
        <PageTitle title="Último confronto" subtitle="Cronograma oficial de golos e cartões · suplentes sancionados a dourado" />
        <DeckLastMatch home={home} away={away} />
      </DeckPage>
      <DeckPage index={15} total={total} section="Arbitragem — disciplina">
        <PageTitle title="Disciplina e períodos de jogo" subtitle="Jogadores mais sancionados, suplentes e minutos críticos" />
        <DeckDiscipline home={home} away={away} />
      </DeckPage>

      {/* Conclusão */}
      <DeckPage index={16} total={total} section="Conclusão executiva">
        <PageTitle title="Conclusão executiva" subtitle="Resumo para a equipa de arbitragem" />
        <div className="grid grid-cols-3 gap-4">
          <Block title="Resumo" className="col-span-2">
            <p>{currentSeasonHasMatches
              ? `${home.name} (${hRow.position}.º, ${hRow.points} pts) recebe ${away.name} (${aRow.position}.º, ${aRow.points} pts) na jornada ${match.round}. Registo ofensivo por jogo: ${fmt(hRow.avgFor, 2)} contra ${fmt(aRow.avgFor, 2)}. Registo defensivo por jogo: ${fmt(hRow.avgAgainst, 2)} contra ${fmt(aRow.avgAgainst, 2)}.`
              : `${home.name} recebe ${away.name} na jornada ${match.round}. Ainda não existem jogos realizados em 2026/27; a leitura disponível assenta nos plantéis publicados e no contexto histórico separado.`}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="deck-h3">Ameaças nos dados</p>
                <div className="mt-2">
                  <Bullets items={keys.filter((k) => k.kind === "dados").slice(0, 3).map((k) => k.title)} />
                </div>
              </div>
              <div>
                <p className="deck-h3">Sinais de alerta</p>
                <div className="mt-2">
                  <Bullets
                    items={
                      keys.filter((k) => k.kind === "alerta").length
                        ? keys.filter((k) => k.kind === "alerta").map((k) => k.title)
                        : ["Sem alertas com fonte confirmada."]
                    }
                  />
                </div>
              </div>
            </div>
          </Block>
          <Block title="Forma recente">
            {[home, away].map((t) => (
              <div key={t.id} className="mb-3">
                <p className="text-[12px] font-semibold">{t.shortName}</p>
                <div className="mt-1">
                  <FormRow results={teamForm(ds, seasonId, t.id, 5).map((f) => f.result)} />
                </div>
              </div>
            ))}
            <div className="deck-rule my-3" />
            <p className="deck-muted text-[11px]">Fonte dos dados: {formatSource(ds.source)}</p>
          </Block>
        </div>
        <Banner
          label="Cenário previsto"
          text={
            estimate
              ? `${home.shortName} ${estimate.home}% · Empate ${estimate.draw}% · ${away.shortName} ${estimate.away}%. Estimativa indicativa baseada nos jogos já realizados.`
              : `${NA} — jogos insuficientes para estimativa de cenário.`
          }
        />
      </DeckPage>
    </div>
  );
}

function ContextPage({ ds, teams, total }: { ds: Dataset; teams: Team[]; total: number }) {
  return (
    <DeckPage index={3} total={total} section="Contexto pré-competitivo">
      <PageTitle title="Base para os primeiros jogos" subtitle="2026/27 em primeiro plano · época anterior apenas como contexto histórico" />
      <div className="grid grid-cols-2 gap-4">
        {teams.map((team) => {
          const history = ds.teamHistory.find((item) => item.teamId === team.id);
          const preparation = ds.preparationMatches.filter((item) => item.teamId === team.id);
          return (
            <div key={team.id} className="space-y-3">
              <Block title={`${team.shortName} · contexto histórico 2025/26`}>
                {history ? (
                  <>
                    <p>{history.competition}</p>
                    <p className="deck-gold mt-2 text-[18px] font-bold tabular-nums">
                      {history.position ? `${history.position}.º lugar` : NA}
                    </p>
                    <p className="mt-1 tabular-nums">
                      {history.played !== null ? `${history.played} J · ${history.wins}-${history.draws}-${history.losses} · ${history.goalsFor}-${history.goalsAgainst} golos · ${history.points} pts` : NA}
                    </p>
                    {history.note && <p className="deck-muted mt-2">{history.note}</p>}
                    <p className="deck-muted mt-3 text-[10px]">Fonte: {formatSource(history.source)}</p>
                  </>
                ) : <p className="deck-muted">{NA}</p>}
              </Block>
              <Block title="Jogos de preparação 2026/27">
                {preparation.length ? preparation.map((game) => (
                  <div key={game.id}>
                    <p className="tabular-nums">{new Date(`${game.date}T12:00:00`).toLocaleDateString("pt-PT")} · {team.shortName} {game.goalsFor}–{game.goalsAgainst} {game.opponent}</p>
                    {game.note && <p className="deck-muted mt-1">{game.note}</p>}
                    <p className="deck-muted mt-2 text-[10px]">Fonte: {formatSource(game.source)}</p>
                  </div>
                )) : <p className="deck-muted">{NA} (sem jogos confirmados)</p>}
              </Block>
            </div>
          );
        })}
      </div>
      <Banner label="Separação de épocas" text="Os números de 2025/26 são contexto histórico e não entram na classificação, forma ou estimativas de 2026/27." />
    </DeckPage>
  );
}

function TeamProfilePage({
  ds,
  seasonId,
  team,
  index,
  total,
}: {
  ds: Dataset;
  seasonId: string;
  team: Team;
  index: number;
  total: number;
}) {
  const st = computeTeamStats(ds, seasonId, team.id);
  const form = teamForm(ds, seasonId, team.id, 5);
  return (
    <DeckPage index={index} total={total} section={`Perfil — ${team.shortName}`}>
      <div className="mb-5 flex items-center gap-4">
        <Crest short={team.shortName} size={62} />
        <div>
          <h2 className="deck-h2">{team.shortName}</h2>
          <p className="deck-sub">{team.name}</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          ["Fundação", team.founded ? String(team.founded) : NA],
          ["Localidade", team.locality ?? NA],
          ["Campo", team.stadium ?? NA],
          ["Treinador", team.coach ?? NA],
        ].map(([l, v]) => (
          <div key={l} className="deck-card" style={{ padding: "10px 12px" }}>
            <p className="deck-kicker">{l}</p>
            <p className="mt-1 text-[13px] font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-6 gap-3">
        <Stat label="Jogos 26/27" value={st.played || NA} />
        <Stat label="V–E–D 26/27" value={st.played ? `${st.wins}–${st.draws}–${st.losses}` : NA} />
        <Stat label="Marcados 26/27" value={st.played ? st.goalsFor : NA} />
        <Stat label="Sofridos 26/27" value={st.played ? st.goalsAgainst : NA} />
        <Stat label="Média marc." value={fmt(st.avgFor, 2)} />
        <Stat label="Média sofr." value={fmt(st.avgAgainst, 2)} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Block title="Pontos fortes">
          <Bullets items={team.strengths} />
        </Block>
        <Block title="Pontos a explorar">
          <Bullets items={team.weaknesses} />
        </Block>
        <Block title="Leitura competitiva">
          <p>{team.styleNotes ?? NA}</p>
          <div className="deck-rule my-3" />
          <p className="deck-kicker">Forma (5 jogos)</p>
          <div className="mt-1.5">
            <FormRow results={form.map((f) => f.result)} />
          </div>
          <p className="deck-muted mt-3 text-[11px]">Fonte: {formatSource(team.source)}</p>
        </Block>
      </div>
    </DeckPage>
  );
}

function SquadPage({ ds, team, index, total }: { ds: Dataset; team: Team; index: number; total: number }) {
  const players = squad(ds, team.id);
  const byPos = (pos: Position) => players.filter((p) => p.position === pos);
  const depth = depthByPosition(players);
  const buckets = ageBuckets(players);
  const out = players.filter((p) => p.availability !== "disponivel" && p.availabilitySource);
  return (
    <DeckPage index={index} total={total} section={`Plantel — ${team.shortName}`}>
      <PageTitle title={`Plantel ${team.shortName}`} subtitle={`${players.length} jogadores registados · distribuição por posição`} />
      <div className="grid grid-cols-4 gap-3">
        {(["GR", "DEF", "MED", "AVA"] as Position[]).map((pos) => (
          <div key={pos} className="deck-card" style={{ padding: "12px" }}>
            <p className="deck-h3">
              {POSITION_LABEL[pos]} · {depth[pos]}
            </p>
            <ul className="mt-2 space-y-1 text-[12px]">
              {byPos(pos).slice(0, 9).map((p: Player) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="truncate">{p.name}</span>
                  <span className="deck-muted tabular-nums">{p.age ?? "n/d"}</span>
                </li>
              ))}
              {!byPos(pos).length && <li className="deck-muted">{NA}</li>}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Block title="Perfil etário">
          {buckets.map((b) => (
            <div key={b.label} className="mb-2">
              <div className="flex justify-between text-[12px]">
                <span>{b.label}</span>
                <span className="tabular-nums">{b.count}</span>
              </div>
              <div className="deck-track mt-1">
                <div className="deck-fill-b" style={{ width: `${Math.min(100, b.count * 10)}%` }} />
              </div>
            </div>
          ))}
        </Block>
        <Block title="Utilização e disciplina">
          <Bullets
            items={[
              players.some((p) => p.minutes !== null) ? `Minutos totais registados: ${players.reduce((a, p) => a + (p.minutes ?? 0), 0)}` : `Minutos: ${NA}`,
              players.some((p) => p.goals !== null) ? `Golos do plantel: ${players.reduce((a, p) => a + (p.goals ?? 0), 0)}` : `Golos: ${NA}`,
              players.some((p) => p.yellows !== null || p.reds !== null) ? `Amarelos: ${players.reduce((a, p) => a + (p.yellows ?? 0), 0)} · Vermelhos: ${players.reduce((a, p) => a + (p.reds ?? 0), 0)}` : `Disciplina: ${NA}`,
            ]}
          />
        </Block>
        <Block title="Ausências com fonte confirmada">
          {out.length ? (
            <Bullets items={out.map((p) => `${p.name} — ${p.availability}${p.availabilityNote ? ` (${p.availabilityNote})` : ""}`)} />
          ) : (
            <p className="deck-muted">Nenhuma ausência com fonte confirmada.</p>
          )}
        </Block>
      </div>
    </DeckPage>
  );
}

function XIPage({
  ds,
  seasonId,
  team,
  override,
  index,
  total,
}: {
  ds: Dataset;
  seasonId: string;
  team: Team;
  override?: string[] | undefined;
  index: number;
  total: number;
}) {
  const xi = likelyXI(ds, seasonId, team, override);
  return (
    <DeckPage index={index} total={total} section={`Onze provável — ${team.shortName}`}>
      <PageTitle title={`Onze provável · ${xi.formation}`} subtitle={`${team.name} — estrutura posicional prevista`} />
      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        <div className="deck-pitch" style={{ padding: 14, minHeight: 420 }}>
          <div className="flex h-full flex-col justify-between gap-3">
            {xi.rows.map((row, i) => (
              <div key={`${row.position}-${i}`} className="flex flex-wrap items-center justify-center gap-2">
                {row.players.map((p) => (
                  <div
                    key={p.player.id}
                    style={{ width: 108, background: "#14284a", border: "1px solid #23604f", borderRadius: 4, padding: "6px 4px" }}
                    className="text-center"
                  >
                    <p className="deck-gold text-[12px] font-bold tabular-nums">{p.player.shirt ?? "-"}</p>
                    <p className="truncate text-[11px] font-semibold">{p.player.name}</p>
                    <p className="deck-muted text-[10px] tabular-nums">{Math.round(p.probability * 100)}%</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Block title="Confiança da previsão">
            <p className="deck-stat" style={{ textTransform: "capitalize" }}>
              {xi.confidence}
            </p>
            <p className="deck-muted mt-1 text-[11px]">{xi.confidenceReason}</p>
          </Block>
          <Block title="Banco provável">
            {xi.bench.length ? (
              <ul className="space-y-1 text-[12px]">
                {xi.bench.slice(0, 8).map((b) => (
                  <li key={b.player.id} className="flex justify-between gap-2">
                    <span className="truncate">{b.player.name}</span>
                    <span className="deck-muted tabular-nums">{Math.round(b.probability * 100)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="deck-muted">{NA}</p>
            )}
          </Block>
          <Block title="Alternativas estruturais">
            <Bullets items={team.altFormations} />
          </Block>
        </div>
      </div>
    </DeckPage>
  );
}
