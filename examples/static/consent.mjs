import {paintChoices} from '/assets/choices-status.mjs';
import { createConsent, mountControls } from '/assets/runtime/index.js';

const config = await (await fetch(location.pathname.startsWith('/dark/') ? '/dark/choices/site.json' : '/choices/site.json')).json();
const consent = createConsent(config);
let requests = 0;
for (const id of ['sample-measurements', 'sample-suggestions']) {
  consent.registerService(id, {
    purposes: config.services.find(service => service.id === id).purposeIds,
    start({ signal }) {
      // Synthetic, first-party integration. No external trackers or identifiers.
      localStorage.setItem(id, 'enabled');
      document.querySelector('#request-count').textContent = String(++requests);
      void fetch(`/demo/${id}.svg`, { signal, cache: 'no-store' }).catch(() => {});
      return () => { localStorage.removeItem(id); };
    },
  });
}
consent.subscribe(paintChoices);
mountControls(document.querySelector('#privacy-controls'), { consent });
document.querySelector('#review-choices').addEventListener('click', () => consent.openPreferences());
window.addEventListener('pagehide', event => { if (!event.persisted) consent.destroy(); });
