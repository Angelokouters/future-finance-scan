// Alle vragen van de Finance Growth & Control Quickscan.
// `v` = publieke volwassenheidswaarde per antwoord (1 = zwak, 5 = sterk).
// Vragen zonder `v` tellen niet mee in de publieke score.
// De interne ICP & Opportunity Score hoort NIET in de frontend (zie README).

export const QUESTIONS = {
  q1: {
    nr: 1, theme: 'Organisatiecomplexiteit', type: 'Context',
    title: 'Welke beschrijving past het beste bij de financiële organisatie?',
    help: 'Kies wat nu het meest van toepassing is.',
    options: [
      '1 entiteit en 1 administratie',
      'Meerdere administraties of businessunits',
      'Meerdere juridische entiteiten',
      'Meerdere landen of valuta',
      'Meerdere entiteiten én meerdere landen of valuta'
    ]
  },
  q2: {
    nr: 2, theme: 'Verwachte ontwikkeling', type: 'Context en compelling event',
    title: 'Welke ontwikkeling is de komende 24 maanden het meest relevant?',
    options: [
      'Groei van transactievolume',
      'Nieuwe entiteit, overname of fusie',
      'Internationale uitbreiding',
      'Professionalisering of centralisatie van Finance',
      'Kostenbesparing of efficiencyprogramma',
      'Vervanging van financiële software',
      'Geen grote verandering voorzien'
    ],
    v: [4, 5, 5, 3, 3, 4, 1]
  },
  q3: {
    nr: 3, theme: 'Druk tijdens de maandafsluiting', type: 'Pijn',
    title: 'Wat veroorzaakt momenteel de meeste druk tijdens de maandafsluiting?',
    options: [
      'Gegevens verzamelen uit verschillende systemen',
      'Correcties en aansluitverschillen uitzoeken',
      'Intercompany-transacties afstemmen',
      'Rapportages handmatig samenstellen',
      'Afhankelijkheid van één of enkele medewerkers',
      'De maandafsluiting veroorzaakt weinig druk'
    ],
    v: [2, 1, 2, 2, 1, 5]
  },
  q3a: {
    nr: 3, sub: true, theme: 'Impact van de maandafsluiting', type: 'Conditionele impact',
    title: 'Wat is meestal het directe gevolg?',
    help: 'Een korte aanvulling op uw vorige antwoord.',
    options: [
      'Rapportage komt later beschikbaar',
      'Extra controlewerk of overuren',
      'Discussie over de juiste cijfers',
      'Andere Finance-activiteiten blijven liggen',
      'Fouten of correcties achteraf',
      'Beperkte merkbare impact'
    ],
    v: [2, 2, 1, 3, 1, 4],
    // Alleen tonen bij een van de eerste vijf antwoorden op vraag 3
    showIf: (a) => a.q3 != null && a.q3 < 5
  },
  q4: {
    nr: 4, theme: 'Flexibiliteit van rapportage', type: 'Pijn',
    title: 'Wat gebeurt er wanneer het management onverwacht om een andere financiële analyse vraagt?',
    options: [
      'De informatie is direct beschikbaar',
      'Finance kan de analyse dezelfde dag opleveren',
      'Gegevens moeten uit verschillende bronnen worden verzameld',
      'Nieuwe spreadsheets of berekeningen zijn nodig',
      'Alleen een specifieke medewerker kan de analyse maken'
    ],
    v: [5, 4, 3, 2, 1]
  },
  q5: {
    nr: 5, theme: 'Betrouwbaarheid van cijfers', type: 'Pijn',
    title: 'Hoe vaak moet Finance verschillen tussen rapportages, systemen of spreadsheets verklaren?',
    options: [
      'Vrijwel nooit',
      'Enkele keren per jaar',
      'Maandelijks',
      'Meerdere keren per maand',
      'Dit is een terugkerend onderdeel van het rapportageproces'
    ],
    v: [5, 4, 3, 2, 1]
  },
  q5a: {
    nr: 5, sub: true, theme: 'Impact van verschillen', type: 'Conditionele impact',
    title: 'Wat is hiervan meestal het belangrijkste gevolg?',
    help: 'Een korte aanvulling op uw vorige antwoord.',
    options: [
      'Vertraging in rapportage',
      'Extra controlewerk',
      'Discussie over de juiste cijfers',
      'Correcties achteraf',
      'Minder vertrouwen bij management',
      'Geen merkbaar gevolg'
    ],
    v: [2, 3, 2, 2, 1, 4],
    // Alleen tonen bij maandelijks of vaker
    showIf: (a) => a.q5 != null && a.q5 >= 2
  },
  q6: {
    nr: 6, theme: 'Onnodig handmatig werk', type: 'Pijn en oplossingsroute',
    title: 'Aan welke activiteit besteedt het Finance-team naar uw inschatting de meeste onnodige tijd?',
    options: [
      'Handmatig verwerken van facturen',
      'Goedkeuringen opvragen',
      'Declaraties controleren',
      'Gegevens overzetten tussen systemen',
      'Rapportages samenstellen',
      'Consolidatie en intercompany-afstemming',
      'Correcties en aansluitingen',
      'Geen van deze activiteiten'
    ],
    v: [2, 3, 3, 2, 3, 1, 1, 5]
  },
  q7: {
    nr: 7, theme: 'Persoonsafhankelijkheid', type: 'Pijn en operationeel risico',
    title: 'Wat gebeurt er als een belangrijke Finance-medewerker zes weken afwezig is?',
    options: [
      'De werkzaamheden worden zonder problemen overgenomen',
      'Enkele processen lopen vertraging op',
      'Belangrijke kennis is onvoldoende vastgelegd',
      'Rapportage of afsluiting komt serieus onder druk',
      'Dit risico is nog niet onderzocht'
    ],
    v: [5, 4, 2, 1, 2]
  },
  q8: {
    nr: 8, theme: 'Groeiscenario', type: 'Pijn en schaalbaarheid',
    title: 'Stel dat het aantal transacties binnen twaalf maanden met 30% stijgt. Wat betekent dat waarschijnlijk voor Finance?',
    options: [
      'De huidige processen kunnen dit goed verwerken',
      'Enkele procesaanpassingen zijn nodig',
      'De werkdruk neemt duidelijk toe',
      'Extra Finance-capaciteit is noodzakelijk',
      'Achterstanden, fouten of vertraging zijn waarschijnlijk'
    ],
    v: [5, 4, 3, 2, 1]
  },
  q9: {
    nr: 9, theme: 'Zakelijke impact', type: 'Impact',
    title: 'Welk gevolg van de huidige Finance-processen heeft de meeste impact op de organisatie?',
    options: [
      'Managementinformatie komt te laat',
      'Finance besteedt te weinig tijd aan analyse en advies',
      'Groei leidt snel tot extra personeelsbehoefte',
      'Financiële risico’s worden te laat zichtbaar',
      'Medewerkers besteden veel tijd aan correcties',
      'Audits en controles vragen te veel voorbereiding',
      'Er is momenteel geen merkbare zakelijke impact'
    ],
    v: [2, 3, 1, 1, 2, 3, 5]
  },
  q10: {
    nr: 10, theme: 'Impact op besluitvorming', type: 'Executive impact',
    title: 'Welke managementbeslissing wordt het meest geraakt wanneer financiële informatie niet tijdig of volledig beschikbaar is?',
    options: [
      'Cashflow- en werkkapitaalsturing',
      'Kostenbeheersing',
      'Forecasting en budgettering',
      'Investeringsbeslissingen',
      'Sturing per entiteit of businessunit',
      'Integratie van overnames',
      'Dit heeft weinig invloed op besluitvorming'
    ]
  },
  q11: {
    nr: 11, theme: 'Aanleiding om te veranderen', type: 'Compelling event',
    title: 'Welke ontwikkeling zou de belangrijkste aanleiding zijn om financiële processen of systemen opnieuw te bekijken?',
    options: [
      'Verdere groei met de huidige Finance-bezetting',
      'Een overname of nieuwe entiteit',
      'Internationale uitbreiding',
      'Toenemende rapportage- of compliance-eisen',
      'Vertrek van een sleutelmedewerker',
      'Noodzaak om kosten te verlagen',
      'Beperkingen of einde levensduur van huidige software',
      'Er is momenteel geen concrete aanleiding'
    ]
  },
  q12: {
    nr: 12, theme: 'Persoonlijke prioriteit', type: 'Prioriteit en personalisatie',
    title: 'Als u één onderdeel binnen Finance direct zou kunnen verbeteren, wat zou u dan kiezen?',
    options: [
      'Snellere maandafsluiting',
      'Betrouwbaardere managementinformatie',
      'Minder handmatige verwerking',
      'Betere consolidatie',
      'Meer grip op inkoop en verplichtingen',
      'Efficiëntere declaratieverwerking',
      'Minder afhankelijkheid van medewerkers',
      'Betere ondersteuning van internationale groei'
    ]
  }
};

// Volgorde van de schermen. 'pause' = tussenscherm op 50%.
export const ORDER = ['q1', 'q2', 'q3', 'q3a', 'q4', 'q5', 'q5a', 'q6', 'pause', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12'];

export const TOTAL_QUESTIONS = 12;
