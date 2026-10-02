// Análise para a equipa de arbitragem: cronograma do último confronto, disciplina
// nos últimos 5 jogos oficiais, cartões de suplentes e períodos de golos.
// Fonte: fichas de jogo oficiais em resultados.fpf.pt. Os jogos 2026/27 têm prioridade
// assim que forem acrescentados a `currentSeasonEventMatches`; cada jogo indica a sua época.
import raw2526 from "./fpf-events-2025-26.json";
import type { SourceRef } from "./types";

export type EventType = "goal" | "own_goal" | "yellow" | "second_yellow" | "red" | "sub";

export interface MatchEvent {
  minute: number;
  added: number;
  type: EventType;
  team: "home" | "away" | null;
  player?: string;
  playerIn?: string | null;
  playerOut?: string | null;
  score?: string;
}

export interface EventMatch {
  fpfMatchId: number;
  season: string;
  round: number;
  date: string | null; // dd-mm-aaaa
  time: string | null;
  venue: string | null;
  home: string;
  away: string;
  homeId: string;
  awayId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  eventsMatchScore: boolean;
  events: MatchEvent[];
}

type RawFile = { season: string; source: string; syncedAt: string; matches: Omit<EventMatch, "season">[] };
const f2526 = raw2526 as unknown as RawFile;

/** Jogos oficiais 2026/27 com eventos — acrescentar após cada jornada (sincronização FPF). */
export const currentSeasonEventMatches: EventMatch[] = [];

const historic: EventMatch[] = f2526.matches.map((m) => ({ ...m, season: f2526.season }));

export const ALL_EVENT_MATCHES: EventMatch[] = [...historic, ...currentSeasonEventMatches].sort(
  (a, b) => sortKey(b) - sortKey(a),
); // mais recente primeiro

function sortKey(m: EventMatch) {
  if (!m.date) return 0;
  const [d = 1, mo = 1, y = 2000] = m.date.split("-").map(Number);
  return Date.UTC(y, mo - 1, d);
}

export function matchSource(m: EventMatch): SourceRef {
  return {
    origin: "fpf",
    label: `FPF — ficha oficial de jogo (${m.season}, J${m.round})`,
    url: `https://resultados.fpf.pt/Match/GetMatchInformation?matchId=${m.fpfMatchId}`,
    syncedAt: f2526.syncedAt,
  };
}

export const eventsSource: SourceRef = {
  origin: "fpf",
  label: "FPF — fichas oficiais de jogo, CD Seniores 1.ª Divisão AF Setúbal",
  url: f2526.source,
  syncedAt: f2526.syncedAt,
};

export const minuteLabel = (e: { minute: number; added: number }) =>
  e.added ? `${e.minute}+${e.added}'` : `${e.minute}'`;

const isCard = (t: EventType) => t === "yellow" || t === "second_yellow" || t === "red";

/* ------------------------------ último confronto ------------------------------ */

export interface TimelineItem extends MatchEvent {
  teamId: string | null;
  /** jogador sancionado tinha entrado do banco (minuto de entrada) */
  enteredAt?: number;
  note?: string;
}

export function lastHeadToHead(homeId: string, awayId: string) {
  const m = ALL_EVENT_MATCHES.find(
    (x) => (x.homeId === homeId && x.awayId === awayId) || (x.homeId === awayId && x.awayId === homeId),
  );
  if (!m) return null;
  const entered = new Map<string, number>();
  const items: TimelineItem[] = m.events.map((e) => {
    const teamId = e.team === "home" ? m.homeId : e.team === "away" ? m.awayId : null;
    if (e.type === "sub" && e.playerIn) entered.set(`${e.team}|${e.playerIn}`, e.minute);
    const it: TimelineItem = { ...e, teamId };
    if (isCard(e.type) && e.player) {
      const at = entered.get(`${e.team}|${e.player}`);
      if (at !== undefined) {
        it.enteredAt = at;
        it.note = `Suplente: entrou aos ${at}' e foi sancionado ${Math.max(0, e.minute - at)} min depois.`;
      }
    }
    if (e.type === "second_yellow") it.note = (it.note ? it.note + " " : "") + "Segundo amarelo — expulsão.";
    if (e.type === "red") it.note = (it.note ? it.note + " " : "") + "Vermelho direto.";
    if (e.type === "own_goal") it.note = "Autogolo.";
    return it;
  });
  return { match: m, items };
}

