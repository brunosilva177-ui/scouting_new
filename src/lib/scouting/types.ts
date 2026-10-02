// Modelo de dados do Scouting AF Setúbal - 1.ª Divisão
// Todos os dados têm proveniência (fonte + data de sincronização).

export type DataOrigin = "exemplo" | "fpf" | "zerozero" | "af-setubal" | "clube" | "imprensa" | "manual" | "csv";

export interface SourceRef {
  /** Identificador da fonte de dados */
  origin: DataOrigin;
  /** Nome legível da fonte */
  label: string;
  /** URL pública, quando existir */
  url?: string;
  /** ISO datetime da última sincronização */
  syncedAt: string;
}

export type Position = "GR" | "DEF" | "MED" | "AVA";

export const POSITION_LABEL: Record<Position, string> = {
  GR: "Guarda-redes",
  DEF: "Defesas",
  MED: "Médios",
  AVA: "Avançados",
};

export type Availability = "disponivel" | "lesionado" | "suspenso" | "duvida";

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: Position;
  detailedPosition: string;
  shirt: number | null;
  age: number | null;
  nationality: string | null;
  apps: number | null;
  starts: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  yellows: number | null;
  reds: number | null;
  availability: Availability;
  availabilityNote?: string;
  /** Fonte confirmada da indisponibilidade (obrigatória para mostrar) */
  availabilitySource?: SourceRef;
  source: SourceRef;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  crestUrl: string | null;
  founded: number | null;
  locality: string | null;
  stadium: string | null;
  coach: string | null;
  mainFormation: string | null;
  altFormations: string[];
  strengths: string[];
  weaknesses: string[];
  styleNotes: string | null;
  source: SourceRef;
}

export type MatchStatus = "proximo" | "em-curso" | "realizado";

export interface Match {
  id: string;
  seasonId: string;
  competitionId: string;
  round: number;
  kickoff: string | null;
  venue: string | null;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  /** Titulares por equipa (ids de jogadores), quando disponível */
  lineups?: { home: string[]; away: string[] };
  source: SourceRef;
}

export interface Competition {
  id: string;
  name: string;
  association: string;
}

export interface Season {
  id: string;
  label: string;
  competitionId: string;
  rounds: number;
}

export interface TeamHistory {
  teamId: string;
  season: "2025/26";
  competition: string;
  position: number | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  points: number | null;
  note: string | null;
  source: SourceRef;
}

export interface PreparationMatch {
  id: string;
  teamId: string;
  date: string;
  opponent: string;
  home: boolean | null;
  goalsFor: number;
  goalsAgainst: number;
  note: string | null;
  source: SourceRef;
}

export interface Dataset {
  competitions: Competition[];
  seasons: Season[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  teamHistory: TeamHistory[];
  preparationMatches: PreparationMatch[];
  /** Verdadeiro quando o conjunto de dados é de demonstração */
  isDemo: boolean;
  source: SourceRef;
}

export interface AnalystNotes {
  pressao?: string;
  construcao?: string;
  transicao?: string;
  organizacaoDefensiva?: string;
  bolasParadas?: string;
  zonas?: string;
  geral?: string;
}

export interface SavedReport {
  id: string;
  matchId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  title: string;
  notes: Record<string, AnalystNotes>; // por teamId
  lineupOverrides: Record<string, string[]>; // teamId -> ids titulares
}

export interface AuditEntry {
  id: string;
  at: string;
  entity: string;
  field: string;
  before: string;
  after: string;
  author: string;
}
