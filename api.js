// Koppelpunten met de backend. In deze versie zijn het stubs: ze doen niets
// zolang API_BASE leeg is. De backend moet:
//  1. de lead opslaan (CRM),
//  2. de interne ICP & Opportunity Score berekenen en A/B/C-routering doen,
//  3. de samenvatting per e-mail versturen,
//  4. een score-review inplannen.
// De interne score hoort nadrukkelijk NIET in de frontend.

const API_BASE = ''; // bijv. 'https://api.voorbeeld.nl/quickscan'

async function post(path, body) {
  if (!API_BASE) return { ok: true, stub: true };
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API ${path} gaf ${res.status}`);
  return res.json();
}

/** Lead + antwoorden. Backend berekent de interne opportunityscore. */
export const submitLead = ({ lead, answers, publicScore }) => post('/leads', { lead, answers, publicScore });

/** Uitslag mailen zonder gesprek. */
export const sendResultEmail = ({ lead, answers }) => post('/result-email', { email: lead.email, voornaam: lead.voornaam, answers });

/** Score-review aanvragen. Telefoonnummer alleen hier, op verzoek van de deelnemer. */
export const requestReview = ({ lead, slot, tel }) => post('/review', { email: lead.email, slot, tel });
