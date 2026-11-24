# Finance Growth & Control Quickscan

Anonieme, mobile-first quickscan voor finance-organisaties in de Mid Market. De deelnemer beantwoordt 12 vragen (plus maximaal 2 conditionele vervolgvragen), laat vier gegevens achter en ziet direct een persoonlijke uitslag met score, profiel, grootste knelpunt, zakelijke impact en een concrete eerste stap.

Gebouwd in vanilla HTML, CSS en JavaScript (ES modules). Geen framework, geen build-stap, geen dependencies.

## Starten

Vereist Node.js 18 of hoger.

```bash
npm start      # start een lokale server op http://localhost:5173
npm test       # test de scorelogica
```

Let op: open `index.html` niet direct als bestand. ES modules werken alleen via een (lokale) webserver. Elke statische server volstaat, bijvoorbeeld ook `python3 -m http.server`.

## Projectstructuur

```
index.html                 Ingang van de applicatie
public/favicon.svg         Favicon
src/
  app.js                   Schermen, navigatie, formulieren, modal, opslag
  styles.css               Alle styling (mobile-first, responsive)
  data/
    questions.js           Alle vragen, antwoorden en antwoordwaarden
    content.js             Dimensies, profielen en alle uitslagteksten
  logic/
    scoring.js             Score- en advieslogica (pure functies)
  services/
    api.js                 Koppelpunten met de backend (nu stubs)
    analytics.js           Analytics-events naar window.dataLayer
tests/
  scoring.test.js          Tests voor de scorelogica
```

Teksten aanpassen kan in `src/data/` zonder de logica te raken.

## Schermen

1. Landingspagina
2. Introductie
3. Vraag 1 tot en met 12, met vraag 3A en 5A alleen wanneer van toepassing
4. Tussenscherm na vraag 6
5. Gegevens (voornaam, zakelijk e-mailadres, bedrijfsnaam, functie)
6. Laadscherm
7. Uitslag
8. Afspraakmodal (telefoonnummer wordt alleen hier gevraagd)
9. E-mailpreview na "Mail mij de uitslag"

Review-modus: met `?demo=` open je elk scherm direct, gevuld met het voorbeeldprofiel. Waarden: `landing`, `intro`, `q1` … `q12`, `q3a`, `q5a`, `tussen`, `gegevens`, `laden`, `uitslag`, `afspraak`, `email`. Voorbeeld: `http://localhost:5173/?demo=uitslag`.

## Scorelogica

Publieke Finance Growth & Control Score (zichtbaar voor de deelnemer):

- Elk antwoord heeft een waarde van 1 tot 5 (`v` in `questions.js`).
- Dimensiescore = ((gemiddelde waarde − 1) / 4) × 100.
- Totaalscore = gewogen gemiddelde van de dimensies, afgerond.
- Overgeslagen conditionele vragen tellen niet mee.

| Dimensie | Vragen | Weging |
| --- | --- | --- |
| Close & Reporting | 3, 3A, 4 | 25% |
| Data & Control | 5, 5A | 20% |
| Efficiency | 6, 9 | 20% |
| Continuity | 7 | 15% |
| Scalability | 2, 8 | 20% |

Profielen: 0–39 Kwetsbaar onder druk · 40–59 Werkbaar, maar arbeidsintensief · 60–79 In control met verbeterpotentieel · 80–100 Schaalbaar en vooruitkijkend.

Uitslagregels:

- Grootste knelpunt = laagste dimensie; bij gelijke stand wint de dimensie die past bij het antwoord op vraag 9.
- Zakelijke impact = vraag 9, aangevuld met de beslissing uit vraag 10.
- Relevante ontwikkeling = vraag 11; zonder aanleiding vraag 2; zonder beide: optimalisatie.
- Aanbevolen eerste stap = vraag 12.

Het voorbeeldprofiel geeft 54/100, profiel "Werkbaar, maar arbeidsintensief", knelpunt Close & Reporting 42/100 (zie `tests/scoring.test.js`).

## Wat de backend moet doen

De interne ICP & Opportunity Score en de A/B/C-leadroutering staan bewust niet in deze code: de deelnemer mag die nooit kunnen zien. In `src/services/api.js` staan drie koppelpunten die nu niets versturen zolang `API_BASE` leeg is:

- `POST /leads`: lead en antwoorden opslaan, interne score berekenen, routeren naar CRM.
- `POST /result-email`: samenvatting per e-mail versturen.
- `POST /review`: score-review inplannen.

## Privacy en opslag

- Antwoorden worden tussentijds bewaard in `localStorage` op het apparaat van de deelnemer, zonder persoonsgegevens. Na de uitslag worden ze gewist.
- De deelbare link bevat alleen de antwoorden, geen naam of e-mailadres.
- Analytics-events bevatten geen persoonsgegevens.

## Analytics-events

`quickscan_viewed`, `quickscan_started`, `question_answered`, `conditional_question_viewed`, `quickscan_abandoned`, `lead_form_viewed`, `lead_submitted`, `result_viewed`, `result_emailed`, `review_cta_clicked`, `review_booked`. Ze worden op `window.dataLayer` gezet.

## Openstaande punten

- Vraag 2 scoort volgens de brief meer verandering als hogere volwassenheid. Valideren voordat de scan live gaat.
- De afspraakdagen zijn de eerstvolgende drie werkdagen met vaste tijden. In productie koppelen aan een echte agenda.
- De privacylink in de footer verwijst nog nergens naar.
