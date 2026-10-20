# Build areas and feature traceability

Generated from [the catalog](../regulatory/catalog.json). P0 is the foundation, P1 adds browser consent, P2 adds records and applicable regional/contract controls, P3 adds discovery/integrations, and P4 is deferred. Status is recorded per feature.

Features link to specific obligations and their planned verification scenarios. A shared mechanism can satisfy several requirements without duplicating its implementation.

<a id="feat-setup"></a>

## P0 · FEAT-SETUP — Guided configuration and private justifications

**Status:** implemented.

**Deliverables:**

- Shared versioned practice/coverage questionnaire for npx wizard and host-authorized admin UI.
- Requirement-linked recommendations, unknowns/conflicts and private justifications; reviewable draft config exports with no automatic activation.
- Local answer/report resume and imported inventory preservation; host-owned authorization and explicit private-note handling.
- Explicit public purpose authoring in CLI/admin setup, guarded edits/removals and unresolved production-blocking facts.
- Versioned integration skill, curated llms.txt and Markdown guide alternates for agent-assisted setup, with explicit unknowns and host-owned review/authorization.
- Read-only, version-matched integration target map with actual config paths, separate host work, current setup question IDs and concrete acceptance scenarios.

**Requirement links:** [REQ-PRODUCT-SETUP](requirements/README.md#req-product-setup), [REQ-PRODUCT-SCOPE-GUARDS](requirements/README.md#req-product-scope-guards), [REQ-PRODUCT-CF-STARTER](requirements/README.md#req-product-cf-starter), [REQ-PRODUCT-SERVICE-CATALOG](requirements/README.md#req-product-service-catalog), [REQ-PRODUCT-SERVICE-DETECTION](requirements/README.md#req-product-service-detection), [REQ-PRODUCT-SERVICE-PROFILES](requirements/README.md#req-product-service-profiles), [REQ-PRODUCT-AGENT-INTEGRATION](requirements/README.md#req-product-agent-integration).

**Code references:** [packages/notabenda/src/setup.ts](../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-cli.ts](../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/setup-ui.ts](../packages/notabenda/src/setup-ui.ts), [packages/notabenda-cf/src/setup.ts](../packages/notabenda-cf/src/setup.ts), [packages/notabenda/src/setup-purpose.ts](../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/src/setup-purpose-ui.ts](../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-purpose-cli.ts](../packages/notabenda/src/setup-purpose-cli.ts), [packages/notabenda/src/setup-catalog-cli.ts](../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda/src/cli-json.ts](../packages/notabenda/src/cli-json.ts), [packages/notabenda/src/catalog-node.ts](../packages/notabenda/src/catalog-node.ts), [skills/notabenda/SKILL.md](../skills/notabenda/SKILL.md), [site/agent-docs.mjs](../site/agent-docs.mjs), [llms.txt](../llms.txt), [packages/notabenda/src/integration-reference.ts](../packages/notabenda/src/integration-reference.ts)

<a id="feat-inventory"></a>

## P0 · FEAT-INVENTORY — Site and processing inventory

**Status:** partial.

**Deliverables:**

- Typed site, service, purpose, storage, retention, audience, and document configuration.
- Separate public bundle facts from private operator metadata.
- Completeness checks with requirement IDs and actionable missing-field messages.

**Requirement links:** [REQ-EU-NOTICE](requirements/README.md#req-eu-notice), [REQ-CH-PROFILING](requirements/README.md#req-ch-profiling), [REQ-QC-PROFILING](requirements/README.md#req-qc-profiling), [REQ-NZ-INDIRECT](requirements/README.md#req-nz-indirect), [REQ-TR-BASIS](requirements/README.md#req-tr-basis), [REQ-EU-TERMS](requirements/README.md#req-eu-terms), [REQ-PRODUCT-CONFIG](requirements/README.md#req-product-config), [REQ-PRODUCT-EMBEDS](requirements/README.md#req-product-embeds), [REQ-PRODUCT-PRIVACY-SIGNALS](requirements/README.md#req-product-privacy-signals), [REQ-PRODUCT-PROCESSING-CHOICES](requirements/README.md#req-product-processing-choices), [REQ-PRODUCT-SCOPE-GUARDS](requirements/README.md#req-product-scope-guards), [REQ-PRODUCT-SERVICE-CATALOG](requirements/README.md#req-product-service-catalog).

**Code references:** [packages/notabenda/src/types.ts](../packages/notabenda/src/types.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/embeds.ts](../packages/notabenda/src/embeds.ts), [packages/notabenda/src/privacy-signals.ts](../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/src/scope-guards.ts](../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/setup-purpose.ts](../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/src/setup-purpose-ui.ts](../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-purpose-cli.ts](../packages/notabenda/src/setup-purpose-cli.ts)

<a id="feat-documents"></a>

## P0 · FEAT-DOCUMENTS — Privacy and cookie documents

**Status:** partial.

**Deliverables:**

- Static privacy and cookie pages, semantic HTML, document links, service/storage tables, and legal-center composition.
- Reviewed supplied content plus an original clause pipeline with explicit review and licensing status.
- Versioned artifacts and material-change diffs; readable pages without JavaScript.

**Requirement links:** [REQ-EU-NOTICE](requirements/README.md#req-eu-notice), [REQ-CA-MEANINGFUL](requirements/README.md#req-ca-meaningful), [REQ-AU-PIXELS](requirements/README.md#req-au-pixels), [REQ-NZ-NOTICE](requirements/README.md#req-nz-notice), [REQ-NZ-INDIRECT](requirements/README.md#req-nz-indirect), [REQ-US-CA-CHOICES](requirements/README.md#req-us-ca-choices), [REQ-US-CO-GPC](requirements/README.md#req-us-co-gpc), [REQ-PRODUCT-DOCUMENTS](requirements/README.md#req-product-documents), [REQ-PRODUCT-SAFE-CONTENT](requirements/README.md#req-product-safe-content), [REQ-PRODUCT-ARTIFACTS](requirements/README.md#req-product-artifacts), [REQ-PRODUCT-AUTHORING](requirements/README.md#req-product-authoring), [REQ-PRODUCT-REACT](requirements/README.md#req-product-react), [REQ-PRODUCT-ASTRO](requirements/README.md#req-product-astro), [REQ-PRODUCT-RETAINED-RELEASES](requirements/README.md#req-product-retained-releases), [REQ-PRODUCT-COLLECTION-NOTICE](requirements/README.md#req-product-collection-notice), [REQ-PRODUCT-RIGHTS-CENTER](requirements/README.md#req-product-rights-center), [REQ-PRODUCT-SERVICE-CATALOG](requirements/README.md#req-product-service-catalog), [REQ-PRODUCT-INDIRECT-NOTICE](requirements/README.md#req-product-indirect-notice), [REQ-EU-GUARANTEE-NOTICE](requirements/README.md#req-eu-guarantee-notice), [REQ-EU-GUARANTEE-LABEL](requirements/README.md#req-eu-guarantee-label), [REQ-PRODUCT-GUARANTEE-NOTICE](requirements/README.md#req-product-guarantee-notice).

**Code references:** [packages/notabenda/src/documents.ts](../packages/notabenda/src/documents.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda/src/react.ts](../packages/notabenda/src/react.ts), [packages/notabenda/src/react-documents.ts](../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro-client.ts](../packages/notabenda/src/astro-client.ts), [packages/notabenda/src/astro/LegalDocument.astro](../packages/notabenda/src/astro/LegalDocument.astro), [packages/notabenda/src/release-files.ts](../packages/notabenda/src/release-files.ts), [packages/notabenda/src/indirect-collection.ts](../packages/notabenda/src/indirect-collection.ts), [packages/notabenda/src/astro/IndirectCollectionNotice.astro](../packages/notabenda/src/astro/IndirectCollectionNotice.astro), [packages/notabenda/src/setup.ts](../packages/notabenda/src/setup.ts), [examples/indirect-collection/build.mjs](../examples/indirect-collection/build.mjs), [packages/notabenda/src/guarantee-notice.ts](../packages/notabenda/src/guarantee-notice.ts), [packages/notabenda/src/guarantee-notice-build.ts](../packages/notabenda/src/guarantee-notice-build.ts), [packages/notabenda/src/guarantee-notice-json.ts](../packages/notabenda/src/guarantee-notice-json.ts), [packages/notabenda/src/guarantee-notice-data.ts](../packages/notabenda/src/guarantee-notice-data.ts), [packages/notabenda/src/guarantees.css](../packages/notabenda/src/guarantees.css), [packages/notabenda/src/astro/LegalGuaranteeNotice.astro](../packages/notabenda/src/astro/LegalGuaranteeNotice.astro), [packages/notabenda/assets/guarantees/manifest.json](../packages/notabenda/assets/guarantees/manifest.json), [examples/guarantees/build.mjs](../examples/guarantees/build.mjs)

<a id="feat-terms"></a>

## P0 · FEAT-TERMS — Terms documents and acceptance

**Status:** partial.

**Deliverables:**

- Static supplied terms first; narrowly scoped reviewed packs later.
- Optional explicit terms-acceptance control linked to an exact version; independent marketing permissions.
- Consumer/business and service-type configuration, with conditional rights and contract-action links.

**Requirement links:** [REQ-EU-TERMS](requirements/README.md#req-eu-terms), [REQ-EU-WITHDRAWAL](requirements/README.md#req-eu-withdrawal), [REQ-DE-CANCEL](requirements/README.md#req-de-cancel), [REQ-DE-WITHDRAWAL](requirements/README.md#req-de-withdrawal), [REQ-BR-CONTRACT](requirements/README.md#req-br-contract), [REQ-PRODUCT-DOCUMENTS](requirements/README.md#req-product-documents), [REQ-EU-ORDER-ACTION](requirements/README.md#req-eu-order-action), [REQ-PRODUCT-TERMS-ACCEPTANCE](requirements/README.md#req-product-terms-acceptance), [REQ-PRODUCT-AUTHORING](requirements/README.md#req-product-authoring), [REQ-EU-GUARANTEE-NOTICE](requirements/README.md#req-eu-guarantee-notice), [REQ-EU-GUARANTEE-LABEL](requirements/README.md#req-eu-guarantee-label), [REQ-PRODUCT-GUARANTEE-NOTICE](requirements/README.md#req-product-guarantee-notice).

**Code references:** [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/documents.ts](../packages/notabenda/src/documents.ts), [packages/notabenda/src/terms.ts](../packages/notabenda/src/terms.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/terms.ts](../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/guarantee-notice.ts](../packages/notabenda/src/guarantee-notice.ts), [packages/notabenda/src/guarantee-notice-build.ts](../packages/notabenda/src/guarantee-notice-build.ts), [packages/notabenda/src/guarantee-notice-json.ts](../packages/notabenda/src/guarantee-notice-json.ts), [packages/notabenda/src/guarantee-notice-data.ts](../packages/notabenda/src/guarantee-notice-data.ts), [packages/notabenda/src/guarantees.css](../packages/notabenda/src/guarantees.css), [packages/notabenda/src/react-documents.ts](../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/LegalGuaranteeNotice.astro](../packages/notabenda/src/astro/LegalGuaranteeNotice.astro), [packages/notabenda/assets/guarantees/manifest.json](../packages/notabenda/assets/guarantees/manifest.json), [examples/guarantees/build.mjs](../examples/guarantees/build.mjs)

<a id="feat-deployment"></a>

## P0 · FEAT-DEPLOYMENT — Installable and restylable delivery

**Status:** partial.

**Deliverables:**

- One frontend npm package with optional subpath exports and no runtime framework dependency.
- Vanilla, React, static HTML, and Astro examples with fictional operators and data.
- Optional Cloudflare deployment commands, same-origin configuration, and install/uninstall instructions.
- Local notabenda-cf init starter and read-only doctor are implemented with host authorization boundaries and explicit generated Wrangler scripts. Remote provisioning and operational rollout verification remain separate.
- Explicit headless entry, derived consent-only CSS and opt-in reproducible bundle-size reports; compatibility JavaScript size target remains open.
- Versioned integration skill, curated llms.txt and Markdown guide alternates for agent-assisted setup, with explicit unknowns and host-owned review/authorization.
- Read-only, version-matched integration target map with actual config paths, separate host work, current setup question IDs and concrete acceptance scenarios.

**Requirement links:** [REQ-PRODUCT-A11Y](requirements/README.md#req-product-a11y), [REQ-PRODUCT-MOBILE](requirements/README.md#req-product-mobile), [REQ-PRODUCT-CONFIG](requirements/README.md#req-product-config), [REQ-PRODUCT-SAFE-CONTENT](requirements/README.md#req-product-safe-content), [REQ-PRODUCT-PACKAGE](requirements/README.md#req-product-package), [REQ-PRODUCT-CF-HOST](requirements/README.md#req-product-cf-host), [REQ-PRODUCT-AUTHORING](requirements/README.md#req-product-authoring), [REQ-PRODUCT-REACT](requirements/README.md#req-product-react), [REQ-PRODUCT-ASTRO](requirements/README.md#req-product-astro), [REQ-PRODUCT-RETAINED-RELEASES](requirements/README.md#req-product-retained-releases), [REQ-PRODUCT-RIGHTS-CENTER](requirements/README.md#req-product-rights-center), [REQ-PRODUCT-CF-STARTER](requirements/README.md#req-product-cf-starter), [REQ-PRODUCT-CF-DOCTOR](requirements/README.md#req-product-cf-doctor), [REQ-PRODUCT-SYNTAX-HIGHLIGHTING](requirements/README.md#req-product-syntax-highlighting), [REQ-PRODUCT-BUNDLE-BUDGET](requirements/README.md#req-product-bundle-budget), [REQ-PRODUCT-AGENT-INTEGRATION](requirements/README.md#req-product-agent-integration).

**Code references:** [packages/notabenda/package.json](../packages/notabenda/package.json), [packages/notabenda/src/cli.ts](../packages/notabenda/src/cli.ts), [site/host.mjs](../site/host.mjs), [site/worker.mjs](../site/worker.mjs), [site/build.mjs](../site/build.mjs), [packages/notabenda/src/react.ts](../packages/notabenda/src/react.ts), [packages/notabenda/src/react-documents.ts](../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro-client.ts](../packages/notabenda/src/astro-client.ts), [packages/notabenda/src/release-files.ts](../packages/notabenda/src/release-files.ts), [packages/notabenda-cf/bin/notabenda-cf.mjs](../packages/notabenda-cf/bin/notabenda-cf.mjs), [packages/notabenda-cf/package.json](../packages/notabenda-cf/package.json), [packages/notabenda-cf/templates/src/worker.mjs](../packages/notabenda-cf/templates/src/worker.mjs), [packages/notabenda-cf/templates/src/host.mjs](../packages/notabenda-cf/templates/src/host.mjs), [packages/notabenda-cf/templates/src/workspace.mjs](../packages/notabenda-cf/templates/src/workspace.mjs), [packages/notabenda-cf/templates/src/authorize.mjs](../packages/notabenda-cf/templates/src/authorize.mjs), [packages/notabenda-cf/templates/src/setup.mjs](../packages/notabenda-cf/templates/src/setup.mjs), [packages/notabenda-cf/templates/scripts/build-assets.mjs](../packages/notabenda-cf/templates/scripts/build-assets.mjs), [packages/notabenda-cf/bin/doctor.mjs](../packages/notabenda-cf/bin/doctor.mjs), [skills/notabenda/SKILL.md](../skills/notabenda/SKILL.md), [site/agent-docs.mjs](../site/agent-docs.mjs), [llms.txt](../llms.txt), [packages/notabenda/src/integration-reference.ts](../packages/notabenda/src/integration-reference.ts)

<a id="feat-requirements"></a>

## P0 · FEAT-REQUIREMENTS — Source-linked requirements catalog

**Status:** partial.

**Deliverables:**

- Versioned primary-source records, requirement IDs, applicability conditions, dates, caveats, and discovery articles.
- Links from requirements to feature IDs, planned verification scenarios, and eventual code/test references.
- Local validation and browseable indexes; legal review and implementation status tracked separately.

**Requirement links:** Product foundation; see deliverables and milestone acceptance criteria..

**Code references:** [scripts/regulatory.py](../scripts/regulatory.py), [regulatory/catalog.json](../regulatory/catalog.json)

<a id="feat-service-catalog"></a>

## P1 · FEAT-SERVICE-CATALOG — Shared third-party catalog and passive recognition

**Status:** partial.

**Deliverables:**

- Versioned provider/product schema, source-backed service facts, custom entries and operator-confirmed site use.
- Shared public third-party rendering and pinned release provenance; large data stays outside normal consent bundles.
- Explainable passive recognition using bounded exact/pattern/combined signals, compatible capture versions and reviewable configuration suggestions.
- Reproducible licensed imports, broad service seeds, source freshness and positive/negative detector fixtures.
- Initial optional reference seed: 363 provider identities, 402 product/reference entries, 2,278 imported storage hints and 39 original backend/provider references plus three browser-product references; all entries unreviewed.

**Requirement links:** [REQ-PRODUCT-SERVICE-CATALOG](requirements/README.md#req-product-service-catalog), [REQ-PRODUCT-SERVICE-DETECTION](requirements/README.md#req-product-service-detection), [REQ-PRODUCT-SERVICE-PROFILES](requirements/README.md#req-product-service-profiles).

**Code references:** [packages/notabenda/src/catalog.ts](../packages/notabenda/src/catalog.ts), [packages/notabenda/src/catalog-project.ts](../packages/notabenda/src/catalog-project.ts), [packages/notabenda/src/catalog-cli.ts](../packages/notabenda/src/catalog-cli.ts), [scripts/build-service-catalog.py](../scripts/build-service-catalog.py), [packages/notabenda/src/service-directory.ts](../packages/notabenda/src/service-directory.ts), [packages/notabenda/src/service-inventory.ts](../packages/notabenda/src/service-inventory.ts), [packages/notabenda/src/catalog-selection.ts](../packages/notabenda/src/catalog-selection.ts), [packages/notabenda/src/catalog-ui.ts](../packages/notabenda/src/catalog-ui.ts), [packages/notabenda/src/catalog-browser.ts](../packages/notabenda/src/catalog-browser.ts), [packages/notabenda/src/catalog-browser-policy.ts](../packages/notabenda/src/catalog-browser-policy.ts), [packages/notabenda/src/catalog-browser-capture.ts](../packages/notabenda/src/catalog-browser-capture.ts), [packages/notabenda/src/catalog-browser-cli.ts](../packages/notabenda/src/catalog-browser-cli.ts), [packages/notabenda/src/catalog-browser-ui.ts](../packages/notabenda/src/catalog-browser-ui.ts), [packages/notabenda/src/discovery-capture.ts](../packages/notabenda/src/discovery-capture.ts), [packages/notabenda/src/discovery-ui.ts](../packages/notabenda/src/discovery-ui.ts), [catalog/browser-rules.json](../catalog/browser-rules.json), [catalog/browser-providers.json](../catalog/browser-providers.json), [packages/notabenda/src/setup-catalog-cli.ts](../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda/src/cli-json.ts](../packages/notabenda/src/cli-json.ts), [packages/notabenda/src/catalog-node.ts](../packages/notabenda/src/catalog-node.ts), [packages/notabenda/src/catalog-release.ts](../packages/notabenda/src/catalog-release.ts), [packages/notabenda/src/catalog-release-policy.ts](../packages/notabenda/src/catalog-release-policy.ts), [packages/notabenda/src/catalog-reference.ts](../packages/notabenda/src/catalog-reference.ts), [packages/notabenda-cf/src/catalog-release-policy.ts](../packages/notabenda-cf/src/catalog-release-policy.ts), [packages/notabenda-cf/src/catalog-reference.ts](../packages/notabenda-cf/src/catalog-reference.ts), [packages/notabenda-cf/src/history.ts](../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/catalog-render.ts](../packages/notabenda-cf/src/catalog-render.ts), [packages/notabenda-cf/src/worker.ts](../packages/notabenda-cf/src/worker.ts), [examples/catalog-releases/build.mjs](../examples/catalog-releases/build.mjs), [catalog/product-profiles.json](../catalog/product-profiles.json), [packages/notabenda/src/catalog-profile.ts](../packages/notabenda/src/catalog-profile.ts)

<a id="feat-controls"></a>

## P1 · FEAT-CONTROLS — Consent and preference widgets

**Status:** partial.

**Deliverables:**

- Compact nonmodal bottom notice by default on mobile; clear permission request with balanced accept/reject/customize actions.
- Preferences expand on deliberate tap into a bottom drawer; desktop may use a corner notice and side drawer. No automatic fullscreen dialog or initial page-blocking backdrop.
- Accessible native markup, optional CSS, semantic theme tokens, light/dark and unstyled variants; optional drag gestures always have visible tap and keyboard equivalents.
- Safe-area spacing, thumb-friendly controls, persistent reopening, focus restoration, and readable choices across small screens, zoom, large text, RTL, and the on-screen keyboard.

**Requirement links:** [REQ-EU-CONSENT](requirements/README.md#req-eu-consent), [REQ-EU-FAIR-CHOICE](requirements/README.md#req-eu-fair-choice), [REQ-ES-CHOICE](requirements/README.md#req-es-choice), [REQ-UK-EXCEPTIONS](requirements/README.md#req-uk-exceptions), [REQ-BR-COOKIE-UI](requirements/README.md#req-br-cookie-ui), [REQ-US-CA-UI](requirements/README.md#req-us-ca-ui), [REQ-PRODUCT-A11Y](requirements/README.md#req-product-a11y), [REQ-PRODUCT-MOBILE](requirements/README.md#req-product-mobile), [REQ-PRODUCT-REACT](requirements/README.md#req-product-react), [REQ-PRODUCT-ASTRO](requirements/README.md#req-product-astro), [REQ-PRODUCT-EMBEDS](requirements/README.md#req-product-embeds), [REQ-PRODUCT-PRIVACY-SIGNALS](requirements/README.md#req-product-privacy-signals), [REQ-PRODUCT-PROCESSING-CHOICES](requirements/README.md#req-product-processing-choices), [REQ-PRODUCT-SCOPE-GUARDS](requirements/README.md#req-product-scope-guards), [REQ-PRODUCT-BUNDLE-BUDGET](requirements/README.md#req-product-bundle-budget), [REQ-PRODUCT-STORAGE-EXCEPTIONS](requirements/README.md#req-product-storage-exceptions), [REQ-PRODUCT-LOCALIZATION](requirements/README.md#req-product-localization).

**Code references:** [packages/notabenda/src/consent.ts](../packages/notabenda/src/consent.ts), [packages/notabenda/src/controls.ts](../packages/notabenda/src/controls.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/react.ts](../packages/notabenda/src/react.ts), [packages/notabenda/src/react-documents.ts](../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro-client.ts](../packages/notabenda/src/astro-client.ts), [packages/notabenda/src/embeds.ts](../packages/notabenda/src/embeds.ts), [packages/notabenda/src/privacy-signals.ts](../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/src/scope-guards.ts](../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/storage-exception-policy.ts](../packages/notabenda/src/storage-exception-policy.ts), [packages/notabenda/src/storage-exceptions.ts](../packages/notabenda/src/storage-exceptions.ts), [packages/notabenda/src/storage-exception-controls.ts](../packages/notabenda/src/storage-exception-controls.ts), [packages/notabenda/src/storage-exceptions.css](../packages/notabenda/src/storage-exceptions.css), [packages/notabenda/src/service-runner.ts](../packages/notabenda/src/service-runner.ts), [packages/notabenda/src/storage-cleanup.ts](../packages/notabenda/src/storage-cleanup.ts)

<a id="feat-enforcement"></a>

## P1 · FEAT-ENFORCEMENT — Service gating and withdrawal

**Status:** partial.

**Deliverables:**

- Declared service loaders and teardown hooks; inert scripts, images, and embeds until allowed.
- Separate device-access permission from downstream processing restrictions.
- Stop future work, remove accessible declared storage, and surface vendor/reload limitations after withdrawal.
- Explicit Irish default grant cap with calendar-month expiry, independent solicitation/refusal clocks and pinned CF receipt parity; justified extensions remain open.

**Requirement links:** [REQ-EU-DEVICE](requirements/README.md#req-eu-device), [REQ-FR-SCOPE](requirements/README.md#req-fr-scope), [REQ-DE-DEVICE](requirements/README.md#req-de-device), [REQ-IE-DEVICE](requirements/README.md#req-ie-device), [REQ-UK-EXCEPTIONS](requirements/README.md#req-uk-exceptions), [REQ-CA-OBA](requirements/README.md#req-ca-oba), [REQ-QC-PROFILING](requirements/README.md#req-qc-profiling), [REQ-GOOGLE-MODE](requirements/README.md#req-google-mode), [REQ-PRODUCT-CONSENT-RUNTIME](requirements/README.md#req-product-consent-runtime), [REQ-PRODUCT-REACT](requirements/README.md#req-product-react), [REQ-PRODUCT-ASTRO](requirements/README.md#req-product-astro), [REQ-PRODUCT-EMBEDS](requirements/README.md#req-product-embeds), [REQ-PRODUCT-PRIVACY-SIGNALS](requirements/README.md#req-product-privacy-signals), [REQ-PRODUCT-PROCESSING-CHOICES](requirements/README.md#req-product-processing-choices), [REQ-PRODUCT-STORAGE-CLEANUP](requirements/README.md#req-product-storage-cleanup), [REQ-PRODUCT-SCOPE-GUARDS](requirements/README.md#req-product-scope-guards), [REQ-PRODUCT-STORAGE-EXCEPTIONS](requirements/README.md#req-product-storage-exceptions).

**Code references:** [packages/notabenda/src/consent.ts](../packages/notabenda/src/consent.ts), [packages/notabenda/src/controls.ts](../packages/notabenda/src/controls.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/react.ts](../packages/notabenda/src/react.ts), [packages/notabenda/src/react-documents.ts](../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro-client.ts](../packages/notabenda/src/astro-client.ts), [packages/notabenda/src/embeds.ts](../packages/notabenda/src/embeds.ts), [packages/notabenda/src/privacy-signals.ts](../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/src/storage-cleanup.ts](../packages/notabenda/src/storage-cleanup.ts), [packages/notabenda/src/scope-guards.ts](../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/storage-exception-policy.ts](../packages/notabenda/src/storage-exception-policy.ts), [packages/notabenda/src/storage-exceptions.ts](../packages/notabenda/src/storage-exceptions.ts), [packages/notabenda/src/storage-exception-controls.ts](../packages/notabenda/src/storage-exception-controls.ts), [packages/notabenda/src/storage-exceptions.css](../packages/notabenda/src/storage-exceptions.css), [packages/notabenda/src/service-runner.ts](../packages/notabenda/src/service-runner.ts), [packages/notabenda/src/consent-engine.ts](../packages/notabenda/src/consent-engine.ts), [docs/verification/regional-consent.md](../docs/verification/regional-consent.md), [packages/notabenda/src/grant-expiry-policy.ts](../packages/notabenda/src/grant-expiry-policy.ts)

<a id="feat-choices"></a>

## P1 · FEAT-CHOICES — Preference lifetime and revisions

**Status:** partial.

**Deliverables:**

- Purpose-level persisted choices, scope compatibility, expiry, and cross-tab updates.
- Separate prompt suppression, grant expiry, evidence retention, and document versions.
- Never convert dismissal, malformed state, missing storage, or stale scope into permission.
- Explicit Irish default grant cap with calendar-month expiry, independent solicitation/refusal clocks and pinned CF receipt parity; justified extensions remain open.

**Requirement links:** [REQ-EU-CONSENT](requirements/README.md#req-eu-consent), [REQ-EU-FAIR-CHOICE](requirements/README.md#req-eu-fair-choice), [REQ-FR-SCOPE](requirements/README.md#req-fr-scope), [REQ-IT-REPROMPT](requirements/README.md#req-it-reprompt), [REQ-IE-CONSENT-DURATION](requirements/README.md#req-ie-consent-duration), [REQ-BR-COOKIE-UI](requirements/README.md#req-br-cookie-ui), [REQ-CA-MEANINGFUL](requirements/README.md#req-ca-meaningful), [REQ-US-CT-GPC](requirements/README.md#req-us-ct-gpc), [REQ-PRODUCT-CONSENT-RUNTIME](requirements/README.md#req-product-consent-runtime), [REQ-PRODUCT-CONSENT-EVIDENCE](requirements/README.md#req-product-consent-evidence), [REQ-PRODUCT-REGIONAL-PROMPTS](requirements/README.md#req-product-regional-prompts).

**Code references:** [packages/notabenda/src/consent.ts](../packages/notabenda/src/consent.ts), [packages/notabenda/src/controls.ts](../packages/notabenda/src/controls.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/prompt-policy.ts](../packages/notabenda/src/prompt-policy.ts), [packages/notabenda/src/consent-notice.ts](../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda/src/consent-evidence.ts](../packages/notabenda/src/consent-evidence.ts), [packages/notabenda-cf/src/consent.ts](../packages/notabenda-cf/src/consent.ts), [examples/repeat-prompts/build.mjs](../examples/repeat-prompts/build.mjs), [examples/repeat-prompts/client.mjs](../examples/repeat-prompts/client.mjs), [packages/notabenda/src/consent-engine.ts](../packages/notabenda/src/consent-engine.ts), [docs/verification/regional-consent.md](../docs/verification/regional-consent.md), [packages/notabenda/src/grant-expiry-policy.ts](../packages/notabenda/src/grant-expiry-policy.ts)

<a id="feat-localization"></a>

## P1 · FEAT-LOCALIZATION — Versioned host-supplied localization

**Status:** partial.

**Deliverables:**

- Complete versioned host-supplied messages for legal documents, consent controls and ordinary terms acceptance, including status/accessibility text, selected language and explicit direction.
- Archived selected consent copy, independent presentation/disclosure revisions, exact material scopes and frontend/backend validation parity.
- Supplied structured or Markdown/MDX documents and optional complete generated-document templates. No automatic translation, language negotiation or inferred jurisdiction.
- Remaining interface localization, broader plural rules, reviewed locale catalogs and multi-language routing are still open.

**Requirement links:** [REQ-PRODUCT-LOCALIZATION](requirements/README.md#req-product-localization).

**Code references:** [packages/notabenda/src/localization-policy.ts](../packages/notabenda/src/localization-policy.ts), [packages/notabenda/src/document-localization.ts](../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/localized-documents.ts](../packages/notabenda/src/localized-documents.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/documents.ts](../packages/notabenda/src/documents.ts), [packages/notabenda/src/controls.ts](../packages/notabenda/src/controls.ts), [packages/notabenda/src/consent-notice.ts](../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/consent-runtime-config.ts](../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-evidence.ts](../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/consent.ts](../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/localization-policy.ts](../packages/notabenda-cf/src/localization-policy.ts), [examples/localization/config.mjs](../examples/localization/config.mjs), [examples/localization/build.mjs](../examples/localization/build.mjs), [packages/notabenda/src/react-consent-bindings.ts](../packages/notabenda/src/react-consent-bindings.ts), [packages/notabenda/src/astro-client.ts](../packages/notabenda/src/astro-client.ts), [packages/notabenda/src/astro/PreferencesButton.astro](../packages/notabenda/src/astro/PreferencesButton.astro), [packages/notabenda/src/terms-localization-policy.ts](../packages/notabenda/src/terms-localization-policy.ts), [packages/notabenda/src/terms.ts](../packages/notabenda/src/terms.ts), [packages/notabenda-cf/src/terms-localization-policy.ts](../packages/notabenda-cf/src/terms-localization-policy.ts), [packages/notabenda-cf/src/terms.ts](../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../packages/notabenda-cf/src/render.ts), [examples/localization/agreement-build.mjs](../examples/localization/agreement-build.mjs), [examples/localization/agreement.mjs](../examples/localization/agreement.mjs)

<a id="feat-forms"></a>

## P2 · FEAT-FORMS — Collection notices and form permissions

**Status:** partial.

**Deliverables:**

- Inline collection notice, optional permission field/group, notice link, and explicit terms action.
- Purpose/channel-specific choices and versioned form text; no forced privacy-policy acceptance checkbox.
- Trusted application API for consent and withdrawal records; no email-sending platform.
- Separate reviewed indirect-collection particulars in static HTML and plain text, with explicit phase and no delivery claim.

**Requirement links:** [REQ-EU-NOTICE](requirements/README.md#req-eu-notice), [REQ-EU-CONSENT](requirements/README.md#req-eu-consent), [REQ-CA-MEANINGFUL](requirements/README.md#req-ca-meaningful), [REQ-AU-PIXELS](requirements/README.md#req-au-pixels), [REQ-NZ-NOTICE](requirements/README.md#req-nz-notice), [REQ-ZA-MARKETING](requirements/README.md#req-za-marketing), [REQ-US-VA-RIGHTS](requirements/README.md#req-us-va-rights), [REQ-TR-BASIS](requirements/README.md#req-tr-basis), [REQ-PRODUCT-TERMS-ACCEPTANCE](requirements/README.md#req-product-terms-acceptance), [REQ-PRODUCT-COLLECTION-NOTICE](requirements/README.md#req-product-collection-notice), [REQ-PRODUCT-FORM-PERMISSIONS](requirements/README.md#req-product-form-permissions), [REQ-EU-MARKETING](requirements/README.md#req-eu-marketing), [REQ-CA-CASL-OPTIN](requirements/README.md#req-ca-casl-optin), [REQ-PRODUCT-INDIRECT-NOTICE](requirements/README.md#req-product-indirect-notice).

**Code references:** [packages/notabenda/src/terms.ts](../packages/notabenda/src/terms.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/terms.ts](../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/collection.ts](../packages/notabenda/src/collection.ts), [packages/notabenda/src/react-documents.ts](../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/CollectionNotice.astro](../packages/notabenda/src/astro/CollectionNotice.astro), [packages/notabenda/src/form-permission.ts](../packages/notabenda/src/form-permission.ts), [packages/notabenda-cf/src/permissions.ts](../packages/notabenda-cf/src/permissions.ts), [packages/notabenda-cf/src/lifecycle.ts](../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda/src/react-form-permission.ts](../packages/notabenda/src/react-form-permission.ts), [packages/notabenda/src/astro-form-permission.ts](../packages/notabenda/src/astro-form-permission.ts), [packages/notabenda/src/astro/FormPermissionField.astro](../packages/notabenda/src/astro/FormPermissionField.astro), [packages/notabenda/src/indirect-collection.ts](../packages/notabenda/src/indirect-collection.ts), [packages/notabenda/src/astro/IndirectCollectionNotice.astro](../packages/notabenda/src/astro/IndirectCollectionNotice.astro), [packages/notabenda/src/setup.ts](../packages/notabenda/src/setup.ts), [examples/indirect-collection/build.mjs](../examples/indirect-collection/build.mjs)

<a id="feat-records"></a>

## P2 · FEAT-RECORDS — Durable evidence with notabenda-cf

**Status:** partial.

**Deliverables:**

- Transactional Durable Object records, artifact registration, anonymous receipts, and authenticated subject events; alternative storage adapters later.
- Export, controlled erasure, retention cleanup, access controls, and evidence provenance.
- Separate browser-reported actions from trusted application events; configurable transport for existing backends.

**Requirement links:** [REQ-EU-CONSENT](requirements/README.md#req-eu-consent), [REQ-ZA-MARKETING](requirements/README.md#req-za-marketing), [REQ-EU-WITHDRAWAL](requirements/README.md#req-eu-withdrawal), [REQ-DE-CANCEL](requirements/README.md#req-de-cancel), [REQ-PRODUCT-ARTIFACTS](requirements/README.md#req-product-artifacts), [REQ-PRODUCT-CF-HISTORY](requirements/README.md#req-product-cf-history), [REQ-PRODUCT-TERMS-ACCEPTANCE](requirements/README.md#req-product-terms-acceptance), [REQ-PRODUCT-CONSENT-EVIDENCE](requirements/README.md#req-product-consent-evidence), [REQ-PRODUCT-PROCESSING-CHOICES](requirements/README.md#req-product-processing-choices), [REQ-PRODUCT-EVIDENCE-EXPORT](requirements/README.md#req-product-evidence-export), [REQ-PRODUCT-EVIDENCE-LIFECYCLE](requirements/README.md#req-product-evidence-lifecycle), [REQ-EU-RETENTION-ERASURE](requirements/README.md#req-eu-retention-erasure), [REQ-PRODUCT-FORM-PERMISSIONS](requirements/README.md#req-product-form-permissions), [REQ-PRODUCT-CONTRACT-ACTIONS](requirements/README.md#req-product-contract-actions), [REQ-PRODUCT-PAID-ORDER-ARCHIVES](requirements/README.md#req-product-paid-order-archives), [REQ-PRODUCT-ORDER-CONFIRMATION](requirements/README.md#req-product-order-confirmation).

**Code references:** [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/history.ts](../packages/notabenda-cf/src/history.ts), [packages/notabenda/src/terms.ts](../packages/notabenda/src/terms.ts), [packages/notabenda-cf/src/terms.ts](../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/consent-notice.ts](../packages/notabenda/src/consent-notice.ts), [packages/notabenda-cf/src/consent.ts](../packages/notabenda-cf/src/consent.ts), [packages/notabenda/src/processing-choices.ts](../packages/notabenda/src/processing-choices.ts), [packages/notabenda-cf/src/processing.ts](../packages/notabenda-cf/src/processing.ts), [packages/notabenda-cf/src/export.ts](../packages/notabenda-cf/src/export.ts), [packages/notabenda-cf/src/worker.ts](../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/types.ts](../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/src/lifecycle.ts](../packages/notabenda-cf/src/lifecycle.ts), [examples/lifecycle.mjs](../examples/lifecycle.mjs), [packages/notabenda/src/form-permission.ts](../packages/notabenda/src/form-permission.ts), [packages/notabenda-cf/src/permissions.ts](../packages/notabenda-cf/src/permissions.ts)

<a id="feat-regions"></a>

## P2 · FEAT-REGIONS — Regional requirement profiles

**Status:** partial.

**Deliverables:**

- Explicit applicability facts and versioned rule packs; conservative fallback when applicability is unknown.
- Explain effective behavior using requirement IDs, sources, and active pack versions.
- Conditional exemptions and purpose-specific restrictions; no inference of applicability from IP geography alone.
- Optional declared UK statistical/appearance objection profiles, separate from consent, with atomic browser preferences and revision-bound resume; qualification remains host review.
- Explicit Irish default grant cap with calendar-month expiry, independent solicitation/refusal clocks and pinned CF receipt parity; justified extensions remain open.

**Requirement links:** [REQ-EU-DEVICE](requirements/README.md#req-eu-device), [REQ-FR-SCOPE](requirements/README.md#req-fr-scope), [REQ-DE-DEVICE](requirements/README.md#req-de-device), [REQ-IT-REPROMPT](requirements/README.md#req-it-reprompt), [REQ-ES-CHOICE](requirements/README.md#req-es-choice), [REQ-IE-DEVICE](requirements/README.md#req-ie-device), [REQ-IE-CONSENT-DURATION](requirements/README.md#req-ie-consent-duration), [REQ-UK-EXCEPTIONS](requirements/README.md#req-uk-exceptions), [REQ-CH-PROFILING](requirements/README.md#req-ch-profiling), [REQ-BR-COOKIE-UI](requirements/README.md#req-br-cookie-ui), [REQ-CA-OBA](requirements/README.md#req-ca-oba), [REQ-QC-PROFILING](requirements/README.md#req-qc-profiling), [REQ-US-CA-GPC](requirements/README.md#req-us-ca-gpc), [REQ-US-CO-GPC](requirements/README.md#req-us-co-gpc), [REQ-US-CT-GPC](requirements/README.md#req-us-ct-gpc), [REQ-US-COPPA-SCOPE](requirements/README.md#req-us-coppa-scope), [REQ-TR-BASIS](requirements/README.md#req-tr-basis), [REQ-PRODUCT-REGIONAL-PROMPTS](requirements/README.md#req-product-regional-prompts), [REQ-EU-MARKETING](requirements/README.md#req-eu-marketing), [REQ-CA-CASL-OPTIN](requirements/README.md#req-ca-casl-optin), [REQ-PRODUCT-STORAGE-EXCEPTIONS](requirements/README.md#req-product-storage-exceptions).

**Code references:** [packages/notabenda/src/prompt-policy.ts](../packages/notabenda/src/prompt-policy.ts), [packages/notabenda/src/consent.ts](../packages/notabenda/src/consent.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-notice.ts](../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda/src/consent-evidence.ts](../packages/notabenda/src/consent-evidence.ts), [packages/notabenda-cf/src/consent.ts](../packages/notabenda-cf/src/consent.ts), [examples/repeat-prompts/build.mjs](../examples/repeat-prompts/build.mjs), [examples/repeat-prompts/client.mjs](../examples/repeat-prompts/client.mjs), [packages/notabenda/src/storage-exception-policy.ts](../packages/notabenda/src/storage-exception-policy.ts), [packages/notabenda/src/storage-exceptions.ts](../packages/notabenda/src/storage-exceptions.ts), [packages/notabenda/src/storage-exception-controls.ts](../packages/notabenda/src/storage-exception-controls.ts), [packages/notabenda/src/storage-exceptions.css](../packages/notabenda/src/storage-exceptions.css), [packages/notabenda/src/service-runner.ts](../packages/notabenda/src/service-runner.ts), [packages/notabenda/src/storage-cleanup.ts](../packages/notabenda/src/storage-cleanup.ts), [packages/notabenda/src/consent-engine.ts](../packages/notabenda/src/consent-engine.ts), [docs/verification/regional-consent.md](../docs/verification/regional-consent.md), [packages/notabenda/src/grant-expiry-policy.ts](../packages/notabenda/src/grant-expiry-policy.ts)

<a id="feat-us-choices"></a>

## P2 · FEAT-US-CHOICES — US privacy choices and signals

**Status:** partial.

**Deliverables:**

- Sale/sharing/targeted-advertising controls, applicable GPC handling, and signal-status messaging.
- Notice-at-collection entry points and relevant sensitive-data restrictions.
- Server-readable restrictions and adapters to stop corresponding downstream processing.

**Requirement links:** [REQ-US-CA-CHOICES](requirements/README.md#req-us-ca-choices), [REQ-US-CA-GPC](requirements/README.md#req-us-ca-gpc), [REQ-US-CA-UI](requirements/README.md#req-us-ca-ui), [REQ-US-CO-GPC](requirements/README.md#req-us-co-gpc), [REQ-US-CT-GPC](requirements/README.md#req-us-ct-gpc), [REQ-PRODUCT-PRIVACY-SIGNALS](requirements/README.md#req-product-privacy-signals), [REQ-PRODUCT-PROCESSING-CHOICES](requirements/README.md#req-product-processing-choices).

**Code references:** [packages/notabenda/src/privacy-signals.ts](../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/src/processing-choices.ts](../packages/notabenda/src/processing-choices.ts), [packages/notabenda-cf/src/processing.ts](../packages/notabenda-cf/src/processing.ts)

<a id="feat-rights"></a>

## P2 · FEAT-RIGHTS — Rights entry points and application bridge

**Status:** partial.

**Deliverables:**

- Configurable rights/contact page and links for access, correction, erasure, withdrawal, and applicable appeals.
- Authenticated hooks to an operator's workflow; receipt exports do not pretend to export all application data.
- Document verified identity and response handling as operator/application responsibilities.
- Initial static core/React/Astro entry points and public contact fallback are implemented; intake, identity, request/response workflow and fulfillment remain host work.

**Requirement links:** [REQ-EU-NOTICE](requirements/README.md#req-eu-notice), [REQ-NZ-INDIRECT](requirements/README.md#req-nz-indirect), [REQ-ZA-MARKETING](requirements/README.md#req-za-marketing), [REQ-US-CA-CHOICES](requirements/README.md#req-us-ca-choices), [REQ-US-VA-RIGHTS](requirements/README.md#req-us-va-rights), [REQ-PRODUCT-RIGHTS-CENTER](requirements/README.md#req-product-rights-center).

**Code references:** [packages/notabenda/src/rights-policy.ts](../packages/notabenda/src/rights-policy.ts), [packages/notabenda/src/rights.ts](../packages/notabenda/src/rights.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda/src/documents.ts](../packages/notabenda/src/documents.ts), [packages/notabenda/src/react-documents.ts](../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/RightsCenter.astro](../packages/notabenda/src/astro/RightsCenter.astro), [packages/notabenda/src/styles.css](../packages/notabenda/src/styles.css), [packages/notabenda-authoring/src/index.ts](../packages/notabenda-authoring/src/index.ts), [examples/rights/build.mjs](../examples/rights/build.mjs)

<a id="feat-contract-actions"></a>

## P2 · FEAT-CONTRACT-ACTIONS — Contract withdrawal and cancellation widgets

**Status:** partial.

**Deliverables:**

- Separate contract-withdrawal and qualifying subscription-cancellation flows, with applicable labels and required fields.
- Review step, durable confirmation output, and application-backend handoff; privacy choices stay independent. Use mobile drawers/pages with readable forms, not unsolicited fullscreen prompts.
- Optional notabenda-cf record/dispatch support; no success message until handoff is durably accepted; no automatic refunds or subscription mutation.
- Native/headless forms, atomic declaration/outbox APIs, isolated examples, private inspection/search and independent bounded host callback runners are implemented and locally verified, including SQLite dispatch lease restart/deduplication with simulated providers. Actual host scheduling/providers, regional review and operational acceptance remain open.

**Requirement links:** [REQ-EU-WITHDRAWAL](requirements/README.md#req-eu-withdrawal), [REQ-DE-CANCEL](requirements/README.md#req-de-cancel), [REQ-DE-WITHDRAWAL](requirements/README.md#req-de-withdrawal), [REQ-BR-CONTRACT](requirements/README.md#req-br-contract), [REQ-EU-ORDER-ACTION](requirements/README.md#req-eu-order-action), [REQ-PRODUCT-CONTRACT-ACTIONS](requirements/README.md#req-product-contract-actions).

**Code references:** [packages/notabenda/src/contract-action-policy.ts](../packages/notabenda/src/contract-action-policy.ts), [packages/notabenda/src/contract-action.ts](../packages/notabenda/src/contract-action.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/contract-action-policy.ts](../packages/notabenda-cf/src/contract-action-policy.ts), [packages/notabenda-cf/src/contracts.ts](../packages/notabenda-cf/src/contracts.ts), [packages/notabenda-cf/src/lifecycle.ts](../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/records.ts](../packages/notabenda-cf/src/records.ts), [packages/notabenda-cf/src/render.ts](../packages/notabenda-cf/src/render.ts), [examples/contract-actions/build.mjs](../examples/contract-actions/build.mjs), [examples/contract-actions/client.mjs](../examples/contract-actions/client.mjs), [examples/contract-actions/style.css](../examples/contract-actions/style.css), [site/contract-context.mjs](../site/contract-context.mjs), [site/contract-seed.mjs](../site/contract-seed.mjs), [site/demo-host.mjs](../site/demo-host.mjs), [site/worker.mjs](../site/worker.mjs), [site/host.mjs](../site/host.mjs), [packages/notabenda-cf/src/contract-dispatch.ts](../packages/notabenda-cf/src/contract-dispatch.ts)

<a id="feat-scope-guards"></a>

## P2 · FEAT-SCOPE-GUARDS — Sensitive and child-related scope guards

**Status:** partial.

**Deliverables:**

- Explicit sensitive-data, children, profiling, and regulated-sector flags in configuration.
- Prevent unsupported scenarios from being described as covered; block optional high-risk integrations by default.
- Specialized age assurance and verifiable parental consent remain deferred until separately designed and reviewed.
- Initial explicit operator scope declarations and optional-runtime guards; specialized authorization and sector workflows remain unsupported.

**Requirement links:** [REQ-CH-PROFILING](requirements/README.md#req-ch-profiling), [REQ-CA-OBA](requirements/README.md#req-ca-oba), [REQ-AU-PIXELS](requirements/README.md#req-au-pixels), [REQ-US-VA-RIGHTS](requirements/README.md#req-us-va-rights), [REQ-US-COPPA-SCOPE](requirements/README.md#req-us-coppa-scope), [REQ-PRODUCT-SCOPE-GUARDS](requirements/README.md#req-product-scope-guards).

**Code references:** [packages/notabenda/src/scope-guard-policy.ts](../packages/notabenda/src/scope-guard-policy.ts), [packages/notabenda/src/scope-guards.ts](../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/types.ts](../packages/notabenda/src/types.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/consent.ts](../packages/notabenda/src/consent.ts), [packages/notabenda/src/consent-notice.ts](../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/controls.ts](../packages/notabenda/src/controls.ts), [packages/notabenda/src/setup.ts](../packages/notabenda/src/setup.ts), [packages/notabenda/src/starter.ts](../packages/notabenda/src/starter.ts), [packages/notabenda/src/react.ts](../packages/notabenda/src/react.ts), [packages/notabenda-cf/src/scope-guard-policy.ts](../packages/notabenda-cf/src/scope-guard-policy.ts), [packages/notabenda-cf/src/consent.ts](../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/history.ts](../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/render.ts](../packages/notabenda-cf/src/render.ts), [examples/scope-guards/build.mjs](../examples/scope-guards/build.mjs), [examples/scope-guards/client.mjs](../examples/scope-guards/client.mjs)

<a id="feat-backoffice"></a>

## P2 · FEAT-BACKOFFICE — Host-authorized evidence backoffice

**Status:** partial.

**Deliverables:**

- Pluggable read-only worker with mandatory host authorization and host-selected store scope.
- Bounded search, evidence cards, readable details, filters, and raw JSON disclosure.
- Durable Object adapter; no login, credentials, arbitrary DO selectors, or consent collection.

**Requirement links:** [REQ-PRODUCT-CF-ADMIN](requirements/README.md#req-product-cf-admin), [REQ-PRODUCT-TERMS-ACCEPTANCE](requirements/README.md#req-product-terms-acceptance), [REQ-PRODUCT-CF-HOST](requirements/README.md#req-product-cf-host), [REQ-PRODUCT-CONSENT-EVIDENCE](requirements/README.md#req-product-consent-evidence), [REQ-PRODUCT-EVIDENCE-EXPORT](requirements/README.md#req-product-evidence-export), [REQ-PRODUCT-EVIDENCE-LIFECYCLE](requirements/README.md#req-product-evidence-lifecycle), [REQ-EU-RETENTION-ERASURE](requirements/README.md#req-eu-retention-erasure), [REQ-PRODUCT-DEMO-WORKSPACE](requirements/README.md#req-product-demo-workspace), [REQ-PRODUCT-CF-STARTER](requirements/README.md#req-product-cf-starter), [REQ-PRODUCT-CONTRACT-ACTIONS](requirements/README.md#req-product-contract-actions), [REQ-PRODUCT-PAID-ORDER-ARCHIVES](requirements/README.md#req-product-paid-order-archives), [REQ-PRODUCT-ORDER-CONFIRMATION](requirements/README.md#req-product-order-confirmation).

**Code references:** [packages/notabenda-cf/src/worker.ts](../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/store.ts](../packages/notabenda-cf/src/store.ts), [packages/notabenda-cf/src/render.ts](../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/src/records.ts](../packages/notabenda-cf/src/records.ts), [packages/notabenda/src/terms.ts](../packages/notabenda/src/terms.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/terms.ts](../packages/notabenda-cf/src/terms.ts), [site/host.mjs](../site/host.mjs), [site/worker.mjs](../site/worker.mjs), [site/build.mjs](../site/build.mjs), [packages/notabenda/src/consent-notice.ts](../packages/notabenda/src/consent-notice.ts), [packages/notabenda-cf/src/consent.ts](../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/export.ts](../packages/notabenda-cf/src/export.ts), [packages/notabenda-cf/src/types.ts](../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/src/lifecycle.ts](../packages/notabenda-cf/src/lifecycle.ts), [examples/lifecycle.mjs](../examples/lifecycle.mjs)

<a id="feat-document-history"></a>

## P2 · FEAT-DOCUMENT-HISTORY — Immutable document history and reviewable differences

**Status:** implemented.

**Deliverables:**

- Explicit transactional release archival with exact content, version metadata, operator change note, and idempotent retries.
- Backoffice release history and safe side-by-side structured comparisons.
- Separate content and rendered-HTML digests; no automatic publication, notification, consent invalidation, or terms acceptance.

**Requirement links:** [REQ-PRODUCT-CF-HISTORY](requirements/README.md#req-product-cf-history), [REQ-PRODUCT-AUTHORING](requirements/README.md#req-product-authoring), [REQ-PRODUCT-RETAINED-RELEASES](requirements/README.md#req-product-retained-releases).

**Code references:** [packages/notabenda-cf/src/history.ts](../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/render.ts](../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/content.ts](../packages/notabenda/src/content.ts), [packages/notabenda/src/release-files.ts](../packages/notabenda/src/release-files.ts)

<a id="feat-paid-orders"></a>

## P2 · FEAT-PAID-ORDERS — Paid order information and deliberate payment action

**Status:** partial.

**Deliverables:**

- Reviewed item and commitment definitions bound to host-calculated quotes, exact money, total/due-now prices, recurring and conditional charges, and product-specific guarantee labels.
- Static vanilla/React/Astro information and a native/headless final action with uncertainty recovery. No implicit terms agreement, payment execution or durable contract confirmation.
- Reusable Cloudflare chunked review/original-file archives, CAS quote activation, one admission per checkout intent with atomic host mutation plans, recovery, scoped admin inspection and retirement are implemented and used by the isolated demo. External payment/stock-system acceptance, actual confirmation provision and legal/national review remain open; optional complete-file archival and host delivery mechanics are tracked separately in FEAT-ORDER-CONFIRMATION.

**Requirement links:** [REQ-EU-ORDER-ACTION](requirements/README.md#req-eu-order-action), [REQ-PRODUCT-PAID-ORDER-ARCHIVES](requirements/README.md#req-product-paid-order-archives), [REQ-EU-ORDER-CONFIRMATION](requirements/README.md#req-eu-order-confirmation).

**Code references:** [packages/notabenda/src/paid-order-policy.ts](../packages/notabenda/src/paid-order-policy.ts), [packages/notabenda/src/paid-order.ts](../packages/notabenda/src/paid-order.ts), [packages/notabenda/src/paid-order-action.ts](../packages/notabenda/src/paid-order-action.ts), [packages/notabenda/src/paid-order-ui.ts](../packages/notabenda/src/paid-order-ui.ts), [packages/notabenda/src/orders.css](../packages/notabenda/src/orders.css), [packages/notabenda-authoring/src/paid-order-build.ts](../packages/notabenda-authoring/src/paid-order-build.ts), [packages/notabenda/src/react-documents.ts](../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/PaidOrderReview.astro](../packages/notabenda/src/astro/PaidOrderReview.astro), [examples/orders/build.mjs](../examples/orders/build.mjs), [examples/orders/client.mjs](../examples/orders/client.mjs), [site/order-demo.mjs](../site/order-demo.mjs), [site/order-demo-admin.mjs](../site/order-demo-admin.mjs), [site/order-admin.css](../site/order-admin.css), [packages/notabenda-cf/src/orders.ts](../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/src/order-context.ts](../packages/notabenda-cf/src/order-context.ts), [packages/notabenda-cf/src/order-blobs.ts](../packages/notabenda-cf/src/order-blobs.ts), [packages/notabenda-cf/src/order-render.ts](../packages/notabenda-cf/src/order-render.ts), [packages/notabenda-cf/src/order-admin-style.ts](../packages/notabenda-cf/src/order-admin-style.ts), [packages/notabenda-cf/src/order-review.ts](../packages/notabenda-cf/src/order-review.ts), [packages/notabenda-cf/src/order-review-style.ts](../packages/notabenda-cf/src/order-review-style.ts), [packages/notabenda-cf/src/order-policy.ts](../packages/notabenda-cf/src/order-policy.ts), [packages/notabenda-cf/src/lifecycle.ts](../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/worker.ts](../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/types.ts](../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/scripts/sync-order-policy.mjs](../packages/notabenda-cf/scripts/sync-order-policy.mjs), [site/order-demo-legacy.mjs](../site/order-demo-legacy.mjs), [site/order-demo-admin-legacy.mjs](../site/order-demo-admin-legacy.mjs)

<a id="feat-order-confirmation"></a>

## P2 · FEAT-ORDER-CONFIRMATION — Customer confirmation archives and host delivery

**Status:** partial.

**Deliverables:**

- Immutable personally addressed plain-text confirmation and optional exact attachments, linked to the admitted review, actual host contract facts and fixed destination version.
- Atomic preparation/outbox, bounded host callback attempts, recoverable uncertainty and stable provider idempotency; no built-in email provider, scheduler or contract-formation decision.
- Separately authorized admin inspection and inert downloads; pending-job retirement guards and resumable scoped purge.
- Complete content, real channel/destination behavior, actual provision, timing and national/linguistic acceptance remain host review work.

**Requirement links:** [REQ-EU-ORDER-CONFIRMATION](requirements/README.md#req-eu-order-confirmation), [REQ-PRODUCT-ORDER-CONFIRMATION](requirements/README.md#req-product-order-confirmation).

**Code references:** [packages/notabenda-cf/src/order-confirmations.ts](../packages/notabenda-cf/src/order-confirmations.ts), [packages/notabenda-cf/src/order-confirmation-state.ts](../packages/notabenda-cf/src/order-confirmation-state.ts), [packages/notabenda-cf/src/order-confirmation-dispatch.ts](../packages/notabenda-cf/src/order-confirmation-dispatch.ts), [packages/notabenda-cf/src/order-confirmation-render.ts](../packages/notabenda-cf/src/order-confirmation-render.ts), [packages/notabenda-cf/src/orders.ts](../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/src/lifecycle.ts](../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/worker.ts](../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/types.ts](../packages/notabenda-cf/src/types.ts), [site/order-confirmation-seed.mjs](../site/order-confirmation-seed.mjs), [site/order-demo-admin.mjs](../site/order-demo-admin.mjs)

<a id="feat-discovery"></a>

## P3 · FEAT-DISCOVERY — Standalone discovery tooling

**Status:** partial.

**Deliverables:**

- Browser-assisted inventory of observed requests, cookies/storage, embeds, and resource hints.
- Human-readable and JSON findings with route, scenario, evidence, and candidate purpose/service mappings.
- Adopters choose when to run it, whether to use CI, and which findings should block their deployments.

**Requirement links:** [REQ-AU-PIXELS](requirements/README.md#req-au-pixels), [REQ-PRODUCT-DISCOVERY](requirements/README.md#req-product-discovery), [REQ-PRODUCT-SERVICE-DETECTION](requirements/README.md#req-product-service-detection).

**Code references:** [packages/notabenda/src/discovery.ts](../packages/notabenda/src/discovery.ts), [packages/notabenda/src/discovery-ui.ts](../packages/notabenda/src/discovery-ui.ts), [packages/notabenda/src/discovery-cli.ts](../packages/notabenda/src/discovery-cli.ts), [examples/discovery/build.mjs](../examples/discovery/build.mjs), [examples/discovery/client.mjs](../examples/discovery/client.mjs)

<a id="feat-google"></a>

## P3 · FEAT-GOOGLE — Google Basic Consent Mode

**Status:** partial.

**Deliverables:**

- Optional adapter setting defaults before tags and explicitly mapping all four relevant consent signals.
- Basic mode tag gating and purpose mapping diagnostics.
- Test fixtures demonstrating no Google requests before consent or after rejection.

**Requirement links:** [REQ-GOOGLE-MODE](requirements/README.md#req-google-mode).

**Code references:** [packages/notabenda/src/google-basic.ts](../packages/notabenda/src/google-basic.ts), [packages/notabenda/src/google-basic-policy.ts](../packages/notabenda/src/google-basic-policy.ts), [packages/notabenda/src/config.ts](../packages/notabenda/src/config.ts), [packages/notabenda/src/types.ts](../packages/notabenda/src/types.ts), [examples/google-basic/build.mjs](../examples/google-basic/build.mjs), [examples/google-basic/client.mjs](../examples/google-basic/client.mjs)

<a id="feat-ad-cmp"></a>

## P4 · FEAT-AD-CMP — Certified advertising CMP path

**Status:** planned.

**Deliverables:**

- Investigate current IAB TCF registration, vendor signaling, and Google certification as a separate project.
- No invented CMP identity or claim that Consent Mode implies certification.
- Defer shipping TCF until specification, certification, and ongoing maintenance are actually satisfied.

**Requirement links:** [REQ-GOOGLE-CMP](requirements/README.md#req-google-cmp).

**Code references:** None yet.
