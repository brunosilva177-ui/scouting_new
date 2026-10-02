import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crest, DemoTag, FormBadges, Kicker, SectionTitle, SourceNote, StatTile } from "@/components/scouting/atoms";
import { getDataset } from "@/lib/scouting/sources";
import {
  computeStandings,
  computeTeamStats,
  fmt,
  squad,
  teamForm,
} from "@/lib/scouting/derive";
import type { Match } from "@/lib/scouting/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scouting AF Setúbal — 1.ª Divisão | Relatórios pré-jogo" },
      {
        name: "description",
        content:
          "Gere relatórios de scouting pré-jogo para o Campeonato Distrital da AF Setúbal - 1.ª Divisão: classificação, forma, plantéis, onzes prováveis e chaves do jogo.",
      },
      { property: "og:title", content: "Scouting AF Setúbal — 1.ª Divisão" },
      {
        property: "og:description",
        content:
          "Relatórios de scouting pré-jogo com dados da época em curso, fontes identificadas e onzes prováveis.",
      },
    ],
  }),
  component: HomePage,
});

function formatKickoff(iso: string | null) {
  if (!iso) return "Dados não disponíveis";
  return new Date(iso).toLocaleString("pt-PT", { dateStyle: "full", timeStyle: "short" });
}

function statusLabel(status: Match["status"]) {
  return status === "proximo" ? "Próximo" : status === "em-curso" ? "Em curso" : "Realizado";
}

