# Notabenda

**An open-source toolkit for self-hosted legal pages, privacy controls and evidence storage.**

The intended install is an npm package. Most work happens in the frontend or at build time: describe processing, generate or render documents, mount controls, and gate optional services. The optional **@notabenda/cloudflare** package provides mountable Cloudflare workers, Durable Object storage adapters, an evidence backoffice, and document-release history. The host application supplies authentication and authorization. Distinct evidence ingestion and optional bounded contract handoff runners are implemented; provider connections, scheduling and operational acceptance belong to the host.

Status: developer preview, **20 October 2026**. Document/configuration tools, controls, evidence APIs, history, framework integrations and isolated examples are implemented, with remaining regional, operational and release work tracked per feature. No package has been published to npm. The `@notabenda` npm organization is reserved; the planned public packages are `@notabenda/core`, `@notabenda/cloudflare` and `@notabenda/authoring`.

## Build areas, in priority order

P0 establishes useful legal pages and integration basics. P1 adds browser consent and enforcement. P2 adds durable evidence and applicable regional/contract controls. P3 adds discovery and specialist integrations. P4 remains deferred. Regional research begins alongside P0 and informs every area.

### 1. Site configuration and legal pages — P0

Build a typed inventory of the site's controller details, purposes, vendors/services, data categories, storage, retention, collection surfaces, audience, and contract type. Project only public facts into browser configuration.

The first useful output is ordinary **privacy, cookie, and terms pages**, plus a legal footer and an optional legal-center page. Pages use the site's layout, fonts, and navigation, work without JavaScript, and can be statically generated. The cookie page includes declared purposes, services, and storage details.

Support existing reviewed documents from the beginning. Add an original clause assembler with explicit scope, licensing, and review status; start with privacy/cookie documents and narrowly scoped terms packs. Validate missing facts and incompatible choices. Archive exact versions and compare released versions.

**Build:** configuration schema, document renderer/compiler, completeness diagnostics, legal links, document artifacts, and vanilla/React/Astro examples. Terms acceptance is a separate, optional component linked to an exact version; reading a privacy policy is not a blanket permission.

