# notabenda

Reusable site configuration and legal pages for your own website. Render privacy, cookie, and supplied terms documents as ordinary HTML, with optional styles and no runtime dependencies.

Optional [repeat-prompt policy](../../docs/REGIONAL-PROMPTS.md) keeps solicitation separate from permission expiry, with configured applicability, public change explanations and linked requirements.

Developer preview. The package has not been published to npm yet; build/pack it from the repository and install the resulting tarball locally. Requires Node.js 22 or newer for the CLI and build-time API. The root renderer is browser/SSR-safe.

## Start with the CLI

After installing the local tarball:

```sh
npx notabenda init
# Edit notabenda.config.json: public operator facts, purposes, services,
# storage inventory, rights information, and your own terms sections.
npx notabenda check --preview
npx notabenda build --preview --out-dir public/legal-output
```

The starter is a draft containing explicit `{{placeholders}}`. Preview output includes a visible draft notice. Production checks/builds are the default and reject drafts and unresolved placeholders. Setting a review declaration is an operator assertion, not a review performed by the package.

Copy the output into the root of your static deployment, or supply your own framework layout. For example `/privacy` produces `privacy/index.html`. The default stylesheet URL is `/assets/notabenda.css`. If deploying under a prefix, configure document routes and the build API's stylesheet URL accordingly.

## Use your site's layout

```ts
import { defineSite, renderLegalDocument, renderLegalLinks } from 'notabenda';
import 'notabenda/styles.css'; // optional
import config from './notabenda.config.json' with { type: 'json' };

const site = defineSite(config);
const article = renderLegalDocument(site, 'privacy');
const footer = renderLegalLinks(site);
```

`defineSite` is a typed authoring helper. For arbitrary parsed JSON, use `validateSiteConfig(input)` and `toPublicConfig(input)`. Rendering always validates input. Use `renderLegalPage` for a complete document with a language attribute, viewport, headings, contents navigation, and legal links. Build and render with `{ mode: 'production' }` when publishing reviewed documents; fragment rendering defaults to preview validation.

Use optional CSS variables on your layout to set `--nb-font`, `--nb-surface`, `--nb-text`, `--nb-muted`, `--nb-line`, `--nb-accent`, and `--nb-document-width`. Omit the CSS entirely for your own styles. Content strings are plain text and escaped; structured section links allow HTTPS, plain mailto, or same-site paths. Raw HTML and Markdown execution are not supported. The initial renderer supports English locales.

## Build a release artifact

```ts
import { compileLegalDocuments } from 'notabenda/content';

const build = compileLegalDocuments(config); // production by default
// build.files: static pages, public config, manifest, immutable artifact JSON
// build.artifact: exact pages + structured documents for your history backend
```

The manifest includes exact-page and structured-content SHA-256 digests. Property ordering and private operator notes do not change it. A changed document creates a new artifact ID. Your backend can archive releases, link them to evidence, and compare structured content without executing archived HTML.

Only allowlisted public fields enter pages, public configuration, and artifacts. Optional `private` configuration and unknown fields are excluded. Never put credentials in public configuration fields. Supplied legal documents keep their own authorship/licensing; this renderer does not generate universally valid contractual terms or certify compliance.

## Privacy request entries

Optional `rightsCenter` configuration supplies explicit actions, scope explanations, safe application links, next steps and a public email/phone fallback. `renderRightsCenter` renders a fragment; `renderRightsPage` produces the full static page. Both default to production validation and require a reviewed declaration; pass `{mode: 'preview'}` explicitly for drafts. The compiler and Markdown/MDX authoring preserve this supporting page alongside the three legal documents.

Use `RightsCenter` from `notabenda/react/documents` or `notabenda/astro/RightsCenter.astro` for framework layouts without hydration. The wizard recommends configuration without inventing workflows, and imported rights declarations return to draft review. These are navigation surfaces: the application owns intake, identity checks, acknowledgments, response handling and fulfillment. See [the guide and examples](../../docs/RIGHTS.md).

## Optional form permissions

Build a purpose/channel offer with `createFormPermissionOffer`, then use `createFormPermission` and the optional `mountFormPermission` field. The host supplies the person/contact binding and recording transport; the field keeps grant and withdrawal independent from the surrounding form. An optional IndexedDB journal retains unconfirmed actions across reload for explicit retry. See [the form-permission guide](../../docs/FORM-PERMISSIONS.md) for activation, retries and current-state checks.

