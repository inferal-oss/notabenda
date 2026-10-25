<!-- @requirements REQ-PRODUCT-RELEASE-CANDIDATE -->
<!-- @requirements REQ-PRODUCT-MARKETING-AUTHORING -->
# @notabenda/core

For agent-assisted integration, use the bundled `dist/skill/SKILL.md` and optional `dist/skill/agents/openai.yaml`, also exported as `@notabenda/core/skill/SKILL.md` and `@notabenda/core/skill/agents/openai.yaml`. See the [agent setup guide](https://notabenda.org/guide/agent-setup/). Copy the complete `dist/skill/` directory, including its configuration-target reference. The installed copy follows this package version; the website follows the current preview.


Reusable site configuration and legal pages for your own website. Render privacy, cookie, and supplied terms documents as ordinary HTML, with optional styles and no runtime dependencies.

Optional [repeat-prompt policy](https://notabenda.org/guide/regional-prompts/) keeps solicitation separate from permission expiry, with configured applicability, public change explanations and linked requirements.

Developer preview. The package has not been published to npm yet; build/pack it from the repository and install the resulting tarball locally. Requires Node.js 22 or newer for the CLI and build-time API. The root renderer is browser/SSR-safe.

Site configuration can also use YAML or a Markdown document with YAML frontmatter. Use `--config notabenda.config.yaml` (or `.md`) with the same CLI commands, or `readSiteConfig` from `@notabenda/core/config/node` in a build. Browser setup can import the same formats and select the draft download format; `wizard --config-format yaml|markdown` selects CLI output. Configuration-document notes stay outside published output and saved browser drafts. CLI checks/builds and `readSiteConfig` reject unknown fields through the installed schema, then apply semantic and review rules. For a loaded object, use `validateAuthoredConfig` from the optional `@notabenda/core/config/validate` entry. See [configuration sources](https://notabenda.org/guide/configuration-sources/).

## Start with the CLI

After installing the local tarball, use `npx --no-install notabenda describe --json` for a version-matched integration map, facts needed, actual wizard question IDs and verification scenarios. Target specific work with `describe cookie-consent terms-agreement --json`; this reads no project config and changes nothing.

Use `npx --no-install notabenda schema consent --json` (or another dot path) for the exact known field shape, required properties and allowed type values. Omit the path for the full authoring schema, also exported as `@notabenda/core/config/schema.json`. It is generated from this package's `SiteConfig` type, rejects unknown keys and supplies no defaults. Run `check` as well for cross-field relationships, policy bounds and review; shape alone cannot verify these.

For an ambiguous task, fill the reference's `selectionTemplate` with supported `yes`, `no` or `unknown` decisions, then run `describe --selection FILE --json`. The selected map lists requested work, prerequisites and unanswered scope questions. It reads only the named ordinary JSON file; it does not scan the project or activate anything. Keep this scope file separate from wizard practice answers.

Use `assess --selection FILE --config FILE [--answers FILE] --json` to reconcile that scope with an existing inventory. The selected reference's `targetAnswersTemplate` limits practice questions to relevant ones. Assessment reports missing target config, conflicts, both validation modes and host work to verify without writing files or returning the config body. Answers may be a private setup report. Exit zero means a report was produced; declared fields and recorded answers do not establish readiness. Keep the assessment private.

To create a new draft:

```sh
npx --no-install notabenda init
# Edit notabenda.config.json: public operator facts, purposes, services,
# storage inventory, rights information, and your own terms sections.
npx --no-install notabenda check --preview
npx --no-install notabenda build --preview --out-dir public/legal-output
```

The starter is a draft containing explicit `{{placeholders}}`. Preview output includes a visible draft notice. Production checks/builds are the default and reject drafts and unresolved placeholders. Setting a review declaration is an operator assertion, not a review performed by the package.

Copy the output into the root of your static deployment, or supply your own framework layout. For example `/privacy` produces `privacy/index.html`. The default stylesheet URL is `/assets/notabenda.css`. If deploying under a prefix, configure document routes and the build API's stylesheet URL accordingly.

## Use your site's layout

```ts
import { defineSite, renderLegalDocument, renderLegalLinks } from '@notabenda/core';
import '@notabenda/core/styles.css'; // optional
import config from './notabenda.config.json' with { type: 'json' };

const site = defineSite(config);
const article = renderLegalDocument(site, 'privacy');
const footer = renderLegalLinks(site);
```

`defineSite` is a typed authoring helper. For arbitrary parsed JSON, use `validateSiteConfig(input)` and `toPublicConfig(input)`. Rendering always validates input. Use `renderLegalPage` for a complete document with a language attribute, viewport, headings, contents navigation, and legal links. Build and render with `{ mode: 'production' }` when publishing reviewed documents; fragment rendering defaults to preview validation.

Use optional CSS variables on your layout to set `--nb-font`, `--nb-surface`, `--nb-text`, `--nb-muted`, `--nb-line`, `--nb-accent`, and `--nb-document-width`. Omit the CSS entirely for your own styles. Content strings are plain text and escaped; structured section links allow HTTPS, plain mailto, or same-site paths. The core renderer does not interpret raw HTML or Markdown. Use the optional [authoring package](https://notabenda.org/guide/authoring-package/) for build-time Markdown or MDX. Built-in wording is English; hosts can supply versioned [localization](https://notabenda.org/guide/localization/).

## Build a release artifact

Review a page's declared inputs with `npx --no-install notabenda explain --config notabenda.config.yaml --document privacy --preview --json`. The build-time `explainLegalDocument` API provides the same section origins and configuration paths. It writes nothing and does not verify legal approval or publication. See [document input review](https://notabenda.org/guide/document-inputs/).

```ts
import { compileLegalDocuments } from '@notabenda/core/content';

const build = compileLegalDocuments(config); // production by default
// build.files: static pages, public config, manifest, immutable artifact JSON
// build.artifact: exact pages + structured documents for your history backend
```

The manifest includes exact-page and structured-content SHA-256 digests. Property ordering and private operator notes do not change it. A changed document creates a new artifact ID. Your backend can archive releases, link them to evidence, and compare structured content without executing archived HTML.

Only allowlisted public fields enter pages, public configuration, and artifacts. Optional `private` configuration and unknown fields are excluded. Never put credentials in public configuration fields. Supplied legal documents keep their own authorship/licensing; this renderer does not generate universally valid contractual terms or certify compliance.

## Privacy request entries

Optional `rightsCenter` configuration supplies explicit actions, scope explanations, safe application links, next steps and a public email/phone fallback. `renderRightsCenter` renders a fragment; `renderRightsPage` produces the full static page. Both default to production validation and require a reviewed declaration; pass `{mode: 'preview'}` explicitly for drafts. The compiler and Markdown/MDX authoring preserve this supporting page alongside the three legal documents.

Use `RightsCenter` from `@notabenda/core/react/documents` or `@notabenda/core/astro/RightsCenter.astro` for framework layouts without hydration. The wizard recommends configuration without inventing workflows, and imported rights declarations return to draft review. These are navigation surfaces: the application owns intake, identity checks, acknowledgments, response handling and fulfillment. See [the guide and examples](https://notabenda.org/guide/rights/).

## Optional form permissions

Build a purpose/channel offer with `createFormPermissionOffer`, then use `createFormPermission` and the optional `mountFormPermission` field. The host supplies the person/contact binding and recording transport; the field keeps grant and withdrawal independent from the surrounding form. An optional IndexedDB journal retains unconfirmed actions across reload for explicit retry. See [the form-permission guide](https://notabenda.org/guide/form-permissions/) for activation, retries and current-state checks.

## Cookie choices

Browser cookie controllers require a descriptor built with `compileConsentRuntimeConfig(config, {evidence: 'local'})` from `@notabenda/core/content` in build/server code. Root/headless `createConsent` aliases `createConsentRuntime` from `@notabenda/core/consent` and returns `ConsentStateController`. Required receipts use explicit `evidence: 'required'` and `requiredConsentEvidence` from `@notabenda/core/consent/evidence`. Both React entries expose this narrow controller type. Keep full-site rendering and other workflows separate. The [browser configuration guide](https://notabenda.org/guide/browser-config/) covers CLI output, validation and delivery; [migration guidance](https://notabenda.org/guide/migration/#unreleased-browser-api-migration) explains the temporary `@notabenda/core/consent/compat` entry and its full getter/larger dependency graph.

The [setup editor and interactive wizard](https://notabenda.org/guide/setup/#configure-cookie-control-settings) can author consent settings from your declared inventory. Custom operator tools can use `createConsentDraftPlan` from `@notabenda/core/setup/consent` or `mountConsentEditor` from `@notabenda/core/setup/consent/ui`. These prepare a local draft and preserve scope restrictions; the host still connects actual services and reviews publication.

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
import { createConsent, mountControls } from '@notabenda/core';
// runtimeConfig is build-produced consent-runtime.json, not the full site config.
const consent = createConsent(runtimeConfig);
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

Only registered cooperative work is gated. Arbitrary scripts, resource hints, third-party/HttpOnly storage, and server processing need explicit integration. Applicability and downstream processing remain host decisions. Optional [GPC restrictions](https://notabenda.org/guide/privacy-signals/) and [withdrawal/cancellation declarations](https://notabenda.org/guide/contract-actions/) are separate mechanisms; cookie consent does not supply them automatically. Optional required-receipt mode is available with host-owned authorization and transport; see the [evidence guide](https://notabenda.org/guide/consent-evidence/). Terms agreement has a separate acknowledged path below.

## Explicit terms agreement

Build an immutable version-and-wording offer with `createTermsOffer(build.artifact, {scopeId, statement, actionLabel})` from `@notabenda/core/content`. Production requires reviewed production terms. The compiler emits pinned document copies at `/artifacts/ARTIFACT_ID/terms.html`; retain and serve earlier versions when replacing deployments.

Use `createTermsAcceptance(offer, {operationId, submit})` and `mountTermsAcceptance(container, {acceptance})` from the browser entry. The checkbox starts unchecked. `submit` is a host-authenticated transport returning a matching backend receipt; the controller reports recorded agreement only after acknowledgment. Unknown failures retry the same secure request ID, while stale offers require a newly reviewed offer/controller. Cookie and marketing permissions are independent.

`getOffer`, `getSnapshot`, `subscribe`, `setChecked`, `submit`, and `destroy` support a custom UI. The optional `requestId` constructor field is for host recovery of an uncertain attempt, never authorization. Mount destruction removes UI only. Controller destruction aborts transport; a server write may already have committed. This does not withdraw an agreement.

For React, `@notabenda/core/react/terms` supplies `TermsAcceptanceProvider`, `TermsAcceptanceControl` and controller/snapshot hooks. Astro supplies `TermsAcceptance.astro` and `mountAstroTermsAcceptance` from `@notabenda/core/astro/client`. Both use the same native control, preserve uncertain requests across view remounts and submit nothing on mount or navigation. See [React](https://notabenda.org/guide/terms/#react) and [Astro](https://notabenda.org/guide/terms/#astro) for host operation binding and fallback content.

The optional `@notabenda/cloudflare` helpers register archived offers, explicitly activate them, and atomically record acceptance under a server-bound subject, scope and operation. The host provides all endpoint auth/CSRF, operation authorization, pinned hosting and retention. A recorded assertion does not establish a valid contract, durable-medium delivery or completion of a signup/payment. See the repository's [terms guide](https://notabenda.org/guide/terms/) for the full integration and boundaries.

## Technology function notices

The optional build-time `@notabenda/core/technology` entry supplies versioned identification, location and profiling disclosures bound to an intact legal release and a fresh consent-managed service scope. Host-language text and activation instructions stay visible without JavaScript. The host uses the existing service lifecycle and controls; it retains the supplemental descriptor separately. See [technology collection](https://notabenda.org/guide/technology-collection/). This initial Québec profile does not determine applicability or implement specialized workflows.

## Build from a configuration file

`notabenda build --config notabenda.config.yaml --consent-runtime local --out-dir legal-dist` builds legal pages plus the small browser consent descriptor and its separate stylesheet. JSON and Markdown with YAML frontmatter work too. Select `required` when optional processing needs a host receipt; the mode has no default and needs an archived notice and host receipt transport. Add `--consent-scope cookie-choices` with required mode to build the native notice and a hash-pinned public copy. Retain selected old notices with `--retain-consent-notice FILE` plus their legal releases. The [consent guide](https://notabenda.org/guide/consent/#smaller-browser-entry) shows the browser connection and service lifecycles.

## Exports

- `@notabenda/core`: configuration validation/projection, document rendering, local or required-receipt consent state, terms agreement, and vanilla controls.
- `@notabenda/core/integration`: read-only `describeIntegration(targetIds)` integration map and `selectIntegration(input)` for explicit scope decisions. Host tasks are separate from config fields.
- `@notabenda/core/integration/assessment`: read-only `assessIntegration({selection, config, answers?})` for an explicit inventory and optional practice answers. Reports observations and remaining work; never drafts or enables configuration.
- `@notabenda/core/content`: Node build-time compilation and portable artifacts.
- `@notabenda/core/styles.css`: optional responsive, namespaced styles.
- `notabenda` CLI: `init`, `check` and `build` accept JSON, YAML and Markdown configuration. `wizard` prepares a draft; `describe`, `schema` and `assess` support integration review. `check --json` exposes diagnostics and requirement IDs. Use `notabenda --help` for the full command list.

Code is licensed under Apache-2.0 OR MIT, at your option. The license does not replace review of the operator's processing facts, applicability, or legal content.

## Optional React integration

`@notabenda/core/react` provides a React 19 provider, effective-permission hooks and the existing native controls. React is an optional peer; default imports remain framework-independent. `@notabenda/core/react/documents` offers server-safe structured legal document/link components. The host owns controller creation, service registration and destruction. See [docs/REACT.md](https://notabenda.org/guide/react/) for APIs, SSR/hydration and limits.

React form permissions use a host-owned controller through `FormPermissionProvider`, `FormPermissionField` and the `useFormPermissionSnapshot` / `useFormPermissionAllowed` hooks in `@notabenda/core/react`. Mounting does not read, save or retry permission; the host explicitly loads current state. See the React guide for lifecycle, recovery and server-rendering limits.

## Optional Astro integration

`@notabenda/core/astro/LegalDocument.astro`, `LegalLinks.astro`, `ConsentControls.astro` and `PreferencesButton.astro` provide static surfaces for Astro 7. The browser-only `mountAstroConsent` function is exported from `@notabenda/core/astro/client`; it connects one host-owned controller to page swaps without recreating it. Astro is an optional peer. Static legal pages need no scripts; the host must retain a preferences surface on client-routed pages with ongoing optional services. See [docs/ASTRO.md](https://notabenda.org/guide/astro/) for the real build example and limits.

### Gated media

`createEmbedService({consent, serviceId})` manages several iframe/image placeholders through one declared lifecycle. Set `services[].resourceOrigins` to exact HTTPS origins or `self`; destinations join the consent scope. `renderEmbedPlaceholder` supplies inert, escaped SSR copy. The placeholder opens preferences without granting, and withdrawal removes owned resources. See [gated media](https://notabenda.org/guide/embeds/) for lifecycle, CSP and remote-processing limits.

### Privacy signals

An explicit `privacySignals.globalPrivacyControl` policy and exhaustive `services[].processingActivities` classification enable a separate GPC runtime restriction. `servicePermissions`/`isServiceAllowed` combine that restriction with cookie/receipt permission; saved cookie grants stay separate. `hasGlobalPrivacyControl` and `getPrivacySignalRestrictions` support host request processing. Account/profile opt-out retention and downstream enforcement belong to the host. See [privacy signals](https://notabenda.org/guide/privacy-signals/).

Use [recorded processing opt-outs](https://notabenda.org/guide/processing-choices/) for a separate manual sale/sharing/targeted-advertising action, optional CF retention and pending-request recovery. Bind it through `createConsent(runtimeConfig, environment, {processingChoices})`; cookie grants cannot override its service restrictions. Host identity and downstream handling remain application responsibilities.

Keep earlier pinned document URLs available in clean deployments with `createRetainedReleaseFiles` from `@notabenda/core/content`, or repeat `--retain-artifact FILE` with the CLI build. Supply trusted public compiler artifacts explicitly; private MD/MDX archives stay in backend history. See [retained releases](https://notabenda.org/guide/releases/).

For an optional producer that owns exact declared browser keys, use [storage cleanup](https://notabenda.org/guide/storage-cleanup/) to tie removal to withdrawal, failed startup and final teardown. Cookie expiration requests remain distinct from verified web-storage absence.

Use [guided setup](https://notabenda.org/guide/setup/) through `npx --no-install notabenda wizard` or the reusable `@notabenda/core/setup/ui` questionnaire. Start fresh or import a config, describe your processing purposes, review providers, record private justifications and inspect catalog-linked recommendations before adopting a draft. Optional `@notabenda/core/setup/purposes` and `@notabenda/core/setup/purposes/ui` APIs support custom purpose editors.

Use a [collection notice](https://notabenda.org/guide/collection/) to place selected purpose information beside a form, with a pinned privacy version and native details. Static vanilla, React and Astro renderers share the same reviewed descriptor; notice display creates no permission or receipt.

Ordinary form permissions use `FormPermissionField.astro` and `mountAstroFormPermission` from `@notabenda/core/astro/client`. A named field checks its exact offer before mounting and follows Astro navigation without reading, saving or retrying. The host owns the controller and person/contact binding. See the Astro guide for context changes and the working two-page example.

## Optional discovery tooling

Use `@notabenda/core/discovery` for an explicit browser capture of visible request/reference origins and accessible storage names, and `@notabenda/core/discovery/ui` for a local review/download surface. `npx --no-install notabenda discover --capture capture.json --config notabenda.config.json` compares explicit captures with declared inventory. Candidate mappings are advisory, with bounded/partial coverage and no automatic configuration, uploads or CI requirements. See [discovery](https://notabenda.org/guide/discovery/).


## Scope guards

Declare `scopeGuards` to hold optional work off for child-data, sensitive-data, high-risk-profiling or specialized sector contexts. Site and purpose facts are public, explicit `absent` / `present` / `unknown` declarations with a material revision. Present and unknown block affected purposes; ordinary policies, terms and rejection remain usable. `evaluateScopeGuards` and controller snapshots explain the result with requirement references. The toolkit does not verify parenthood or supply specialized authorization. See [the guide](https://notabenda.org/guide/scope-guards/) and the fictional light/dark laboratory.

## Optional Google Basic adapter

Declare `service.googleBasic` with explicit targets and all four signal mappings, then register it through `@notabenda/core/google` before any Google snippet. The existing effective-permission engine gates tag insertion. Events are explicit and never buffered while blocked. Withdrawal after an attempted load requires a full document reset; this is not a certified CMP or a guarantee that already executed vendor code stops sending. See [the guide](https://notabenda.org/guide/google-basic/) and the local simulator.

## Contract actions

The optional `@notabenda/core/contracts` subpath supplies explicit withdrawal/cancellation form state and native controls. Build reviewed, versioned definitions with `createContractActionDefinition` from `@notabenda/core/content`. The separate CF API captures declarations and independent delivery jobs; actual dispatch, contract matching and regional eligibility remain host work. This is an initial mechanism. See [contract declarations](https://notabenda.org/guide/contract-actions/).

## Choose browser delivery

`@notabenda/core/headless` exposes the same cookie-choice controller, subscriptions, service lifecycles, scope guards, signal helpers and receipt types for a custom UI. It has no DOM mounting or document-rendering exports. Construction validates the bounded runtime descriptor; complete site validation runs in the build/SSR compiler. Required receipts use the separately imported evidence adapter. Other form/contract controllers retain their existing entry points.

```js
import {createConsent} from '@notabenda/core/headless';
import {mountControls} from '@notabenda/core'; // optional native UI
import '@notabenda/core/consent.css';         // optional consent-only styles
// runtimeConfig is build-produced consent-runtime.json, not the full site config.
const consent = createConsent(runtimeConfig);
mountControls(document.querySelector('#privacy-controls'), {consent});
```

Use `@notabenda/core/consent.css` for cookie controls, their privacy links and the package’s opt-in `.nb-page`/skip-link foundations. It uses the same tokens, focus rules, mobile drawer, reduced-motion and forced-color styling as `@notabenda/core/styles.css`. The latter remains the complete stylesheet for legal pages, setup, forms, contract actions and other components. The narrower stylesheet supplies no full legal-document or operator-UI layout.

The repository’s `npm run size` reports measured browser/CSS sizes; `npm run size:check` additionally enforces the stated targets when you choose to run it. The primary API change requires fresh exact-source measurements against the unchanged 15 KiB JavaScript and 5 KiB consent-only CSS targets; earlier dated measurements describe their original entries and do not close this gate. See [delivery verification](https://notabenda.org/guide/verification/browser-delivery/). These are transfer sizes, not startup or accessibility certification.

The optional [service catalog](https://notabenda.org/guide/service-catalog/) supplies offline provider/product search and static project discovery, including backend SDKs. Use `notabenda catalog search email --delivery backend` or `notabenda discover --project .` after installing the local preview. Results remain candidates for review; reference data and Node scanning stay outside ordinary consent bundles.

`npx --no-install notabenda wizard --project . --out-dir ./setup-review` connects those candidates to explicit actual-use review after purpose authoring. Add `--catalog FILE` for a custom reference. The wizard saves full findings separately in ignored `discovery.private.json`; noninteractive `--answers` runs never select services from detection. Existing settings and private reviewed pins remain intact. See [project-aware setup](https://notabenda.org/guide/setup/#find-project-services-during-setup).

[Service directories](https://notabenda.org/guide/services) render the declared inventory as native, React or Astro cards with optional local search. Import `@notabenda/core/services` and `@notabenda/core/services.css`; no reference dataset is loaded by the visitor view.


For optional browser recognition, import `@notabenda/core/catalog/browser` and the separately selected `@notabenda/core/catalog/browser/seed`; pass that seed as `browserRules` to `mountDiscovery`, or capture explicitly with `captureBrowserCatalog`. `notabenda catalog detect --capture FILE` reviews rich pinned captures or origin/name-only legacy hints. Source snapshots, partial matches and coverage remain visible; no result activates a service. See [discovery](https://notabenda.org/guide/discovery/) for rule semantics, privacy limits and private exports.


`@notabenda/core/catalog/release` provides `attachCatalogReview` to bind current selected catalog facts to a compiled static/MDX release. Public files carry only a descriptor; the separate archive is for authorized history storage. Finalize before creating notices/offers. [Release workflow](https://notabenda.org/guide/service-catalog/#retain-selections-with-policy-releases).

For information obtained from another source, the optional [indirect collection notice](https://notabenda.org/guide/indirect-collection/) renders reviewed New Zealand IPP3A particulars in static HTML or plain text. It keeps the collection phase and privacy revision explicit; your application handles notification and any delivery records.

The optional [EU guarantee notice](https://notabenda.org/guide/guarantees/) supplies the unchanged official shop-level artwork in 24 languages, with selected-file build output and text alternatives. Code is Apache-2.0 OR MIT; official graphics keep their own source/use conditions. Product labels and paid ordering use the separate entries described below.

The optional `@notabenda/core/guarantees/label` entry supplies `normalizeDurabilityGuaranteeLabel` and `renderDurabilityGuaranteeLabel` for finished producer GARAN files. React and Astro provide static wrappers. Ingestion and image validation live in `@notabenda/authoring/guarantees`, keeping frontend installs dependency-free. See [product durability labels](https://notabenda.org/guide/guarantee-labels/) for qualification, review and retention boundaries. **REQ-EU-GUARANTEE-LABEL**.

## Paid orders

Use `@notabenda/core/orders` and `@notabenda/core/orders.css` for expanded final-order information and an explicit payment-obligation action. Mixed carts, deposit/balance, subscriptions and conditional/calculated charges have separate totals and commitments. Your host supplies authenticated quotes, atomic admission, payment execution and durable contract confirmation. See [paid orders](https://notabenda.org/guide/paid-orders/) for setup and recovery behavior.


Optional [UK storage settings](https://notabenda.org/guide/storage-exceptions/) use `@notabenda/core/storage-exceptions` and `@notabenda/core/storage-exceptions/ui`. These keep explicit host-assessed exception declarations and objections separate from consent, with inline controls and atomic browser persistence. Scope and legal review remain recorded per requirement.

## Bring your own language

Supply complete versioned messages for legal pages, cookie-choice controls and terms acceptance, including status and accessibility text. Set an explicit locale and direction; the compiled runtime contains only the selected consent copy. See the [localization guide](https://notabenda.org/guide/localization/) and [Portuguese example](https://notabenda.org/source/examples/localization/config.mjs.txt). Translation review, remaining interfaces and multi-language routing remain host or future work.

The [privacy packs](https://notabenda.org/guide/privacy-packs/) add focused form/indirect notices, request entry points and processing opt-out setup. `reviewPackInputs` and `packGroups` are exported from `@notabenda/core/packs`. The scoped report and optional third `formatPackBrief` argument identify missing/manual inputs without copying config values or marking anything configured.

The Node-only `@notabenda/core/publication` API and `notabenda check-publication` command compare an intended public artifact with four deployed pinned files. See [publication checks](https://notabenda.org/guide/publication-check/) for explicit network authority, limits and unverified work.

<!-- @requirements REQ-PRODUCT-RIGHTS-AUTHORING -->
Privacy-request setup includes an explicit public-page editor, atomic page/ privacy-link draft API and versioned CLI proposal. It requires actual destinations, contact, scope and wording; it supplies no entitlement or intake process. Changed public content needs a new revision. Non-English native pages require complete `localization.rights` messages; the operator editor remains English. See [request-page authoring](https://notabenda.org/guide/rights-authoring/).

<!-- @requirements REQ-PRODUCT-STORAGE-AUTHORING -->
Storage inventory can be authored explicitly in the operator UI or with `wizard --storage FILE`. Changes require fresh material versions for affected consent-managed owners, preserve unrelated settings and retain previous declarations in a private migration review. No browser data or permission is changed. See [storage authoring](https://notabenda.org/guide/storage-authoring/).

Use the optional [connection inspector](https://notabenda.org/guide/connection-inspection/) to compare the intended consent descriptor with the actual controller and identify missing lifecycle registrations. It leaves publication and application testing explicitly unverified.

For suspected vulnerabilities, use the [private security contact](https://notabenda.org/guide/security/). Read [migration and removal](https://notabenda.org/guide/migration/) before replacing an existing integration or retiring its records.

Prepare direct-form notice settings from a final public release with `notabenda form-workbench`. The local browser editor previews selected public facts and exports JSON/YAML/Markdown settings for the existing collection-flow builder. See [the workbench guide](https://notabenda.org/guide/collection-workbench/).

Prepare a recorded opt-out notice with `notabenda processing-workbench`, then compile its JSON/YAML/Markdown settings directly against the final artifact with `notabenda processing-notice`. See [the processing workbench guide](https://notabenda.org/guide/processing-workbench/).


South African web marketing requests can be prepared as JSON, YAML or Markdown-frontmatter settings with the optional [local request editor](https://notabenda.org/guide/marketing-workbench/). The `marketing-request` command compiles against the exact final public artifact using the existing schema-4 builder. Invitation eligibility, recording, identity and actual sending remain host work.
