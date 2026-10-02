import type { PreparationMatch, SourceRef, TeamHistory } from "./types";

export const historicalSource: SourceRef = {
  origin: "zerozero",
  label: "zerozero / oGol — classificação final 2025/26",
  url: "https://www.ogol.com.br/edicao/af-setubal-i-divisao-2025-26/203372",
  syncedAt: "2026-10-01T15:22:00.000Z",
};

const secondDivisionSource: SourceRef = {
  origin: "zerozero",
  label: "oGol — apuramento de campeão da 2.ª Divisão 2025/26",
  url: "https://www.ogol.com.br/edition.php?id_edicao=203536&simp=0",
  syncedAt: "2026-10-01T15:22:00.000Z",
};

const comercioSource: SourceRef = {
  origin: "imprensa",
  label: "Jornal de Desporto — balanço do Campeonato de Portugal 2025/26",
  url: "https://www.jornaldedesporto.pt/2026/04/campeonato-de-portugal-alcochetense.html",
  syncedAt: "2026-10-01T15:22:00.000Z",
};

const firstDivisionRows: Array<[string, number, number, number, number, number, number, number, number]> = [
  ["olimpico-montijo", 2, 30, 18, 5, 7, 53, 34, 59],
  ["grandolense", 3, 30, 17, 5, 8, 63, 40, 56],
  ["moitense", 4, 30, 15, 6, 9, 50, 31, 51],
  ["cova-piedade", 5, 30, 15, 2, 13, 38, 35, 47],
  ["sesimbra", 6, 30, 13, 8, 9, 52, 40, 47],
  ["palmelense", 7, 30, 12, 8, 10, 44, 32, 44],
  ["barreirense", 8, 30, 13, 4, 13, 41, 40, 43],
  ["uniao-santiago", 9, 30, 11, 9, 10, 41, 35, 42],
  ["amora-b", 10, 30, 10, 10, 10, 37, 41, 40],
  ["pescadores", 11, 30, 9, 8, 13, 40, 51, 35],
  ["vasco-da-gama", 12, 30, 9, 7, 14, 40, 55, 34],
  ["charneca-caparica", 13, 30, 10, 3, 17, 38, 52, 33],
  ["alfarim", 14, 30, 6, 11, 13, 36, 46, 29],
];

export const teamHistory: TeamHistory[] = [
  ...firstDivisionRows.map(([teamId, position, played, wins, draws, losses, goalsFor, goalsAgainst, points]) => ({
    teamId,
    season: "2025/26" as const,
    competition: "AF Setúbal — 1.ª Divisão",
    position,
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    points,
    note: null,
    source: historicalSource,
  })),
  {
    teamId: "seixal-1925", season: "2025/26" as const, competition: "AF Setúbal — 2.ª Divisão, apuramento de campeão",
    position: 1, played: 10, wins: 8, draws: 0, losses: 2, goalsFor: 23, goalsAgainst: 16, points: 24,
    note: "Campeão e promovido à 1.ª Divisão.", source: secondDivisionSource,
  },
  {
    teamId: "lagamecas", season: "2025/26" as const, competition: "AF Setúbal — 2.ª Divisão, apuramento de campeão",
    position: 2, played: 10, wins: 6, draws: 2, losses: 2, goalsFor: 20, goalsAgainst: 11, points: 20,
    note: "2.º classificado e promovido à 1.ª Divisão.", source: secondDivisionSource,
  },
  {
    teamId: "comercio-e-industria", season: "2025/26" as const, competition: "Campeonato de Portugal — Série D",
    position: 13, played: null, wins: null, draws: null, losses: null, goalsFor: null, goalsAgainst: null, points: null,
    note: "13.º classificado; despromovido aos campeonatos distritais.", source: comercioSource,
  },
];

// Mantido vazio até existirem resultados de preparação confirmados por uma fonte acessível.
export const preparationMatches: PreparationMatch[] = [];
