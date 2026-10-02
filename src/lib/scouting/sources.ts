// Camada de fontes de dados configurável.
// A app funciona hoje com o conjunto de demonstração e com importação manual/CSV.
// Cada conector declara o seu estado; nenhum conector inventa dados.

import type { Dataset, DataOrigin, SourceRef } from "./types";
import { realDataset, FPF_COMPETITION_URL, FPF_SYNCED_AT } from "./real-data";

export type ConnectorStatus = "ativo" | "por-ligar" | "manual";

export interface DataSourceConnector {
  id: DataOrigin;
  label: string;
  url?: string;
  description: string;
  status: ConnectorStatus;
  /** O que este conector fornece quando estiver autorizado */
  provides: string[];
  lastSyncAt: string | null;
}

export const connectors: DataSourceConnector[] = [
  {
    id: "fpf",
    label: "FPF Resultados (AF Setúbal)",
    url: FPF_COMPETITION_URL,
    description:
      "Portal oficial de resultados. Fonte das equipas, calendário, datas, horas e campos da época 2026/27.",
    status: "ativo",
    provides: ["Equipas", "Calendário", "Resultados", "Classificação"],
    lastSyncAt: FPF_SYNCED_AT,
  },
  {
    id: "zerozero",
    label: "zerozero.pt",
    url: "https://www.zerozero.pt",
    description:
      "Fonte principal prevista para calendário, resultados, classificação, plantéis e estatísticas individuais. Requer API/autorização de utilização antes de ser ligada.",
    status: "por-ligar",
    provides: ["Calendário", "Resultados", "Classificação", "Plantéis", "Minutos", "Cartões"],
    lastSyncAt: null,
  },
  {
    id: "af-setubal",
    label: "AF Setúbal (site oficial)",
    url: "https://www.afsetubal.pt",
    description:
      "Fonte oficial para comunicados, castigos disciplinares, alterações de horários e campos.",
    status: "por-ligar",
    provides: ["Jornadas", "Castigos", "Alterações de calendário"],
    lastSyncAt: null,
  },
  {
    id: "clube",
    label: "Páginas oficiais dos clubes",
    description:
      "Complemento para plantéis, convocatórias, boletins clínicos e emblemas autorizados.",
    status: "por-ligar",
    provides: ["Convocatórias", "Lesões", "Emblemas (com licença)"],
    lastSyncAt: null,
  },
  {
    id: "csv",
    label: "Importação manual / CSV",
    description:
      "Via disponível de imediato para carregar dados reais enquanto não existir fonte automática autorizada.",
    status: "manual",
    provides: ["Jogos", "Resultados", "Plantéis", "Estatísticas"],
    lastSyncAt: null,
  },
  {
    id: "manual",
    label: "Correção do analista",
    description:
      "Edições feitas na área de administração. Cada alteração fica registada com data, campo, valor anterior e novo.",
    status: "manual",
    provides: ["Correções pontuais", "Notas de observação"],
    lastSyncAt: null,
  },
];

export function connectorLabel(origin: DataOrigin): string {
  return connectors.find((c) => c.id === origin)?.label ?? origin;
}

export function formatSource(source: SourceRef): string {
  return `${source.label} · atualizado a ${new Date(source.syncedAt).toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  })}`;
}

/** Conjunto de dados ativo: dados reais da FPF (época 2026/27). */
export function getDataset(): Dataset {
  return realDataset;
}
