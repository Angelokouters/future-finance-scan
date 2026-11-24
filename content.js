// Uitslagteksten en advieslogica-content. Alle teksten in één bestand,
// zodat Sales en Marketing ze kunnen aanpassen zonder de logica te raken.

// Vijf dimensies van de publieke Finance Growth & Control Score.
export const DIMENSIONS = [
  { key: 'cr', name: 'Close & Reporting', nl: 'afsluiting en rapportage', questions: ['q3', 'q3a', 'q4'], weight: 0.25 },
  { key: 'dc', name: 'Data & Control', nl: 'betrouwbaarheid van cijfers', questions: ['q5', 'q5a'], weight: 0.20 },
  { key: 'ef', name: 'Efficiency', nl: 'handmatig werk', questions: ['q6', 'q9'], weight: 0.20 },
  { key: 'co', name: 'Continuity', nl: 'persoonsafhankelijkheid', questions: ['q7'], weight: 0.15 },
  { key: 'sc', name: 'Scalability', nl: 'schaalbaarheid bij groei', questions: ['q2', 'q8'], weight: 0.20 }
];

// Gelijke stand bij laagste dimensie: dimensie die past bij antwoord op vraag 9 krijgt voorrang.
export const Q9_TO_DIMENSION = ['cr', 'cr', 'sc', 'dc', 'ef', 'dc', null];

export const PROFILES = [
  {
    min: 0, band: '0–39', name: 'Kwetsbaar onder druk',
    message: 'De huidige werkwijze bevat meerdere knelpunten die snelheid, betrouwbaarheid of continuïteit beperken. Groei kan de druk snel vergroten.',
    cta: 'Valideer in een persoonlijke score-review de grootste risico’s en de mogelijke impact.'
  },
  {
    min: 40, band: '40–59', name: 'Werkbaar, maar arbeidsintensief',
    message: 'De basis functioneert, maar Finance compenseert waarschijnlijk met handmatige acties, extra controles of specialistische kennis. Bij verdere groei neemt de druk sneller toe dan de beschikbare capaciteit.',
    cta: 'Bepaal samen welke twee verbeterpunten de meeste capaciteit en businessimpact opleveren.'
  },
  {
    min: 60, band: '60–79', name: 'In control met verbeterpotentieel',
    message: 'De processen zijn grotendeels beheerst. Gerichte verbeteringen kunnen tijd vrijmaken en groei eenvoudiger ondersteunen.',
    cta: 'Leg de uitkomst naast een praktisch volwassenheidsmodel en bepaal een gerichte verbeterprioriteit.'
  },
  {
    min: 80, band: '80–100', name: 'Schaalbaar en vooruitkijkend',
    message: 'Finance lijkt groei en besluitvorming goed te ondersteunen. De focus kan liggen op verdere optimalisatie en voorspellende sturing.',
    cta: 'Bepaal in een score-review de volgende optimalisatiefase.'
  }
];

// Thematische feedbackbibliotheek (brief hoofdstuk 8).
export const INSIGHT = {
  cr: 'De maandafsluiting en rapportage vragen relatief veel afstemming. Hierdoor komt informatie later beschikbaar en blijft minder tijd over voor analyse.',
  dc: 'Verschillen tussen systemen of bestanden leiden tot extra controlewerk en mogelijk discussie over de juiste cijfers.',
  ef: 'Een aanzienlijk deel van de capaciteit gaat mogelijk naar handmatige verwerking of goedkeuring.',
  co: 'Kritieke kennis of processtappen zijn mogelijk onvoldoende overdraagbaar.',
  sc: 'Meer volume of extra entiteiten leiden waarschijnlijk tot extra werkdruk of personeelsbehoefte.'
};