## Cookie choices

For a smaller browser bundle, build a descriptor with `compileConsentRuntimeConfig(config, {evidence: 'local'})` from `notabenda/content`, then use `createConsentRuntime` and `mountControls` from `notabenda/consent` with optional `notabenda/consent.css`. Required receipts use explicit `evidence: 'required'` and `requiredConsentEvidence` from `notabenda/consent/evidence`. The [consent guide](../../docs/CONSENT.md) explains validation, adapter support and the conservative migration of older stored grants. React hosts can use `notabenda/react/consent` with the compiled controller. Existing `createConsent` and `notabenda/react` remain available with full config validation and the complete public getter.

Add an explicit runtime scope to the site inventory. IDs refer to declared purposes and services; every purpose of a managed service must be included:

```ts
config.consent = {
  purposes: [{ id: 'measurement', scope: 'purpose-1' }],
  services: [{ id: 'sample-metrics', scope: 'vendor-1' }],
  grantLifetimeDays: 30,
  refusalLifetimeDays: 180,
  dismissalMinutes: 60,
};
```

These lifetimes are examples, not legal defaults. Include preference storage keys `notabenda:choices:v1:SITE_ID` and `notabenda:choices:v1:SITE_ID:prompt` in your inventory. They hold local choices/scope/times and separate notice suppression, with no visitor ID.

```ts
import { createConsent, mountControls } from 'notabenda';
const consent = createConsent(config);
consent.registerService('sample-metrics', {
  purposes: ['measurement'],
  async start({ signal }) {
    const service = await import('./optional-metrics.js');
    if (signal.aborted) return () => {};
    service.start({ signal });
    return () => service.stopAndClearAccessibleStorage();
  },
});
const controls = mountControls(document.querySelector('#privacy-controls')!, { consent });
```

Optional services require all their declared purposes. New service/material scope changes invalidate grants; unexpired refusals remain refused. Unknown, stale, expired, malformed, or unavailable local state never grants. Failed writes leave optional services off. A failed withdrawal takes effect in memory, but old stored state may return on a later visit if storage cannot be changed.

The default notice is nonmodal with equal accept/reject actions. Only deliberate opening creates a native dialog: a bottom drawer on phones and side panel on large screens. Closing discards unsaved changes. The mount includes a persistent preferences button and needs native dialog support. English text and optional namespaced CSS are provided; the same controller supports a custom interface.

Use `getSnapshot`, `subscribe`, `choose` (all optional purposes required), `acceptAll`, `rejectAll`, `dismiss`, `openPreferences`, `closePreferences`, `isAllowed`, and `refresh`. `getConfig` and state snapshots are detached copies. `registerService` returns an unregister function. `settled()` waits for lifecycle work; `destroy()` aborts and cleans up. `mountControls().destroy()` removes UI only; destroy the controller separately when its lifecycle ends.

Adapters must honor the abort signal and return cleanup, including cancellation and storage deletion. Pending revoked starts are retired permanently; cleanup completes before restart. Failed start/cleanup requires reload. Recheck permission before any optional action. Browser defaults observe storage changes and resume events; clocks, synchronous storage, subscriptions and timer scheduling can be injected with the second `createConsent` argument. SSR imports access no browser globals; without storage, grants stay blocked.

Only registered cooperative work is gated. Arbitrary scripts, resource hints, third-party/HttpOnly storage, and server processing need explicit integration. No automatic legal applicability, US privacy signals, notice delivery or contract cancellation are implemented yet. Optional required-receipt mode is available with host-owned authorization and transport; see the [evidence guide](../../docs/CONSENT-EVIDENCE.md). Terms agreement has a separate acknowledged path below.

## Explicit terms agreement

Build an immutable version-and-wording offer with `createTermsOffer(build.artifact, {scopeId, statement, actionLabel})` from `notabenda/content`. Production requires reviewed production terms. The compiler emits pinned document copies at `/artifacts/ARTIFACT_ID/terms.html`; retain and serve earlier versions when replacing deployments.

