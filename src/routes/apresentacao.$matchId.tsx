import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScoutingDeck } from "@/components/scouting/deck";
import { getDataset } from "@/lib/scouting/sources";
import { useScoutingStore } from "@/lib/scouting/store";
import { createDeckPdf } from "@/lib/scouting/pdf";

export const Route = createFileRoute("/apresentacao/$matchId")({
  head: () => ({
    meta: [
      { title: "Apresentação de scouting em PDF | AF Setúbal 1.ª Divisão" },
      {
        name: "description",
        content:
          "Apresentação técnica pré-jogo em formato A4 horizontal, pronta para criar PDF: capa, perfis, plantéis, onzes prováveis, comparação e chaves do jogo.",
      },
      { property: "og:title", content: "Apresentação de scouting em PDF — AF Setúbal 1.ª Divisão" },
      {
        property: "og:description",
        content: "Deck de scouting pré-jogo em A4 horizontal, com fonte identificada em cada secção.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeckPageRoute,
});

function DeckPageRoute() {
  const { matchId } = Route.useParams();
  const ds = getDataset();
  const match = ds.matches.find((m) => m.id === matchId);
  if (!match) throw notFound();
  const m = match;

  const home = ds.teams.find((t) => t.id === match.homeTeamId)!;
  const away = ds.teams.find((t) => t.id === match.awayTeamId)!;
  const store = useScoutingStore();
  const deckRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function handlePdf() {
    if (!deckRef.current) return;
    setBusy(true);
    const t = toast.loading("A criar PDF (A4 horizontal)…");
    try {
      await createDeckPdf(
        deckRef.current,
        `Scouting-${home.shortName}-vs-${away.shortName}-J${m.round}.pdf`.replace(/\s+/g, "-"),
      );
      toast.success("PDF criado.", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível criar o PDF.", { id: t });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="no-print mx-auto mb-5 flex max-w-[1123px] flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/relatorio/$matchId" params={{ matchId }}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao relatório
          </Link>
        </Button>
        <Button size="sm" onClick={handlePdf} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileDown className="mr-1 h-4 w-4" />}
          Criar PDF
        </Button>
      </div>

      <div className="mx-auto w-full max-w-[1123px] overflow-x-auto">
        <div ref={deckRef}>
          <ScoutingDeck
            ds={ds}
            match={match}
            home={home}
            away={away}
            notes={store.notes[match.id]}
            lineups={store.lineups[match.id]}
          />
        </div>
      </div>
    </main>
  );
}