**Connected features:** [inventory](FEATURES.md#feat-inventory), [documents](FEATURES.md#feat-documents), [terms](FEATURES.md#feat-terms), [distribution](FEATURES.md#feat-deployment). Example requirements: [EU disclosures](requirements/README.md#req-eu-notice), [NZ collection statements](requirements/README.md#req-nz-notice).

### 2. Clear, unobtrusive permission controls — P1

Build a consent notice, granular preferences, persistent privacy-choice trigger, and gated-content placeholder. Offer semantic vanilla markup, optional styles, React components, and a headless interface using the same state engine.

**Mobile default:** a compact, nonmodal bottom notice that clearly asks for permission and exposes accept/reject/customize choices. It should look like a small part of the site, leave the page usable, and avoid an automatic fullscreen dialog or page-blocking backdrop. Tapping preferences opens a neat bottom drawer. Desktop can use a corner panel and side drawer.

Use thumb-friendly targets, safe-area spacing, readable text, restrained motion, and stable layouts. Optional pull/drag gestures supplement visible buttons. Dismissal leaves permission unchanged. The preference drawer can scroll internally with accessible actions; no clipping choices to force a compact height. Large text, short landscape screens, long translations, and on-screen keyboards must remain usable.

**Styling:** inherit fonts, expose semantic CSS tokens, offer light/dark and unstyled variants, and allow component replacement. No remote iframe, bundled font, or required Shadow DOM. Demonstrate two visibly different fictional brands without internal-selector overrides.

**Connected feature:** [controls](FEATURES.md#feat-controls). Requirements: [mobile design](requirements/README.md#req-product-mobile), [accessibility](requirements/README.md#req-product-a11y), [Spanish choice visibility](requirements/README.md#req-es-choice).

### 3. Consent that controls real behavior — P1

Build purpose-level decisions and explicit service lifecycles: initialize, allow, deny, withdraw, expire, and handle scope changes. Optional scripts, embeds, pixels, and requests stay inert until the applicable decision permits them. Required functions are classified separately from optional consent.

Persist browser preferences, synchronize changes between tabs, and handle unavailable storage conservatively. Distinguish **grant lifetime**, **repeat-prompt suppression**, **document revisions**, and **evidence retention**. A new purpose does not inherit an unrelated grant; a CSS edit does not automatically trigger re-consent.

On withdrawal, stop future work, invoke teardown/disable hooks, remove accessible declared storage, and replace affected embeds. Document vendor/server limitations and any required reload. Do not claim that deleting a script element undoes executed code or transmitted data.

**Connected features:** [enforcement](FEATURES.md#feat-enforcement), [choices](FEATURES.md#feat-choices). Requirements: [EU device access](requirements/README.md#req-eu-device), [German exceptions](requirements/README.md#req-de-device), [Italian repeat prompts](requirements/README.md#req-it-reprompt).

### 4. Collection forms and durable records — P2

Build inline collection notices, purpose/channel-specific permission fields, explicit terms acceptance, and withdrawal actions. Keep required contract actions, optional marketing permission, and cookie preferences distinct. Avoid the generic required “I accept the privacy policy” checkbox.

Add `@notabenda/cloudflare` for artifact registration, anonymous browser receipts, authenticated application events, export, erasure, and scheduled retention cleanup. Also support an existing backend through a transport interface. Browser choices continue to work independently of network delivery; record acknowledgments and failed delivery honestly.

Receipts link choices to exact released wording, configuration, language, and server receipt time. Anonymous reports remain distinct from trusted account/form events. Do not collect full form payloads or visitor fingerprints just to record a choice.

**Connected features:** [forms](FEATURES.md#feat-forms), [records](FEATURES.md#feat-records), [rights bridge](FEATURES.md#feat-rights). Requirements: [demonstrable consent](requirements/README.md#req-eu-consent), [Canadian meaningful consent](requirements/README.md#req-ca-meaningful), [South African electronic marketing](requirements/README.md#req-za-marketing).

### 5. Specific regional controls and contract widgets — P2

Build versioned regional profiles from **individual requirements**, with explicit applicability facts and explainable behavior. A profile can affect disclosures, a disabled-by-default function, an objection route, a prompt rule, or a downstream processing restriction. Country detection can assist routing; it cannot establish legal applicability.

Initial implementation priorities include US sale/sharing/targeted-advertising choices and applicable browser signals, Québec profiling activation, conditional UK storage/access exceptions, and national consent differences. Sensitive and child-related scenarios receive explicit scope guards; unsupported cases must not be described as covered.

Build separate **contract withdrawal and cancellation widgets** where applicable: a discoverable entry, a readable form/review step, an application handoff, and the required acknowledgment. These are distinct from withdrawing privacy consent. Examples in the catalog include the EU online withdrawal function, German cancellation/withdrawal rules, and Brazil's distance-contract right of regret. Confirmation needs durable backend delivery; refunds and subscription changes belong to the host application.

**Connected features:** [regional rules](FEATURES.md#feat-regions), [US choices](FEATURES.md#feat-us-choices), [contract actions](FEATURES.md#feat-contract-actions), [scope guards](FEATURES.md#feat-scope-guards). The [requirements catalog](requirements/README.md) records exact sources, conditions, caveats, and planned verification.

### 6. Standalone discovery and diagnostics — P3

Provide browser-assisted tooling to observe requests, cookies/storage, embeds, and resource hints across selected routes and consent scenarios. Report undeclared activity, candidate inventory entries, and behavior that continues after rejection or withdrawal.

Provide readable and JSON output, evidence, and suggested changes for review. Discovery cannot establish every processing purpose, observe all server-side work, or automatically declare a tracker legally exempt. **Adopters decide when to run it, whether to use CI, and whether findings should block their deployment.**

**Connected feature:** [discovery](FEATURES.md#feat-discovery). Example: [Australian tracking-pixel obligations](requirements/README.md#req-au-pixels) connect observed pixels to collection-notice and sensitive-data review.

### 7. Optional advertising integrations — P3, with certification deferred to P4

Start with a Google **Basic Consent Mode** adapter, defaults established before tags, explicit purpose-to-signal mapping, and verified no-consent network behavior. An advanced-mode option would require separate, explicit configuration and disclosure of its possible cookieless requests.

A certified advertising CMP is a separate undertaking involving the current IAB specifications, registration, Google certification where applicable, and continuing maintenance. A functioning Consent Mode adapter is not certification.

**Connected features:** [Google adapter](FEATURES.md#feat-google), [deferred CMP](FEATURES.md#feat-ad-cmp). Requirements: [mode behavior](requirements/README.md#req-google-mode), [publisher certification](requirements/README.md#req-google-cmp).

## Keep research, behavior, and tests connected

Maintain the [source-linked catalog](../regulatory/README.md) as part of the product:

```text
source / article -> requirement + applicability -> feature -> verification -> code/test references
```

The initial catalog contains individual requirements, planned/partial/implemented features, primary and discovery sources, and linked verification scenarios. It spans selected EU/national, UK, Swiss, Brazilian, Canadian/Québec, Australian, New Zealand, South African, Turkish, Singaporean, and US items, plus separate platform and product standards. Singapore's selected cookie guidance is retrieved and connected to setup; wider Singapore research, Japan source/version gaps and remaining jurisdictions stay explicit.

Use iubenda articles and web search to discover requirements, then verify against statutes, regulators, and platform specifications. Record source locators, retrieval status, timing, caveats, legal-review status, and implementation status. The [source index](requirements/SOURCES.md) distinguishes retrieved sources, search-result findings, and blocked access.

Every implemented rule should reference its `REQ-*` items and actual tests. Until code exists, its implementation/test references remain empty. Research coverage is broader than release support; no country is declared supported merely because it appears in the catalog. Source changes should identify the affected rules, content, features, and verification scenarios.

## Delivery and quality targets

| Package/import | What an adopter gets |
| --- | --- |
| `@notabenda/core` | Typed config, consent state, vanilla controls, service gating |
| `@notabenda/core/headless` | State/actions for custom markup |
| `@notabenda/core/react` | Optional provider, hooks, and components |
| `@notabenda/core/styles.css` | Optional token-based styles |
| `@notabenda/core/content` | Build-time document tools |
| `@notabenda/core/google` | Optional Basic Consent Mode adapter |
| `@notabenda/cloudflare` | Optional host-authorized workers, Durable Object adapters, evidence inspection, and document history; capture, lifecycle tools and local starter/doctor; operational rollout remains host-owned |

Target at most **15 KiB gzip** for core plus vanilla controls and **5 KiB gzip** for default CSS, excluding documents, locales, framework code, and optional adapters. Measure before making performance claims. Browser imports must exclude the CLI, document build tooling, React unless requested, and backend code.

No project telemetry, central consent account, remote law updates, per-page-view logging requirement, or mandatory backend. Operators own documents and records. Hosting, keys, migrations, retention, exports, and restore procedures need straightforward instructions.

## Competitive scope and boundaries

iubenda combines document generation, consent widgets/blocking, preference logs, a separate form-consent database, discovery, advertising integrations, and broader organization tooling. Those areas inform this plan; an enterprise dashboard, whistleblowing, accessibility overlay, newsletter platform, and full rights-case management are outside the initial build. [Product overview](https://www.iubenda.com/en/help/161837-home/), [features](https://www.iubenda.com/en/features/), [consent database](https://www.iubenda.com/en/help/6469-consent-solution-getting-started/), [preference log](https://www.iubenda.com/en/help/45718-cookie-preference-log/)

The intended improvement is a smaller, native-looking, inspectable system with owned content and evidence. Maintained legal content, accurate operator facts, application integrations, and ecosystem certification still require ongoing work.

## Detailed references

- [Build deliverables by feature](FEATURES.md)
- [Individual requirements and verification scenarios](requirements/README.md)
- [Source index](requirements/SOURCES.md) and [research workflow](../regulatory/README.md)
- [Regulatory context and limits](REGULATORY.md)
- [Architecture, APIs, and milestones](PLAN.md)

Start with P0 documents/inventory and P1 consent controls/enforcement in a small complete example. Add the optional evidence backend and applicable regional features against the same requirement IDs.
