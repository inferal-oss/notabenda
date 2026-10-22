// @requirements REQ-PRODUCT-SOURCE-CANDIDATE
// This file is copied beside a browser bundle built from the installed candidate archives.
import {createConsentRuntime, mountControls} from './runtime.js';

const get = id => document.getElementById(id);
const marker = 'notabenda-candidate-review-marker';
const unavailable = new URL(location.href).searchParams.get('storage') === 'unavailable';
let starts = 0, stops = 0, completed = 0, failed = 0;
let controller;
function show() {
  if (!controller) return;
  const state = controller.getSnapshot();
  get('permission').textContent = state.purposes['audience-measurement'];
  get('phase').textContent = state.services['sample-metrics'] ?? 'not registered';
  get('persistence').textContent = state.persistence;
  get('starts').textContent = String(starts);
  get('stops').textContent = String(stops);
  get('completed').textContent = String(completed);
  get('failed').textContent = String(failed);
  try { get('marker').textContent = localStorage.getItem(marker) === null ? 'absent' : 'present'; }
  catch { get('marker').textContent = 'unavailable'; }
}
try {
  const descriptor = await fetch('./runtime-config.json', {credentials:'omit', cache:'no-store'}).then(r => {
    if (!r.ok) throw Error();
    return r.json();
  });
  const storage = {getItem(){throw Error();}, setItem(){throw Error();}, removeItem(){throw Error();}};
  controller = createConsentRuntime(descriptor, unavailable ? {storage} : undefined);
  controller.subscribe(show);
  controller.registerService('sample-metrics', {
    purposes:['audience-measurement'],
    start({signal}) {
      starts++;
      localStorage.setItem(marker, 'synthetic');
      // One real loopback request per start. Abort/cleanup cannot recall an admitted request.
      fetch('/probe', {method:'POST', credentials:'omit', headers:{'x-notabenda-review':'probe'}, signal})
        .then(r => { if (!r.ok) throw Error(); completed++; })
        .catch(() => { failed++; })
        .finally(show);
      return () => { stops++; localStorage.removeItem(marker); show(); };
    },
  });
  // A marker left by a closed page is sample data, not permission. Only this exact key is touched.
  if (!controller.isServiceAllowed('sample-metrics')) localStorage.removeItem(marker);
  mountControls(get('controls'), {consent:controller});
  get('preferences').addEventListener('click', () => controller.openPreferences());
  get('counter').addEventListener('click', async () => {
    get('server-count').textContent = 'Reading…';
    try {
      const response = await fetch('/observations', {credentials:'omit', cache:'no-store'});
      if (!response.ok) throw Error();
      const result = await response.json();
      get('server-count').textContent = String(result.attempts);
    } catch { get('server-count').textContent = 'Unavailable'; }
  });
  get('storage-mode').textContent = unavailable ? 'Choice storage failure simulated' : 'Browser choice storage';
  get('ready').textContent = 'Controls connected';
  show();
} catch {
  get('ready').textContent = 'Review could not start. Check the candidate files and browser console.';
  get('ready').setAttribute('role', 'alert');
}