// Persoonlijke echo van het gekozen antwoord bij het grootste knelpunt.
export const ECHO_QUESTION = { cr: 'q4', dc: 'q5', ef: 'q6', co: 'q7', sc: 'q8' };
export const ECHO = {
  cr: [
    'Managementvragen zijn direct te beantwoorden, maar de afsluiting zelf vraagt relatief veel afstemming.',
    'Analyses komen dezelfde dag, maar de afsluiting zelf vraagt relatief veel afstemming.',
    'Managementinformatie vraagt gegevens uit meerdere bronnen en extra rekenwerk.',
    'Nieuwe managementvragen vragen nieuwe spreadsheets en berekeningen.',
    'Ad-hocanalyses zijn afhankelijk van één specifieke medewerker.'
  ],
  dc: [
    'Verschillen komen zelden voor, maar vragen dan relatief veel uitzoekwerk.',
    'Finance verklaart enkele keren per jaar verschillen tussen rapportages of systemen.',
    'Finance verklaart maandelijks verschillen tussen rapportages, systemen of spreadsheets.',
    'Finance verklaart meerdere keren per maand verschillen tussen rapportages of systemen.',
    'Verschillen verklaren is een vast onderdeel van het rapportageproces.'
  ],
  ef: [
    'De meeste onnodige tijd gaat naar handmatig verwerken van facturen.',
    'De meeste onnodige tijd gaat naar het opvragen van goedkeuringen.',
    'De meeste onnodige tijd gaat naar het controleren van declaraties.',
    'De meeste onnodige tijd gaat naar gegevens overzetten tussen systemen.',
    'De meeste onnodige tijd gaat naar het samenstellen van rapportages.',
    'De meeste onnodige tijd gaat naar consolidatie en intercompany-afstemming.',
    'De meeste onnodige tijd gaat naar correcties en aansluitingen.',
    'U ervaart weinig onnodig handwerk, maar de impact op de organisatie is wel merkbaar.'
  ],
  co: [
    'Werk wordt goed overgenomen, maar de continuïteit verdient aandacht in combinatie met andere antwoorden.',
    'Bij zes weken afwezigheid van een sleutelmedewerker lopen enkele processen vertraging op.',
    'Belangrijke kennis is onvoldoende vastgelegd.',
    'Bij afwezigheid van een sleutelmedewerker komt de afsluiting serieus onder druk.',
    'Het risico van afwezigheid van een sleutelmedewerker is nog niet onderzocht.'
  ],
  sc: [
    'De processen kunnen meer volume aan, maar de ontwikkeling vraagt aandacht.',
    'Bij 30% meer transacties zijn procesaanpassingen nodig.',
    'Bij 30% meer transacties neemt de werkdruk duidelijk toe.',
    'Bij 30% meer transacties is extra Finance-capaciteit nodig.',
    'Bij 30% meer transacties zijn achterstanden, fouten of vertraging waarschijnlijk.'
  ]
};

// Zakelijke impact op basis van vraag 9: [kop, adviserende tekst].
export const IMPACT = [
  ['Managementinformatie komt te laat', 'Managementinformatie komt mogelijk later beschikbaar dan nodig. Daardoor stuurt het management op cijfers die al achterlopen.'],
  ['Te weinig tijd voor analyse en advies', 'Finance besteedt te weinig tijd aan analyse en advies. Daardoor blijft minder capaciteit over voor ondersteuning van managementbeslissingen.'],
  ['Groei vraagt snel extra mensen', 'Groei vertaalt zich snel in extra personeelsbehoefte. Dat maakt groei duurder dan nodig.'],
  ['Risico’s worden laat zichtbaar', 'Financiële risico’s worden mogelijk pas laat zichtbaar. Dat verkleint de tijd om bij te sturen.'],
  ['Veel tijd naar correcties', 'Een deel van de capaciteit gaat naar correcties. Die tijd komt niet ten goede aan analyse of advies.'],
  ['Audits vragen veel voorbereiding', 'Audits en controles vragen relatief veel voorbereiding. Dat legt periodiek extra druk op het team.'],
  ['Nu geen merkbare impact', 'U ervaart op dit moment geen merkbare zakelijke impact. Dat is een goede uitgangspositie om gericht te optimaliseren.']
];

// Vraag 10: welke beslissing wordt geraakt (index 6 = weinig invloed, geen zin toevoegen).
export const DECISION = [
  'cashflow- en werkkapitaalsturing',
  'kostenbeheersing',
  'forecasting en budgettering',
  'investeringsbeslissingen',
  'sturing per entiteit of businessunit',
  'de integratie van overnames'
];

// Aanbevolen eerste stap op basis van vraag 12 (persoonlijke prioriteit).
export const FIRST_STEP = [
  'Visualiseer de afsluitkalender van één maand. Markeer wachttijd, correcties en overdrachtsmomenten en kies de twee stappen met de meeste vertraging.',
  'Selecteer één terugkerend managementrapport en registreer alle databronnen, handmatige correcties en controlemomenten. Dit maakt zichtbaar waar snelheid en betrouwbaarheid het meest verloren gaan.',
  'Meet twee weken lang hoeveel handelingen en minuten één veelvoorkomend proces vraagt, bijvoorbeeld factuurverwerking.',
  'Leg voor één consolidatieronde vast welke entiteiten, correcties en intercompany-afstemmingen handmatig gebeuren.',
  'Breng voor één maand in kaart welke verplichtingen vooraf zijn goedgekeurd en welke pas bij de factuur zichtbaar worden.',
  'Tel voor één maand het aantal declaraties, controlemomenten en terugvragen per declaratie.',
  'Documenteer de vijf meest kritieke activiteiten met eigenaar, back-up en werkinstructie.',
  'Voer een 30%-groeisimulatie uit met één extra land of entiteit en bepaal welke processtap als eerste de capaciteit overschrijdt.'
];

export const DISCLAIMER = 'Indicatieve volwassenheids- en risicoscore op basis van uw antwoorden. Geen audit of officieel advies.';