Use `createTermsAcceptance(offer, {operationId, submit})` and `mountTermsAcceptance(container, {acceptance})` from the browser entry. The checkbox starts unchecked. `submit` is a host-authenticated transport returning a matching backend receipt; the controller reports recorded agreement only after acknowledgment. Unknown failures retry the same secure request ID, while stale offers require a newly reviewed offer/controller. Cookie and marketing permissions are independent.

`getOffer`, `getSnapshot`, `subscribe`, `setChecked`, `submit`, and `destroy` support a custom UI. The optional `requestId` constructor field is for host recovery of an uncertain attempt, never authorization. Mount destruction removes UI only. Controller destruction aborts transport; a server write may already have committed. This does not withdraw an agreement.

The optional `notabenda-cf` helpers register archived offers, explicitly activate them, and atomically record acceptance under a server-bound subject, scope and operation. The host provides all endpoint auth/CSRF, operation authorization, pinned hosting and retention. A recorded assertion does not establish a valid contract, durable-medium delivery or completion of a signup/payment. See the repository's [terms guide](../../docs/TERMS.md) for the full integration and boundaries.

## Exports

- `notabenda`: configuration validation/projection, document rendering, local or required-receipt consent state, terms agreement, and vanilla controls.
- `notabenda/content`: Node build-time compilation and portable artifacts.
- `notabenda/styles.css`: optional responsive, namespaced styles.
- `notabenda` CLI: JSON-only `init`, `check`, and `build` commands; `check --json` exposes diagnostics and requirement IDs.

Code is licensed under Apache-2.0. The license does not replace review of the operator's processing facts, applicability, or legal content.

## Optional React integration

`notabenda/react` provides a React 19 provider, effective-permission hooks and the existing native controls. React is an optional peer; default imports remain framework-independent. `notabenda/react/documents` offers server-safe structured legal document/link components. The host owns controller creation, service registration and destruction. See [docs/REACT.md](../../docs/REACT.md) for APIs, SSR/hydration and limits.

React form permissions use a host-owned controller through `FormPermissionProvider`, `FormPermissionField` and the `useFormPermissionSnapshot` / `useFormPermissionAllowed` hooks in `notabenda/react`. Mounting does not read, save or retry permission; the host explicitly loads current state. See the React guide for lifecycle, recovery and server-rendering limits.

## Optional Astro integration

`notabenda/astro/LegalDocument.astro`, `LegalLinks.astro`, `ConsentControls.astro` and `PreferencesButton.astro` provide static surfaces for Astro 7. The browser-only `mountAstroConsent` function is exported from `notabenda/astro/client`; it connects one host-owned controller to page swaps without recreating it. Astro is an optional peer. Static legal pages need no scripts; the host must retain a preferences surface on client-routed pages with ongoing optional services. See [docs/ASTRO.md](../../docs/ASTRO.md) for the real build example and limits.

### Gated media

`createEmbedService({consent, serviceId})` manages several iframe/image placeholders through one declared lifecycle. Set `services[].resourceOrigins` to exact HTTPS origins or `self`; destinations join the consent scope. `renderEmbedPlaceholder` supplies inert, escaped SSR copy. The placeholder opens preferences without granting, and withdrawal removes owned resources. See the repository’s `docs/EMBEDS.md` for lifecycle, CSP and remote-processing limits.

### Privacy signals

An explicit `privacySignals.globalPrivacyControl` policy and exhaustive `services[].processingActivities` classification enable a separate GPC runtime restriction. `servicePermissions`/`isServiceAllowed` combine that restriction with cookie/receipt permission; saved cookie grants stay separate. `hasGlobalPrivacyControl` and `getPrivacySignalRestrictions` support host request processing. Account/profile opt-out retention and downstream enforcement belong to the host. See `docs/PRIVACY-SIGNALS.md`.

Use [recorded processing opt-outs](../../docs/PROCESSING-CHOICES.md) for a separate manual sale/sharing/targeted-advertising action, optional CF retention and pending-request recovery. Bind it through `createConsent(config, environment, {processingChoices})`; cookie grants cannot override its service restrictions. Host identity and downstream handling remain application responsibilities.

