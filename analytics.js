// Analytics-events uit de brief (hoofdstuk 12). Zet events op window.dataLayer,
// zodat Google Tag Manager of een andere tool ze kan oppakken.
// Stuur nooit persoonsgegevens mee in events.

export function track(event, data = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data, ts: Date.now() });
  } catch (e) { /* analytics mag de scan nooit breken */ }
}
