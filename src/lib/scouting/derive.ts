// Cálculos derivados exclusivamente a partir dos dados carregados.
// Nenhum valor é inventado: quando não há dados, devolve null.

import type { Dataset, Match, Player, Position, Team } from "./types";

export const NA = "Dados não disponíveis";

export function fmt(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NA;
  return digits > 0 ? value.toFixed(digits).replace(".", ",") : String(value);
}

export interface TeamStats {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  diff: number;
  avgFor: number | null;
  avgAgainst: number | null;
  home: { played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number };
  away: { played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number };
}

const emptySplit = () => ({ played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });

export function playedMatches(ds: Dataset, seasonId: string): Match[] {
  return ds.matches.filter((m) => m.seasonId === seasonId && m.status === "realizado" && m.homeGoals !== null && m.awayGoals !== null);
}

export function computeTeamStats(ds: Dataset, seasonId: string, teamId: string): TeamStats {
  const stats: TeamStats = {
    teamId,
    played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, diff: 0,
    avgFor: null, avgAgainst: null,
    home: emptySplit(), away: emptySplit(),
  };
  for (const m of playedMatches(ds, seasonId)) {
    const isHome = m.homeTeamId === teamId;
    const isAway = m.awayTeamId === teamId;
    if (!isHome && !isAway) continue;
    const gf = (isHome ? m.homeGoals : m.awayGoals) as number;
    const ga = (isHome ? m.awayGoals : m.homeGoals) as number;
    const split = isHome ? stats.home : stats.away;
    stats.played++; split.played++;
    stats.goalsFor += gf; stats.goalsAgainst += ga;
    split.goalsFor += gf; split.goalsAgainst += ga;
    if (gf > ga) { stats.wins++; split.wins++; stats.points += 3; split.points += 3; }
    else if (gf === ga) { stats.draws++; split.draws++; stats.points += 1; split.points += 1; }
    else { stats.losses++; split.losses++; }
  }
  stats.diff = stats.goalsFor - stats.goalsAgainst;
  stats.avgFor = stats.played ? stats.goalsFor / stats.played : null;
  stats.avgAgainst = stats.played ? stats.goalsAgainst / stats.played : null;
  return stats;
}

export interface StandingRow extends TeamStats {
  position: number;
  team: Team;
}

export function computeStandings(ds: Dataset, seasonId: string): StandingRow[] {
  const rows = ds.teams
    .map((team) => ({ ...computeTeamStats(ds, seasonId, team.id), team, position: 0 }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor || a.team.name.localeCompare(b.team.name));
  rows.forEach((r, i) => (r.position = i + 1));
  return rows;
}

export type FormResult = "V" | "E" | "D";

export interface FormEntry {
  match: Match;
  result: FormResult;
  goalsFor: number;
  goalsAgainst: number;
  home: boolean;
  opponent: Team;
}

export function teamForm(ds: Dataset, seasonId: string, teamId: string, limit = 5, filter?: "casa" | "fora"): FormEntry[] {
  return playedMatches(ds, seasonId)
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .filter((m) => (filter === "casa" ? m.homeTeamId === teamId : filter === "fora" ? m.awayTeamId === teamId : true))
    .sort((a, b) => (b.kickoff ?? "").localeCompare(a.kickoff ?? ""))
    .slice(0, limit)
    .map((m) => {
      const home = m.homeTeamId === teamId;
      const gf = (home ? m.homeGoals : m.awayGoals) as number;
      const ga = (home ? m.awayGoals : m.homeGoals) as number;
      return {
        match: m,
        result: (gf > ga ? "V" : gf === ga ? "E" : "D") as FormResult,
        goalsFor: gf,
        goalsAgainst: ga,
        home,
        opponent: ds.teams.find((t) => t.id === (home ? m.awayTeamId : m.homeTeamId))!,
      };
    });
}

export function formPoints(entries: FormEntry[]): number {
  return entries.reduce((acc, e) => acc + (e.result === "V" ? 3 : e.result === "E" ? 1 : 0), 0);
}

export function headToHead(ds: Dataset, homeId: string, awayId: string): Match[] {
  return ds.matches
    .filter((m) => m.status === "realizado")
    .filter((m) => (m.homeTeamId === homeId && m.awayTeamId === awayId) || (m.homeTeamId === awayId && m.awayTeamId === homeId))
    .sort((a, b) => (b.kickoff ?? "").localeCompare(a.kickoff ?? ""));
}

export function squad(ds: Dataset, teamId: string): Player[] {
  const order: Position[] = ["GR", "DEF", "MED", "AVA"];
  return ds.players
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => order.indexOf(a.position) - order.indexOf(b.position) || (b.minutes ?? 0) - (a.minutes ?? 0));
}

