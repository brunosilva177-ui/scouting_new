// Persistência local do trabalho do analista: notas, onzes prováveis,
// relatórios guardados (com versões) e registo de alterações manuais.

import { useCallback, useEffect, useState } from "react";
import type { AnalystNotes, AuditEntry, SavedReport } from "./types";

const KEY = "scouting-afs-v1";

interface StoreState {
  notes: Record<string, Record<string, AnalystNotes>>; // matchId -> teamId -> notas
  lineups: Record<string, Record<string, string[]>>; // matchId -> teamId -> ids
  reports: SavedReport[];
  audit: AuditEntry[];
}

const empty: StoreState = { notes: {}, lineups: {}, reports: [], audit: [] };

function read(): StoreState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as StoreState) } : empty;
  } catch {
    return empty;
  }
}

function write(state: StoreState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("scouting-store-change"));
}

export function useScoutingStore() {
  const [state, setState] = useState<StoreState>(empty);

  useEffect(() => {
    setState(read());
    const handler = () => setState(read());
    window.addEventListener("scouting-store-change", handler);
    return () => window.removeEventListener("scouting-store-change", handler);
  }, []);

  const update = useCallback((fn: (s: StoreState) => StoreState) => {
    const next = fn(read());
    write(next);
    setState(next);
  }, []);

  const setNote = useCallback(
    (matchId: string, teamId: string, field: keyof AnalystNotes, value: string) => {
      update((s) => ({
        ...s,
        notes: {
          ...s.notes,
          [matchId]: { ...(s.notes[matchId] ?? {}), [teamId]: { ...(s.notes[matchId]?.[teamId] ?? {}), [field]: value } },
        },
      }));
    },
    [update],
  );

  const setLineup = useCallback(
    (matchId: string, teamId: string, ids: string[]) => {
      update((s) => ({
        ...s,
        lineups: { ...s.lineups, [matchId]: { ...(s.lineups[matchId] ?? {}), [teamId]: ids } },
      }));
    },
    [update],
  );

  const logChange = useCallback(
    (entry: Omit<AuditEntry, "id" | "at">) => {
      update((s) => ({
        ...s,
        audit: [{ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() }, ...s.audit].slice(0, 200),
      }));
    },
    [update],
  );

  const saveReport = useCallback(
    (matchId: string, title: string) => {
      update((s) => {
        const existing = s.reports.filter((r) => r.matchId === matchId);
        const version = existing.length ? Math.max(...existing.map((r) => r.version)) + 1 : 1;
        const report: SavedReport = {
          id: crypto.randomUUID(),
          matchId,
          title,
          version,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: s.notes[matchId] ?? {},
          lineupOverrides: s.lineups[matchId] ?? {},
        };
        return { ...s, reports: [report, ...s.reports] };
      });
    },
    [update],
  );

  return { ...state, setNote, setLineup, logChange, saveReport };
}