Keep earlier pinned document URLs available in clean deployments with `createRetainedReleaseFiles` from `notabenda/content`, or repeat `--retain-artifact FILE` with the JSON CLI build. Supply trusted public compiler artifacts explicitly; private MD/MDX archives stay in backend history. See [retained releases](../../docs/RELEASES.md).

For an optional producer that owns exact declared browser keys, use [storage cleanup](../../docs/STORAGE-CLEANUP.md) to tie removal to withdrawal, failed startup and final teardown. Cookie expiration requests remain distinct from verified web-storage absence.

Use [guided setup](../../docs/SETUP.md) through `npx notabenda wizard` or the reusable `notabenda/setup/ui` questionnaire. Start fresh or import a config, describe your processing purposes, review providers, record private justifications and inspect catalog-linked recommendations before adopting a draft. Optional `notabenda/setup/purposes` and `notabenda/setup/purposes/ui` APIs support custom purpose editors.

Use a [collection notice](../../docs/COLLECTION.md) to place selected purpose information beside a form, with a pinned privacy version and native details. Static vanilla, React and Astro renderers share the same reviewed descriptor; notice display creates no permission or receipt.

Ordinary form permissions use `FormPermissionField.astro` and `mountAstroFormPermission` from `notabenda/astro/client`. A named field checks its exact offer before mounting and follows Astro navigation without reading, saving or retrying. The host owns the controller and person/contact binding. See the Astro guide for context changes and the working two-page example.

## Optional discovery tooling

Use `notabenda/discovery` for an explicit browser capture of visible request/reference origins and accessible storage names, and `notabenda/discovery/ui` for a local review/download surface. `npx notabenda discover --capture capture.json --config notabenda.config.json` compares explicit captures with declared inventory. Candidate mappings are advisory, with bounded/partial coverage and no automatic configuration, uploads or CI requirements. See [discovery](../../docs/DISCOVERY.md).


## Scope guards

Declare `scopeGuards` to hold optional work off for child-data, sensitive-data, high-risk-profiling or specialized sector contexts. Site and purpose facts are public, explicit `absent` / `present` / `unknown` declarations with a material revision. Present and unknown block affected purposes; ordinary policies, terms and rejection remain usable. `evaluateScopeGuards` and controller snapshots explain the result with requirement references. The toolkit does not verify parenthood or supply specialized authorization. See [the guide](../../docs/SCOPE-GUARDS.md) and the fictional light/dark laboratory.

## Optional Google Basic adapter

Declare `service.googleBasic` with explicit targets and all four signal mappings, then register it through `notabenda/google` before any Google snippet. The existing effective-permission engine gates tag insertion. Events are explicit and never buffered while blocked. Withdrawal after an attempted load requires a full document reset; this is not a certified CMP or a guarantee that already executed vendor code stops sending. See [the guide](../../docs/GOOGLE-BASIC.md) and the local simulator.

## Contract actions

The optional `notabenda/contracts` subpath supplies explicit withdrawal/cancellation form state and native controls. Build reviewed, versioned definitions with `createContractActionDefinition` from `notabenda/content`. The separate CF API captures declarations and independent delivery jobs; actual dispatch, contract matching and regional eligibility remain host work. This is an initial mechanism. See [contract declarations](../../docs/CONTRACT-ACTIONS.md).

## Choose browser delivery

`notabenda/headless` exposes the same cookie-choice controller, subscriptions, service lifecycles, scope guards, signal helpers and receipt types for a custom UI. It has no DOM mounting or document-rendering exports. Construction still validates the complete site configuration and supports the existing required-evidence options; the subpath does not bypass those checks. Other form/contract controllers retain their existing entry points.

```js
import {createConsent} from 'notabenda/headless';
import {mountControls} from 'notabenda'; // optional native UI
import 'notabenda/consent.css';         // optional consent-only styles
const consent = createConsent(publicConfig);
mountControls(document.querySelector('#privacy-controls'), {consent});
```

Use `notabenda/consent.css` for cookie controls, their privacy links and the package’s opt-in `.nb-page`/skip-link foundations. It uses the same tokens, focus rules, mobile drawer, reduced-motion and forced-color styling as `notabenda/styles.css`. The latter remains the complete stylesheet for legal pages, setup, forms, contract actions and other components. The narrower stylesheet supplies no full legal-document or operator-UI layout.

