# Cookie choices and service integration

The first local consent runtime and vanilla controls are implemented. They use the same site inventory as the legal pages. Optional services stay off until all their declared purposes have a current explicit grant. This is a cooperative integration API: an application must put optional work behind its registered loaders.

## Configure optional purposes and services

Add an optional `consent` section to a valid site configuration:

```ts
siteConfig.consent = {
  purposes: [{ id: 'measurement', scope: 'purpose-1' }],
  services: [{ id: 'sample-metrics', scope: 'vendor-1' }],
  grantLifetimeDays: 30,
  refusalLifetimeDays: 180,
  dismissalMinutes: 60,
};
```

IDs refer to inventory items. Every purpose of a managed service must be consent-managed; every optional-storage service must be included. Do not infer optionality from a legal-basis sentence or collection-required flag. Lifetimes above are fictional example settings. Applicable duration and repeated-prompt rules need separate review; 180 days is not a claim to implement an Italian six-calendar-month rule.

`scope` is an explicit material-version declaration. Effective grant scope also includes the public purpose facts and related service facts/scopes. Adding a vendor or changing these disclosures invalidates affected grants. Current refusals/withdrawals stay refused until their original expiry; a material change cannot erase rejection. General document versions, CSS, and unrelated purposes do not change that scope. There is no automatic legal materiality decision.

## Register before loading

```ts
import { createConsent, mountControls } from 'notabenda';
import 'notabenda/styles.css'; // optional

const consent = createConsent(publicSiteConfig);
consent.registerService('sample-metrics', {
  purposes: ['measurement'],
  async start({ signal }) {
    const metrics = await import('./optional-metrics.js');
    if (signal.aborted) return () => {};
    metrics.start({ signal });
    return () => metrics.stopAndClearAccessibleStorage();
  },
});
const controls = mountControls(document.querySelector('#privacy-controls')!, { consent });
```

Registering is inert until permission exists. A multipurpose service requires **all** purposes. Registration rejects unknown IDs and mismatched purpose declarations. Return a cleanup function even for a service that does no persistent work. Listen to the abort signal immediately, including while initialization is pending. A revoked generation stays revoked even if the visitor allows the service again before its initialization completes; its cleanup finishes before another start.

Withdrawal aborts the signal immediately and calls cleanup. The host adapter must stop requests, disable vendor work, remove accessible storage, and replace embeds as appropriate. An already executed script cannot be unexecuted; third-party, HttpOnly, cookie path/domain, IndexedDB, worker, and server processing need explicit handling. This version does not automatically delete arbitrary declared storage or retroactively block scripts. Start/cleanup failures latch `reload-required`; the controls tell the visitor to reload.

For optional iframes and images, the [gated media adapter](EMBEDS.md) supplies inert placeholders and resource removal through that same lifecycle. Several resources share one declared service and initial-origin inventory; the placeholder opens preferences without granting permission itself.

Avoid eager optional imports, remote previews, resource hints, preloads, pixels, and code outside the registered lifecycle. `AbortSignal` is a cooperative contract, not a network firewall. The example uses only synthetic first-party requests and demonstrates explicit storage cleanup.

## Headless state

- `getSnapshot()` returns detached purpose states, pure effective `permissions`, service phases, prompt visibility, persistence status, and preferences-open state. Saved grants can still be blocked by required evidence; inspect `permissions` for display and use service lifecycles for actual execution.
- `subscribe(listener)` returns an unsubscribe function. Observer errors cannot prevent rejection.
- `choose({purposeId: boolean, ...})` requires explicit choices for every configured optional purpose. `acceptAll()` and `rejectAll()` use the same engine and return `{persisted}`.
- `isAllowed(purposeId)` rechecks the effective permission. Unknown IDs never permit work.
- `servicePermissions` and `isServiceAllowed(serviceId)` combine cookie permission with independent [processing restrictions](PRIVACY-SIGNALS.md), when explicitly configured. A purpose grant alone does not override GPC.
- `dismiss()` suppresses the prompt separately and grants nothing. Opening/closing preferences writes no choice.
- `refresh()` rereads current storage and rechecks expiration. Browser defaults also refresh on storage events, `pageshow`, and return from background.
- `settled()` waits for pending lifecycle/cleanup promises, useful for integration tests. `destroy()` aborts services, removes listeners/timers, and handles late cleanup.

