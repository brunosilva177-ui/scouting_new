// DADOS REAIS — Época 2026/27, CD Seniores 1.ª Divisão AF Setúbal.
// Fonte: resultados.fpf.pt (portal oficial de resultados da FPF/AF Setúbal).
// Apenas o que a fonte publica: equipas, calendário, datas, horas e campos.
// Plantéis e treinadores são complementados por uma fonte de imprensa identificada.

import raw from "./fpf-2026-27.json";
import jdRaw from "./jd-plantel-2026-27.json";
import { preparationMatches, teamHistory } from "./context-data";
import type { Dataset, Match, Player, Position, SourceRef, Team } from "./types";

export const FPF_SYNCED_AT = "2026-10-01T14:32:00.000Z";
export const FPF_COMPETITION_URL =
  "https://resultados.fpf.pt/Competition/Details?competitionId=29857&seasonId=106";

const fpfSource: SourceRef = {
  origin: "fpf",
  label: "FPF Resultados (AF Setúbal)",
  url: FPF_COMPETITION_URL,
  syncedAt: FPF_SYNCED_AT,
};

// Plantéis e treinadores 2026/27 — Jornal de Desporto (não oficial, pode estar incompleto).
export const JD_SYNCED_AT = "2026-10-01T14:35:00.000Z";
const jdSource: SourceRef = {
  origin: "imprensa",
  label: "Jornal de Desporto — plantéis 2026/27 (não oficial)",
  url: "https://www.jornaldedesporto.pt/2026/08/mercado-de-transferencias-1-divisao-af_0289233862.html",
  syncedAt: JD_SYNCED_AT,
};
type JdTeam = { coach: string | null; players: Array<{ id: string; name: string; position: string; note: string | null }> };
const jd = jdRaw as Record<string, JdTeam>;

const teams: Team[] = raw.teams.map((t) => ({
  id: t.id,
  name: t.name,
  shortName: t.shortName,
  crestUrl: null,
  founded: null,
  locality: null,
  stadium: raw.matches.find((m) => m.home === t.id)?.venue ?? null,
  coach: jd[t.id]?.coach ?? null,
  mainFormation: null,
  altFormations: [],
  strengths: [],
  weaknesses: [],
  styleNotes: null,
  source: fpfSource,
}));

const players: Player[] = Object.entries(jd).flatMap(([teamId, t]) =>
  t.players.map((p) => ({
    id: p.id,
    name: p.name,
    teamId,
    position: p.position as Position,
    detailedPosition: p.note ?? "",
    shirt: null,
    age: null,
    nationality: null,
    apps: null,
    starts: null,
    minutes: null,
    goals: null,
    assists: null,
    yellows: null,
    reds: null,
    availability: "disponivel" as const,
    source: jdSource,
  })),
);

const matches: Match[] = raw.matches.map((m) => ({
  id: m.id,
  seasonId: "s2026",
  competitionId: "afs-d1",
  round: m.round,
  kickoff: new Date(m.kickoff).toISOString(),
  venue: m.venue,
  homeTeamId: m.home,
  awayTeamId: m.away,
  status: "proximo",
  homeGoals: null,
  awayGoals: null,
  source: fpfSource,
}));

export const realDataset: Dataset = {
  competitions: [
    { id: "afs-d1", name: "Campeonato Distrital - 1.ª Divisão", association: "AF Setúbal" },
  ],
  seasons: [{ id: "s2026", label: "2026/27", competitionId: "afs-d1", rounds: 30 }],
  teams,
  players,
  matches,
  teamHistory,
  preparationMatches,
  isDemo: false,
  source: fpfSource,
};