The repository’s `npm run size` reports measured browser/CSS sizes; `npm run size:check` additionally enforces the stated targets when you choose to run it. Current core JavaScript exceeds the 15 KiB gzip target, while consent-only CSS is below 5 KiB. See [delivery verification](../../docs/verification/browser-delivery.md). These are transfer sizes, not startup or accessibility certification.

The optional [service catalog](../../docs/SERVICE-CATALOG.md) supplies offline provider/product search and static project discovery, including backend SDKs. Use `notabenda catalog search email --delivery backend` or `notabenda discover --project .` after installing the local preview. Results remain candidates for review; reference data and Node scanning stay outside ordinary consent bundles.

`npx notabenda wizard --project . --out-dir ./setup-review` connects those candidates to explicit actual-use review after purpose authoring. Add `--catalog FILE` for a custom reference. The wizard saves full findings separately in ignored `discovery.private.json`; noninteractive `--answers` runs never select services from detection. Existing settings and private reviewed pins remain intact. See [project-aware setup](../../docs/SETUP.md#find-project-services-during-setup).

[Service directories](https://notabenda.org/guide/services) render the declared inventory as native, React or Astro cards with optional local search. Import `notabenda/services` and `notabenda/services.css`; no reference dataset is loaded by the visitor view.


For optional browser recognition, import `notabenda/catalog/browser` and the separately selected `notabenda/catalog/browser/seed`; pass that seed as `browserRules` to `mountDiscovery`, or capture explicitly with `captureBrowserCatalog`. `notabenda catalog detect --capture FILE` reviews rich pinned captures or origin/name-only legacy hints. Source snapshots, partial matches and coverage remain visible; no result activates a service. See [discovery](../../docs/DISCOVERY.md) for rule semantics, privacy limits and private exports.


`notabenda/catalog/release` provides `attachCatalogReview` to bind current selected catalog facts to a compiled static/MDX release. Public files carry only a descriptor; the separate archive is for authorized history storage. Finalize before creating notices/offers. [Release workflow](../../docs/SERVICE-CATALOG.md#retain-selections-with-policy-releases).

For information obtained from another source, the optional [indirect collection notice](../../docs/INDIRECT-COLLECTION.md) renders reviewed New Zealand IPP3A particulars in static HTML or plain text. It keeps the collection phase and privacy revision explicit; your application handles notification and any delivery records.

The optional [EU guarantee notice](../../docs/GUARANTEES.md) supplies the unchanged official shop-level artwork in 24 languages, with selected-file build output and text alternatives. Code is Apache-2.0; official graphics keep their own source/use conditions. Product labels and paid ordering remain separate work.

The optional `notabenda/guarantees/label` entry supplies `normalizeDurabilityGuaranteeLabel` and `renderDurabilityGuaranteeLabel` for finished producer GARAN files. React and Astro provide static wrappers. Ingestion and image validation live in `notabenda-authoring/guarantees`, keeping frontend installs dependency-free. See [product durability labels](../../docs/GUARANTEE-LABELS.md) for qualification, review and retention boundaries. **REQ-EU-GUARANTEE-LABEL**.

## Paid orders

Use `notabenda/orders` and `notabenda/orders.css` for expanded final-order information and an explicit payment-obligation action. Mixed carts, deposit/balance, subscriptions and conditional/calculated charges have separate totals and commitments. Your host supplies authenticated quotes, atomic admission, payment execution and durable contract confirmation. See [paid orders](../../docs/PAID-ORDERS.md) for setup and recovery behavior.


Optional [UK storage settings](../../docs/STORAGE-EXCEPTIONS.md) use `notabenda/storage-exceptions` and `notabenda/storage-exceptions/ui`. These keep explicit host-assessed exception declarations and objections separate from consent, with inline controls and atomic browser persistence. Scope and legal review remain recorded per requirement.

## Bring your own language

Supply complete versioned messages for legal pages and cookie-choice controls, including status and accessibility text. Set an explicit locale and direction; the compiled runtime contains only the selected consent copy. See the [localization guide](../../docs/LOCALIZATION.md) and [Portuguese example](../../examples/localization/config.mjs). Translation review, remaining interfaces and multi-language routing remain host or future work.
