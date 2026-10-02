import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, FileDown, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Crest,
  DemoTag,
  FormBadges,
  Kicker,
  OriginTag,
  SectionTitle,
  SourceNote,
  StatTile,
  Unavailable,
} from "@/components/scouting/atoms";
import { PitchXI } from "@/components/scouting/pitch-xi";
import { CompareBars } from "@/components/scouting/compare-bars";
import { RefereePanel } from "@/components/scouting/referee-panel";
import { getDataset } from "@/lib/scouting/sources";
import { useScoutingStore } from "@/lib/scouting/store";
import { useAuth } from "@/hooks/use-auth";
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
import { POSITION_LABEL, type AnalystNotes, type Player, type Position, type Team } from "@/lib/scouting/types";

export const Route = createFileRoute("/relatorio/$matchId")({
  head: () => ({
    meta: [
      { title: "Relatório de scouting pré-jogo | AF Setúbal 1.ª Divisão" },
      {
        name: "description",
        content:
          "Relatório técnico pré-jogo: enquadramento competitivo, perfis das equipas, plantéis, onzes prováveis, comparação, análise tática e chaves do jogo.",
      },
      { property: "og:title", content: "Relatório de scouting pré-jogo — AF Setúbal 1.ª Divisão" },
      {
        property: "og:description",
        content: "Relatório técnico pré-jogo com dados da época em curso e fonte identificada em cada secção.",
      },
    ],
  }),
  component: ReportPage,
});

const STATUS_LABEL = { proximo: "Próximo", "em-curso": "Em curso", realizado: "Realizado" } as const;

