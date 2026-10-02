<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Real data lives in src/lib/scouting/fpf-2026-27.json (scraped from resultados.fpf.pt, competitionId 29857 / seasonId 106) and is exposed via real-data.ts; demo-data.ts is no longer used — keeps reports tied to an official, cited source.
- Pre-season 2026/27 and historical 2025/26 context live separately from current-season matches and never feed 2026/27 calculations — prevents cross-season statistics from being conflated.
- Match events (goals, cards, subs) come from official FPF match sheets in src/lib/scouting/fpf-events-*.json and are analysed in discipline.ts; each match keeps its season label and 2026/27 matches take priority once added — referee-focus analysis must stay traceable to the official sheet.
