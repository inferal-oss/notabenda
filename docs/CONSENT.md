# Cookie choices and service integration

Register optional services with the consent controller. Their loaders run only while every declared purpose has a current grant. The controls use the same site inventory as the legal pages; the application must route optional work through those loaders.

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

The [regional baseline checks](verification/regional-consent.md) connect added-purpose behavior and declared German/Irish device-access conditions to primary sources and both controller APIs. Country declarations identify diagnostics; they do not certify an exception or select a complete regional pack.

## Smaller browser entry

Build the consent descriptor alongside your legal pages. The CLI accepts the same JSON, YAML or Markdown-frontmatter configuration as the document build:

```sh
notabenda build --config notabenda.config.yaml --consent-runtime local --out-dir legal-dist
```

This writes `consent-runtime.json` and `assets/notabenda-consent.css` in addition to the legal pages and retained artifact. It validates the complete configuration and requires reviewed production content unless `--preview` is explicit. Choose `local` for browser-only choices, or `required` when a host receipt must precede optional processing. There is no evidence-mode default. Required mode still needs an archived consent notice and a host-bound receipt adapter; the command connects no service loaders, transport or backend. Without the switch, a new output directory has the same document-only output as before. If the output already contains a runtime descriptor, repeat the switch when rebuilding so an old descriptor cannot silently remain beside changed legal pages.

The files can be deployed with the site. Import the published `@notabenda/core/consent.css` from your own bundler, or link the generated `/assets/notabenda-consent.css` when serving static assets. Your browser code still registers each service lifecycle before optional requests can start.

For a custom build pipeline, use the same compiler directly:

```ts
// Build/server code; defaults to reviewed production content.
import { compileConsentRuntimeConfig } from '@notabenda/core/content';

const runtime = compileConsentRuntimeConfig(siteConfig, { evidence: 'local' });
// Serialize runtime to a same-origin public JSON asset.
```

```ts
// Browser code
import { createConsentRuntime, mountControls } from '@notabenda/core/consent';
import '@notabenda/core/consent.css'; // optional, existing theme variables work

const response = await fetch('/consent-runtime.json');
if (!response.ok) throw new Error('Privacy choices could not be loaded.');
const consent = createConsentRuntime(await response.json());
mountControls(document.querySelector('#privacy-controls')!, { consent });
// Register the same explicit service lifecycles shown below before optional work loads.
```

Choose `evidence: 'required'` when a host receipt must precede permission. The mode has no default and cannot silently downgrade when an adapter is missing:

```ts
import { requiredConsentEvidence } from '@notabenda/core/consent/evidence';

const consent = createConsentRuntime(requiredRuntimeConfig, undefined, {
  evidence: requiredConsentEvidence({
    notice, streamRef,
    read: ({ signal }) => host.readConsentHead({ signal }),
    write: (command, { signal }) => host.recordConsent(command, { signal }),
  }),
});
```

The host methods above must resolve parsed evidence responses; they supply identity/context binding and authenticated transport. Keep credentials out of public JSON. Use the pinned notice for the exact archived copy actually shown. The separately imported adapter preserves synchronous binding checks, receipt gating and retries. Each controller receives its own session; a serialized or forged adapter is rejected. Local mode rejects a supplied receipt adapter to catch mismatched configuration.

Compilation validates the **whole** site, including terms and operator facts, then emits only site metadata, the complete purpose/service/storage inventory, consent scopes/lifetimes, guards, signal/prompt policy and privacy/cookie document metadata. Authoring bodies, controller contacts, rights workflows, terms and private fields stay out of this descriptor. Runtime input is independently bounded and checked before browser capabilities are used; a format marker is not a trust boundary or a legal approval.

The compiled profile accepts at most 256 purposes, 256 services and 512 storage entries; optional runtime scope remains limited to 40 purposes and 80 services. The descriptor is at most 256 KiB UTF-8, IDs are at most 120 characters, ordinary text fields are at most 4,096 characters and version/scope fields are at most 200. The existing 64K-character local-choice record limit also applies. Oversized inputs fail explicitly. Use `{mode: 'preview', evidence: 'local'}` only for deliberate draft previews.

