---
name: e2e-workflow
description: Arbejdsgangen for E2E Tracker. Brug den ved ALT arbejde i dette repo — idéer, ændringsønsker, fejl, features, PR'er og deploy. Arbejdet går altid gennem tre faser — Analyse og Design, Implementation, Deploy — og man skifter kun fase, når brugeren siger det.
---

# E2E Tracker — arbejdsgang

Alt arbejde går gennem tre faser i denne rækkefølge. Sig altid kort, hvilken fase vi er i, når den skifter. Skift kun fase, når brugeren beder om det (fx "implementér", "byg det", "lav PR" → Implementation; "deploy", "udgiv", "gå live" → Deploy). Er det uklart, så bliv i den nuværende fase og spørg.

## 1. Analyse og Design (standardfasen)

Vi sparrer om ændringer, idéer, features og fejl. Ingen kode ændres.

- Diskutér løsninger, giv en anbefaling, og vis gerne skitser eller eksempler i chatten.
- Saml hver beslutning i **`CHANGELOG.md`** under **"Næste release (under design)"**: én kort linje pr. ændring, skrevet som det brugeren vil se (fx "Systems: vælg flere systemer på én gang").
- Opdatér listen løbende: tilføj, ret eller fjern linjer, når vi ændrer mening. Markér åbne spørgsmål med `(åbent: …)`.
- Changelog-ændringer må committes og pushes direkte på `main`, så de ikke går tabt — det er det eneste, der må committes i denne fase.
- Afslut med at vise den aktuelle liste, så brugeren kan godkende den.

## 2. Implementation

Byg det, der står i "Næste release (under design)". **Ingen deploy.**

1. Ny branch fra opdateret `main` (`git fetch origin main && git checkout -B <kort-navn> origin/main`). Én branch pr. sammenhængende ændring.
2. Implementér i `index.html` (selve siden). Hold `README.md` opdateret, når adfærd ændres.
3. Udvid `scripts/test.js` med tests for det nye.
4. Kør `node scripts/test.js` — alle tests skal bestå. Kør `node scripts/build.js` for at opdatere `E2E-Tracker.html`.
5. Commit, push branchen og opret PR (se "PR'er" nedenfor) med changelog-linjerne i beskrivelsen og testresultatet.
6. Flyt de færdige linjer i `CHANGELOG.md` fra "under design" til **"Klar til deploy"** med PR-link.
7. **Publicér ikke** artefaktet, merge ikke, og send ikke filer som "den nye version". Vis gerne et skærmbillede af ændringen.

## 3. Deploy

Kun når brugeren beder om det. Forudsætning: alle PR'er under "Klar til deploy" er klar, og byg og test er kørt.

1. Merge PR'erne til `main` (REST, se nedenfor), og hent `main`.
2. Kør `node scripts/test.js` og `node scripts/build.js` på `main` igen. Stop og meld tilbage, hvis noget fejler.
3. Commit et eventuelt opdateret `E2E-Tracker.html` på `main`.
4. Publicér `index.html` til artefaktet **https://claude.ai/artifact/7cuS9TxyHkmxfCmQkJWFE9** (Artifact-værktøjet med `url` og `file_path` = `index.html`; behold capabilities).
5. Send `E2E-Tracker.html` til brugeren som den nye delbare version.
6. I `CHANGELOG.md`: flyt "Klar til deploy" til en ny sektion `## <dato> (artefakt version N)`, og tøm de to øverste sektioner. Commit og push.
7. Opsummér kort, hvad der gik live.

## PR'er

`gh pr create` virker ikke her (GitHub GraphQL er blokeret), så brug REST:

```bash
gh api repos/Raythomwill/Raythomwill-e2e-tracker/pulls -f title="…" -f head="<branch>" -f base=main -f body="…"
gh api -X PUT repos/Raythomwill/Raythomwill-e2e-tracker/pulls/<nr>/merge -f merge_method=squash
```

Virker `gh` slet ikke (ugyldigt token), så push branchen, og giv brugeren linket `https://github.com/Raythomwill/Raythomwill-e2e-tracker/compare/main...<branch>?expand=1`, så de selv kan oprette PR'en.
