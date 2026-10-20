# Architecture and implementation plan

Architecture and roadmap, 18 October 2026. Documents/configuration, the local consent runtime and vanilla controls, version-bound terms agreement, and optional host-authorized Cloudflare backoffice/history APIs work locally. Broader regional rules, additional framework adapters and further operational workflows remain proposals. Use the package READMEs and [consent guide](CONSENT.md) and [terms guide](TERMS.md) for actual APIs.

Setup now includes explicit [cookie control settings authoring](SETUP.md#configure-cookie-control-settings) in the operator UI and interactive CLI. It creates configured drafts from actual inventory while preserving restrictions and policies. Connecting and verifying actual service loaders, cleanup, storage, evidence transport and deployment remains required host work; configured settings are not installation evidence.

Build priorities and concrete deliverables are indexed in [FEATURES.md](FEATURES.md). Individual obligations, applicability conditions, sources, and verification scenarios live in the [requirements catalog](requirements/README.md), generated from [regulatory/catalog.json](../regulatory/catalog.json). Each rule and test must refer to its applicable `REQ-*` IDs. Research, legal review, implementation, and automated verification are separate statuses.

Markdown/MDX authoring with YAML frontmatter is implemented through the optional build-time `@notabenda/authoring` package. It preserves private source archives, static custom-component output and source/rendered comparisons. The JSON CLI is unchanged; see [AUTHORING.md](AUTHORING.md).

The optional React 19 subpaths now connect cookie and ordinary form-permission provider/hooks and native controls to the same host-owned controller, with conservative SSR/hydration and server-safe structured legal wrappers. See [REACT.md](REACT.md). Optional Astro components and a page-lifecycle bridge now accompany a real static-build example; see [ASTRO.md](ASTRO.md). Broader framework/platform verification remains pending.

Rights entry points now provide optional, operator-configured static navigation, scope explanations and a public contact fallback across vanilla, React and Astro. Setup recommends the mechanism and reopens imported wording/destinations for review. Request intake, identity checks, response handling, fulfillment and appeals remain application work; `FEAT-RIGHTS` stays partial. See [RIGHTS.md](RIGHTS.md).

Host-supplied [localization](LOCALIZATION.md) now covers legal document chrome/generated templates, every cookie-choice control state, ordinary terms acceptance, form permissions and static direct-collection notices, with versioned selected messages, explicit direction and archived consent copy. Material disclosure revisions are separate from presentation copy revisions. The remaining interfaces and broad reviewed locale catalogs remain open.

## 1. System boundaries

Keep the default path frontend-only. Configuration and legal content build into a site's deployment; a synchronous consent bootstrap determines which optional services may start. Render documents through the host framework or static HTML. Load a record transport only when configured.

```mermaid
flowchart TD
  A[Typed processing inventory + reviewed content] --> B[Build validation and compilation]
  B --> C[Static legal pages + released artifact]
  B --> D[Browser config]
  D --> E[Consent state and rules]
  E --> F[Native or headless controls]
  F --> E
  E --> G[Declared service loaders and embeds]
  E --> H[Local preference storage]
  E -. optional receipts .-> I[@notabenda/cloudflare Worker]
  J[Authenticated application backend] --> I
  I --> K[Operator-selected records and archives]
  L[Authenticated operator tools] --> I
```

No request to a project-operated service should be required. No remote UI rendering, automatic law downloads, or mandatory configuration fetch. A site can self-host pinned script/CSS assets instead of using a bundler. Content and configuration releases remain pinned and reviewable.

### Selected repository paths

```text
packages/
  notabenda/           # inventory, renderers, controllers, adapters, CLI
  notabenda-authoring/ # build-time Markdown/MDX and YAML frontmatter
  notabenda-cf/        # host-callable stores, operator Worker, starter and doctor
examples/
  static/             # plain HTML and local assets
  react/              # optional framework integration
  astro/              # static legal routes + client bootstrap
  authoring/          # sample Markdown/MDX sources and private-archive workflow
packages/*/test/      # package tests and scoped synthetic fixtures
catalog/              # pinned provider data, source licenses and browser rules
regulatory/           # public source/requirement/feature/verification catalog
scripts/regulatory.py # local validation and readable-index generation
docs/
```

The initial implementation uses TypeScript, npm workspaces, ESM/declarations, and Node's built-in test runner. There is no runtime dependency or bundler requirement. Keep the React adapters optional. Browser checks verify the actual no-JS pages and responsive layout. Keep build tooling out of browser dependency graphs.

The catalog links implemented and partial requirements to actual code/tests. Document/configuration, consent state/lifecycle, and CF backoffice/history tests run. The [accessibility audit](verification/accessibility.md) adds current-page semantic scans and desktop/mobile Chromium scenarios for actual controls and operator renderers, retaining incomplete findings explicitly. Full accessibility/platform review and regional-pack scenarios remain pending. Maintainer checks do not prescribe an adopter's CI workflow.

## 2. One inventory, several outputs

Separate public browser config from private operator facts. A build projection should prevent secrets, internal notes, private contact details, and retention justifications from accidentally entering the bundle.

| Model | Important fields |
| --- | --- |
| Site | Public site ID, public controller details, origins, languages, document routes |
| Purpose | Stable ID, description, collection contexts, legal basis, applicable controls |
| Service | Vendor, purposes, processing restrictions, storage/network declarations, loader and teardown |
| Rule pack | Scope, version, source references, review status, applicable restrictions |
| Document | Kind, locale, revision, effective date, original/reviewed content, dependencies |
| Consent scope | Material purpose/vendor/disclosure versions that determine whether a prior grant remains usable |
| Release artifact | Canonical config and rendered wording, digests, template/locale versions, UI release |
| Retention policy | Distinct local-choice, evidence, pending-delivery, and processing-data lifetimes |

Do not use one category such as “marketing” to represent every legal question. Model device access separately from downstream processing and US sale/sharing/targeted-advertising restrictions. A simple category UI can project from the richer model. A required service is not an optional permission that users supposedly granted.

Version material consent scope separately from general artifact revisions. A new purpose can invalidate relevant grants; a CSS change can produce a new release artifact without discarding a valid choice. Keep the old artifact available for retained evidence. The [retained-release build helper](RELEASES.md) now emits explicitly selected earlier public artifacts and exact pinned HTML into clean deployments; it keeps private source archives and mutable routes separate.

## 3. Developer experience

```sh
# After installing the preview package locally
npm install @notabenda/core
npx @notabenda/core init
npx @notabenda/core check
npx @notabenda/core build
```

`init` creates a small inventory and explicit content placeholders. `check` validates missing facts, undeclared services, unsupported profiles, and draft content. `build` emits static legal documents, public runtime config, and a versioned evidence artifact. Production mode rejects unresolved placeholders and unreviewed generated content; bring-your-own reviewed documents remain supported.

The [guided setup wizard](SETUP.md) now shares a bounded questionnaire/recommendation engine across CLI and the host-authorized local admin UI, with private justifications, saved-answer resume, draft exports and catalog references. Imported settings remain explicit operator decisions.

The initial [standalone discovery tool](DISCOVERY.md) captures buffered resource observations, DOM resource/hint origins and accessible storage names in an explicitly invoked browser UI/API, then compares capture JSON with declared inventory through a local CLI. Deeper network interception, frame/worker/server coverage and automatic crawling remain separate work. Support human-readable and machine-readable output. Adopters decide when to run it and whether to integrate it into CI or use findings as deployment gates; the toolkit does not require a CI workflow. Observations suggest configuration changes for review rather than automatically classifying services as legally exempt.

Current runtime API (configure explicit consent scope and lifetimes in the site inventory first):

```ts
import { createConsent, mountControls } from '@notabenda/core';
import '@notabenda/core/styles.css';
import publicConfig from './legal/notabenda.public.json';

const consent = createConsent(publicConfig);

// Register before the service is otherwise imported or requested.
consent.registerService('optional-metrics', {
  purposes: ['audience-measurement'],
  async start({ signal }) {
    const service = await import('./optional-metrics.js');
    if (signal.aborted) return () => {};
    service.start({ signal });
    return () => service.stop();
  },
});

mountControls(document.querySelector('#privacy-controls')!, { consent });
document.querySelector('#privacy-choices')!
  .addEventListener('click', () => consent.openPreferences());
```

The generated config declares the service and its rules; runtime registration supplies its executable lifecycle. Validation fails on unknown service IDs or mismatched purposes. Registering a service starts it only if the effective decision allows it. The importer must avoid eager imports, bundler preloads, remote previews, or inline initialization elsewhere.

Diagnostics and rule-decision explanations should include applicable requirement IDs. For example, a repeat-prompt rule cites `REQ-IT-REPROMPT`; its implementation and corresponding `VERIFY-IT-REPROMPT` test populate the catalog's real file references. Source changes can then identify affected rules, fixtures, and documents. Do not reduce the catalog to badges such as “Italy compliant.”

Offer state subscription, purpose/service decisions, `openPreferences`, explicit choice actions, and `destroy`. Headless consumers receive the same state/actions. React gets a provider, a subscription hook, and optional components; it must use the same decision engine rather than a parallel consent implementation. SSR imports must be safe without `window`.

Provide privacy/cookie/terms link components, a persistent preferences trigger, a form permission component, a terms-acceptance component, and gated embed placeholders. Privacy notices use ordinary links; optional marketing permission and terms acceptance remain separate actions.

### Deployment modes

| Mode | Setup | Evidence characteristics |
| --- | --- | --- |
| Static/local | npm package or self-hosted script, generated documents, local choices | No durable controller-held event history; not equivalent to recorded consent evidence |
| Existing backend | Configure a transport implementation | Operator owns storage, trusted identity binding, retention, and export |
| Cloudflare | Deploy @notabenda/cloudflare; configure same-origin `/api/privacy` where possible | Durable browser receipts plus trusted application records |

When JavaScript or storage is unavailable, optional integrations remain blocked and documents remain accessible. Show functional limitations where relevant. Avoid displaying a useless consent banner on sites with no optional processing, while preserving applicable notices and privacy-choice routes.

## 4. Consent and enforcement

The initial [regional solicitation guard](REGIONAL-PROMPTS.md) implements explicit Italian repeat-prompt policy mechanics, including separate suppression memory, exact declared material-change transitions and policy-bound notice copy. This starts regional behavior without inferring applicability or claiming a complete reviewed regional pack.

Persist decisions independently from receipt delivery. UI drafts are not active consent. Track `unknown`, `granted`, `denied`, `withdrawn`, and `expired` where meaningful; do not turn absence or failed parsing into permission.

1. Read valid local state synchronously before any optional loader, then apply expiration, scope compatibility, applicable rules, and browser signals. Unknown location uses the conservative profile. IP geography can assist routing, but cannot determine legal applicability by itself.
2. A choice updates local effective state, controls, and service lifecycle immediately. Record delivery status separately as pending, acknowledged, or failed; never tell a visitor a remote record was saved without acknowledgment.
3. Withdrawal stops future requests, calls available vendor disable/teardown hooks, removes accessible declared storage, and replaces relevant embeds. An already executed script cannot be unexecuted, transmitted data cannot be recalled, and third-party/HttpOnly storage may need vendor or server handling. Document when a reload is required; make that reload part of the tested flow.
4. A failing backend never reverses a rejection or withdrawal. Retry pending evidence with bounded lifetime/backoff. For evidence-required grants, keep the optional purpose blocked until its receipt is acknowledged; other deployments must explicitly choose and document local-only grant behavior.
5. Cross-tab changes converge through a supported browser channel/storage event, with an in-memory fallback when persistence fails. Clearing storage starts from the conservative default. Do not fingerprint visitors to recover preferences.
6. Server-side trackers and audience exports require integration with the same restrictions. Local flags are untrusted input, never authorization credentials.

Use explicit adapters and inert embeds as the primary enforcement path. Avoid claiming that MutationObserver, patching `document.cookie`, or retroactively removing script nodes can prevent all tracking. Optional automatic detection can flag mistakes, but it cannot see every execution path, server action, or worker. Cover script tags, fetch/beacons, iframes, images, preload/preconnect hints, pixels, storage, SPAs, hydration, and service workers in integration guidance.

The initial iframe/image adapter is implemented: one host-owned service group, inert SSR placeholders, declared initial origins included in consent scope, all-purpose/evidence gating and abort-driven removal. See [EMBEDS.md](EMBEDS.md). An opt-in [declared storage cleanup adapter](STORAGE-CLEANUP.md) now clears exact local/session items and requests explicitly scoped cookie expiration inside the same service generation. Broader automatic discovery, inaccessible storage and vendor-specific integration remain separate work.

The initial [GPC runtime restriction](PRIVACY-SIGNALS.md) now combines explicit processing classification with cookie/receipt eligibility, including queued starts and withdrawal. It supplies browser/status and server-header mechanics. A separate [recorded opt-out](PROCESSING-CHOICES.md) now provides manual restriction actions, local pending recovery and a monotonic host-bound CF ledger. Account/profile identity mapping, downstream processing and reviewed jurisdiction profiles remain outstanding; this mechanism does not complete those milestones.

The initial [Google Basic adapter](GOOGLE-BASIC.md) now validates explicit public tag/signal declarations, establishes denied defaults before initialization, and uses effective service gating. Intercepted default-loader tests make no Google requests before grant or initial rejection. Post-load withdrawal closes owned calls and requires a full document reset; real vendor/browser acceptance remains pending. Advanced mode and TCF support are separate opt-in projects; see [regulatory boundaries](REGULATORY.md).

## 5. Styling and interface quality

Default to semantic light-DOM markup, low-specificity namespaced selectors, a named cascade layer, and CSS custom properties. Styles are optional. No bundled fonts, inline styling requirement, iframe, or mandatory Shadow DOM. Headless rendering permits complete composition inside existing design systems.

```css
@layer notabenda, app;

@layer app {
  .nb-root {
    --nb-font: inherit;
    --nb-surface: #fff;
    --nb-text: #1c2420;
    --nb-border: #d4ddd7;
    --nb-action-bg: #174c37;
    --nb-action-text: #fff;
    --nb-radius: 0.75rem;
    --nb-max-width: 36rem;
    --nb-bottom-offset: 0.75rem;
    --nb-sheet-max-height: min(75dvh, 36rem);
  }
}
```

The complete token contract should include focus indicators, muted text, links, secondary surfaces, spacing, elevation, motion, safe-area insets, and offsets for host-site controls. Expose stable slots/classes and layout variants. Provide light/dark defaults and an unstyled variant. A persistent footer link is required in examples; a floating button is optional.

**Default mobile interaction:** begin with a compact, nonmodal bottom notice, not an automatic fullscreen dialog. It clearly asks for permission and exposes balanced accept/reject/customize actions while leaving the page usable. Use a short, specific purpose summary with a notice link; do not stuff full legal documents into the first layer. On narrow screens, equal accept/reject buttons can share a row, with a separate visible preferences action. Do not require opening the drawer merely to refuse.

Open preferences only after a deliberate tap, keyboard action, or optional pull-up gesture. The default expansion is a bottom drawer with a visible heading, close action, clear purpose controls, internally scrolling content, and accessible save/reject actions. Desktop can use a corner notice and a side drawer. The first-layer notice has no page-blocking backdrop, body scroll lock, focus trap, or automatic focus theft. An intentionally opened modal drawer can use appropriate focus handling and a restrained backdrop, with focus restored on close.

Treat the compact notice as a small card/bar, with an approximate 120–180 CSS-pixel design target on a typical mobile viewport at default text size. This is a design target, never a hard cap that clips text, shrinks controls, or hides required actions. The expanded drawer should generally stay within 75% of the dynamic viewport and scroll its body, adapting for short screens, large text, zoom, and the keyboard. Prefer about 44px touch targets as a product ergonomic target. Respect safe areas, home indicators, browser chrome, and configurable offsets to avoid overlapping a site's primary actions.

Dragging is an enhancement, never the only way to open/close. Closing or swiping away the notice/drawer does not grant consent or apply unsaved changes. Keep a persistent way to reopen controls. Avoid repeated solicitation, flashing, pulsing, promotional language, and a full-screen takeover on route changes. If the site has no relevant optional processing, do not create an unnecessary permission prompt.

Acceptance should demonstrate the same configuration in two visibly different fictional brands without overriding internal selectors. Test 320/360/390/430px widths, short landscape heights, mobile safe areas/keyboards, 200–400% zoom, large text, long translations, RTL, reduced motion, and forced colors. Inspect both the initial compact notice and deliberate drawer expansion in WebKit and Chromium, with physical iOS/Android checks before release. Use real labels and buttons, focus restoration, dialog keyboard behavior, and screen-reader announcements. Keep accept/reject equally easy to find and operate through theme changes. Trace these checks to `REQ-PRODUCT-MOBILE`, `REQ-PRODUCT-A11Y`, and relevant regional requirements such as `REQ-ES-CHOICE`.

Allow visual customization without removing required actions or making them unreadable. Built-in themes receive contrast and accessibility checks; headless consumers receive an explicit integration checklist and test helpers. Product presets should never optimize for accidental opt-in.

The initial [scope guard mechanism](SCOPE-GUARDS.md) now connects explicit operator context declarations to optional-service eligibility, granular grants and archive-checked CF recording. It preserves static documents and restrictive actions, with revision-bound choices and private setup reasoning. Specialized authorization, age/identity verification, sector flows and legal review remain separate work.

The initial [collection notice](COLLECTION.md) now presents selected inventory facts beside host forms with a pinned privacy revision, independent wording review and static vanilla/React/Astro markup. The [ordinary form-permission mechanism](FORM-PERMISSIONS.md) now adds reviewed purpose/channel offers, a headless/vanilla field and trusted CF grant/withdrawal records. Isolated light/midnight examples and local SQLite restart checks are implemented. Optional transactional IndexedDB recovery now retains exact pending requests and withdrawal fences without automatic delivery. React provider/hooks and the native field wrapper now reuse that controller with conservative SSR and explicit host reads. Astro named fields and the page-lifecycle bridge now bind exact offers, retain host ownership and make no mount/navigation transport. A real two-page session example checks context replacement. Field-level mapping, background delivery, actual sending and regional packs remain incomplete.

## 6. Legal content pipeline

Compile structured clauses or supplied reviewed documents into semantic HTML, a table of contents, a service/storage table, and a portable JSON artifact. Markdown inputs must be sanitized; no arbitrary HTML or remote executable content by default. Route rendering belongs to the host site, preserving its typography, navigation, and SEO.

Start with privacy and cookie notices plus supplied terms. Add a small original, reviewed terms pack for a narrowly declared service/audience scope rather than advertising universal generated terms. Keep template licenses explicit. A document assembler should explain which facts selected each clause and flag contradictory or missing answers.

[Retained-release tooling](RELEASES.md) preserves exact public policy pages; [document history](AUTHORING.md) exposes rendered and authored-source comparisons. The host reviews material changes and any future effective date, then controls publication and activation. These helpers do not silently replace live terms or decide whether an edit requires reacceptance. Where acceptance is needed, archive the accepted version and record an explicit action through the application backend. Publishing a notice, notifying users, and obtaining a new consent are different operations.

### Applicable contract actions

The initial [contract-action module](CONTRACT-ACTIONS.md) now supplies versioned reviewed forms, a headless/native controller, savable receipt, transactional CF declarations and separate leased application/acknowledgement jobs. Per-declaration lifecycle prevents old-evidence retirement from blocking future declarations. Public light/midnight examples, tailored private inspection/search and local SQLite capture/restart are verified. Optional paired/single-channel delivery runners now handle bounded host callbacks and separate provider/settlement outcomes; a two-DO SQLite harness verifies restart, expired claims and downstream deduplication with simulated providers. Actual installed host scheduling/providers, recipient delivery and regional/operational acceptance remain open. Continue the optional contract-action module for applicable withdrawal and cancellation flows, linked to `FEAT-CONTRACT-ACTIONS` and the individual `REQ-EU-WITHDRAWAL`, `REQ-DE-WITHDRAWAL`, `REQ-DE-CANCEL`, and `REQ-BR-CONTRACT` items. National implementation, contract type, rights windows, and exclusions determine which flow is shown. Do not combine these actions with privacy-consent withdrawal.

Provide a visible entry, appropriate form and review/confirmation step, durable submission, and required acknowledgment via the configured application channel. Keep forms mobile-friendly and user-opened. The application decides identity/contract matching and performs refunds, cancellation, or subscription changes. The toolkit should not require an account login merely for convenience where applicable rules require an easier route. Avoid revealing account or contract existence through public responses.

The optional CF contract-action store uses its own declaration schema and lifecycle class, idempotent receipts and independent application/acknowledgement jobs. Pending dispatch is durable before a declaration is acknowledged. Host authorization, channel delivery and contractual fulfillment still need integration and verification. A frontend-only “success” state is insufficient. Any need for a queue or delivery provider is specific to this optional reliable-dispatch requirement, not a dependency of the core cookie runtime. External delivery and fulfillment remain operator responsibilities unless explicitly configured and verified.

## 7. @notabenda/cloudflare: deliberately small

The current optional package supplies a read-only, mountable admin Worker, a host-scoped Durable Object storage adapter, transactional document-release history, and opt-in transactional terms-offer/acceptance helpers. Authentication/authorization is supplied by the host through a mandatory hook, with no package login system. The hook returns an already scoped store; browser URLs do not select arbitrary DOs or namespaces. See [the CF package guide](../packages/notabenda-cf/README.md) for actual APIs and limits.

The backoffice provides bounded evidence search, cards/details, release comparisons, safe JSON inspection and [explicitly authorized filtered JSON export](EVIDENCE-EXPORT.md). Downloads are live bounded segments with continuation; broader data exports and snapshot isolation remain host work. [Evidence lifecycle](EVIDENCE-LIFECYCLE.md) now supplies scoped retirement, holds, bounded payload purge and manifest reapplication, with terminal browser states and readable admin progress. Eligibility, scheduling, identity resolution, authoritative manifests, retained metadata and external copies remain host work. History retains exact document releases and change notes, rejects conflicting immutable writes, and distinguishes structured-content changes from rendered-HTML changes. It does not publish, notify, or collect visitor choices automatically. The host owns evidence capture, authorization, access logging, retention/erasure, and application actions. These accepted decisions are recorded in [SCOPE.md](SCOPE.md).

D1, R2, scheduled retention jobs, and delivery queues remain options for future evidence services; none is a mandatory dependency of this admin component. The document archive currently bounds values to 128 KiB and requires a transactional store. Larger records need a reviewed blob-storage strategy.

Terms acceptance is implemented as host-callable storage helpers, with trusted subject/workflow/operation binding and an acknowledged frontend transport. Registration and activation are separate, and activation checks share the acceptance transaction. There is no package-provided public write route. Cookie-choice notice registration and a transactional host-callable ledger are implemented; see [CONSENT-EVIDENCE.md](CONSENT-EVIDENCE.md). Browser required-receipt gating and bounded delivery are implemented behind opt-in host transport; [retention, holds and resumable erasure](EVIDENCE-LIFECYCLE.md) are available through explicit host policy and authorization. Broader generic subject-event ingestion remains open.

### Future evidence-ingestion API surface (routes not implemented)

| Route | Caller | Purpose |
| --- | --- | --- |
| `POST /v1/choices` | Browser, restricted public ingestion | Submit an anonymous choice/revocation and receive a receipt |
| `GET /v1/receipts/:id` | Matching opaque receipt capability or authenticated operator | Retrieve only that receipt; no anonymous enumeration |
| `POST /v1/subject-events` | Authenticated application server | Form consent, withdrawal, or terms events bound to a scoped subject |
| `GET /v1/subjects/:id/events` | Authenticated operator/application with explicit scope | Export evidence for a known subject |
| `POST /v1/artifacts` | Authenticated deployment tooling | Register a versioned artifact before it can be referenced |
| `POST /v1/exports` | Authenticated operator | Bounded export by site, subject, and/or time range |
| `DELETE /v1/subjects/:id` | Authenticated operator, policy-aware | Authorized erasure with legal-hold handling and deletion audit |
| `GET /healthz` | Deployment monitoring | Health without personal data or internal configuration |

Public writes are unverified browser reports. Site IDs and public configuration are not secrets. Validate schemas, payload sizes, origin/site mappings, artifact references, event types, and idempotency keys; rate-limit abuse and quotas. CORS is a browser control, not authentication. Do not allow public callers to attach an event to an account merely by supplying a subject ID.

Prefer same-origin deployment and tightly scoped receipt capabilities stored as hashes server-side. Any cookie-authenticated operation needs CSRF defenses and appropriate cookie flags. Operator reads/deletes require scoped secrets or validated Cloudflare Access identity; checking the presence of an Access header is insufficient. Never put operator keys in frontend config.

### Data and trust model

The current evidence ledgers scope artifacts, choices, terms agreements, form permissions and processing restrictions to host-resolved contexts. Their current-state projections are derived from recorded actions. A generic subject-event API and additional capability/issuer designs remain proposals. Bind record creation and projections transactionally using the selected store's guarantees, and test retry/concurrency behavior. Record trusted receipt order and client-reported time separately. Backdated/offline events must not resurrect permission after a later withdrawal; receipt retries must not create duplicate events.

Hash canonical released artifacts; reference them from events. Optional signed receipts include the artifact digest, event ID, server time, and provenance level. Keep signing-key versions and document rotation. Signatures establish issuer/integrity, not human identity. Artifact registration must be authenticated, and referenced versions must remain retrievable for the record's retention period.

Do not log raw requests or sensitive payloads. Use pseudonymous, site-scoped subject references supplied by trusted applications; hashing an email without an appropriate keyed/scoped design is not anonymization. Configure evidence retention, pending-record expiry, export access, deletion, operator auditing, and restore procedures before production use. Legal holds must be explicit and access-restricted, with expiry/review, rather than turning all records into permanent logs.

Cloudflare D1 supports jurisdiction constraints at database creation. Use a jurisdiction when database locality is required; a location hint is not a guarantee. D1 locality does not constrain all Worker processing, logs, exports, backups, or subprocessors. Document the complete data path and provider arrangements rather than calling an EU database “EU-only hosting.” [Cloudflare D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/)

### Deployment experience

The initial `npx @notabenda/cloudflare init` is now implemented. It exclusively creates a new local project with a denying host hook, configured-site DO routing, shared admin/setup, private archive RPC and explicit Wrangler build/check/dev/deploy scripts. It does not run installation or deployment. See [CLOUDFLARE-STARTER.md](CLOUDFLARE-STARTER.md); the [read-only local doctor](CLOUDFLARE-DOCTOR.md) now checks starter declarations and reports separate manual acceptance. Remote provisioning and broader operational rollout checks remain open.

```sh
# Implemented optional backend setup
npx @notabenda/cloudflare init
# In the new project, review auth/settings and install local preview packages.
npx @notabenda/cloudflare doctor
# Review and run the explicit generated Wrangler build/check/deploy scripts.
```

The additional proposed wrappers should expose reviewable Wrangler configuration, class lifecycle declarations, host secret setup and a verification run. A failed deployment must report whether resources were created and how to resume safely. Never ship a development token or permissive production origin policy. Produce local configuration, not a central account signup. The implemented starter uses explicit generated npm/Wrangler scripts; `notabenda-cf deploy` remains a proposal. The implemented doctor does not execute project code, install, build, load credentials or inspect remote resources; its local verdict never replaces host access/lifecycle verification.

Document staging/production separation, migrations and rollback boundaries, key rotation, export/restore, backup retention, and how deletions are reapplied after restore. Estimate costs from choice-event volume, writes, retained rows, and exports; there should be no per-page-view write requirement. Benchmark against current Cloudflare pricing/limits before publishing costs or capacity claims.

## 8. Build versus reuse

Spend an early, time-boxed spike evaluating [CookieConsent](https://github.com/orestbida/cookieconsent) and [Klaro](https://github.com/kiprotect/klaro) against the headless API, lifecycle control, styling, accessibility, SSR, and size targets. CookieConsent is MIT-licensed; verify the exact release and dependencies of any selected library. Neither should be assumed to solve legal content, evidence, or every regional requirement.

Prefer reuse where it meets the contract without carrying two competing state engines. Otherwise implement a small purpose-specific core and document why. Do not fork a broad suite simply to reskin its banner. Preserve attribution and audit third-party licenses before open-source distribution.

## 9. Milestones and acceptance gates

Order matters: prove enforcement and artifact identity before expanding document catalogs or adapters. Effort bands are rough engineering estimates for one experienced contributor, exclude external review and certification, and should be revised after the first spike.

| Milestone | Deliverable | Exit criteria | Effort band |
| --- | --- | --- | --- |
| 0 — Contracts and spike | Schema, source-linked requirements, threat model, dependency decision, synthetic demo | Stable requirement/purpose/service IDs; source gaps and trust boundaries explicit; reuse decision measured | 2–4 days |
| 1 — Documents and integration basics | Inventory, static documents, content validation, legal links, vanilla/React/Astro entry points | No-JS documents; deterministic artifacts; incomplete production config fails; examples use native styling | 5–8 days |
| 2 — Browser controls and enforcement | Local state, compact notice/drawers, headless/React controls, service gating, two themes | No optional traffic before grant; reject/withdraw work; storage failures stay safe; mobile, accessibility, and requirement-linked checks pass | 5–8 days |
| 3 — Forms, regional rules, and records | Form surfaces, prioritized regional profiles, Worker/DO, receipts/trusted events, retention/export/delete | Requirement-specific behavior verified; duplicates/reordering handled; private records protected; restore/deletion drill passes | 7–12 days |
| 3b — Applicable contract widgets | Withdrawal/cancellation forms, application handoff, durable acknowledgment | Required flows pass their regional scenarios; no fake success; delivery/retry failures are recoverable | 3–6 days |
| 4 — Integrations and diagnostics | Basic Consent Mode, browser inspection, deployment doctor | Unknown network/storage behavior reported; no-consent Google fixture stays silent; endpoint outage/recovery verified | 3–5 days |
| 5 — Release hardening | Docs, scope review, accessibility review, package/deployment verification | Release checklist below satisfied; documented exclusions; no unsupported compliance claims | 3–5 days |

Ship milestones 1–2 as a clearly labeled frontend preview if useful. Milestone 3b is needed only for deployments that use the applicable contract actions. A production claim involving recorded evidence waits for milestone 3 and its operational checks. Full regional support waits for the corresponding review, regardless of engineering completion. Research across the broader catalog starts with milestone 0 and continues through every phase; it is not deferred until regional runtime work.

Browser delivery now has an explicit `@notabenda/core/headless` export, a consent-only stylesheet derived from canonical styles and a self-contained bundled cookie example. Optional `npm run size` / `size:check` tooling reports real entry graphs and gzip sizes. Consent CSS is below its 5 KiB target; the existing fully validating core-plus-controls entry remains above 15 KiB. A compiled runtime entry and separate required-evidence adapter now share the compatibility state engine. Build-time full validation plus bounded browser validation preserves exact material scope encoding and synchronous binding errors; local plus native controls meets 15 KiB gzip. React now has a separate consent-only entry with the same bridge behavior and a narrower honest getter, while its compatibility entry retains the full config contract. Required receipt code is measured separately. New stored-choice provenance prevents a missing adapter from reusing a required or ambiguous historical grant; negatives and regional prompt memory remain. Optional Node/browser tools now measure fresh-controller setup, granted snapshots and synchronous local choice calls with the actual native controls. Shared snapshot work is reduced while live restrictions remain checked. The fully validating compatibility entry, full page startup/paint, receipt/processing configurations and broader platforms still need size/performance work; see [controller timing](verification/consent-performance.md). See [delivery verification](verification/browser-delivery.md).

## 10. Tests that determine whether this works

- **Network/storage:** fresh browser, reject, granular grant, reload, withdrawal, expired scope, newly added purpose, unavailable storage, disabled JS, and a blocked evidence endpoint. Assert both requests and storage effects, including embedded content and resource hints.
- **State correctness:** malformed/tampered local records, GPC plus previous grant, cross-tab changes, offline/reordered retries, and no resurrection of revoked permissions. Check Chromium, Firefox, and WebKit.
- **Application processing:** a synthetic backend export obeys an applicable opt-out; a forged subject ID cannot create trusted consent; terms acceptance and optional marketing permissions remain independent.
- **Security:** artifact poisoning, cross-site access, replay, ingestion floods, unsafe document markup, missing/invalid admin identity, log redaction, and secret isolation. Public-receipt integrity tests must not confuse a valid signature with authenticated consent.
- **Operations:** deploy into a fresh account/environment, run migrations, rotate keys, export data, expire records, restore a backup, reapply deletions, and recover from partial deployment.
- **Experience/performance:** manual keyboard/screen-reader verification, contrast, compact initial mobile layout, deliberate drawer expansion, tap alternatives to gestures, safe areas, short screens/keyboard/zoom/RTL themes, import-safe SSR, hydration, SPA navigation, bundle budgets, and startup/interaction timing. Verify that initial display does not trap focus/block the page, dismissal grants nothing, and route changes do not recreate an unsolicited takeover. The CLI should report observed issues, never a universal legal-compliance score.

## 11. Public release checklist and deferred work

Before release: verify npm names; include the project's Apache-2.0 license; document separate content licenses; include a security reporting policy; pin/review dependencies; verify package contents exclude secrets and private examples; provide install/uninstall/migration instructions and evidence-format versioning. Use only fictional operators, domains, vendors, and subjects in project fixtures and examples.

Migration guidance should inventory actual services, preserve available historical evidence, archive prior document versions where lawfully available, and explicitly establish new grants when old choices cannot be mapped reliably. Do not translate an old opaque cookie into assumed consent. Prevent parallel old/new loaders from starting the same tracker during rollout.

Defer a hosted dashboard, automatic legal updates, broad vendor/locale catalogs, CMS plugins, account-wide/cross-domain consent, enterprise rights workflows, whistleblowing, and TCF/Google certification. Cross-device consent needs an explicit identity, disclosure, and precedence design; do not infer it by tracking visitors.

The first implementation task is milestone 0 followed by the smallest complete demo: reviewed supplied documents, one mock optional integration, one choice flow in two themes, and a versioned artifact. Then add the optional receipt path without changing the frontend state contract.

The optional [customer confirmation module](ORDER-CONFIRMATIONS.md) retains complete host-supplied personally addressed files and a separate delivery job after host-declared contract conclusion. It preserves the original order admission, fixed destination version, exact file bytes, provider/settlement uncertainty, private inspection and lifecycle fencing. It installs no sender or scheduler. Real provision, timing, content review, corrections and regional/operational acceptance remain separate work.


The optional [UK storage settings](STORAGE-EXCEPTIONS.md) implement declared statistical/appearance profiles as independent objection gates. They reuse the cooperative service runner, require atomic preference persistence and usable presentation, preserve objections across material revisions, and keep ordinary consent choices separate. Broader regional support and provider qualification remain open.

## Product direction: packs

The primary product path is now choose a job, prepare its facts and connect it to a site. Treat the framework APIs as supporting integration details. The first slice supplies three basic packs, additional functions and specific timing overlays, a shared installed registry, focused manual/CLI setup and an agent brief. Continue this model through preview, connection and operator next actions; avoid adding more isolated feature pages as the default onboarding. See [packs](CARTRIDGES.md) and [scope decisions](SCOPE.md#pack-product-model).

The installed pack UI now supplies optional server rendering, browser mounting/hydration and separate styles. Website/operator setup and new CF starters use the shared component, including private-report resume and host-owned destinations. Continue with evidence-workspace organization and evidence-bound operator next actions; setup selection alone remains a local draft.

The optional backend now has a shared overview and cross-area record finder. New CF starters and the project website use three primary evidence jobs, folded additional areas and bounded continuation into the existing search views. Evidence-bound pack installation/verification and richer operator follow-through remain open; a displayed record is not a readiness signal.

Draft review now includes a deliberate local preview of config-based privacy, cookie and terms pages. The same renderer and default styles serve this reader, with a fixed public snapshot and inert outside links. Separate authored MD/MDX/custom-component previews, live widget behavior and evidence-bound connection/deployment verification remain open.

Prepared drafts now show selected pack connection work and application checks from the installed integration reference, with shared foundations listed for reuse. Browser and scoped CLI output use the same connection-stage agent brief and actual config/report filenames. The UI can return to selected facts, and edits invalidate prior guidance/downloads. This is actionable integration guidance; evidence-bound installation and deployment checks remain open.

<!-- @requirements REQ-PRODUCT-RIGHTS-AUTHORING -->
Privacy-request setup includes an explicit public-page editor, atomic page/ privacy-link draft API and versioned CLI proposal. It requires actual destinations, contact, scope and wording; it supplies no entitlement or intake process. Changed public content needs a new revision. The packaged page/editor are English-only. See [request-page authoring](https://notabenda.org/guide/rights-authoring/).
