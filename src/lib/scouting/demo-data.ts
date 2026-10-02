// DADOS DE DEMONSTRAÇÃO ("Exemplo").
// Gerados de forma determinística apenas para validar a aplicação.
// NUNCA devem ser apresentados como dados reais nem misturados com fontes reais.

import type {
  Dataset,
  Match,
  Player,
  Position,
  SourceRef,
  Team,
} from "./types";

const SYNCED_AT = "2026-08-27T21:30:00.000Z";

const demoSource: SourceRef = {
  origin: "exemplo",
  label: "Conjunto de demonstração (Exemplo)",
  syncedAt: SYNCED_AT,
};

/** PRNG determinístico (mulberry32) para gerar o conjunto de exemplo. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEAMS: Array<{
  name: string;
  short: string;
  locality: string;
  stadium: string;
  coach: string;
  founded: number;
  formation: string;
}> = [
  { name: "GD Exemplo Azeitão", short: "Azeitão", locality: "Azeitão", stadium: "Campo Municipal de Azeitão", coach: "A. Marques", founded: 1948, formation: "4-3-3" },
  { name: "AD Exemplo Palmela", short: "Palmela", locality: "Palmela", stadium: "Complexo Desportivo de Palmela", coach: "J. Pinheiro", founded: 1936, formation: "4-4-2" },
  { name: "CD Exemplo Aldeia Grande", short: "Aldeia Grande", locality: "Grândola", stadium: "Campo da Aldeia Grande", coach: "R. Cordeiro", founded: 1955, formation: "3-5-2" },
  { name: "SC Exemplo Moita", short: "Moita", locality: "Moita", stadium: "Estádio Municipal da Moita", coach: "P. Lourenço", founded: 1929, formation: "4-2-3-1" },
  { name: "UD Exemplo Sesimbra", short: "Sesimbra", locality: "Sesimbra", stadium: "Campo do Facho", coach: "N. Salgado", founded: 1941, formation: "4-3-3" },
  { name: "GS Exemplo Alcochete", short: "Alcochete", locality: "Alcochete", stadium: "Campo do Samouco", coach: "H. Bento", founded: 1962, formation: "5-3-2" },
  { name: "CF Exemplo Barreiro", short: "Barreiro", locality: "Barreiro", stadium: "Campo do Alto do Seixalinho", coach: "M. Ferraz", founded: 1924, formation: "4-4-2" },
  { name: "AC Exemplo Santo André", short: "Santo André", locality: "Santo André", stadium: "Campo de Santo André", coach: "T. Vilela", founded: 1971, formation: "4-2-3-1" },
  { name: "SU Exemplo Pinhal Novo", short: "Pinhal Novo", locality: "Pinhal Novo", stadium: "Campo do Pinhal", coach: "L. Amaro", founded: 1933, formation: "4-1-4-1" },
  { name: "CR Exemplo Setúbal", short: "Setúbal", locality: "Setúbal", stadium: "Campo das Amoreiras", coach: "D. Cabrita", founded: 1919, formation: "3-4-3" },
];

const FIRST = ["Tiago", "Rui", "Miguel", "João", "Bruno", "André", "Diogo", "Pedro", "Ricardo", "Nuno", "Hugo", "Fábio", "Luís", "Gonçalo", "Daniel", "Vasco", "Rodrigo", "Sérgio", "Marco", "Filipe", "Simão", "Ivo"];
const LAST = ["Ferreira", "Silva", "Lopes", "Correia", "Matias", "Rocha", "Nunes", "Antunes", "Cardoso", "Bernardo", "Teixeira", "Pires", "Gaspar", "Moreira", "Vieira", "Sampaio", "Duarte", "Neves", "Baptista", "Faria", "Coelho", "Ramos"];

const SQUAD_SHAPE: Array<{ position: Position; detail: string }> = [
  { position: "GR", detail: "Guarda-redes" },
  { position: "GR", detail: "Guarda-redes" },
  { position: "DEF", detail: "Lateral direito" },
  { position: "DEF", detail: "Lateral direito" },
  { position: "DEF", detail: "Central" },
  { position: "DEF", detail: "Central" },
  { position: "DEF", detail: "Central" },
  { position: "DEF", detail: "Lateral esquerdo" },
  { position: "DEF", detail: "Lateral esquerdo" },
  { position: "MED", detail: "Médio defensivo" },
  { position: "MED", detail: "Médio defensivo" },
  { position: "MED", detail: "Médio interior" },
  { position: "MED", detail: "Médio interior" },
  { position: "MED", detail: "Médio ofensivo" },
  { position: "AVA", detail: "Extremo direito" },
  { position: "AVA", detail: "Extremo esquerdo" },
  { position: "AVA", detail: "Extremo esquerdo" },
  { position: "AVA", detail: "Ponta de lança" },
  { position: "AVA", detail: "Ponta de lança" },
  { position: "MED", detail: "Médio interior" },
];

const STRENGTHS = [
  "Organização defensiva em bloco médio",
  "Eficácia em bolas paradas ofensivas",
  "Transições rápidas pelos corredores",
  "Pressão alta após perda",
  "Rendimento em casa",
  "Domínio do jogo aéreo",
];
const WEAKNESSES = [
  "Vulnerabilidade em cruzamentos",
  "Perda de intensidade no último terço do jogo",
  "Indisciplina em zonas de risco",
  "Dificuldade a construir sob pressão",
  "Rendimento fora de casa",
  "Dependência do melhor marcador",
];

function buildTeams(): Team[] {
  const r = rng(11);
  return TEAMS.map((t, i) => {
    const alt = TEAMS.filter((_, j) => j !== i).map((x) => x.formation);
    return {
      id: `t${i + 1}`,
      name: t.name,
      shortName: t.short,
      crestUrl: null, // Emblemas apenas com licença/URL autorizada ou upload manual
      founded: t.founded,
      locality: t.locality,
      stadium: t.stadium,
      coach: t.coach,
      mainFormation: t.formation,
      altFormations: [alt[Math.floor(r() * alt.length)]!, alt[Math.floor(r() * alt.length)]!].filter(
        (f, idx, arr) => f !== t.formation && arr.indexOf(f) === idx,
      ),
      strengths: [STRENGTHS[i % STRENGTHS.length]!, STRENGTHS[(i + 2) % STRENGTHS.length]!],
      weaknesses: [WEAKNESSES[i % WEAKNESSES.length]!, WEAKNESSES[(i + 3) % WEAKNESSES.length]!],
      styleNotes: null,
      source: demoSource,
    };
  });
}

function buildPlayers(teams: Team[]): Player[] {
  const players: Player[] = [];
  teams.forEach((team, ti) => {
    const r = rng(100 + ti);
    SQUAD_SHAPE.forEach((slot, pi) => {
      const name = `${FIRST[Math.floor(r() * FIRST.length)]!} ${LAST[Math.floor(r() * LAST.length)]!}`;
      const starterWeight = pi < 11 ? 1 : r() * 0.6;
      const apps = Math.round(2 + starterWeight * 7);
      const starts = Math.min(apps, Math.round(apps * (0.4 + starterWeight * 0.6)));
      const minutes = starts * 90 + (apps - starts) * Math.round(20 + r() * 30);
      const attack = slot.position === "AVA" ? 1 : slot.position === "MED" ? 0.5 : 0.15;
      const availabilityRoll = r();
      const unavailable = availabilityRoll > 0.92;
      const yellows = Math.round(r() * (slot.position === "DEF" || slot.position === "MED" ? 4 : 2));
      players.push({
        id: `${team.id}-p${pi + 1}`,
        name,
        teamId: team.id,
        position: slot.position,
        detailedPosition: slot.detail,
        shirt: pi + 1,
        age: 18 + Math.floor(r() * 18),
        nationality: r() > 0.9 ? "Brasil" : "Portugal",
        apps,
        starts,
        minutes,
        goals: Math.round(r() * 6 * attack),
        assists: Math.round(r() * 4 * attack),
        yellows,
        reds: r() > 0.94 ? 1 : 0,
        availability: unavailable ? (r() > 0.5 ? "lesionado" : yellows >= 4 ? "suspenso" : "duvida") : "disponivel",
        ...(unavailable
          ? { availabilityNote: "Registo do boletim clínico de exemplo", availabilitySource: demoSource }
          : {}),
        source: demoSource,
      });
    });
  });
  return players;
}

const ROUNDS_TOTAL = 18;
const ROUNDS_PLAYED = 9;

/** Calendário round-robin simples (método do círculo). */
function buildMatches(teams: Team[], players: Player[]): Match[] {
  const ids = teams.map((t) => t.id);
  const n = ids.length;
  const matches: Match[] = [];
  const r = rng(7);
  const start = new Date("2026-09-06T16:00:00.000Z").getTime();
  const rotation = [...ids];

  for (let round = 1; round <= ROUNDS_TOTAL; round++) {
    const firstLeg = round <= n - 1;
    const idx = (round - 1) % (n - 1);
    const arr = [rotation[0], ...rotation.slice(1)];
    // rodar
    const rot = [arr[0]!, ...arr.slice(1 + idx), ...arr.slice(1, 1 + idx)];
    for (let i = 0; i < n / 2; i++) {
      const a = rot[i]!;
      const b = rot[n - 1 - i]!;
      const home = firstLeg ? (i % 2 === 0 ? a : b) : i % 2 === 0 ? b : a;
      const away = home === a ? b : a;
      const played = round <= ROUNDS_PLAYED;
      const inPlay = round === ROUNDS_PLAYED + 1 && i === 0;
      const homeTeam = teams.find((t) => t.id === home)!;
      const kickoff = new Date(start + (round - 1) * 7 * 86400000 + i * 5400000).toISOString();
      const pickXI = (teamId: string) =>
        players
          .filter((p) => p.teamId === teamId)
          .slice(0, 14)
          .sort((x, y) => (y.minutes ?? 0) - (x.minutes ?? 0))
          .slice(0, 11)
          .map((p) => p.id);
      matches.push({
        id: `m-${round}-${home}-${away}`,
        seasonId: "s2026",
        competitionId: "afs-d1",
        round,
        kickoff,
        venue: homeTeam.stadium,
        homeTeamId: home,
        awayTeamId: away,
        status: played ? "realizado" : inPlay ? "em-curso" : "proximo",
        homeGoals: played ? Math.floor(r() * 4) : inPlay ? 1 : null,
        awayGoals: played ? Math.floor(r() * 3) : inPlay ? 0 : null,
        ...(played ? { lineups: { home: pickXI(home), away: pickXI(away) } } : {}),
        source: demoSource,
      });
    }
  }
  return matches;
}

function build(): Dataset {
  const teams = buildTeams();
  const players = buildPlayers(teams);
  const matches = buildMatches(teams, players);
  return {
    competitions: [
      { id: "afs-d1", name: "Campeonato Distrital - 1.ª Divisão", association: "AF Setúbal" },
    ],
    seasons: [{ id: "s2026", label: "2026/27", competitionId: "afs-d1", rounds: ROUNDS_TOTAL }],
    teams,
    players,
    matches,
    teamHistory: [],
    preparationMatches: [],
    isDemo: true,
    source: demoSource,
  };
}

export const demoDataset: Dataset = build();
export const DEMO_SOURCE = demoSource;
export { ROUNDS_PLAYED, ROUNDS_TOTAL };