/* ------------------------------ últimos 5 jogos ------------------------------ */

export function lastMatches(teamId: string, n = 5) {
  return ALL_EVENT_MATCHES.filter((m) => m.homeId === teamId || m.awayId === teamId).slice(0, n);
}

const sideOf = (m: EventMatch, teamId: string) => (m.homeId === teamId ? "home" : "away");

export interface PlayerDiscipline {
  player: string;
  yellow: number;
  secondYellow: number;
  red: number;
  matches: number; // jogos com sanção
  asSub: number; // sanções recebidas depois de entrar do banco
  minutes: string[];
  points: number; // amarelo 1, 2.º amarelo 2, vermelho 3
}

export function disciplineLeaders(teamId: string, n = 5) {
  const ms = lastMatches(teamId, n);
  const map = new Map<string, PlayerDiscipline>();
  for (const m of ms) {
    const side = sideOf(m, teamId);
    const entered = new Set<string>();
    const seenThisMatch = new Set<string>();
    for (const e of m.events) {
      if (e.team !== side) continue;
      if (e.type === "sub" && e.playerIn) entered.add(e.playerIn);
      if (!isCard(e.type) || !e.player) continue;
      const r =
        map.get(e.player) ??
        ({ player: e.player, yellow: 0, secondYellow: 0, red: 0, matches: 0, asSub: 0, minutes: [], points: 0 } as PlayerDiscipline);
      if (e.type === "yellow") { r.yellow++; r.points += 1; }
      if (e.type === "second_yellow") { r.secondYellow++; r.points += 2; }
      if (e.type === "red") { r.red++; r.points += 3; }
      if (entered.has(e.player)) r.asSub++;
      if (!seenThisMatch.has(e.player)) { r.matches++; seenThisMatch.add(e.player); }
      r.minutes.push(minuteLabel(e));
      map.set(e.player, r);
    }
  }
  const players = [...map.values()].sort((a, b) => b.points - a.points || b.matches - a.matches);
  return { matches: ms, players };
}

/* --------------------------- cartões de suplentes --------------------------- */

export interface BenchCardStat {
  scope: string;
  matches: number;
  totalCards: number;
  benchCards: number;
  matchesWithBenchCard: number;
  avgMinutesAfterEntry: number | null;
  share: number | null; // % de cartões que foram a suplentes
  pattern: boolean;
  cases: { player: string; minute: string; enteredAt: number; season: string; round: number; type: EventType }[];
}

function benchStats(teamId: string, ms: EventMatch[], scope: string): BenchCardStat {
  let total = 0, bench = 0, withBench = 0, sumAfter = 0;
  const cases: BenchCardStat["cases"] = [];
  for (const m of ms) {
    const side = sideOf(m, teamId);
    const entered = new Map<string, number>();
    let had = false;
    for (const e of m.events) {
      if (e.team !== side) continue;
      if (e.type === "sub" && e.playerIn) entered.set(e.playerIn, e.minute);
      if (!isCard(e.type) || !e.player) continue;
      total++;
      const at = entered.get(e.player);
      if (at !== undefined) {
        bench++; had = true; sumAfter += Math.max(0, e.minute - at);
        cases.push({ player: e.player, minute: minuteLabel(e), enteredAt: at, season: m.season, round: m.round, type: e.type });
      }
    }
    if (had) withBench++;
  }
  const share = total ? Math.round((bench / total) * 100) : null;
  return {
    scope, matches: ms.length, totalCards: total, benchCards: bench, matchesWithBenchCard: withBench,
    avgMinutesAfterEntry: bench ? Math.round(sumAfter / bench) : null, share,
    // padrão: suplentes sancionados em pelo menos 40% dos jogos ou >= 25% dos cartões (com amostra mínima)
    pattern: ms.length >= 3 && (withBench / ms.length >= 0.4 || (share ?? 0) >= 25) && bench >= 2,
    cases,
  };
}