The optional environment argument supplies synchronous storage, a clock, a notification subscription, and a timer scheduler for headless hosts/tests. Without an available storage adapter, grants stay blocked. All browser capabilities are accessed at construction, so importing the package is safe during SSR.

## Local storage and evidence limits

The built-in browser environment uses localStorage keys `notabenda:choices:v1:SITE_ID` and `notabenda:choices:v1:SITE_ID:prompt`. Include both in the site's declared storage and explain their purposes/lifetimes. Dismissal has a separate key and never writes a choice grant. The record stores scope/disclosure text, choices, and timestamps without a visitor identifier.

The local choice record is limited to 64K characters; an oversized configured scope fails before runtime initialization. Configuration is bounded to 40 optional purposes and 80 optional services. This preview favors a small explicit inventory over a broad vendor catalog.

Missing, malformed, stale, expired, cross-site, future-dated, or unavailable local state never grants permission. Expiry uses timers and resume checks. Browser suspension can delay cooperative cleanup; there is no precise real-time cancellation guarantee for arbitrary vendor code. Cross-tab events reread current storage rather than trusting event payloads. Storage is last-write-wins and not an ordered evidence log or an authorization credential.

If a save fails, optional services remain off. Rejection/withdrawal takes effect in memory even when it cannot be persisted; the runtime tries to remove older stored grants. If storage cannot be changed at all, an older choice may return in a new page instance. The UI surfaces that limitation. The default local-only controller creates no remote receipt. Optional [required-receipt mode](CONSENT-EVIDENCE.md) supplies acknowledged delivery and a construction-time gate, with host-owned authorization/transport and no package identity system.

## Built-in interface

The initial bottom/corner notice is nonmodal and does not steal focus, trap the keyboard, or block page scrolling. Accept and reject use equal controls; refusal does not require opening preferences. A native modal dialog opens only deliberately, as a bottom drawer on phones or side panel on large screens. Close/Escape discards the draft and restores focus. A persistent host-positioned preferences button remains available after a choice.

Use semantic CSS tokens such as `--nb-surface`, `--nb-page-bg`, `--nb-soft`, `--nb-text`, `--nb-muted`, `--nb-line`, `--nb-accent`, `--nb-action-bg`, `--nb-action-text`, `--nb-focus`, `--nb-font`, `--nb-radius`, `--nb-bottom-offset`, and `--nb-sheet-max-height`. Styles use the `notabenda` cascade layer and low-specificity selectors. Light/dark examples use tokens rather than replacing internals. Native dialog support is required by the built-in UI; a custom headless interface can serve other environments.

The renderer is initially English. The optional [React adapter](REACT.md) connects to the same controller. Full accessibility review, platform/screen-reader testing, regional rule packs, US sale/sharing/GPC handling, additional framework adapters and form permissions remain separate work. [Terms agreement](TERMS.md) has its own controller and acknowledged record path, independent of these cookie controls. Do not describe this preview as a complete compliance solution.

## Traceability and reuse

The runtime connects to `REQ-EU-CONSENT`, `REQ-EU-DEVICE`, and `REQ-EU-FAIR-CHOICE`; controls connect to `REQ-ES-CHOICE`, `REQ-PRODUCT-MOBILE`, and `REQ-PRODUCT-A11Y`. Those legal/UI items remain partial, with their limitations in the catalog. See [browser verification](verification/consent-browser.md).

The design reviewed [CookieConsent script management](https://cookieconsent.orestbida.com/advanced/manage-scripts.html) and [Klaro's integration model](https://github.com/kiprotect/klaro) on 18 October 2026. Both offer useful existing consent interfaces and script integrations. This implementation uses an original small state engine because its explicit per-purpose/vendor scope, async generation cleanup, failed-storage behavior, and shared headless API are core contracts here. This is a documentation/design comparison, not a benchmark or claim that those libraries cannot be adapted. No third-party source code was copied and no second consent engine is bundled.
