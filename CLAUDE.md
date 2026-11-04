# E2E Tracker

Interaktiv end-to-end testoversigt for en testmanager: flow map (flows i afhængighedsrækkefølge), systemer, feature-status, defects sporet til features, og hvem der er bagud. Brugeren skriver ofte på dansk — svar på samme sprog.

## Arbejdsgang

**Følg altid skillen `e2e-workflow`** (`.claude/skills/e2e-workflow/SKILL.md`): Analyse og Design → Implementation → Deploy. Start i Analyse og Design, og skift kun fase, når brugeren beder om det. Den løbende changelog står i `CHANGELOG.md`.

## Filer

- `index.html` — selve siden (HTML, CSS og JS i én fil, uden byggetrin). Skrives uden `<!doctype>/<html>/<head>/<body>`; claude.ai pakker den ind ved publicering.
- `E2E-Tracker.html` — den delbare standalone-kopi. Genereres med `node scripts/build.js`; redigér den aldrig i hånden.
- `scripts/test.js` — smoke-tests (Playwright, headless Chromium). `scripts/build.js` — bygger standalone-filen.
- `tests/fixtures/` — eksempler på den tekst, Microsoft 365-connectoren returnerer for arbejdsbogen (to formater).

## Faste fakta

- Publiceret artefakt: https://claude.ai/artifact/7cuS9TxyHkmxfCmQkJWFE9 (capabilities: `mcp` → Microsoft 365 `read_resource`, `downloads`).
- Arbejdsbog: OneDrive `E2E.xlsx`, URI `file:///267E4B7D2ECAE911/267E4B7D2ECAE911!s25619702286d4c55a8bc9c402a1402f5`. Ark: System (Title, Flow), Flow (Title, Dependant), Feature (Title, Flow, Status), Defects (Title, Feature, Category, Status).
- Den indbyggede data i `index.html` (`<script id="e2e-data">`) bør svare til arbejdsbogen ved deploy.
- GitHub: `Raythomwill/Raythomwill-e2e-tracker`, standardbranch `main`.

## Konventioner

- Farver: feature-status New grå, Started lyseblå, Implemented blå, Testing gul, OK grøn. Progress %: 100 grøn, 75 blå, 50 gul, 25 orange, 0 rød. Defect-kategori: Critical rød, High orange, Medium lilla, Low skifer.
- Alle farver er tokens på `:root` med lyse og mørke værdier; ny UI skal virke i begge temaer og ved 400 px bredde.