export function benchCardAnalysis(teamId: string) {
  const all = ALL_EVENT_MATCHES.filter((m) => m.homeId === teamId || m.awayId === teamId);
  if (!all.length) return null;
  const latestSeason = all[0]!.season;
  return {
    last5: benchStats(teamId, all.slice(0, 5), "Últimos 5 jogos oficiais"),
    season: benchStats(teamId, all.filter((m) => m.season === latestSeason), `Época ${latestSeason} completa`),
  };
}

/* ------------------------------ períodos de golos ------------------------------ */

export const PERIODS = ["0–15'", "16–30'", "31–45+'", "46–60'", "61–75'", "76–90+'"] as const;
const bucket = (min: number) => (min <= 15 ? 0 : min <= 30 ? 1 : min <= 45 ? 2 : min <= 60 ? 3 : min <= 75 ? 4 : 5);

export interface PeriodProfile {
  scope: string;
  matches: number;
  scored: number[];
  conceded: number[];
  cards: number[];
  peakScored: string | null;
  peakConceded: string | null;
  peakCards: string | null;
  inconsistent: number; // jogos cujo resultado oficial difere dos eventos (ex.: decisão administrativa)
}

function profile(teamId: string, ms: EventMatch[], scope: string): PeriodProfile {
  const scored = Array(6).fill(0), conceded = Array(6).fill(0), cards = Array(6).fill(0);
  let inconsistent = 0;
  for (const m of ms) {
    const side = sideOf(m, teamId);
    if (!m.eventsMatchScore) inconsistent++;
    for (const e of m.events) {
      // minutos de compensação contam no período em que ocorreram (45+ e 90+)
      const b = bucket(e.minute);
      if (e.type === "goal" || e.type === "own_goal") (e.team === side ? scored : conceded)[b]++;
      if (isCard(e.type) && e.team === side) cards[b]++;
    }
  }
  const peak = (a: number[]) => {
    const mx = Math.max(...a);
    return mx > 0 ? a.map((v, i) => (v === mx ? PERIODS[i] : null)).filter(Boolean).join(" / ") : null;
  };
  return { scope, matches: ms.length, scored, conceded, cards, peakScored: peak(scored), peakConceded: peak(conceded), peakCards: peak(cards), inconsistent };
}

export function goalPeriods(teamId: string) {
  const all = ALL_EVENT_MATCHES.filter((m) => m.homeId === teamId || m.awayId === teamId);
  if (!all.length) return null;
  const latestSeason = all[0]!.season;
  return {
    last5: profile(teamId, all.slice(0, 5), "Últimos 5 jogos oficiais"),
    season: profile(teamId, all.filter((m) => m.season === latestSeason), `Época ${latestSeason}`),
  };
}

/* ------------------------------ focos para a arbitragem ------------------------------ */

export function refereeFocus(teamId: string, teamName: string): string[] {
  const out: string[] = [];
  const d = disciplineLeaders(teamId);
  const top = d.players.filter((p) => p.points >= 2).slice(0, 3);
  if (top.length)
    out.push(`${teamName}: atenção a ${top.map((p) => `${p.player} (${p.yellow}A${p.secondYellow ? `, ${p.secondYellow} 2.ºA` : ""}${p.red ? `, ${p.red}V` : ""})`).join(", ")} — mais sancionados nos últimos ${d.matches.length} jogos.`);
  const b = benchCardAnalysis(teamId);
  if (b?.last5.pattern || b?.season.pattern) {
    const s = b.last5.pattern ? b.last5 : b.season;
    out.push(`${teamName}: padrão de suplentes sancionados (${s.benchCards} de ${s.totalCards} cartões, ${s.scope.toLowerCase()}); em média ${s.avgMinutesAfterEntry ?? "—"} min após a entrada.`);
  }
  const g = goalPeriods(teamId);
  if (g) {
    if (g.season.peakCards) out.push(`${teamName}: maior concentração de cartões em ${g.season.peakCards} (${g.season.scope}).`);
    if (g.season.peakScored) out.push(`${teamName}: marca mais em ${g.season.peakScored}; sofre mais em ${g.season.peakConceded ?? "—"} (${g.season.scope}).`);
  }
  return out;
}
