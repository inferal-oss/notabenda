# Google Basic Consent Mode

Requirements: `REQ-GOOGLE-MODE`, `REQ-PRODUCT-CONSENT-RUNTIME`, `REQ-PRODUCT-PRIVACY-SIGNALS`. This optional integration is an initial adapter, not a certified CMP, Tag Manager template or reviewed jurisdiction pack.

Google distinguishes Basic mode, which withholds tags before consent, from Advanced mode, which can send cookieless measurements under denied states. The package implements Basic tag gating; it does not provide an Advanced mode. [Google's overview](https://developers.google.com/tag-platform/security/concepts/consent-mode).

## Declare targets and all four signals

```ts
config.services.push({
  id: 'google-measurement',
  name: 'Site measurement',
  provider: 'Google',
  location: 'Your reviewed Google processing locations',
  purposeIds: ['measurement'],
  resourceOrigins: ['https://www.googletagmanager.com'],
  processingActivities: [], // Your classification; declare actual sharing/sale/targeting if applicable.
  googleBasic: {
    version: 1,
    tagIds: ['G-YOURTAG123'],
    signals: {
      analytics_storage: ['measurement'],
      ad_storage: [],
      ad_user_data: [],
      ad_personalization: [],
    },
  },
});
// Include this service and its purposes in config.consent too, with material scopes/lifetimes.
```

Every signal is explicit. A nonempty array requires all listed purposes; an empty array remains denied. The union must equal this service's purposes. Analytics destinations (`G-*`) require a nonempty analytics-storage mapping. Ads destinations (`AW-*`) require nonempty ad-storage and advertising-user-data mappings. These are conservative package restrictions; advertising personalization can stay denied. Declare no more than ten unique targets. GTM containers, unified GT IDs, Floodlight, enhanced conversions, identity upload and undeclared connected destinations are outside this initial integration.

All declared purposes gate the entire combined service. A combined Analytics/Ads service therefore waits for every declared purpose before loading anything. It does not start Analytics alone when the same service's advertising purpose is refused. This avoids loading a product under a denied collection signal. One adapter owns the document's Google globals; independent Google service adapters cannot safely assign different global consent states.

The public declaration includes tag IDs and mappings in the material consent scope. Changing either invalidates the affected earlier grants. Private operator notes are excluded as usual. The declared origin describes the initial script request, not every destination or redirect Google's executed code might use. Review all connected destinations and settings in the actual Google account.

Processing classification and any GPC/recorded opt-out policy remain independent of cookie permission. `processingActivities: []` is an operator assertion that none of the supported restriction categories apply; it is not an exemption inferred from the word “analytics.” Unknown or restricted scopes and pending required receipts continue to hold the service off.

## Register once, before any Google integration

```ts
import {registerGoogleBasic} from '@notabenda/core/google';

const google = registerGoogleBasic({
  consent, // the existing host-owned controller
  serviceId: 'google-measurement',
});

// A deliberate application event. Nothing is buffered while blocked.
const queued = google.event('page_view', {page_title: 'Your reviewed page title'});
```

There is no automatic page view. The adapter sets all four denied defaults locally before any tag insertion, waits for effective service permission, sets explicit updates, initializes only the declared targets and then inserts the standard `gtag.js` URL. Google's guidance requires consent defaults before measurement commands. [Implementation guide](https://developers.google.com/tag-platform/security/guides/consent).

Register outside framework renders/replayed effects. Remove existing Google snippets, Tag Manager containers, resource hints and competing queues first. The browser port rejects detectable preexisting globals, scripts, hints and GA disable flags; it does not override another owner or a prior opt-out flag. DOM inspection cannot prove that an earlier script was never executed and removed, or detect every first-party tag gateway. The host must actually provide a clean document.

The adapter owns `window.gtag` and `window.dataLayer`. Its global stub does not buffer outside calls. Use this adapter's event method for application events; do not separately push commands or initialize tags. Unrelated code can still bypass an integration by making its own network requests, so this is not a browser security boundary.

`event()` accepts a bounded event name and at most 32 flat primitive parameters. It rejects getters, callbacks, destination overrides and supported identity/configuration override keys. It routes events to the declared targets and resamples effective eligibility immediately before dispatch. It returns false while blocked, loading, withdrawn, destroyed or awaiting reload; discarded events never replay later. A true return means the command was queued, not that Google received or accepted it. Parameters still require the host's privacy review: no automatic classifier can establish that arbitrary text contains no personal information.

## Withdrawal and failure

Before the first grant, and after an initial refusal in a clean document, the adapter makes no Google script request and sends no denied-status request. A saved compatible grant may start it on a later page once the core has evaluated that grant and any required evidence.

After any script-loading attempt, withdrawal synchronously closes the event entry point, sets each GA4 disable flag, removes the owned script element, clears queued work and queues all four denied states. The adapter becomes terminal for that document. Regrant cannot restart it; reload or normal full navigation establishes a new document whose persisted restrictions are checked again. Load errors, timeouts and cancellation also require reload. The core controls display the shared reload-required message.

**This is not a guarantee of post-load network silence.** Removing a tag cannot undo executed code, revoke data already sent, clear inaccessible cookies or stop every vendor timer/request. Google documents a GA4 disable flag; it is not an equivalent kill switch for Ads or other connected products. Denied updates themselves may produce traffic in already loaded code. A host needing a strict document-wide execution boundary must complete the full reload/navigation and handle its own application state. [Google privacy controls](https://developers.google.com/tag-platform/security/guides/privacy).

The host stops other producers, handles server-side processing and uses the separately configured storage-cleanup mechanics for exact owned accessible storage. There is no automatic cookie-name guessing or universal Google erasure operation. If no script-loading attempt occurred, disposal simply closes this adapter. `destroy()` unregisters its lifecycle and closes its event entry point; it never destroys the host consent controller. Google globals remain reserved for the document lifetime, so replacing an adapter in place does not bypass a required reset.

## Execution environments and verification

The default browser port creates an owned local queue and standard script element. `createGoogleBasicBrowserEnvironment({document, nonce})` supports an explicit document and optional script nonce. The factory and module import are server-safe; registration requires a browser or a supplied `GoogleBasicEnvironment`. The optional timeout is 100–60,000ms, default 15 seconds. A custom environment is trusted integration code: connecting and setting defaults must not fetch, load must honor its abort signal, and stop must synchronously disable owned work. It cannot turn a weaker custom loader into a stronger privacy guarantee.

The [light](http://127.0.0.1:4179/google-basic/) and [midnight](http://127.0.0.1:4179/dark/google-basic/) examples use the actual adapter with an explicitly local simulator. They never load Google's library or a real account. The command trail shows defaults, authorized initialization, explicit events and withdrawal, and separates simulated starts from actual network behavior.

Automated tests intercept the production browser loader's requested URL, exercise pending/late loads, withdrawal, regrant, product mappings, required receipts, GPC and reentrant observers. Interception proves adapter behavior, not Google's implementation or every browser/network path. Wider vendor/browser acceptance and Tag Assistant verification against a host's reviewed account remain required. A functioning Consent Mode adapter does not establish Google publisher CMP certification; the separate TCF/certification project remains deferred.

For focused setup, draft input checks and the agent handoff, choose the corresponding [specialist pack](SPECIALIST-PACKS.md). Selection enables no profile, tag, permission or objection state.