function ReportPage() {
  const { matchId } = Route.useParams();
  const ds = getDataset();
  const match = ds.matches.find((m) => m.id === matchId);
  if (!match) throw notFound();

  const home = ds.teams.find((t) => t.id === match.homeTeamId)!;
  const away = ds.teams.find((t) => t.id === match.awayTeamId)!;
  const seasonId = match.seasonId;
  const season = ds.seasons.find((s) => s.id === seasonId)!;
  const competition = ds.competitions.find((c) => c.id === season.competitionId)!;
  const store = useScoutingStore();

  const standings = useMemo(() => computeStandings(ds, seasonId), [ds, seasonId]);
  const hRow = standings.find((r) => r.team.id === home.id)!;
  const aRow = standings.find((r) => r.team.id === away.id)!;
  const metrics = useMemo(() => comparison(ds, seasonId, home, away), [ds, seasonId, home, away]);
  const estimate = dataEstimate(ds, seasonId, home, away);
  const keys = matchKeys(ds, seasonId, home, away);
  const h2h = headToHead(ds, home.id, away.id);
  const currentSeasonHasMatches = hRow.played > 0 || aRow.played > 0;

  const generatedAt = new Date().toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar aos jogos</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              store.saveReport(match.id, `${home.shortName} vs ${away.shortName} — J${match.round}`);
              toast.success("Relatório guardado com nova versão.");
            }}
          >
            <Save className="mr-1 h-4 w-4" /> Guardar versão
          </Button>
          <Button asChild size="sm">
            <Link to="/apresentacao/$matchId" params={{ matchId: match.id }}>
              <FileDown className="mr-1 h-4 w-4" /> Criar PDF (A4 horizontal)
            </Link>
          </Button>

        </div>
      </div>

      {/* A. Capa */}
      <section className="panel print-block mb-6 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Kicker>{competition.association} · {competition.name} · {season.label} · Jornada {match.round}</Kicker>
          <div className="flex items-center gap-2">
            {ds.isDemo && <DemoTag />}
            <span className="rounded bg-surface px-2 py-0.5 text-xs font-semibold text-surface-foreground">
              {STATUS_LABEL[match.status]}
            </span>
          </div>
        </div>
        <div className="mt-5 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-3">
            <Crest team={home} size={56} />
            <div>
              <Kicker>Casa</Kicker>
              <h1 className="font-display text-xl font-bold leading-tight md:text-2xl">{home.name}</h1>
              <p className="text-xs text-muted-foreground">{hRow.played ? `${hRow.position}.º · ${hRow.points} pts` : "2026/27 · classificação indisponível"}</p>
            </div>
          </div>
          <div className="text-center font-display text-2xl font-bold text-muted-foreground">
            {match.status === "proximo" ? "vs" : `${match.homeGoals ?? "-"}–${match.awayGoals ?? "-"}`}
          </div>
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <Kicker>Visitante</Kicker>
              <h2 className="font-display text-xl font-bold leading-tight md:text-2xl">{away.name}</h2>
              <p className="text-xs text-muted-foreground">{aRow.played ? `${aRow.position}.º · ${aRow.points} pts` : "2026/27 · classificação indisponível"}</p>
            </div>
            <Crest team={away} size={56} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <Info label="Data e hora" value={match.kickoff ? new Date(match.kickoff).toLocaleString("pt-PT", { dateStyle: "full", timeStyle: "short" }) : null} />
          <Info label="Estádio / campo" value={match.venue} />
          <Info label="Relatório atualizado a" value={generatedAt} />
        </div>
        <div className="mt-4 border-t border-border pt-3">
          <SourceNote source={match.source} />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Emblemas apresentados apenas quando existir licença, URL pública autorizada ou upload manual.
          </p>
        </div>
      </section>

      <Tabs defaultValue="visao" className="w-full">
        <TabsList className="no-print mb-5 flex h-auto w-full flex-wrap justify-start gap-1 bg-surface p-1">
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="arbitragem" className="font-semibold">Arbitragem · Último confronto</TabsTrigger>
          <TabsTrigger value="equipas">Equipas</TabsTrigger>
          <TabsTrigger value="planteis">Plantéis</TabsTrigger>
          <TabsTrigger value="onzes">Onzes prováveis</TabsTrigger>
          <TabsTrigger value="comparacao">Comparação</TabsTrigger>
          <TabsTrigger value="tatica">Análise tática</TabsTrigger>
          <TabsTrigger value="chaves">Chaves do jogo</TabsTrigger>
          <TabsTrigger value="exportar">Exportar</TabsTrigger>
        </TabsList>

        {/* B. Enquadramento competitivo */}
        <TabsContent value="visao" className="print-show-all space-y-8">
          <section>
            <SectionTitle letter="B" title="Enquadramento competitivo" subtitle="Posição, contexto da jornada e fatores de equilíbrio." />
            <div className="grid gap-4 lg:grid-cols-2">
              {[home, away].map((team) => {
                const st = computeTeamStats(ds, seasonId, team.id);
                const row = standings.find((r) => r.team.id === team.id)!;
                return (
                  <div key={team.id} className="panel print-block p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Crest team={team} size={28} />
                      <h3 className="font-semibold">{team.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <StatTile label="Posição 2026/27" value={st.played ? `${row.position}.º` : "n/d"} />
                      <StatTile label="Pontos 2026/27" value={st.played ? st.points : "n/d"} />
                      <StatTile label="Jogos 2026/27" value={st.played ? st.played : "n/d"} />
                      <StatTile label="V–E–D 2026/27" value={st.played ? `${st.wins}–${st.draws}–${st.losses}` : "n/d"} />
                    </div>
                    <div className="mt-3">
                      <Kicker>Profundidade do plantel disponível</Kicker>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {Object.entries(depthByPosition(squad(ds, team.id))).map(([pos, n]) => (
                          <span key={pos} className="rounded bg-surface px-2 py-1 tabular-nums">
                            {POSITION_LABEL[pos as Position]}: {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="panel mt-4 p-4">
              <Kicker>Contexto da jornada</Kicker>
              <p className="mt-1 text-sm leading-relaxed">
                {currentSeasonHasMatches
                  ? `Jornada ${match.round} de ${season.rounds}. ${home.shortName} ocupa o ${hRow.position}.º lugar com ${hRow.points} pontos; ${away.shortName} ocupa o ${aRow.position}.º lugar com ${aRow.points} pontos. Diferença atual: ${Math.abs(hRow.points - aRow.points)} ponto(s).`
                  : `Jornada ${match.round} de ${season.rounds}. A classificação de 2026/27 ainda não está disponível porque não existem jogos realizados.`}
              </p>
              <div className="mt-3">
                <Kicker>Histórico de confrontos diretos</Kicker>
                {h2h.length ? (
                  <ul className="mt-1 space-y-1 text-sm">
                    {h2h.slice(0, 5).map((m) => (
                      <li key={m.id} className="tabular-nums">
                        Jornada {m.round}: {ds.teams.find((t) => t.id === m.homeTeamId)!.shortName} {m.homeGoals}–{m.awayGoals}{" "}
                        {ds.teams.find((t) => t.id === m.awayTeamId)!.shortName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-1"><Unavailable hint="sem confrontos registados nesta época" /></div>
                )}
              </div>
            </div>

            <HistoricalContext teams={[home, away]} />

            <PreparationContext teams={[home, away]} />

            <div className="panel mt-4 p-4">
              <Kicker>Fatores de equilíbrio</Kicker>
              <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
                {[home, away].map((team) => {
                  const st = computeTeamStats(ds, seasonId, team.id);
                  const form = teamForm(ds, seasonId, team.id, 5);
                  const sq = squad(ds, team.id);
                  const out = sq.filter((p) => p.availability !== "disponivel" && p.availabilitySource);
                  return (
                    <div key={team.id} className="space-y-1">
                      <p className="font-semibold">{team.shortName}</p>
                      <p>Casa 2026/27: {st.home.played ? `${st.home.points} pts / ${st.home.played} j.` : "Dados não disponíveis"} · Fora: {st.away.played ? `${st.away.points} pts / ${st.away.played} j.` : "Dados não disponíveis"}</p>
                      <p>Momento de forma (5 jogos): {form.map((f) => f.result).join(" ") || "Dados não disponíveis"}</p>
                      <p>Disciplina: {sq.some((p) => p.yellows !== null || p.reds !== null) ? `${sq.reduce((a, p) => a + (p.yellows ?? 0), 0)} amarelos · ${sq.reduce((a, p) => a + (p.reds ?? 0), 0)} vermelhos` : "Dados não disponíveis"}</p>
                      <p>Ausências confirmadas: {out.length ? out.map((p) => p.name).join(", ") : "Nenhuma com fonte confirmada"}</p>
                      <p className="text-muted-foreground">Bolas paradas: <Unavailable hint="evento por jogo não recolhido" /></p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* J. Conclusão executiva */}
          <section className="print-page-break">
            <SectionTitle letter="J" title="Conclusão executiva" subtitle="Resumo para a equipa de arbitragem." />
            <div className="panel print-block space-y-4 p-5">
              <p className="text-sm leading-relaxed">
                {currentSeasonHasMatches
                  ? `${home.name} (${hRow.position}.º, ${hRow.points} pts) recebe ${away.name} (${aRow.position}.º, ${aRow.points} pts) na jornada ${match.round}. Registo ofensivo por jogo: ${fmt(hRow.avgFor, 2)} contra ${fmt(aRow.avgFor, 2)}. Registo defensivo por jogo: ${fmt(hRow.avgAgainst, 2)} contra ${fmt(aRow.avgAgainst, 2)}.`
                  : `${home.name} recebe ${away.name} na jornada ${match.round}. Ainda não existem jogos realizados em 2026/27; a leitura disponível assenta nos plantéis publicados e no contexto histórico, apresentado separadamente.`}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Kicker>Ameaças identificadas nos dados</Kicker>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {keys.filter((k) => k.kind === "dados").slice(0, 3).map((k) => <li key={k.title}>{k.title}</li>)}
                  </ul>
                </div>
                <div>
                  <Kicker>Sinais de alerta</Kicker>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {keys.filter((k) => k.kind === "alerta").length ? (
                      keys.filter((k) => k.kind === "alerta").map((k) => <li key={k.title}>{k.title}</li>)
                    ) : (
                      <li>Sem alertas com fonte confirmada.</li>
                    )}
                  </ul>
                </div>
              </div>
              {estimate ? (
                <div>
                  <Kicker>Cenário esperado (estimativa baseada em dados)</Kicker>
                  <p className="mt-1 text-sm">
                    {home.shortName} {estimate.home}% · Empate {estimate.draw}% · {away.shortName} {estimate.away}%.
                    Fatores considerados: {estimate.factors.join(", ")}. Não é uma previsão garantida.
                  </p>
                </div>
              ) : (
                <Unavailable hint="jogos insuficientes para estimativa" />
              )}
              <SourceNote source={ds.source} />
            </div>
          </section>
        </TabsContent>

        {/* C. Perfil de cada equipa */}
        <TabsContent value="equipas" className="print-show-all print-page-break">
          <SectionTitle letter="C" title="Perfil de cada equipa" subtitle="Identidade, sistema, métricas da época e forma recente." />
          <div className="grid gap-4 lg:grid-cols-2">
            {[home, away].map((team) => (
              <TeamProfile key={team.id} team={team} seasonId={seasonId} matchId={match.id} store={store} />
            ))}
          </div>
        </TabsContent>

        {/* D + E */}
        <TabsContent value="planteis" className="print-show-all print-page-break space-y-8">
          <section>
            <SectionTitle letter="D" title="Plantéis" subtitle="Organização por posição, utilização e disciplina." />
            <div className="space-y-6">
              {[home, away].map((team) => <SquadBlock key={team.id} team={team} />)}
            </div>
          </section>
          <section>
            <SectionTitle letter="E" title="Jogadores-chave" subtitle="Seleção automática por minutos, participações em golos, cartões e utilização." />
            <div className="grid gap-4 lg:grid-cols-2">
              {[home, away].map((team) => <KeyPlayersBlock key={team.id} team={team} />)}
            </div>
          </section>
        </TabsContent>

        {/* F */}
        <TabsContent value="onzes" className="print-show-all print-page-break">
          <SectionTitle letter="F" title="Onzes prováveis" subtitle="Probabilidade calculada a partir de titularidades, minutos, posição e disponibilidade." />
          <div className="grid gap-4 lg:grid-cols-2">
            {[home, away].map((team) => (
              <XIBlock key={team.id} team={team} seasonId={seasonId} matchId={match.id} store={store} />
            ))}
          </div>
        </TabsContent>

        {/* G */}
        <TabsContent value="comparacao" className="print-show-all print-page-break">
          <SectionTitle letter="G" title="Comparação das equipas" subtitle="Barras acompanhadas sempre pelos valores reais." />
          <div className="panel p-5">
            <CompareBars metrics={metrics} home={home} away={away} />
          </div>
          <div className="panel mt-4 p-4">
            <Kicker>Estimativa baseada em dados</Kicker>
            {estimate ? (
              <p className="mt-1 text-sm">
                {home.shortName} {estimate.home}% · Empate {estimate.draw}% · {away.shortName} {estimate.away}%.
                Fatores: {estimate.factors.join(", ")}. Estimativa indicativa, não é um favoritismo confirmado.
              </p>
            ) : (
              <div className="mt-1"><Unavailable hint="jogos insuficientes" /></div>
            )}
          </div>
        </TabsContent>

        {/* H */}
        <TabsContent value="tatica" className="print-show-all print-page-break space-y-6">
          <SectionTitle letter="H" title="Análise tática" subtitle="Distinção explícita entre dados automáticos e observação do analista." />
          <div className="grid gap-4 lg:grid-cols-2">
            {[home, away].map((team) => {
              const st = computeTeamStats(ds, seasonId, team.id);
              const form10 = teamForm(ds, seasonId, team.id, 10);
              const streaks = lastFormStreaks(teamForm(ds, seasonId, team.id, 10));
              return (
                <div key={team.id} className="panel print-block space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{team.shortName}</h3>
                    <OriginTag kind="dados" />
                  </div>
                  <p className="text-sm">Sistema mais utilizado: {team.mainFormation ?? "Dados não disponíveis"}. Alternativas: {team.altFormations.join(", ") || "Dados não disponíveis"}.</p>
                  <ul className="space-y-1 text-sm">
                    <li>Rendimento casa/fora: {st.home.points} pts em casa · {st.away.points} pts fora.</li>
                    <li>Tendência de resultados (10 jogos): {form10.map((f) => f.result).join(" ") || "Dados não disponíveis"}.</li>
                    <li>Sequência sem marcar: {streaks.noScore} jogo(s). Sequência a sofrer: {streaks.conceding} jogo(s).</li>
                    <li>Golos por período: <Unavailable hint="minuto do golo não recolhido" /></li>
                  </ul>
                  <div className="border-t border-border pt-3">
                    <OriginTag kind="analista" />
                    <div className="mt-2 grid gap-2">
                      {([
                        ["pressao", "Pressão"],
                        ["construcao", "Construção"],
                        ["transicao", "Transição"],
                        ["organizacaoDefensiva", "Organização defensiva"],
                        ["bolasParadas", "Bolas paradas"],
                        ["zonas", "Zonas fortes / fracas"],
                      ] as Array<[keyof AnalystNotes, string]>).map(([field, label]) => (
                        <label key={field} className="block">
                          <Kicker className="mb-1 block">{label}</Kicker>
                          <Textarea
                            rows={2}
                            placeholder="Notas de observação do analista"
                            value={store.notes[match.id]?.[team.id]?.[field] ?? ""}
                            onChange={(e) => store.setNote(match.id, team.id, field, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="arbitragem" className="print-show-all print-page-break">
          <RefereePanel home={home} away={away} />
        </TabsContent>

        {/* I */}
        <TabsContent value="chaves" className="print-show-all print-page-break">
          <SectionTitle letter="I" title="Chaves do jogo" subtitle="Geradas a partir dos dados disponíveis. Recomendações são análise sugerida." />
          <div className="grid gap-3 md:grid-cols-2">
            {keys.map((k) => (
              <div
                key={k.title}
                className={`panel print-block p-4 ${k.kind === "alerta" ? "border-l-4 border-l-destructive" : "border-l-4 border-l-accent"}`}
              >
                <Kicker>{k.kind === "alerta" ? "Sinal de alerta" : "Chave"}</Kicker>
                <h3 className="mt-1 font-semibold">{k.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{k.detail}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exportar" className="space-y-4">
          <SectionTitle title="Exportar e guardar" subtitle="Apresentação em A4 horizontal, exportada diretamente para PDF." />
          <div className="panel space-y-3 p-5">
            <p className="text-sm">
              A opção “Criar PDF” gera um documento A4 horizontal, página a página, com todas as secções do relatório —
              capa, enquadramento, perfis, plantéis, jogadores-chave, onzes prováveis, comparação, análise tática, chaves
              do jogo e conclusão. As notas do analista e os onzes editados são incluídos.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/apresentacao/$matchId" params={{ matchId: match.id }}>
                  <FileDown className="mr-1 h-4 w-4" /> Criar PDF
                </Link>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  store.saveReport(match.id, `${home.shortName} vs ${away.shortName} — J${match.round}`);
                  toast.success("Nova versão do relatório guardada.");
                }}
              >
                <Save className="mr-1 h-4 w-4" /> Guardar versão
              </Button>
            </div>
            <div>
              <Kicker>Versões guardadas deste jogo</Kicker>
              <ul className="mt-1 space-y-1 text-sm">
                {store.reports.filter((r) => r.matchId === match.id).length ? (
                  store.reports
                    .filter((r) => r.matchId === match.id)
                    .map((r) => (
                      <li key={r.id} className="tabular-nums">
                        v{r.version} — {new Date(r.createdAt).toLocaleString("pt-PT")}
                      </li>
                    ))
                ) : (
                  <li className="text-muted-foreground">Ainda sem versões guardadas.</li>
                )}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <Kicker>{label}</Kicker>
      {value ? <p className="mt-0.5">{value}</p> : <div className="mt-0.5"><Unavailable /></div>}
    </div>
  );
}

function HistoricalContext({ teams }: { teams: Team[] }) {
  const ds = getDataset();
  return (
    <section className="mt-4 border-t-4 border-t-accent bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Kicker>Contexto histórico — não entra nos cálculos de 2026/27</Kicker>
          <h3 className="mt-1 font-display text-lg font-semibold">Época 2025/26</h3>
        </div>
        <span className="rounded border border-border px-2 py-1 text-xs font-semibold">Época anterior</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {teams.map((team) => {
          const row = ds.teamHistory.find((item) => item.teamId === team.id);
          return (
            <div key={team.id} className="border-l-2 border-l-accent pl-3">
              <p className="font-semibold">{team.shortName}</p>
              {row ? (
                <>
                  <p className="mt-1 text-sm">{row.competition}</p>
                  <p className="mt-1 text-sm tabular-nums">
                    {row.position ? `${row.position}.º lugar` : "Posição não disponível"}
                    {row.played !== null ? ` · ${row.played} J · ${row.wins}-${row.draws}-${row.losses} · ${row.goalsFor}-${row.goalsAgainst} golos · ${row.points} pts` : ""}
                  </p>
                  {row.note && <p className="mt-1 text-xs text-muted-foreground">{row.note}</p>}
                  <SourceNote source={row.source} className="mt-2" />
                </>
              ) : <Unavailable hint="contexto histórico não confirmado" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PreparationContext({ teams }: { teams: Team[] }) {
  const ds = getDataset();
  return (
    <section className="panel mt-4 p-4">
      <Kicker>Preparação — época 2026/27</Kicker>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {teams.map((team) => {
          const games = ds.preparationMatches.filter((item) => item.teamId === team.id);
          return (
            <div key={team.id}>
              <p className="font-semibold">{team.shortName}</p>
              {games.length ? games.map((game) => (
                <div key={game.id} className="mt-1 text-sm">
                  <p className="tabular-nums">{new Date(`${game.date}T12:00:00`).toLocaleDateString("pt-PT")} · {team.shortName} {game.goalsFor}–{game.goalsAgainst} {game.opponent}</p>
                  {game.note && <p className="text-xs text-muted-foreground">{game.note}</p>}
                  <SourceNote source={game.source} className="mt-1" />
                </div>
              )) : <div className="mt-1"><Unavailable hint="sem jogos de preparação confirmados" /></div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TeamProfile({
  team,
  seasonId,
  matchId,
  store,
}: {
  team: Team;
  seasonId: string;
  matchId: string;
  store: ReturnType<typeof useScoutingStore>;
}) {
  const ds = getDataset();
  const st = computeTeamStats(ds, seasonId, team.id);
  const form5 = teamForm(ds, seasonId, team.id, 5);
  const form10 = teamForm(ds, seasonId, team.id, 10);
  return (
    <div className="panel print-block space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Crest team={team} size={40} />
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight">{team.name}</h3>
          <p className="text-xs text-muted-foreground">
            {team.locality ?? "Localidade não disponível"} · Fundação: {team.founded ?? "n/d"} · {team.stadium ?? "Estádio não disponível"}
          </p>
          <p className="text-xs text-muted-foreground">Treinador: {team.coach ?? "Dados não disponíveis"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Jogos 2026/27" value={st.played || "n/d"} />
        <StatTile label="V–E–D 2026/27" value={st.played ? `${st.wins}–${st.draws}–${st.losses}` : "n/d"} />
        <StatTile label="Golos M/S 2026/27" value={st.played ? `${st.goalsFor}/${st.goalsAgainst}` : "n/d"} />
        <StatTile label="Saldo 2026/27" value={st.played ? (st.diff > 0 ? `+${st.diff}` : st.diff) : "n/d"} tone={st.played && st.diff < 0 ? "warning" : "accent"} />
      </div>
      <p className="text-sm">
        Média de golos em 2026/27: {fmt(st.avgFor, 2)} marcados · {fmt(st.avgAgainst, 2)} sofridos por jogo.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Kicker>Forma — últimos 5</Kicker>
          <div className="mt-1"><FormBadges entries={form5} /></div>
        </div>
        <div>
          <Kicker>Forma — últimos 10</Kicker>
          <div className="mt-1"><FormBadges entries={form10} /></div>
        </div>
        <div>
          <Kicker>Últimos 5 em casa</Kicker>
          <div className="mt-1"><FormBadges entries={teamForm(ds, seasonId, team.id, 5, "casa")} /></div>
        </div>
        <div>
          <Kicker>Últimos 5 fora</Kicker>
          <div className="mt-1"><FormBadges entries={teamForm(ds, seasonId, team.id, 5, "fora")} /></div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Kicker>Pontos fortes</Kicker>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {team.strengths.length ? team.strengths.map((s) => <li key={s}>{s}</li>) : <li>Dados não disponíveis</li>}
          </ul>
        </div>
        <div>
          <Kicker>Pontos fracos</Kicker>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {team.weaknesses.length ? team.weaknesses.map((s) => <li key={s}>{s}</li>) : <li>Dados não disponíveis</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <OriginTag kind="dados" />
          <span className="text-xs text-muted-foreground">
            Sistema mais utilizado: {team.mainFormation ?? "Dados não disponíveis"}
          </span>
        </div>
        <p className="mt-2 text-sm">
          Resumo automático: {st.played
            ? `${team.shortName} soma ${st.points} pontos em ${st.played} jogos, com ${fmt(st.avgFor, 2)} golos marcados e ${fmt(st.avgAgainst, 2)} sofridos por jogo. Rendimento em casa: ${st.home.points} pts; fora: ${st.away.points} pts.`
            : "Dados não disponíveis (sem jogos realizados)."}
        </p>
        <div className="mt-3">
          <OriginTag kind="analista" />
          <Textarea
            className="mt-1"
            rows={3}
            placeholder="Estilo de jogo observado, contexto do plantel, notas do analista"
            value={store.notes[matchId]?.[team.id]?.geral ?? ""}
            onChange={(e) => store.setNote(matchId, team.id, "geral", e.target.value)}
          />
        </div>
      </div>
      <SourceNote source={team.source} />
    </div>
  );
}

function SquadBlock({ team }: { team: Team }) {
  const ds = getDataset();
  const players = squad(ds, team.id);
  const groups: Position[] = ["GR", "DEF", "MED", "AVA"];
  const unavailable = players.filter((p) => p.availability !== "disponivel" && p.availabilitySource);
  const topMinutes = [...players].sort((a, b) => (b.minutes ?? 0) - (a.minutes ?? 0))[0];
  const topAttack = [...players].sort((a, b) => ((b.goals ?? 0) + (b.assists ?? 0)) - ((a.goals ?? 0) + (a.assists ?? 0)))[0];
  const topRisk = [...players].sort((a, b) => ((b.yellows ?? 0) + (b.reds ?? 0) * 2) - ((a.yellows ?? 0) + (a.reds ?? 0) * 2))[0];

  return (
    <div className="panel print-block overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Crest team={team} size={28} />
          <h3 className="font-semibold">{team.name}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{players.length} jogadores registados</p>
      </div>
      <div className="grid gap-2 px-4 py-3 sm:grid-cols-3">
        <StatTile label="Mais minutos" value={topMinutes?.name ?? "n/d"} hint={`${fmt(topMinutes?.minutes)} min`} />
        <StatTile label="Maior contribuição ofensiva" value={topAttack?.name ?? "n/d"} hint={`${(topAttack?.goals ?? 0) + (topAttack?.assists ?? 0)} G+A`} tone="accent" />
        <StatTile label="Maior risco disciplinar" value={topRisk?.name ?? "n/d"} hint={`${fmt(topRisk?.yellows)} amarelos · ${fmt(topRisk?.reds)} vermelhos`} tone="warning" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface text-left">
            <tr className="label-kicker">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Jogador</th>
              <th className="px-3 py-2">Posição</th>
              <th className="px-3 py-2 text-right">Idade</th>
              <th className="px-3 py-2">Nac.</th>
              <th className="px-3 py-2 text-right">J</th>
              <th className="px-3 py-2 text-right">Tit.</th>
              <th className="px-3 py-2 text-right">Min</th>
              <th className="px-3 py-2 text-right">G</th>
              <th className="px-3 py-2 text-right">A</th>
              <th className="px-3 py-2 text-right">Am</th>
              <th className="px-3 py-2 text-right">Ver</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <PositionGroup key={g} position={g} players={players.filter((p) => p.position === g)} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 border-t border-border px-4 py-3 sm:grid-cols-2">
        <div>
          <Kicker>Distribuição por posição (disponíveis)</Kicker>
          <p className="mt-1 text-sm">
            {Object.entries(depthByPosition(players)).map(([k, v]) => `${POSITION_LABEL[k as Position]}: ${v}`).join(" · ")}
          </p>
        </div>
        <div>
          <Kicker>Distribuição por escalão etário</Kicker>
          <p className="mt-1 text-sm">{ageBuckets(players).map((b) => `${b.label}: ${b.count}`).join(" · ")}</p>
        </div>
      </div>
      <div className="border-t border-border px-4 py-3">
        <Kicker>Indisponíveis com fonte confirmada</Kicker>
        {unavailable.length ? (
          <ul className="mt-1 space-y-1 text-sm">
            {unavailable.map((p) => (
              <li key={p.id}>
                {p.name} — {p.availability} {p.availabilityNote ? `(${p.availabilityNote})` : ""}
                {p.availabilitySource && <span className="text-muted-foreground"> · {p.availabilitySource.label}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Sem indisponibilidades com fonte confirmada.</p>
        )}
      </div>
      <div className="px-4 pb-3"><SourceNote source={team.source} /></div>
    </div>
  );
}

function PositionGroup({ position, players }: { position: Position; players: Player[] }) {
  return (
    <>
      <tr className="bg-muted/60">
        <td colSpan={12} className="px-3 py-1.5 label-kicker">{POSITION_LABEL[position]}</td>
      </tr>
      {players.map((p) => (
        <tr key={p.id} className="border-t border-border">
          <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{p.shirt ?? "-"}</td>
          <td className="px-3 py-1.5 font-medium">
            {p.name}
            {p.availability !== "disponivel" && p.availabilitySource && (
              <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                {p.availability}
              </span>
            )}
          </td>
          <td className="px-3 py-1.5 text-muted-foreground">{p.detailedPosition}</td>
          <td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.age)}</td>
          <td className="px-3 py-1.5">{p.nationality ?? "n/d"}</td>
          <td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.apps)}</td>
          <td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.starts)}</td>
          <td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.minutes)}</td>
          <td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.goals)}</td>
          <td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.assists)}</td>
          <td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.yellows)}</td>
          <td className="px-3 py-1.5 text-right tabular-nums">{fmt(p.reds)}</td>
        </tr>
      ))}
    </>
  );
}

function KeyPlayersBlock({ team }: { team: Team }) {
  const ds = getDataset();
  const players = squad(ds, team.id);
  const keys = keyPlayers(players, 5);
  return (
    <div className="panel print-block p-4">
      <div className="mb-3 flex items-center gap-2">
        <Crest team={team} size={28} />
        <h3 className="font-semibold">{team.shortName}</h3>
      </div>
      <div className="space-y-3">
        {keys.map((k) => (
          <div key={k.player.id} className="rounded border border-border p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {k.player.shirt ?? "-"} · {k.player.name}
              </p>
              <span className="text-xs text-muted-foreground">{k.player.detailedPosition}</span>
            </div>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {fmt(k.player.apps)} jogos · {fmt(k.player.starts)} titularidades · {fmt(k.player.minutes)} min ·{" "}
              {fmt(k.player.goals)} G · {fmt(k.player.assists)} A · {fmt(k.player.yellows)} Am
            </p>
            {k.reasons.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-xs">
                {k.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <Kicker>Plano de contenção (análise sugerida)</Kicker>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {keys.slice(0, 3).map((k) => (
            <li key={k.player.id}>
              {k.player.name} ({k.player.detailedPosition}): condicionar a zona de atuação e reduzir tempo de decisão.
              {k.disciplinaryRisk ? " Explorar o risco disciplinar acumulado em duelos." : ""}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Recomendações apresentadas como análise sugerida a partir dos dados disponíveis, não como factos confirmados.
        </p>
      </div>
    </div>
  );
}

function XIBlock({
  team,
  seasonId,
  matchId,
  store,
}: {
  team: Team;
  seasonId: string;
  matchId: string;
  store: ReturnType<typeof useScoutingStore>;
}) {
  const ds = getDataset();
  const override = store.lineups[matchId]?.[team.id];
  const xi = likelyXI(ds, seasonId, team, override);
  const players = squad(ds, team.id);
  const { canEdit, displayName } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const current = override ?? xi.starters.map((s) => s.player.id);

  return (
    <div className="space-y-3">
      <PitchXI team={team} xi={xi} />
      {!canEdit ? (
        <div className="no-print panel p-4">
          <Kicker>Ajuste manual do onze ({team.shortName})</Kicker>
          <p className="mt-1 text-xs text-muted-foreground">
            Edição reservada a analistas e administradores com sessão iniciada.{" "}
            <Link to="/auth" className="text-accent underline">
              Entrar
            </Link>
          </p>
        </div>
      ) : (
      <div className="no-print panel p-4">
        <Kicker>Ajuste manual do onze ({team.shortName})</Kicker>
        <p className="mt-1 text-xs text-muted-foreground">
          Selecione exatamente 11 jogadores para guardar a sua previsão. Fica registada como alteração do analista.
        </p>
        <div className="mt-2 grid max-h-56 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
          {players.map((p) => {
            const checked = (selected.length ? selected : current).includes(p.id);
            return (
              <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const base = selected.length ? selected : current;
                    setSelected(e.target.checked ? [...base, p.id] : base.filter((id) => id !== p.id));
                  }}
                />
                <span className="truncate">{p.shirt ?? "-"} {p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{p.position}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={(selected.length ? selected : current).length !== 11}
            onClick={() => {
              const ids = selected.length ? selected : current;
              store.setLineup(matchId, team.id, ids);
              store.logChange({
                entity: `Onze provável — ${team.name}`,
                field: "titulares",
                before: current.join(", "),
                after: ids.join(", "),
                author: displayName ?? "Analista",
              });
              toast.success("Onze do analista guardado.");
            }}
          >
            Guardar previsão do analista
          </Button>
          <span className="text-xs text-muted-foreground">
            Selecionados: {(selected.length ? selected : current).length}/11
          </span>
        </div>
      </div>
      )}
    </div>
  );
}