`getConfig()` returns `ConsentRuntimeInventory`, which contains only the fields above. Existing `createConsent`/`@notabenda/core/headless` APIs still synchronously validate a complete configuration and return the complete public config. Native controls, media, storage cleanup, Google Basic and the Astro client bridge accept either controller. React hosts can use `@notabenda/core/react/consent` with either controller. Its hook returns the smaller inventory honestly. The existing `@notabenda/core/react` entry retains its full-controller contract; use `createConsent` with that compatibility entry. See [React integration](REACT.md).

The light and midnight cookie examples use this compiled entry. Optional `npm run size` reports local, required-receipt and compatibility bundles separately; adopters choose their own CI policy. See [delivery verification](verification/browser-delivery.md).

## Stored-choice migration

New choice records carry `authorizationMode: 'local' | 'required'`, even when a required command could not be prepared. Local controllers discard positive choices from required records, records with any evidence property, unknown modes and older markerless records. This pre-release migration closes an ambiguity in older failed-preparation records. Valid refusals/withdrawals and regional prompt memory remain; parsing does not rewrite storage. A fresh explicit local choice creates a local record. Required controllers continue to require a valid matching receipt; the local marker never replaces one.

## Register before loading

```ts
import { createConsent, mountControls } from '@notabenda/core';
import '@notabenda/core/styles.css'; // optional

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

The built-in entries expose their drawer relationship and expanded state. Purpose names and their longer descriptions are separately labeled. If a background update hides the focused notice or retry action, focus moves to the remaining status or reopening control. Keyboard focus can scroll its destination into view; pointer-triggered recovery preserves scrolling. Unrelated page focus stays where the visitor put it. See [focus verification](verification/consent-focus.md).

Use semantic CSS tokens such as `--nb-surface`, `--nb-page-bg`, `--nb-soft`, `--nb-text`, `--nb-muted`, `--nb-line`, `--nb-accent`, `--nb-action-bg`, `--nb-action-text`, `--nb-focus`, `--nb-font`, `--nb-radius`, `--nb-bottom-offset`, and `--nb-sheet-max-height`. Styles use the `notabenda` cascade layer and low-specificity selectors. Light/dark examples use tokens rather than replacing internals. Native dialog support is required by the built-in UI; a custom headless interface can serve other environments.

The built-in wording is English; hosts can supply versioned [localization](LOCALIZATION.md). The optional [React](REACT.md) and [Astro](ASTRO.md) adapters share the controller. [Processing opt-outs](PROCESSING-CHOICES.md), [Global Privacy Control](PRIVACY-SIGNALS.md) and [form permissions](FORM-PERMISSIONS.md) have separate controls and scope. Full accessibility review, platform/screen-reader testing and broader reviewed regional coverage remain open. [Terms agreement](TERMS.md) has its own controller and acknowledged record path, independent of these cookie controls. Do not describe this preview as a complete compliance solution.

## Rights links and browser guidance

You can supply public information alongside the controls:

```js
config.consent.information = {
  rights: {label: 'Your privacy rights', url: '/privacy/requests'},
  browserControls: {
    title: 'Browser storage settings',
    description: 'Use the links below for browser settings. Blocking third-party cookies does not prevent every request or storage mechanism. Use these purpose controls to stop the registered optional features.',
    links: [{label: 'Chrome cookie settings', url: 'https://support.google.com/chrome/answer/95647'}],
  },
};
```

Use your actual rights route and reviewed wording. Either field can be supplied independently. The rights link appears on the initial notice and in preferences. Browser guidance is a native foldout, collapsed initially, below the purpose choices. Opening it grants nothing. Captions and descriptions are plain text; links allow HTTPS, a single-leading-slash local route or a valid `mailto:` destination. Unknown/private fields, unsafe links, control characters and oversized values reject. The whole information object is limited to 4 KiB of UTF-8 JSON, with up to four help links and a 2,000-character description.

Keep guidance relevant to your supported browsers and actual storage/trackers, including anything their settings cannot disable. The toolkit neither detects a browser nor fetches help pages. A rights link does not implement request intake or fulfillment. These hooks are reusable; declaring Brazil or selecting Portuguese does not populate them automatically. Setup advises review of the fields when Brazil is selected.

The public projection, compiled browser descriptor and immutable consent notice retain the selected information. Frontend evidence initialization and the standalone Cloudflare backend require it to match the released config. Stored-choice inspection shows the retained copy and destinations. The archive records captions and URLs, rather than the contents of external pages or proof they were opened.

Information edits change the release and notice IDs. They do not alone change a purpose's material scope. If the underlying processing or disclosure meaning changes, revise the appropriate purpose/service scope or localization disclosure revision deliberately. Keep previous artifacts needed by existing records.

See the [Portuguese example](/localization/), `REQ-BR-COOKIE-RIGHTS-LINK`, `REQ-BR-COOKIE-BROWSER-HELP` and the [regional verification report](verification/regional-consent.md).

## Traceability and reuse

The runtime connects to `REQ-EU-CONSENT`, `REQ-EU-DEVICE`, and `REQ-EU-FAIR-CHOICE`; controls connect to `REQ-ES-CHOICE`, `REQ-PRODUCT-MOBILE`, and `REQ-PRODUCT-A11Y`. Those legal/UI items remain partial, with their limitations in the catalog. See [browser verification](verification/consent-browser.md).

The design reviewed [CookieConsent script management](https://cookieconsent.orestbida.com/advanced/manage-scripts.html) and [Klaro's integration model](https://github.com/kiprotect/klaro) on 18 October 2026. Both offer useful existing consent interfaces and script integrations. This implementation uses an original small state engine because its explicit per-purpose/vendor scope, async generation cleanup, failed-storage behavior, and shared headless API are core contracts here. This is a documentation/design comparison, not a benchmark or claim that those libraries cannot be adapted. No third-party source code was copied and no second consent engine is bundled.

## Headless imports and component styles

For a custom cookie-choice interface, import `createConsent` from `@notabenda/core/headless`. It is the same validated controller as the root export, including required-receipt behavior. For the native controls, add `mountControls` from `@notabenda/core` and optional `@notabenda/core/consent.css`. The consent-only stylesheet is derived from the canonical styles and preserves the same tokens and accessibility rules. Use the complete `@notabenda/core/styles.css` when you also need full document, setup or other component layouts.

The local light/midnight cookie examples use the smaller stylesheet and a bundled browser entry. The full configuration and required-evidence implementation still contribute to the existing JavaScript controller; its measured core-plus-controls bundle remains above the 15 KiB target. [Measurements and limits](verification/browser-delivery.md) remain explicit.

## Long copy, small screens and direction

The default preferences drawer wraps long headings and Close labels. Its action grid adapts to text size, stacking buttons when two readable columns do not fit. Both actions retain the same styling and DOM order.

The drawer uses one scroll region when space is tight. Where `ResizeObserver` is available and enough room remains for body text, it keeps the header and footer fixed and scrolls the body. Resizing keeps the current control focused and preserves unsaved choices. Browsers without resize observation use the whole-drawer fallback. Closing still applies no draft choices.

Set direction on the host document or container using normal HTML `dir` semantics. Desktop side drawers follow inline-end placement and notice offsets follow the corresponding safe-area edge. This supports layout direction; translated status messages come from the host-supplied localization catalog. See the [repeatable layout checks](verification/controls-layout.md) for long text, RTL, enlarged text and remaining platform work.

An optional [calendar grant cap](REGIONAL-PROMPTS.md#cap-remembered-grants-at-six-calendar-months) can limit remembered grants separately from refusal memory and repeat-prompt rules. The host selects it explicitly; market and locale declarations do not activate it.

## Controls opened by the visitor

`mountControls(container, { consent, noticeMode: 'on-demand' })` hides the initial automatic notice and retains the preferences trigger. It changes no stored choice and starts no service. Use it when the host already presents the relevant disclosure before activation, such as the [technology function notice](TECHNOLOGY-COLLECTION.md). Keep a persistent way to reopen choices. The default remains `automatic`; choosing a display mode never establishes legal applicability.

## Author settings through setup

The [cookie control settings editor](SETUP.md#configure-cookie-control-settings) and interactive wizard author enrollment, public material versions and separate memory periods from the actual inventory. They preserve scope restrictions and existing timing policies. Saving prepares a draft; registering actual service lifecycles and reviewing publication remain host work.

The optional [connection inspector](CONNECTION-INSPECTION.md) reads the actual controller’s registration map and lifecycle phases, and can compare the intended compiled consent inventory. It does not refresh, start services or replace network/storage tests.