function HomePage() {
  const ds = getDataset();
  const [seasonId, setSeasonId] = useState(ds.seasons[0]!.id);
  const [round, setRound] = useState<string>("todas");
  const [teamId, setTeamId] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const season = ds.seasons.find((s) => s.id === seasonId)!;
  const competition = ds.competitions.find((c) => c.id === season.competitionId)!;
  const standings = useMemo(() => computeStandings(ds, seasonId), [ds, seasonId]);

  const matches = useMemo(
    () =>
      ds.matches
        .filter((m) => m.seasonId === seasonId)
        .filter((m) => (round === "todas" ? true : m.round === Number(round)))
        .filter((m) => (teamId === "todas" ? true : m.homeTeamId === teamId || m.awayTeamId === teamId))
        .filter((m) => (statusFilter === "todos" ? true : m.status === statusFilter))
        .sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? "")),
    [ds, seasonId, round, teamId, statusFilter],
  );

  const upcoming = matches.filter((m) => m.status !== "realizado").slice(0, 8);
  const recent = matches.filter((m) => m.status === "realizado").reverse().slice(0, 8);

  const focusTeam = teamId === "todas" ? standings[0]!.team : ds.teams.find((t) => t.id === teamId)!;
  const focusStats = computeTeamStats(ds, seasonId, focusTeam.id);
  const focusRow = standings.find((r) => r.team.id === focusTeam.id)!;
  const focusForm = teamForm(ds, seasonId, focusTeam.id, 5);
  const focusSquad = squad(ds, focusTeam.id);
  const cards = focusSquad.reduce((a, p) => a + (p.yellows ?? 0), 0);
  const reds = focusSquad.reduce((a, p) => a + (p.reds ?? 0), 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Kicker>{competition.association} · {competition.name}</Kicker>
          {ds.isDemo && <DemoTag />}
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Scouting AF Setúbal — 1.ª Divisão
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
          Relatórios de scouting pré-jogo construídos a partir dos dados já realizados na época em curso.
          Todos os valores mostram a respetiva fonte e data de atualização. Quando um dado não existe,
          é apresentado como “Dados não disponíveis”.
        </p>
        <div className="mt-3">
          <SourceNote source={ds.source} />
        </div>
      </header>

      <section className="panel mb-8 p-4 md:p-5">
        <SectionTitle title="Filtros" subtitle="Escolha a época, jornada, equipa e jogo a analisar." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Época">
            <Select value={seasonId} onValueChange={setSeasonId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ds.seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Jornada">
            <Select value={round} onValueChange={setRound}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as jornadas</SelectItem>
                {Array.from({ length: season.rounds }, (_, i) => i + 1).map((r) => (
                  <SelectItem key={r} value={String(r)}>Jornada {r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Equipa">
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as equipas</SelectItem>
                {[...ds.teams].sort((a, b) => a.name.localeCompare(b.name)).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado do jogo">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="proximo">Próximos</SelectItem>
                <SelectItem value="realizado">Realizados</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle
          title={`Indicadores rápidos — ${focusTeam.name}`}
          subtitle="Selecione uma equipa nos filtros para atualizar estes indicadores."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Classificação" value={`${focusRow.position}.º`} hint={`${focusStats.points} pontos em ${focusStats.played} jogos`} />
          <StatTile label="Golos marcados / sofridos" value={`${focusStats.goalsFor}–${focusStats.goalsAgainst}`} hint={`Média: ${fmt(focusStats.avgFor, 2)} / ${fmt(focusStats.avgAgainst, 2)} por jogo`} />
          <StatTile label="Vitórias / Empates / Derrotas" value={`${focusStats.wins}–${focusStats.draws}–${focusStats.losses}`} tone="accent" />
          <StatTile label="Disciplina" value={`${cards} A · ${reds} V`} hint="Total acumulado do plantel registado" tone={reds > 1 ? "warning" : "default"} />
        </div>
        <div className="panel mt-3 flex flex-wrap items-center gap-4 px-4 py-3">
          <Kicker>Forma (últimos 5)</Kicker>
          <FormBadges entries={focusForm} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle title="Próximos jogos" subtitle="Gere o relatório de scouting pré-jogo." />
          <div className="space-y-3">
            {upcoming.length ? (
              upcoming.map((m) => <MatchCard key={m.id} match={m} />)
            ) : (
              <p className="text-sm text-muted-foreground">Sem jogos para os filtros escolhidos.</p>
            )}
          </div>
        </section>
        <section>
          <SectionTitle title="Últimos jogos realizados" subtitle="Base estatística do relatório." />
          <div className="space-y-3">
            {recent.length ? (
              recent.map((m) => <MatchCard key={m.id} match={m} />)
            ) : (
              <p className="text-sm text-muted-foreground">Sem jogos realizados para os filtros escolhidos.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <SectionTitle title="Classificação" subtitle={`${competition.name} · ${season.label}`} />
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-left">
              <tr className="label-kicker">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Equipa</th>
                <th className="px-3 py-2 text-right">J</th>
                <th className="px-3 py-2 text-right">V</th>
                <th className="px-3 py-2 text-right">E</th>
                <th className="px-3 py-2 text-right">D</th>
                <th className="px-3 py-2 text-right">GM</th>
                <th className="px-3 py-2 text-right">GS</th>
                <th className="px-3 py-2 text-right">Dif</th>
                <th className="px-3 py-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((r) => (
                <tr key={r.team.id} className="border-t border-border">
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.position}</td>
                  <td className="px-3 py-2 font-medium">{r.team.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.played}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.wins}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.draws}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.losses}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.goalsFor}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.goalsAgainst}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Classificação calculada a partir dos resultados registados no conjunto de dados ativo.
        </p>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Kicker className="mb-1.5 block">{label}</Kicker>
      {children}
    </label>
  );
}

function MatchCard({ match }: { match: Match }) {
  const ds = getDataset();
  const home = ds.teams.find((t) => t.id === match.homeTeamId)!;
  const away = ds.teams.find((t) => t.id === match.awayTeamId)!;
  return (
    <article className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Kicker>Jornada {match.round} · {statusLabel(match.status)}</Kicker>
        {ds.isDemo && <DemoTag />}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Crest team={home} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{home.shortName} vs {away.shortName}</p>
          <p className="truncate text-xs text-muted-foreground">{home.name} · {away.name}</p>
        </div>
        <Crest team={away} size={32} />
        {match.status !== "proximo" && (
          <span className="font-display text-lg font-bold tabular-nums">
            {match.homeGoals ?? "-"}–{match.awayGoals ?? "-"}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatKickoff(match.kickoff)}</p>
        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {match.venue ?? "Dados não disponíveis"}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <SourceNote source={match.source} />
        {match.status === "proximo" && (
          <Button asChild size="sm">
            <Link to="/relatorio/$matchId" params={{ matchId: match.id }}>
              Gerar scouting <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