export function depthByPosition(players: Player[]): Record<Position, number> {
  const out: Record<Position, number> = { GR: 0, DEF: 0, MED: 0, AVA: 0 };
  players.filter((p) => p.availability === "disponivel").forEach((p) => out[p.position]++);
  return out;
}

export function ageBuckets(players: Player[]) {
  const buckets = [
    { label: "Sub-21", min: 0, max: 20 },
    { label: "21-25", min: 21, max: 25 },
    { label: "26-30", min: 26, max: 30 },
    { label: "31+", min: 31, max: 99 },
  ];
  return buckets.map((b) => ({
    label: b.label,
    count: players.filter((p) => p.age !== null && p.age >= b.min && p.age <= b.max).length,
  }));
}

export interface KeyPlayer {
  player: Player;
  score: number;
  reasons: string[];
  contributions: number;
  disciplinaryRisk: boolean;
}

export function keyPlayers(players: Player[], limit = 5): KeyPlayer[] {
  const maxMin = Math.max(1, ...players.map((p) => p.minutes ?? 0));
  return players
    .map((p) => {
      const goals = p.goals ?? 0;
      const assists = p.assists ?? 0;
      const contributions = goals + assists;
      const minuteShare = (p.minutes ?? 0) / maxMin;
      const score = contributions * 3 + minuteShare * 4 + (p.starts ?? 0) * 0.2;
      const reasons: string[] = [];
      if (contributions > 0) reasons.push(`${contributions} participação(ões) em golos`);
      if (minuteShare > 0.8) reasons.push("Dos jogadores mais utilizados");
      if ((p.yellows ?? 0) >= 3) reasons.push("Risco disciplinar acumulado");
      if (p.availability !== "disponivel") reasons.push("Disponibilidade condicionada");
      return { player: p, score, reasons, contributions, disciplinaryRisk: (p.yellows ?? 0) >= 3 || (p.reds ?? 0) > 0 };
    })
    .filter((k) => k.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const FORMATION_SHAPES: Record<string, Array<{ position: Position; count: number }>> = {
  "4-3-3": [{ position: "GR", count: 1 }, { position: "DEF", count: 4 }, { position: "MED", count: 3 }, { position: "AVA", count: 3 }],
  "4-4-2": [{ position: "GR", count: 1 }, { position: "DEF", count: 4 }, { position: "MED", count: 4 }, { position: "AVA", count: 2 }],
  "4-2-3-1": [{ position: "GR", count: 1 }, { position: "DEF", count: 4 }, { position: "MED", count: 5 }, { position: "AVA", count: 1 }],
  "3-5-2": [{ position: "GR", count: 1 }, { position: "DEF", count: 3 }, { position: "MED", count: 5 }, { position: "AVA", count: 2 }],
  "5-3-2": [{ position: "GR", count: 1 }, { position: "DEF", count: 5 }, { position: "MED", count: 3 }, { position: "AVA", count: 2 }],
  "4-1-4-1": [{ position: "GR", count: 1 }, { position: "DEF", count: 4 }, { position: "MED", count: 5 }, { position: "AVA", count: 1 }],
  "3-4-3": [{ position: "GR", count: 1 }, { position: "DEF", count: 3 }, { position: "MED", count: 4 }, { position: "AVA", count: 3 }],
};

export interface XIPlayer {
  player: Player;
  probability: number;
}

export interface LikelyXI {
  formation: string;
  starters: XIPlayer[];
  bench: XIPlayer[];
  confidence: "alta" | "média" | "baixa";
  confidenceReason: string;
  rows: Array<{ position: Position; players: XIPlayer[] }>;
}

/** Probabilidade de titularidade a partir de titularidades, minutos, posição e disponibilidade. */
export function startProbability(player: Player, teamMatches: number): number {
  if (!teamMatches) return 0;
  const startRate = (player.starts ?? 0) / teamMatches;
  const minuteRate = Math.min(1, (player.minutes ?? 0) / (teamMatches * 90));
  let p = startRate * 0.65 + minuteRate * 0.35;
  if (player.availability === "lesionado" || player.availability === "suspenso") p = 0;
  if (player.availability === "duvida") p *= 0.45;
  return Math.max(0, Math.min(1, p));
}

export function likelyXI(
  ds: Dataset,
  seasonId: string,
  team: Team,
  override?: string[],
): LikelyXI {
  const players = squad(ds, team.id);
  const teamMatches = computeTeamStats(ds, seasonId, team.id).played;
  const formation = team.mainFormation && FORMATION_SHAPES[team.mainFormation] ? team.mainFormation : "4-4-2";
  const shape = FORMATION_SHAPES[formation] ?? FORMATION_SHAPES["4-4-2"]!;
  const withProb = players.map((p) => ({ player: p, probability: startProbability(p, teamMatches) }));

  let starters: XIPlayer[] = [];
  const rows: LikelyXI["rows"] = [];
  if (override && override.length === 11) {
    starters = override
      .map((id) => withProb.find((w) => w.player.id === id))
      .filter((w): w is XIPlayer => Boolean(w));
    for (const line of shape) {
      rows.push({ position: line.position, players: starters.filter((s) => s.player.position === line.position) });
    }
  } else {
    for (const line of shape) {
      const picked = withProb
        .filter((w) => w.player.position === line.position && w.probability > 0)
        .sort((a, b) => b.probability - a.probability)
        .slice(0, line.count);
      rows.push({ position: line.position, players: picked });
      starters = starters.concat(picked);
    }
  }
  const starterIds = new Set(starters.map((s) => s.player.id));
  const bench = withProb
    .filter((w) => !starterIds.has(w.player.id) && w.player.availability !== "lesionado" && w.player.availability !== "suspenso")
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 7);

  const avg = starters.length ? starters.reduce((a, s) => a + s.probability, 0) / starters.length : 0;
  const confidence = teamMatches < 3 ? "baixa" : avg > 0.7 ? "alta" : avg > 0.5 ? "média" : "baixa";
  return {
    formation,
    starters,
    bench,
    confidence,
    confidenceReason: `Base: ${teamMatches} jogo(s) da época, titularidades e minutos registados. Média de probabilidade do onze: ${(avg * 100).toFixed(0)}%.`,
    rows,
  };
}

export interface ComparisonMetric {
  label: string;
  homeValue: number | null;
  awayValue: number | null;
  homeDisplay: string;
  awayDisplay: string;
  /** Escala 0-100 para gráficos */
  homeScore: number;
  awayScore: number;
  hint: string;
}

export function comparison(ds: Dataset, seasonId: string, home: Team, away: Team): ComparisonMetric[] {
  const hs = computeTeamStats(ds, seasonId, home.id);
  const as = computeTeamStats(ds, seasonId, away.id);
  const hSquad = squad(ds, home.id);
  const aSquad = squad(ds, away.id);
  const cards = (list: Player[]) => list.some((p) => p.yellows !== null || p.reds !== null)
    ? list.reduce((a, p) => a + (p.yellows ?? 0) + (p.reds ?? 0) * 2, 0)
    : null;
  const avgAge = (list: Player[]) => {
    const withAge = list.filter((p) => p.age !== null);
    return withAge.length ? withAge.reduce((a, p) => a + (p.age as number), 0) / withAge.length : null;
  };
  const scale = (v: number | null, max: number) => (v === null || max === 0 ? 0 : Math.max(0, Math.min(100, (v / max) * 100)));

  const hFormEntries = teamForm(ds, seasonId, home.id, 5);
  const aFormEntries = teamForm(ds, seasonId, away.id, 5);
  const hForm = hFormEntries.length ? formPoints(hFormEntries) : null;
  const aForm = aFormEntries.length ? formPoints(aFormEntries) : null;
  const hCards = cards(hSquad);
  const aCards = cards(aSquad);
  const metrics: ComparisonMetric[] = [
    { label: "Forma (pts últimos 5)", homeValue: hForm, awayValue: aForm, homeDisplay: hForm === null ? NA : `${hForm}/15`, awayDisplay: aForm === null ? NA : `${aForm}/15`, homeScore: scale(hForm, 15), awayScore: scale(aForm, 15), hint: "Pontos conquistados nos últimos 5 jogos realizados." },
    { label: "Ataque (média golos marcados)", homeValue: hs.avgFor, awayValue: as.avgFor, homeDisplay: fmt(hs.avgFor, 2), awayDisplay: fmt(as.avgFor, 2), homeScore: scale(hs.avgFor, 3), awayScore: scale(as.avgFor, 3), hint: "Golos marcados por jogo na época." },
    { label: "Defesa (solidez)", homeValue: hs.avgAgainst, awayValue: as.avgAgainst, homeDisplay: fmt(hs.avgAgainst, 2), awayDisplay: fmt(as.avgAgainst, 2), homeScore: 100 - scale(hs.avgAgainst, 3), awayScore: 100 - scale(as.avgAgainst, 3), hint: "Menos golos sofridos por jogo corresponde a barra maior." },
    { label: "Disciplina (cartões)", homeValue: hCards, awayValue: aCards, homeDisplay: hCards === null ? NA : `${hCards} pts cartão`, awayDisplay: aCards === null ? NA : `${aCards} pts cartão`, homeScore: hCards === null ? 0 : 100 - scale(hCards, 60), awayScore: aCards === null ? 0 : 100 - scale(aCards, 60), hint: "Amarelos + 2x vermelhos do plantel. Barra maior = mais disciplinado." },
    { label: "Experiência (idade média)", homeValue: avgAge(hSquad), awayValue: avgAge(aSquad), homeDisplay: `${fmt(avgAge(hSquad), 1)} anos`, awayDisplay: `${fmt(avgAge(aSquad), 1)} anos`, homeScore: scale(avgAge(hSquad), 35), awayScore: scale(avgAge(aSquad), 35), hint: "Idade média do plantel registado." },
    { label: "Profundidade do plantel", homeValue: hSquad.filter((p) => p.availability === "disponivel").length, awayValue: aSquad.filter((p) => p.availability === "disponivel").length, homeDisplay: `${hSquad.filter((p) => p.availability === "disponivel").length} disponíveis`, awayDisplay: `${aSquad.filter((p) => p.availability === "disponivel").length} disponíveis`, homeScore: scale(hSquad.filter((p) => p.availability === "disponivel").length, 22), awayScore: scale(aSquad.filter((p) => p.availability === "disponivel").length, 22), hint: "Jogadores sem indisponibilidade confirmada." },
    { label: "Rendimento em casa", homeValue: hs.home.played ? hs.home.points : null, awayValue: as.home.played ? as.home.points : null, homeDisplay: hs.home.played ? `${hs.home.points} pts em ${hs.home.played} j.` : NA, awayDisplay: as.home.played ? `${as.home.points} pts em ${as.home.played} j.` : NA, homeScore: hs.home.played ? scale(hs.home.points, hs.home.played * 3) : 0, awayScore: as.home.played ? scale(as.home.points, as.home.played * 3) : 0, hint: "Pontos conquistados como visitado." },
    { label: "Rendimento fora", homeValue: hs.away.played ? hs.away.points : null, awayValue: as.away.played ? as.away.points : null, homeDisplay: hs.away.played ? `${hs.away.points} pts em ${hs.away.played} j.` : NA, awayDisplay: as.away.played ? `${as.away.points} pts em ${as.away.played} j.` : NA, homeScore: hs.away.played ? scale(hs.away.points, hs.away.played * 3) : 0, awayScore: as.away.played ? scale(as.away.points, as.away.played * 3) : 0, hint: "Pontos conquistados como visitante." },
  ];
  return metrics;
}

/** Estimativa baseada em dados (nunca apresentada como certeza). */
export function dataEstimate(ds: Dataset, seasonId: string, home: Team, away: Team) {
  const hs = computeTeamStats(ds, seasonId, home.id);
  const as = computeTeamStats(ds, seasonId, away.id);
  if (!hs.played || !as.played) return null;
  const hRating = hs.points / hs.played + hs.diff / hs.played * 0.5 + 0.35; // fator casa
  const aRating = as.points / as.played + as.diff / as.played * 0.5;
  const total = Math.max(0.1, hRating + aRating + 0.9);
  const homeP = Math.round((hRating / total) * 100);
  const awayP = Math.round((aRating / total) * 100);
  return {
    home: homeP,
    draw: Math.max(0, 100 - homeP - awayP),
    away: awayP,
    factors: [
      "Pontos por jogo na época",
      "Saldo de golos por jogo",
      "Fator casa aplicado à equipa visitada",
    ],
  };
}

export interface MatchKey {
  title: string;
  detail: string;
  kind: "dados" | "alerta";
}

export function matchKeys(ds: Dataset, seasonId: string, home: Team, away: Team): MatchKey[] {
  const keys: MatchKey[] = [];
  const hs = computeTeamStats(ds, seasonId, home.id);
  const as = computeTeamStats(ds, seasonId, away.id);
  const hSquad = squad(ds, home.id);
  const aSquad = squad(ds, away.id);

  const topScorer = (list: Player[], team: Team) => {
    const s = [...list].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))[0];
    return s && (s.goals ?? 0) > 0 ? { s, team } : null;
  };
  const th = topScorer(hSquad, home);
  const ta = topScorer(aSquad, away);
  if (th) keys.push({ kind: "dados", title: `Controlar ${th.s.name} (${home.shortName})`, detail: `${th.s.goals} golo(s) em ${fmt(th.s.apps)} jogo(s), ${fmt(th.s.minutes)} minutos. Principal referência ofensiva registada.` });
  if (ta) keys.push({ kind: "dados", title: `Controlar ${ta.s.name} (${away.shortName})`, detail: `${ta.s.goals} golo(s) em ${fmt(ta.s.apps)} jogo(s), ${fmt(ta.s.minutes)} minutos.` });

  if (hs.avgAgainst !== null && as.avgAgainst !== null) {
    const fragile = hs.avgAgainst > as.avgAgainst ? { t: home, v: hs.avgAgainst } : { t: away, v: as.avgAgainst };
    keys.push({ kind: "dados", title: `Explorar fragilidade defensiva do ${fragile.t.shortName}`, detail: `Sofre em média ${fmt(fragile.v, 2)} golos por jogo na época em curso.` });
  }
  const homeStrength = hs.home.played ? hs.home.points / hs.home.played : null;
  const awayStrength = as.away.played ? as.away.points / as.away.played : null;
  if (homeStrength !== null || awayStrength !== null) keys.push({
    kind: "dados",
    title: "Peso do fator casa",
    detail: `${home.shortName} em casa: ${fmt(homeStrength, 2)} pts/jogo. ${away.shortName} fora: ${fmt(awayStrength, 2)} pts/jogo.`,
  });

  const risky = [...hSquad, ...aSquad].filter((p) => (p.yellows ?? 0) >= 3);
  if (risky.length) {
    keys.push({
      kind: "alerta",
      title: "Gestão de jogadores em risco disciplinar",
      detail: risky.slice(0, 5).map((p) => `${p.name} (${ds.teams.find((t) => t.id === p.teamId)?.shortName}, ${p.yellows} amarelos)`).join("; "),
    });
  }
  const out = [...hSquad, ...aSquad].filter((p) => p.availability !== "disponivel" && p.availabilitySource);
  if (out.length) {
    keys.push({
      kind: "alerta",
      title: "Ausências com fonte confirmada",
      detail: out.slice(0, 6).map((p) => `${p.name} (${ds.teams.find((t) => t.id === p.teamId)?.shortName}, ${p.availability})`).join("; "),
    });
  }
  const noStrikers = [home, away].filter((t) => { const s = squad(ds, t.id); return s.length > 0 && s.filter((p) => p.position === "AVA" && p.availability === "disponivel").length <= 3; });
  if (noStrikers.length) {
    keys.push({ kind: "alerta", title: "Baixa disponibilidade de avançados", detail: noStrikers.map((t) => t.shortName).join(", ") + " com plantel ofensivo reduzido segundo os dados registados." });
  }
  return keys.slice(0, 8);
}

export function lastFormStreaks(entries: FormEntry[]) {
  let noScore = 0;
  for (const e of entries) { if (e.goalsFor === 0) noScore++; else break; }
  let conceding = 0;
  for (const e of entries) { if (e.goalsAgainst > 0) conceding++; else break; }
  return { noScore, conceding };
}
