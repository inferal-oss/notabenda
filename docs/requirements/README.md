# Requirements catalog

Generated from [regulatory/catalog.json](../../regulatory/catalog.json). Edit the catalog and run `python3 scripts/regulatory.py` to refresh these pages.

Research baseline: **2026-10-18**. Implementation and verification status are recorded per item. Legal research is initial and legally unreviewed; no jurisdiction pack is production-supported. Search-result evidence is labeled separately from a retrieved full source.

[Feature index](../FEATURES.md) · [Source index](SOURCES.md) · [Research workflow](../../regulatory/README.md)

## Scope index

| Scope | Requirements | Coverage |
| --- | --- | --- |
| EU-EEA | [REQ-EU-NOTICE](#req-eu-notice), [REQ-EU-CONSENT](#req-eu-consent), [REQ-EU-DEVICE](#req-eu-device), [REQ-EU-FAIR-CHOICE](#req-eu-fair-choice), [REQ-EU-TERMS](#req-eu-terms), [REQ-EU-WITHDRAWAL](#req-eu-withdrawal), [REQ-EU-ORDER-ACTION](#req-eu-order-action), [REQ-EU-RETENTION-ERASURE](#req-eu-retention-erasure), [REQ-EU-MARKETING](#req-eu-marketing), [REQ-EU-GUARANTEE-NOTICE](#req-eu-guarantee-notice), [REQ-EU-GUARANTEE-LABEL](#req-eu-guarantee-label), [REQ-EU-ORDER-CONFIRMATION](#req-eu-order-confirmation), [REQ-EU-INTERESTS-DISCLOSURE](#req-eu-interests-disclosure) | Selected items: partial |
| FR | [REQ-FR-SCOPE](#req-fr-scope) | Selected items: partial |
| DE | [REQ-DE-DEVICE](#req-de-device), [REQ-DE-CANCEL](#req-de-cancel), [REQ-DE-WITHDRAWAL](#req-de-withdrawal) | Selected items: partial |
| IT | [REQ-IT-REPROMPT](#req-it-reprompt) | Selected items: partial |
| ES | [REQ-ES-CHOICE](#req-es-choice) | Selected items: partial |
| IE | [REQ-IE-DEVICE](#req-ie-device), [REQ-IE-CONSENT-DURATION](#req-ie-consent-duration) | Selected items: partial |
| UK | [REQ-UK-EXCEPTIONS](#req-uk-exceptions) | Selected items: partial |
| CH | [REQ-CH-PROFILING](#req-ch-profiling) | Selected items: partial |
| BR | [REQ-BR-COOKIE-UI](#req-br-cookie-ui), [REQ-BR-CONTRACT](#req-br-contract), [REQ-BR-COOKIE-RIGHTS-LINK](#req-br-cookie-rights-link), [REQ-BR-COOKIE-BROWSER-HELP](#req-br-cookie-browser-help) | Selected items: implemented, partial |
| CA-FED | [REQ-CA-MEANINGFUL](#req-ca-meaningful), [REQ-CA-OBA](#req-ca-oba), [REQ-CA-CASL-OPTIN](#req-ca-casl-optin) | Selected items: partial |
| CA-QC | [REQ-QC-PROFILING](#req-qc-profiling) | Selected items: partial |
| AU | [REQ-AU-PIXELS](#req-au-pixels) | Selected items: partial |
| NZ | [REQ-NZ-NOTICE](#req-nz-notice), [REQ-NZ-INDIRECT](#req-nz-indirect) | Selected items: partial |
| ZA | [REQ-ZA-MARKETING](#req-za-marketing) | Selected items: planned |
| US-CA | [REQ-US-CA-CHOICES](#req-us-ca-choices), [REQ-US-CA-GPC](#req-us-ca-gpc), [REQ-US-CA-UI](#req-us-ca-ui), [REQ-US-CA-ALTERNATIVE-LINK](#req-us-ca-alternative-link) | Selected items: partial, planned |
| US-CO | [REQ-US-CO-GPC](#req-us-co-gpc) | Selected items: partial |
| US-CT | [REQ-US-CT-GPC](#req-us-ct-gpc) | Selected items: partial |
| US-VA | [REQ-US-VA-RIGHTS](#req-us-va-rights) | Selected items: partial |
| US-FED | [REQ-US-COPPA-SCOPE](#req-us-coppa-scope) | Selected items: partial |
| TR | [REQ-TR-BASIS](#req-tr-basis) | Selected items: planned |
| PLATFORM | [REQ-GOOGLE-MODE](#req-google-mode), [REQ-GOOGLE-CMP](#req-google-cmp) | Selected items: partial, planned |
| PRODUCT | [REQ-PRODUCT-A11Y](#req-product-a11y), [REQ-PRODUCT-MOBILE](#req-product-mobile), [REQ-PRODUCT-CONFIG](#req-product-config), [REQ-PRODUCT-DOCUMENTS](#req-product-documents), [REQ-PRODUCT-SAFE-CONTENT](#req-product-safe-content), [REQ-PRODUCT-ARTIFACTS](#req-product-artifacts), [REQ-PRODUCT-PACKAGE](#req-product-package), [REQ-PRODUCT-CF-ADMIN](#req-product-cf-admin), [REQ-PRODUCT-CF-HISTORY](#req-product-cf-history), [REQ-PRODUCT-CONSENT-RUNTIME](#req-product-consent-runtime), [REQ-PRODUCT-TERMS-ACCEPTANCE](#req-product-terms-acceptance), [REQ-PRODUCT-CF-HOST](#req-product-cf-host), [REQ-PRODUCT-CONSENT-EVIDENCE](#req-product-consent-evidence), [REQ-PRODUCT-AUTHORING](#req-product-authoring), [REQ-PRODUCT-REACT](#req-product-react), [REQ-PRODUCT-ASTRO](#req-product-astro), [REQ-PRODUCT-EMBEDS](#req-product-embeds), [REQ-PRODUCT-PRIVACY-SIGNALS](#req-product-privacy-signals), [REQ-PRODUCT-PROCESSING-CHOICES](#req-product-processing-choices), [REQ-PRODUCT-RETAINED-RELEASES](#req-product-retained-releases), [REQ-PRODUCT-STORAGE-CLEANUP](#req-product-storage-cleanup), [REQ-PRODUCT-SETUP](#req-product-setup), [REQ-PRODUCT-COLLECTION-NOTICE](#req-product-collection-notice), [REQ-PRODUCT-EVIDENCE-EXPORT](#req-product-evidence-export), [REQ-PRODUCT-DISCOVERY](#req-product-discovery), [REQ-PRODUCT-REGIONAL-PROMPTS](#req-product-regional-prompts), [REQ-PRODUCT-EVIDENCE-LIFECYCLE](#req-product-evidence-lifecycle), [REQ-PRODUCT-SCOPE-GUARDS](#req-product-scope-guards), [REQ-PRODUCT-DEMO-WORKSPACE](#req-product-demo-workspace), [REQ-PRODUCT-RIGHTS-CENTER](#req-product-rights-center), [REQ-PRODUCT-CF-STARTER](#req-product-cf-starter), [REQ-PRODUCT-FORM-PERMISSIONS](#req-product-form-permissions), [REQ-PRODUCT-CF-DOCTOR](#req-product-cf-doctor), [REQ-PRODUCT-CONTRACT-ACTIONS](#req-product-contract-actions), [REQ-PRODUCT-SYNTAX-HIGHLIGHTING](#req-product-syntax-highlighting), [REQ-PRODUCT-BUNDLE-BUDGET](#req-product-bundle-budget), [REQ-PRODUCT-SERVICE-CATALOG](#req-product-service-catalog), [REQ-PRODUCT-SERVICE-DETECTION](#req-product-service-detection), [REQ-PRODUCT-SERVICE-PROFILES](#req-product-service-profiles), [REQ-PRODUCT-INDIRECT-NOTICE](#req-product-indirect-notice), [REQ-PRODUCT-GUARANTEE-NOTICE](#req-product-guarantee-notice), [REQ-PRODUCT-PAID-ORDER-ARCHIVES](#req-product-paid-order-archives), [REQ-PRODUCT-ORDER-CONFIRMATION](#req-product-order-confirmation), [REQ-PRODUCT-STORAGE-EXCEPTIONS](#req-product-storage-exceptions), [REQ-PRODUCT-LOCALIZATION](#req-product-localization), [REQ-PRODUCT-AGENT-INTEGRATION](#req-product-agent-integration), [REQ-PRODUCT-COMPLIANCE-MAP](#req-product-compliance-map), [REQ-PRODUCT-CARTRIDGES](#req-product-cartridges), [REQ-PRODUCT-WORKSPACE-OVERVIEW](#req-product-workspace-overview), [REQ-PRODUCT-DRAFT-PREVIEW](#req-product-draft-preview), [REQ-PRODUCT-PACK-CONNECTION](#req-product-pack-connection), [REQ-PRODUCT-CONSENT-AUTHORING](#req-product-consent-authoring), [REQ-PRODUCT-PRIVACY-PACKS](#req-product-privacy-packs), [REQ-PRODUCT-PUBLICATION-CHECK](#req-product-publication-check), [REQ-PRODUCT-CONSUMER-PACKS](#req-product-consumer-packs), [REQ-PRODUCT-SPECIALIST-PACKS](#req-product-specialist-packs), [REQ-PRODUCT-RIGHTS-AUTHORING](#req-product-rights-authoring), [REQ-PRODUCT-RIGHTS-LOCALIZATION](#req-product-rights-localization), [REQ-PRODUCT-STORAGE-AUTHORING](#req-product-storage-authoring), [REQ-PRODUCT-CONNECTION-INSPECTION](#req-product-connection-inspection), [REQ-PRODUCT-CF-RECOVERY-REHEARSAL](#req-product-cf-recovery-rehearsal), [REQ-PRODUCT-TERMS-ADAPTERS](#req-product-terms-adapters), [REQ-PRODUCT-PACK-EDUCATION](#req-product-pack-education), [REQ-PRODUCT-STORAGE-LOCALIZATION](#req-product-storage-localization), [REQ-PRODUCT-RELEASE-CANDIDATE](#req-product-release-candidate), [REQ-PRODUCT-RECORDING-INSPECTION](#req-product-recording-inspection), [REQ-PRODUCT-AGENT-HANDOFF](#req-product-agent-handoff), [REQ-PRODUCT-AUTHORED-PREVIEW](#req-product-authored-preview), [REQ-PRODUCT-PROCESSING-LOCALIZATION](#req-product-processing-localization), [REQ-PRODUCT-SETUP-SESSION](#req-product-setup-session), [REQ-PRODUCT-SERVICE-LOCALIZATION](#req-product-service-localization), [REQ-PRODUCT-INDIRECT-LOCALIZATION](#req-product-indirect-localization), [REQ-PRODUCT-CF-REMOTE-RECOVERY](#req-product-cf-remote-recovery), [REQ-PRODUCT-TERMS-CONNECTION](#req-product-terms-connection), [REQ-PRODUCT-CONSENT-REHEARSAL](#req-product-consent-rehearsal), [REQ-PRODUCT-DOCS-SEARCH](#req-product-docs-search), [REQ-PRODUCT-EMBED-LOCALIZATION](#req-product-embed-localization), [REQ-PRODUCT-TERMS-AUTHORING](#req-product-terms-authoring), [REQ-PRODUCT-TERMS-HISTORY](#req-product-terms-history), [REQ-PRODUCT-CONTRACT-LOCALIZATION](#req-product-contract-localization), [REQ-PRODUCT-PRIVACY-CHOICE-LINK](#req-product-privacy-choice-link), [REQ-PRODUCT-CONFIG-SOURCES](#req-product-config-sources), [REQ-PRODUCT-CONSENT-NOTICE-FILES](#req-product-consent-notice-files) | Selected items: implemented, partial |
| US-OR | [REQ-US-OR-GPC](#req-us-or-gpc) | Selected items: partial |
| US-MN | [REQ-US-MN-GPC](#req-us-mn-gpc) | Selected items: partial |

## Individual requirements

<a id="req-eu-notice"></a>

### REQ-EU-NOTICE — Transparent processing disclosures

Provide applicable processing disclosures in an accessible notice.

**Applies when:** GDPR applies to the operator and collection/processing context.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) — Articles 12–14 (read; [SRC-EU-GDPR](SOURCES.md#src-eu-gdpr)); [EDPB small-business guide: respecting individuals’ rights](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en) — Facilitate rights; electronic entry points; identity doubts (read; [SRC-EU-RIGHTS-GUIDE](SOURCES.md#src-eu-rights-guide)).

**Discovery articles:** [SRC-IUB-OVERVIEW](SOURCES.md#src-iub-overview).

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-RIGHTS](../FEATURES.md#feat-rights).

<a id="verify-eu-notice"></a>

**VERIFY-EU-NOTICE (partial):** Missing applicable controller, purpose, recipient, retention, transfer, or rights facts identify this requirement; inline collection notice links resolve.

**Implementation boundary:** Declared document disclosures and a selected-purpose inline notice now share the inventory and pinned privacy revision. Actual surface timing, field-level mapping, complete applicable particulars, factual accuracy and legal review remain host work; regional support is partial.

**Limits/open review:** Required particulars differ by context; a compiler cannot verify factual accuracy.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/collection.ts](../../packages/notabenda/src/collection.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/rights-policy.ts](../../packages/notabenda/src/rights-policy.ts), [packages/notabenda/src/rights.ts](../../packages/notabenda/src/rights.ts), [packages/notabenda/test/config.test.mjs](../../packages/notabenda/test/config.test.mjs), [packages/notabenda/test/documents.test.mjs](../../packages/notabenda/test/documents.test.mjs), [packages/notabenda/test/collection.test.mjs](../../packages/notabenda/test/collection.test.mjs), [packages/notabenda/test/rights.test.mjs](../../packages/notabenda/test/rights.test.mjs)

<a id="req-eu-interests-disclosure"></a>

### REQ-EU-INTERESTS-DISCLOSURE — Disclose the legitimate interests pursued

When processing relies on GDPR Article 6(1)(f), disclose the interests pursued by the controller or a third party in the applicable privacy information.

**Applies when:** GDPR applies and the actual processing relies on Article 6(1)(f); the operator assesses the basis and collection context.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) — Articles 6(1)(f), 13(1)(d), 14(2)(b); Official Journal PDF pp. 36, 41–42 (read; [SRC-EU-GDPR](SOURCES.md#src-eu-gdpr)).

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-SERVICE-CATALOG](../FEATURES.md#feat-service-catalog).

<a id="verify-eu-interests-disclosure"></a>

**VERIFY-EU-INTERESTS-DISCLOSURE (automated):** Explicit interests survive public projection, generated and localized direct notices, service details, guarded setup edits and selected provider archives; invalid UTF-8 bounds/control characters and production placeholders fail. Rehashed omitted/altered facts reject against intact releases in frontend and independent CF checks. Changed managed interests remove the affected saved grant without changing other grants. NZ descriptors remain profile-specific.

**Timing:** Supply the applicable information at the time required for the actual collection context; Article 14 has its own timing and exceptions.

**Implementation boundary:** An explicit bounded public purpose statement is projected into generated privacy and direct-collection basis text in the host language, retained across setup/provider-review archives and independently reconstructed permission facts, and included in material purpose scopes. Private assessments stay outside public output. Broader legal sufficiency and Article 14 notification workflow remain open.

**Limits/open review:** Optional structured wording does not choose or substantiate a basis, perform balancing, establish notice completeness or turn the NZ indirect-notice profile into a GDPR Article 14 notification. Supplied legal content remains author-owned; absence is not an inapplicability finding.

**Code/test references:** [packages/notabenda/src/purpose-disclosures.ts](../../packages/notabenda/src/purpose-disclosures.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/localized-documents.ts](../../packages/notabenda/src/localized-documents.ts), [packages/notabenda/src/collection.ts](../../packages/notabenda/src/collection.ts), [packages/notabenda/src/indirect-collection.ts](../../packages/notabenda/src/indirect-collection.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/setup-purpose.ts](../../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/src/setup-purpose-ui.ts](../../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-purpose-cli.ts](../../packages/notabenda/src/setup-purpose-cli.ts), [packages/notabenda/src/service-inventory.ts](../../packages/notabenda/src/service-inventory.ts), [packages/notabenda/src/service-directory.ts](../../packages/notabenda/src/service-directory.ts), [packages/notabenda/src/catalog-release-policy.ts](../../packages/notabenda/src/catalog-release-policy.ts), [packages/notabenda/src/catalog-review-ui.ts](../../packages/notabenda/src/catalog-review-ui.ts), [packages/notabenda-cf/src/catalog-release-policy.ts](../../packages/notabenda-cf/src/catalog-release-policy.ts), [packages/notabenda-cf/src/catalog-render.ts](../../packages/notabenda-cf/src/catalog-render.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [examples/collection/build.mjs](../../examples/collection/build.mjs), [packages/notabenda/test/legitimate-interests.test.mjs](../../packages/notabenda/test/legitimate-interests.test.mjs), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs), [packages/notabenda/test/catalog-release.test.mjs](../../packages/notabenda/test/catalog-release.test.mjs), [packages/notabenda/test/indirect-collection.test.mjs](../../packages/notabenda/test/indirect-collection.test.mjs), [docs/verification/legitimate-interests.md](../../docs/verification/legitimate-interests.md), [site/test/legitimate-interests.test.mjs](../../site/test/legitimate-interests.test.mjs)

<a id="req-eu-consent"></a>

### REQ-EU-CONSENT — Demonstrable consent and easy withdrawal

Where consent is the legal basis, preserve the choice and support easy withdrawal.

**Applies when:** An operator relies on GDPR consent.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) — Article 7 (read; [SRC-EU-GDPR](SOURCES.md#src-eu-gdpr)); [EDPB Guidelines 05/2020 on consent, version 1.1](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf) — Sections 5.1–5.2, paragraphs 104–120 (read; [SRC-EU-EDPB-CONSENT](SOURCES.md#src-eu-edpb-consent)).

**Discovery articles:** [SRC-IUB-OVERVIEW](SOURCES.md#src-iub-overview).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-CHOICES](../FEATURES.md#feat-choices), [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-eu-consent"></a>

**VERIFY-EU-CONSENT (partial):** An explicit purpose grant references the released wording; withdrawal uses the persistent controls and stops relevant future processing.

**Implementation boundary:** Local choices, withdrawal, expiry and cooperative cleanup are implemented. Optional server evidence preserves exact notices and transactional choice order; required-receipt browser mode checks current acknowledgments and bounded retries. Production retention, complete applicability and regional legal review remain incomplete. Ordinary purpose/channel fields and evaluated CF grant/withdrawal evidence now provide supporting mechanics; full applicability, meaningful presentation, specialized cases and regional review remain incomplete.

**Limits/open review:** Durable browser receipts do not prove human identity; consent is not the only legal basis.

**Code/test references:** [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda/src/form-permission.ts](../../packages/notabenda/src/form-permission.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/permissions.ts](../../packages/notabenda-cf/src/permissions.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/consent.test.mjs](../../packages/notabenda/test/consent.test.mjs), [packages/notabenda/test/consent-evidence.test.mjs](../../packages/notabenda/test/consent-evidence.test.mjs), [packages/notabenda/test/form-permission.test.mjs](../../packages/notabenda/test/form-permission.test.mjs), [docs/verification/form-permissions.md](../../docs/verification/form-permissions.md), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs)

<a id="req-eu-device"></a>

### REQ-EU-DEVICE — Prior permission for non-exempt device access

Keep consent-requiring storage/access inactive until a valid affirmative choice.

**Applies when:** Applicable national ePrivacy rules require permission for the declared activity.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [EDPB cookie banner taskforce report](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf) — Applicable framework; practices A, B, H, I (read; [SRC-EU-EDPB](SOURCES.md#src-eu-edpb)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-eu-device"></a>

**VERIFY-EU-DEVICE (partial):** A fresh and a rejected session produce no requests or device access for declared consent-requiring integrations.

**Implementation boundary:** Declared cooperative services stay blocked until all purposes have a current grant. Arbitrary scripts, device-access exemptions, server processing, and national profiles still require integration and review. The iframe/image adapter now supplies inert placeholders and shared-service withdrawal cleanup; this does not complete national applicability or vendor integration review.

**Limits/open review:** National law and exemptions require separate review; not limited to cookies.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/embeds.ts](../../packages/notabenda/src/embeds.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/consent.test.mjs](../../packages/notabenda/test/consent.test.mjs), [packages/notabenda/test/embeds.test.mjs](../../packages/notabenda/test/embeds.test.mjs)

<a id="req-eu-fair-choice"></a>

### REQ-EU-FAIR-CHOICE — Clear choices without preselected opt-ins

Avoid implied consent and misleading controls; offer a clear refusal path.

**Applies when:** Collecting tracker consent under the relevant EU/national rules.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [EDPB cookie banner taskforce report](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf) — Practices A–E and K (read; [SRC-EU-EDPB](SOURCES.md#src-eu-edpb)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-CHOICES](../FEATURES.md#feat-choices).

<a id="verify-eu-fair-choice"></a>

**VERIFY-EU-FAIR-CHOICE (partial):** All themes show usable accept/reject/customize actions; scrolling, dismissal, and navigation never grant optional permission.

**Implementation boundary:** No implied grant; dismissal and UI drafts do not grant. Built-in accept/reject controls are balanced. Complete accessibility, regional and wording review remains pending.

**Limits/open review:** Balanced first-layer buttons are the project standard; do not claim identical statutory UI rules in every country.

**Code/test references:** [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/consent.test.mjs](../../packages/notabenda/test/consent.test.mjs), [docs/verification/consent-browser.md](../../docs/verification/consent-browser.md)

<a id="req-fr-scope"></a>

### REQ-FR-SCOPE — Specific purposes and changes to consent scope

Collect prior permission and revisit grants when an additional consent-requiring purpose is introduced.

**Applies when:** French tracker rules apply.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [CNIL: tracker requirements](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi) — Valid consent; prior consent; additional purposes (read; [SRC-FR-CNIL](SOURCES.md#src-fr-cnil)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-CHOICES](../FEATURES.md#feat-choices), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-fr-scope"></a>

**VERIFY-FR-SCOPE (automated):** Adding an optional purpose leaves that purpose blocked until granted; a cosmetic release alone does not invalidate existing choices.

**Limits/open review:** Audience-measurement exemptions depend on configuration and conditions, not a vendor label. Shared-engine tests cover added purposes, changed disclosures, retained refusals and presentation-only edits. No complete French pack, exemption qualification or legal review is claimed.

**Code/test references:** [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [docs/verification/regional-consent.md](../../docs/verification/regional-consent.md), [packages/notabenda/test/regional-consent.test.mjs](../../packages/notabenda/test/regional-consent.test.mjs)

<a id="req-de-device"></a>

### REQ-DE-DEVICE — Terminal storage and access conditions

Obtain informed consent unless a section 25 exception applies.

**Applies when:** German TDDDG section 25 applies to the activity.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Germany TDDDG section 25](https://www.gesetze-im-internet.de/ttdsg/__25.html) — Section 25(1)–(2) (read; [SRC-DE-TDDDG](SOURCES.md#src-de-tdddg)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-de-device"></a>

**VERIFY-DE-DEVICE (partial):** A declared exemption must name its condition; an advertising loader cannot bypass the decision engine by being labeled necessary. These shared-engine checks do not establish legal qualification of the declared exception.

**Limits/open review:** Transmission and requested-service necessity are narrow exceptions. Diagnostics require an explanation and cooperative lifecycle tests prevent category-based bypass. The library cannot establish that an operator's exception assertion is legally valid or stop code loaded outside its lifecycle.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [docs/verification/regional-consent.md](../../docs/verification/regional-consent.md), [packages/notabenda/test/regional-consent.test.mjs](../../packages/notabenda/test/regional-consent.test.mjs)

<a id="req-it-reprompt"></a>

### REQ-IT-REPROMPT — Respect a recorded refusal before prompting again

Avoid repeated consent requests after refusal except under the stated conditions, including the six-month condition.

**Applies when:** Italian cookie guidelines apply and the visitor previously refused.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Garante: cookie guidelines and repeated prompts](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9679893) — Recorded choices and exceptions to repeat solicitation (read; [SRC-IT-GARANTE](SOURCES.md#src-it-garante)); [Garante cookie guidelines](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876) — Sections 6.2 and 7.1: repeated solicitation, partial consent and closing the initial banner (read; [SRC-IT-GUIDE](SOURCES.md#src-it-guide)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-CHOICES](../FEATURES.md#feat-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-it-reprompt"></a>

**VERIFY-IT-REPROMPT (partial):** Refusal, partial consent and dismissal suppress solicitation independently of choice expiry. Test exact material transitions, unavailable/legacy state, cross-tab acknowledgement and UTC calendar boundaries. Legal presentation-time interpretation and full platform review remain open.

**Limits/open review:** Explicit solicitation guard only. Six calendar months run conservatively from a recorded withholding/dismissal action, not observed banner presentation. Applicability, legal review and complete regional support remain open.

**Code/test references:** [packages/notabenda/src/prompt-policy.ts](../../packages/notabenda/src/prompt-policy.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [examples/repeat-prompts/build.mjs](../../examples/repeat-prompts/build.mjs), [examples/repeat-prompts/client.mjs](../../examples/repeat-prompts/client.mjs), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/prompt-policy.test.mjs](../../packages/notabenda/test/prompt-policy.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs)

<a id="req-es-choice"></a>

### REQ-ES-CHOICE — Simultaneous and equally visible accept/reject choices

Offer acceptance and rejection at the same time, level, and visibility.

**Applies when:** Spanish consent-requiring tracker use falls within AEPD guidance.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [AEPD: cookie consent and choice visibility](https://www.aepd.es/preguntas-frecuentes/17-internet-y-redes-sociales/FAQ-1707-importancia-de-las-cookies-en-la-proteccion-de-datos) — Accept/reject visibility paragraph (read; [SRC-ES-AEPD](SOURCES.md#src-es-aepd)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-es-choice"></a>

**VERIFY-ES-CHOICE (partial):** Every built-in theme exposes both actions in the first layer without hiding rejection in a settings screen.

**Implementation boundary:** Simultaneous equal-style accept/reject buttons implemented and initially inspected in Chromium. National applicability and full deployment review remain pending.

**Limits/open review:** Consent exemptions and service-specific exceptions still require separate analysis.

**Code/test references:** [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [docs/verification/consent-browser.md](../../docs/verification/consent-browser.md)

<a id="req-ie-device"></a>

### REQ-IE-DEVICE — Consent for non-exempt tracking

Require affirmative consent where tracking is not strictly necessary for an explicitly requested service.

**Applies when:** Irish ePrivacy rules apply.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Irish DPC: cookies and tracking guidance](https://www.dataprotection.ie/en/dpc-guidance/guidance-cookies-and-other-tracking-technologies) — Consent and strictly necessary exception (read; [SRC-IE-DPC](SOURCES.md#src-ie-dpc)); [Irish DPC: cookies guidance note (April 2020)](https://www.dataprotection.ie/sites/default/files/uploads/2020-04/Guidance%20note%20on%20cookies%20and%20other%20tracking%20technologies.pdf) — pp. 6-11: exemptions; analytics; multiple purposes; withdrawal; no implied consent (read; [SRC-IE-DPC-COOKIE-NOTE](SOURCES.md#src-ie-dpc-cookie-note)); [Irish DPC: consent for analytics cookies](https://www.dataprotection.ie/en/faqs/cookies/do-i-need-consent-analytics-cookies) — Answer and distinction between first-party and third-party analytics (read; [SRC-IE-DPC-ANALYTICS](SOURCES.md#src-ie-dpc-analytics)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-ie-device"></a>

**VERIFY-IE-DEVICE (partial):** The Irish profile leaves optional trackers inert until an explicit choice and documents the requested-service reason for exemptions. Current automated scenarios exercise the shared engine with an explicit Irish declaration; profile review and duration policy remain open.

**Limits/open review:** Do not import prompt durations or exemption assumptions from another country's pack. Shared-engine tests cover optional first-party measurement, affirmative granular choices and multipurpose gating. There is no reviewed Irish profile; remembered-consent duration is tracked separately by REQ-IE-CONSENT-DURATION.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [docs/verification/regional-consent.md](../../docs/verification/regional-consent.md), [packages/notabenda/test/regional-consent.test.mjs](../../packages/notabenda/test/regional-consent.test.mjs)

<a id="req-ie-consent-duration"></a>

### REQ-IE-CONSENT-DURATION — Review remembered-consent duration against DPC guidance

Compare the configured remembered-consent lifetime with the DPC default of reaffirmation within six months and its case-specific justification for longer storage.

**Applies when:** Following Irish DPC guidance for cookies that remember a consent state.

**Type:** regulator-recommendation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Irish DPC: cookies guidance note (April 2020)](https://www.dataprotection.ie/sites/default/files/uploads/2020-04/Guidance%20note%20on%20cookies%20and%20other%20tracking%20technologies.pdf) — pp. 8-9, Withdrawal of consent and footnote 2 (read; [SRC-IE-DPC-COOKIE-NOTE](SOURCES.md#src-ie-dpc-cookie-note)).

**Features:** [FEAT-CHOICES](../FEATURES.md#feat-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-ie-consent-duration"></a>

**VERIFY-IE-CONSENT-DURATION (partial):** A reviewed duration policy distinguishes calendar-month guidance, explicit lifetimes and case-specific justification. It must not inherit another country's prompt interval or treat a vendor retention period as consent. Automated scenarios cover the explicit default cap, calendar edges, local migration, preserved refusals/solicitation memory and required-evidence/CF parity. Case-specific extensions and independent legal/platform review remain open.

**Timing:** April 2020 guidance; retrieved through the current DPC page on 19 October 2026. This is guidance rather than a statutory fixed-day lifetime.

**Limits/open review:** The explicit version-1 default cap uses the earlier of the configured grant lifetime and six clamped UTC calendar months. Refusal, Italian solicitation and evidence retention remain independent. Both receipt clocks are bounded separately. Source applicability, actual disclosures/vendor behavior, objective case-specific longer-period qualification and a complete reviewed Irish profile remain open. A six-calendar-month recommendation is not an automatic 180-day statutory limit.

**Code/test references:** [packages/notabenda/src/grant-expiry-policy.ts](../../packages/notabenda/src/grant-expiry-policy.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda-cf/src/grant-expiry-policy.ts](../../packages/notabenda-cf/src/grant-expiry-policy.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [examples/repeat-prompts/build.mjs](../../examples/repeat-prompts/build.mjs), [examples/repeat-prompts/client.mjs](../../examples/repeat-prompts/client.mjs), [docs/verification/regional-consent.md](../../docs/verification/regional-consent.md), [packages/notabenda/test/grant-expiry.test.mjs](../../packages/notabenda/test/grant-expiry.test.mjs)

<a id="req-uk-exceptions"></a>

### REQ-UK-EXCEPTIONS — Conditional storage/access exceptions and objection

Only enable an exception when its conditions hold; statistical/appearance exceptions require information and a simple free objection route.

**Applies when:** UK PECR applies and an operator opts into a qualifying exception.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [ICO: storage/access exception conditions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/) — At a glance; statistical/appearance exceptions; simple means of objecting (read; [SRC-UK-ICO](SOURCES.md#src-uk-ico)); [Data (Use and Access) Act 2025: Schedule 12 storage/access amendments](https://www.legislation.gov.uk/ukpga/2025/18/pdfs/ukpga_20250018_en.pdf) — Schedule 12 inserting PECR Schedule A1, paragraphs 5–6, printed pages 233–234 (read; [SRC-UK-DUAA-STORAGE](SOURCES.md#src-uk-duaa-storage)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-uk-exceptions"></a>

**VERIFY-UK-EXCEPTIONS (partial):** Software checks enforce declared prerequisites and usable objection controls. Independent review must establish actual qualification, disclosure, provider behavior and downstream data processing.

**Timing:** ICO finalized updated guidance on 29 April 2026.

**Limits/open review:** Optional host-assessed profiles only. Ordinary consent remains opt-in. Real qualification, downstream personal-data processing, aggregation/deletion behavior, accessibility and legal review remain open; software declarations do not prove their truth.

**Code/test references:** [packages/notabenda/src/storage-exception-policy.ts](../../packages/notabenda/src/storage-exception-policy.ts), [packages/notabenda/src/storage-exceptions.ts](../../packages/notabenda/src/storage-exceptions.ts), [packages/notabenda/src/storage-exception-controls.ts](../../packages/notabenda/src/storage-exception-controls.ts), [packages/notabenda/src/storage-exceptions.css](../../packages/notabenda/src/storage-exceptions.css), [packages/notabenda/src/service-runner.ts](../../packages/notabenda/src/service-runner.ts), [packages/notabenda/src/storage-cleanup.ts](../../packages/notabenda/src/storage-cleanup.ts), [examples/storage-exceptions/config.mjs](../../examples/storage-exceptions/config.mjs), [examples/storage-exceptions/build.mjs](../../examples/storage-exceptions/build.mjs), [examples/storage-exceptions/client.mjs](../../examples/storage-exceptions/client.mjs), [packages/notabenda/test/storage-exceptions.test.mjs](../../packages/notabenda/test/storage-exceptions.test.mjs), [docs/verification/storage-exceptions.md](../../docs/verification/storage-exceptions.md), [site/test/storage-exceptions.test.mjs](../../site/test/storage-exceptions.test.mjs)

<a id="req-ch-profiling"></a>

### REQ-CH-PROFILING — Assess personalised-advertising and high-risk profiling consent

Assess whether personalised advertising enables high-risk profiling that requires consent.

**Applies when:** Swiss FADP applies to the declared profiling/advertising activity.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [FDPIC: updated cookie guidance](https://www.edoeb.admin.ch/en/cookie-guidelines-updated-version) — Clarification on personalised advertising and high-risk profiling (read; [SRC-CH-FDPIC](SOURCES.md#src-ch-fdpic)).

**Discovery articles:** [SRC-IUB-OVERVIEW](SOURCES.md#src-iub-overview).

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-SCOPE-GUARDS](../FEATURES.md#feat-scope-guards).

<a id="verify-ch-profiling"></a>

**VERIFY-CH-PROFILING (partial):** A Swiss advertising/profiling declaration requires an explicit risk/consent classification and leaves an unresolved activity blocked.

**Timing:** FDPIC update published 7 October 2025.

**Implementation boundary:**  Explicit operator declarations now block affected registered optional work and generic grants. This support boundary does not implement the specialized legal workflow, determine applicability or complete legal review.

**Limits/open review:** Do not equate all Swiss cookies with EU opt-in rules or assume all profiling has the same status.

**Code/test references:** [packages/notabenda/src/scope-guards.ts](../../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/scope-guards.test.mjs](../../packages/notabenda/test/scope-guards.test.mjs)

<a id="req-br-cookie-ui"></a>

### REQ-BR-COOKIE-UI — ANPD cookie-control recommendations

Provide understandable purposes, easy rejection of unnecessary cookies, and accessible management/withdrawal.

**Applies when:** Applying ANPD's cookie-guide recommendations to personal-data processing.

**Type:** regulator-recommendation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** implemented.

**Sources:** [ANPD: final cookies and personal-data guide](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf/@@display-file/file) — Printed pp. 30–33 (PDF indexes 29–32): first/second-layer rejection, purpose categories, consent-based choices off by default, and patterns to avoid. (read; [SRC-BR-ANPD](SOURCES.md#src-br-anpd)).

**Discovery articles:** [SRC-IUB-BR](SOURCES.md#src-iub-br), [SRC-IUB-BR-COOKIE-GUIDE](SOURCES.md#src-iub-br-cookie-guide).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CHOICES](../FEATURES.md#feat-choices).

<a id="verify-br-cookie-ui"></a>

**VERIFY-BR-COOKIE-UI (automated):** The actual bundled Portuguese client starts with both optional purposes off, rejects on both layers, applies granular grants independently, restores valid choices on reload and removes its exact session marker on withdrawal. Unsaved settings and preference-storage failure grant nothing.

**Implementation boundary:** Portuguese two-purpose example exercises initial off state, direct rejection on both layers, unsaved drafts, independent service grants, reload, withdrawal, exact optional-marker cleanup and blocked preference storage. This verifies technical mechanics with host-supplied draft wording; actual inventory, applicability and legal/translation review remain open.

**Limits/open review:** These are regulator recommendations; LGPD legal bases require purpose-specific analysis, not a claim that consent is mandatory for all cookies.

**Code/test references:** [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [examples/localization/config.mjs](../../examples/localization/config.mjs), [examples/localization/build.mjs](../../examples/localization/build.mjs), [examples/localization/client.mjs](../../examples/localization/client.mjs), [site/test/br-cookie-ui.test.mjs](../../site/test/br-cookie-ui.test.mjs), [docs/verification/regional-consent.md](../../docs/verification/regional-consent.md)

<a id="req-ca-meaningful"></a>

### REQ-CA-MEANINGFUL — Meaningful consent and material changes

Explain collection, sharing, purposes, and consequences, with meaningful choices and withdrawal.

**Applies when:** PIPEDA applies and consent is required.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [OPC: meaningful consent](https://www.priv.gc.ca/media/4957/info_mc_eng.pdf) — Meaningful consent: four key elements and clear choices (read; [SRC-CA-OPC](SOURCES.md#src-ca-opc)).

**Discovery articles:** [SRC-IUB-OVERVIEW](SOURCES.md#src-iub-overview).

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-CHOICES](../FEATURES.md#feat-choices).

<a id="verify-ca-meaningful"></a>

**VERIFY-CA-MEANINGFUL (planned):** A collection surface displays the relevant concise facts; an additional purpose does not silently inherit an unrelated grant.

**Implementation boundary:**  Ordinary purpose/channel fields and evaluated CF grant/withdrawal evidence now provide supporting mechanics; full applicability, meaningful presentation, specialized cases and regional review remain incomplete.

**Limits/open review:** Provincial regimes and statutory exceptions must be evaluated separately.

**Code/test references:** [packages/notabenda/src/form-permission.ts](../../packages/notabenda/src/form-permission.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/permissions.ts](../../packages/notabenda-cf/src/permissions.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/test/form-permission.test.mjs](../../packages/notabenda/test/form-permission.test.mjs), [docs/verification/form-permissions.md](../../docs/verification/form-permissions.md)

<a id="req-ca-oba"></a>

### REQ-CA-OBA — Conditional opt-out consent for behavioural advertising

Do not assume opt-out consent is sufficient for all behavioural advertising.

**Applies when:** PIPEDA applies to online behavioural advertising.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [OPC: online behavioural advertising](https://www.priv.gc.ca/en/privacy-topics/technology/online-privacy-tracking-cookies/tracking-and-ads/gl_ba_1112/) — Opt-out conditions; sensitive information; children (read; [SRC-CA-OBA](SOURCES.md#src-ca-oba)).

**Features:** [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-SCOPE-GUARDS](../FEATURES.md#feat-scope-guards).

<a id="verify-ca-oba"></a>

**VERIFY-CA-OBA (partial):** No Canadian profile enables a sensitive-data or child-related advertising flow merely by showing an opt-out notice.

**Implementation boundary:**  Explicit operator declarations now block affected registered optional work and generic grants. This support boundary does not implement the specialized legal workflow, determine applicability or complete legal review.

**Limits/open review:** Any opt-out model needs review of the OPC conditions; the conservative default remains opt-in.

**Code/test references:** [packages/notabenda/src/scope-guards.ts](../../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/scope-guards.test.mjs](../../packages/notabenda/test/scope-guards.test.mjs)

<a id="req-qc-profiling"></a>

### REQ-QC-PROFILING — Profiling/identification/location functions off by default

Notify people of covered functions and how to activate them; do not activate them by default.

**Applies when:** Québec private-sector collection rules cover the declared technology.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Québec CAI: private-sector collection and profiling functions](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/collecte-renseignements-personnels_entreprises) — Private-sector collection: necessity; Technologies d’identification, de localisation et de profilage; separate biometric and automated-decision sections. (read; [SRC-QC-CAI](SOURCES.md#src-qc-cai)).

**Discovery articles:** [SRC-IUB-QC-LAW25](SOURCES.md#src-iub-qc-law25).

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-qc-profiling"></a>

**VERIFY-QC-PROFILING (automated):** A verified supplemental disclosure remains readable without JavaScript and binds a declared service to a fresh material scope. The actual local example stays off before voluntary activation; opening controls/reading topics grants nothing, old generic grants do not authorize it, withdrawal cleans up, and receipt/processing/scope restrictions remain effective. Host notification timing and legal suitability remain unproven.

**Implementation boundary:** Optional build/server declaration and static host-language renderer bind functions, activation instructions, provider and complete service purposes to a verified legal release and a declaration-derived material service scope. Existing cooperative runtime and on-demand controls preserve prior-grant invalidation, voluntary choice, receipts, processing restrictions and withdrawal. Host placement before all activation opportunities, supplemental descriptor retention, actual necessity/applicability, specialized workflows and legal/translation review remain separate.

**Limits/open review:** Scope and exceptions need Québec-specific review; this is not a statement that every cookie is covered.

**Code/test references:** [packages/notabenda/src/technology-collection.ts](../../packages/notabenda/src/technology-collection.ts), [packages/notabenda/src/technology.css](../../packages/notabenda/src/technology.css), [packages/notabenda/src/release-files.ts](../../packages/notabenda/src/release-files.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/technology/config.mjs](../../examples/technology/config.mjs), [examples/technology/build.mjs](../../examples/technology/build.mjs), [examples/technology/client.mjs](../../examples/technology/client.mjs), [examples/technology/style.css](../../examples/technology/style.css), [docs/TECHNOLOGY-COLLECTION.md](../../docs/TECHNOLOGY-COLLECTION.md), [scripts/measure-bundles.mjs](../../scripts/measure-bundles.mjs), [packages/notabenda/src/technology-collection-policy.ts](../../packages/notabenda/src/technology-collection-policy.ts), [packages/notabenda/test/technology-collection.test.mjs](../../packages/notabenda/test/technology-collection.test.mjs), [packages/notabenda/test/fixtures/technology-fr.mjs](../../packages/notabenda/test/fixtures/technology-fr.mjs), [site/test/technology-collection.test.mjs](../../site/test/technology-collection.test.mjs), [docs/verification/technology-collection.md](../../docs/verification/technology-collection.md), [packages/notabenda/test/delivery.test.mjs](../../packages/notabenda/test/delivery.test.mjs)

<a id="req-au-pixels"></a>

### REQ-AU-PIXELS — Pixel notices and sensitive-data consent

Provide applicable collection notice; assess express consent when pixels expose sensitive information.

**Applies when:** Australian Privacy Act/APP obligations apply to the operator and pixel activity.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [OAIC: tracking pixels and privacy obligations](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations) — Privacy obligations; APP 5 notification; sensitive information (read; [SRC-AU-OAIC](SOURCES.md#src-au-oaic)).

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-SCOPE-GUARDS](../FEATURES.md#feat-scope-guards), [FEAT-DISCOVERY](../FEATURES.md#feat-discovery).

<a id="verify-au-pixels"></a>

**VERIFY-AU-PIXELS (partial):** A pixel fixture can be inventoried; the collection surface links an appropriate notice and unresolved sensitive-data exposure stays blocked.

**Implementation boundary:** Explicit discovery supports limited origin/name inventory review. Australian applicability, appropriate notices, sensitive-data consent and unresolved sensitive-flow blocking remain unreviewed/incomplete. Explicit operator declarations now block affected registered optional work and generic grants. This support boundary does not implement the specialized legal workflow, determine applicability or complete legal review.

**Limits/open review:** A privacy policy alone does not replace APP 5 notice; applicability/exemptions and actual data flows must be checked.

**Code/test references:** [packages/notabenda/src/discovery.ts](../../packages/notabenda/src/discovery.ts), [packages/notabenda/src/scope-guards.ts](../../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/discovery.test.mjs](../../packages/notabenda/test/discovery.test.mjs), [docs/verification/discovery.md](../../docs/verification/discovery.md), [packages/notabenda/test/scope-guards.test.mjs](../../packages/notabenda/test/scope-guards.test.mjs)

<a id="req-nz-notice"></a>

### REQ-NZ-NOTICE — Direct-collection privacy statement

Explain collection, purposes, recipients, optionality/consequences, and access/correction rights.

**Applies when:** An agency collects personal information directly and the relevant Privacy Act principles apply.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [NZ OPC: what a privacy statement must cover](https://www.privacy.org.nz/resources-and-learning/knowledge-base/view/312/) — Privacy statement contents and Principle 3 (read; [SRC-NZ-STATEMENT](SOURCES.md#src-nz-statement)).

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-FORMS](../FEATURES.md#feat-forms).

<a id="verify-nz-notice"></a>

**VERIFY-NZ-NOTICE (partial):** An NZ collection notice provides the applicable facts before or with the collection flow and a usable rights route.

**Implementation boundary:** Declared document disclosures and a selected-purpose inline notice now share the inventory and pinned privacy revision. Actual surface timing, field-level mapping, complete applicable particulars, factual accuracy and legal review remain host work; regional support is partial.

**Limits/open review:** Exceptions and context affect timing and particulars.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/collection.ts](../../packages/notabenda/src/collection.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/test/config.test.mjs](../../packages/notabenda/test/config.test.mjs), [packages/notabenda/test/documents.test.mjs](../../packages/notabenda/test/documents.test.mjs), [packages/notabenda/test/collection.test.mjs](../../packages/notabenda/test/collection.test.mjs)

<a id="req-nz-indirect"></a>

### REQ-NZ-INDIRECT — Indirect-collection notification

Assess and provide applicable notification when information is collected from another source.

**Applies when:** An agency collects personal information indirectly under IPP3A, subject to exceptions.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [NZ OPC: indirect-collection notification](https://www.privacy.org.nz/resources-and-learning/a-z-topics/ipp3a/) — Requirements; reasonable steps; timing; collecting and holding agency; exceptions (read; [SRC-NZ-IPP3A](SOURCES.md#src-nz-ipp3a)); [NZ OPC: Principle 3A and reproduced principle text](https://www.privacy.org.nz/privacy-principles/3a/) — Reproduced IPP3A(1)-(7), especially particulars and timing in (1)-(2) (read; [SRC-NZ-IPP3A-PRINCIPLE](SOURCES.md#src-nz-ipp3a-principle)).

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-RIGHTS](../FEATURES.md#feat-rights).

<a id="verify-nz-indirect"></a>

**VERIFY-NZ-INDIRECT (automated):** Mechanism checks cover explicit notification particulars, advance/collected wording, exact selected categories, usable links, release integrity and no permission/delivery side effects. Host notification, exceptions and legal acceptance remain unverified.

**Timing:** IPP3A came into force on 1 May 2026.

**Implementation boundary:** Separate optional HTML/plain-text particulars pin an intact privacy release, full selected purpose facts, actual indirect category subsets and explicit source/recipient/law/access decisions. Advance/collected wording stays distinct. Hosts assess lawful collection, applicability, prior awareness, exceptions, timing and real notification; no delivery, consent or exemption evidence is created.

**Limits/open review:** Mechanism coverage only. No individual delivery/awareness or deadline workflow, sector-specific notice, lawful-collection determination or exception decision. Legal coverage remains unreviewed.

**Code/test references:** [packages/notabenda/src/indirect-collection.ts](../../packages/notabenda/src/indirect-collection.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/IndirectCollectionNotice.astro](../../packages/notabenda/src/astro/IndirectCollectionNotice.astro), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [examples/indirect-collection/build.mjs](../../examples/indirect-collection/build.mjs), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/test/indirect-collection.test.mjs](../../packages/notabenda/test/indirect-collection.test.mjs), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/indirect-collection.md](../../docs/verification/indirect-collection.md)

<a id="req-za-marketing"></a>

### REQ-ZA-MARKETING — Electronic direct-marketing permissions and objections

Assess consent or the qualifying customer exception for unsolicited electronic marketing and provide applicable refusal mechanisms.

**Applies when:** POPIA section 69 applies to electronic direct marketing.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [South Africa: POPIA direct-marketing guidance](https://inforegulator.org.za/wp-content/uploads/2020/07/GUIDANCE-NOTE-ON-DIRECT-MARKETING-IN-TERMS-OF-THE-PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013-POPIA.pdf) — Section 3.5: section 69 electronic marketing (read; [SRC-ZA-DM](SOURCES.md#src-za-dm)).

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-RIGHTS](../FEATURES.md#feat-rights).

<a id="verify-za-marketing"></a>

**VERIFY-ZA-MARKETING (planned):** A permission field records purpose/channel and text version; withdrawal reaches the application suppression hook.

**Limits/open review:** Do not authorize sending on a generic cookie choice; customer exceptions and prescribed consent requirements need review.

**Code/test references:** None yet; nothing implemented.

<a id="req-us-ca-choices"></a>

### REQ-US-CA-CHOICES — Sale/sharing opt-out and applicable privacy notices

Provide applicable notice and methods to opt out of sale/sharing; account for sensitive-information rights where applicable.

**Applies when:** The business and processing fall within CCPA/CPRA scope.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [California agency: consumer rights and 2026 regulation update](https://www.cppa.ca.gov/faq.html) — Consumer rights; business obligations (read; [SRC-US-CA](SOURCES.md#src-us-ca)); [California CCPA regulations effective 1 January 2026](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) — Section 7026: methods, status, cessation, downstream notifications and re-opt-in solicitation conditions (read; [SRC-US-CA-REGS-2026](SOURCES.md#src-us-ca-regs-2026)); [California Attorney General: CCPA consumer request methods](https://www.oag.ca.gov/privacy/ccpa) — Sections B–E: designated methods; account creation; verification distinctions (read; [SRC-US-CA-AG-RIGHTS](SOURCES.md#src-us-ca-ag-rights)).

**Discovery articles:** [SRC-IUB-US](SOURCES.md#src-iub-us).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-RIGHTS](../FEATURES.md#feat-rights).

<a id="verify-us-ca-choices"></a>

**VERIFY-US-CA-CHOICES (planned):** An applicable notice-at-collection route and sale/sharing control affect both browser and synthetic downstream processing.

**Implementation boundary:** Separate opt-out action and retained restrictions with exact privacy/wording references are implemented. This supplies one technical method and record only. Alternative methods, legal applicability, sensitive-information handling, associated identity contexts, cessation/propagation deadlines, notices and re-opt-in conditions remain unreviewed and incomplete.

**Limits/open review:** Thresholds, exceptions, definitions, and sensitive-information limits require detailed pack review; no blanket US opt-in rule.

**Code/test references:** [packages/notabenda-cf/src/processing.ts](../../packages/notabenda-cf/src/processing.ts), [packages/notabenda/src/rights-policy.ts](../../packages/notabenda/src/rights-policy.ts), [packages/notabenda/src/rights.ts](../../packages/notabenda/src/rights.ts), [packages/notabenda/test/processing.test.mjs](../../packages/notabenda/test/processing.test.mjs), [docs/verification/processing-choices-browser.md](../../docs/verification/processing-choices-browser.md), [packages/notabenda/test/rights.test.mjs](../../packages/notabenda/test/rights.test.mjs)

<a id="req-us-ca-gpc"></a>

### REQ-US-CA-GPC — Honor applicable opt-out preference signals

Process qualifying browser signals as applicable sale/sharing opt-outs.

**Applies when:** CCPA/CPRA applies and a qualifying preference signal is received.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [California agency: consumer rights and 2026 regulation update](https://www.cppa.ca.gov/faq.html) — Opt-out preference signals (read; [SRC-US-CA](SOURCES.md#src-us-ca)); [California CCPA regulations effective 1 January 2026](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) — §7025(b)–(c), pp. 44–48 (read; [SRC-US-CA-REGS-2026](SOURCES.md#src-us-ca-regs-2026)).

**Discovery articles:** [SRC-IUB-US](SOURCES.md#src-iub-us).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-us-ca-gpc"></a>

**VERIFY-US-CA-GPC (partial):** GPC applies before optional advertising starts, remains effective across reloads, and is not silently reversed by generic accept-all.

**Implementation boundary:** Declared browser/runtime restrictions, generic-accept precedence and lifecycle aborts are implemented. Known account/profile and downstream processing propagation, durable opt-out retention, applicability and legal review remain host work; no complete jurisdiction pack is claimed.

**Limits/open review:** Signal scope, conflict handling, and frictionless-mode details need regulation-level review.

**Code/test references:** [packages/notabenda/src/privacy-signals.ts](../../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/test/privacy-signals.test.mjs](../../packages/notabenda/test/privacy-signals.test.mjs)

<a id="req-us-ca-ui"></a>

### REQ-US-CA-UI — Symmetrical and understandable privacy choices

Avoid interfaces that subvert or impair privacy choices.

**Applies when:** CCPA request/consent interface requirements apply.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [California agency: avoiding dark patterns](https://www.cppa.ca.gov/announcements/2024/20240904.html) — Clear and balanced choices; symmetrical methods (read; [SRC-US-CA-UI](SOURCES.md#src-us-ca-ui)).

**Discovery articles:** [SRC-IUB-US](SOURCES.md#src-iub-us).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices).

<a id="verify-us-ca-ui"></a>

**VERIFY-US-CA-UI (planned):** All bundled layouts present readable, usable choices; opt-out is not hidden behind misleading text or extra persuasion.

**Limits/open review:** Legal analysis is contextual; automated contrast checks alone are insufficient.

**Code/test references:** None yet; nothing implemented.

<a id="req-us-co-gpc"></a>

### REQ-US-CO-GPC — Recognized universal opt-out mechanism

Honor recognized mechanisms for sale/targeted-advertising opt-outs and explain their processing.

**Applies when:** Colorado Privacy Act applies and the consumer uses a recognized mechanism.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Colorado AG: universal opt-out mechanisms](https://coag.gov/opt-out/) — Business obligations; GPC; privacy-policy explanation (read; [SRC-US-CO](SOURCES.md#src-us-co)).

**Discovery articles:** [SRC-IUB-US](SOURCES.md#src-iub-us).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents).

<a id="verify-us-co-gpc"></a>

**VERIFY-US-CO-GPC (partial):** The Colorado fixture honors GPC for sale and targeted advertising and includes the corresponding policy explanation.

**Timing:** GPC obligation identified from 1 July 2024.

**Implementation boundary:** Declared browser/runtime restrictions, generic-accept precedence and lifecycle aborts are implemented. Known account/profile and downstream processing propagation, durable opt-out retention, applicability and legal review remain host work; no complete jurisdiction pack is claimed.

**Limits/open review:** Recheck recognized mechanisms and applicability thresholds; this source is not a survey of all Colorado amendments.

**Code/test references:** [packages/notabenda/src/privacy-signals.ts](../../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/test/privacy-signals.test.mjs](../../packages/notabenda/test/privacy-signals.test.mjs)

<a id="req-us-ct-gpc"></a>

### REQ-US-CT-GPC — Preference signals override conflicting prior choices

Honor qualifying signals, including when they conflict with an earlier privacy choice.

**Applies when:** The controller is subject to CTDPA and receives a qualifying consumer signal.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Connecticut AG: CTDPA and opt-out signals](https://portal.ct.gov/en/ag/sections/privacy/the-connecticut-data-privacy-act) — Opt-out preference signal FAQs (read; [SRC-US-CT](SOURCES.md#src-us-ct)).

**Discovery articles:** [SRC-IUB-US](SOURCES.md#src-iub-us).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CHOICES](../FEATURES.md#feat-choices).

<a id="verify-us-ct-gpc"></a>

**VERIFY-US-CT-GPC (partial):** A stored advertising grant is restricted by the applicable signal before any loader runs.

**Timing:** Signal obligations identified from 1 January 2025.

**Implementation boundary:** Declared browser/runtime restrictions, generic-accept precedence and lifecycle aborts are implemented. Known account/profile and downstream processing propagation, durable opt-out retention, applicability and legal review remain host work; no complete jurisdiction pack is claimed.

**Limits/open review:** Residency determination and other statutory criteria require review; do not infer applicability solely from browser language.

**Code/test references:** [packages/notabenda/src/privacy-signals.ts](../../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/test/privacy-signals.test.mjs](../../packages/notabenda/test/privacy-signals.test.mjs)

<a id="req-us-va-rights"></a>

### REQ-US-VA-RIGHTS — Sensitive-data permission and rights appeals

Support applicable sensitive-data consent and a route to appeal a rights decision.

**Applies when:** Virginia VCDPA applies to the operator and activity.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Virginia AG: VCDPA summary](https://www.oag.state.va.us/consumer-protection/files/tips-and-info/Virginia-Consumer-Data-Protection-Act-Summary-2-2-23.pdf) — Sensitive data; appeal process (search-result; [SRC-US-VA](SOURCES.md#src-us-va)); [Virginia Code: Consumer Data Protection Act](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/) — §59.1-571 definitions; §59.1-578(A)(5); §59.1-577(C) (read; [SRC-US-VA-CODE](SOURCES.md#src-us-va-code)).

**Discovery articles:** [SRC-IUB-US](SOURCES.md#src-iub-us).

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-RIGHTS](../FEATURES.md#feat-rights), [FEAT-SCOPE-GUARDS](../FEATURES.md#feat-scope-guards).

<a id="verify-us-va-rights"></a>

**VERIFY-US-VA-RIGHTS (partial):** Sensitive processing cannot inherit a cookie-category grant; a rights denial can link to the configured appeal route.

**Implementation boundary:**  Explicit operator declarations now block affected registered optional work and generic grants. This support boundary does not implement the specialized legal workflow, determine applicability or complete legal review. A configurable appeal entry point now exists; it does not implement the appeal decision, timing or escalation workflow.

**Limits/open review:** The initial toolkit provides hooks/entry points; it does not adjudicate appeals or fully implement VCDPA workflows.

**Code/test references:** [packages/notabenda/src/scope-guards.ts](../../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/rights-policy.ts](../../packages/notabenda/src/rights-policy.ts), [packages/notabenda/src/rights.ts](../../packages/notabenda/src/rights.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/scope-guards.test.mjs](../../packages/notabenda/test/scope-guards.test.mjs), [packages/notabenda/test/rights.test.mjs](../../packages/notabenda/test/rights.test.mjs)

<a id="req-us-coppa-scope"></a>

### REQ-US-COPPA-SCOPE — Child-related processing requires a separate supported flow

Covered child-data flows may require verifiable parental consent, including separate third-party-disclosure consent.

**Applies when:** COPPA applies to a child-directed service or relevant actual-knowledge context.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [FTC: revised COPPA rule](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data) — Separate parental consent; retention (search-result; [SRC-US-COPPA](SOURCES.md#src-us-coppa)); [2025 COPPA final rule and compliance dates](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm) — Compliance date and amended rule (read; [SRC-US-COPPA-RULE](SOURCES.md#src-us-coppa-rule)).

**Features:** [FEAT-SCOPE-GUARDS](../FEATURES.md#feat-scope-guards), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-us-coppa-scope"></a>

**VERIFY-US-COPPA-SCOPE (partial):** A configuration declaring a covered child-related flow is flagged unsupported until a separately reviewed parental-consent integration exists.

**Timing:** Most amended-rule provisions had a compliance deadline of 22 April 2026; safe-harbor provisions differ.

**Implementation boundary:**  Explicit operator declarations now block affected registered optional work and generic grants. This support boundary does not implement the specialized legal workflow, determine applicability or complete legal review.

**Limits/open review:** Do not collect birth dates or identity documents merely to activate a generic banner; no COPPA support claim.

**Code/test references:** [packages/notabenda/src/scope-guards.ts](../../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/scope-guards.test.mjs](../../packages/notabenda/test/scope-guards.test.mjs)

<a id="req-tr-basis"></a>

### REQ-TR-BASIS — Separate legal basis and disclosure from explicit consent

Identify an applicable processing condition; do not substitute disclosure or a blanket checkbox for required explicit consent.

**Applies when:** Türkiye Law 6698 applies to the declared personal-data processing.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [KVKK: processing conditions](https://www.kvkk.gov.tr/Icerik/6607/Conditions-for-Processing-Personal-Data-) — Conditions for processing personal data (search-result; [SRC-TR-KVKK](SOURCES.md#src-tr-kvkk)); [KVKK: cookie-processing enforcement decision summary](https://www.kvkk.gov.tr/Icerik/7408/Summary-of-the-Board-Decision-on-the-processing-of-personal-data-by-the-data-controller-operating-in-e-commerce-sector-through-cookies-used-by-the-websites-mobile-applications-) — Cookie-processing decision summary (search-result; [SRC-TR-COOKIES](SOURCES.md#src-tr-cookies)).

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-tr-basis"></a>

**VERIFY-TR-BASIS (planned):** The configuration distinguishes disclosure from permission and refuses an unclassified optional processing purpose.

**Limits/open review:** Cookie and cross-border-transfer details need current Turkish-law review; the cited decision is case-specific.

**Code/test references:** None yet; nothing implemented.

<a id="req-eu-terms"></a>

### REQ-EU-TERMS — Consumer terms need an appropriate fairness profile

Use applicable consumer-contract protections when composing terms.

**Applies when:** The operator contracts with consumers under applicable EU/national consumer law.

**Type:** official-explanation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [European Commission: unfair contract terms](https://commission.europa.eu/law/law-topic/consumer-protection-law/consumer-contract-law/unfair-contract-terms-directive_en) — Unfair contract terms directive overview (read; [SRC-EU-CONTRACTS](SOURCES.md#src-eu-contracts)).

**Discovery articles:** [SRC-IUB-OVERVIEW](SOURCES.md#src-iub-overview).

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-INVENTORY](../FEATURES.md#feat-inventory).

<a id="verify-eu-terms"></a>

**VERIFY-EU-TERMS (partial):** Consumer mode cannot silently reuse an unchecked business-only limitation/waiver pack.

**Implementation boundary:** Supplied structured terms, audience/service classification and review checks exist. Version-bound acceptance/storage mechanics now exist under REQ-PRODUCT-TERMS-ACCEPTANCE. Consumer fairness, paid checkout, national applicability and enforceability review remain unimplemented.

**Limits/open review:** No generic terms pack establishes enforceability; sector and national review remain necessary.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/test/config.test.mjs](../../packages/notabenda/test/config.test.mjs)

<a id="req-eu-withdrawal"></a>

### REQ-EU-WITHDRAWAL — Online contract withdrawal function

Provide the applicable online withdrawal function, confirmation flow, and durable acknowledgment.

**Applies when:** A covered online distance contract carries a withdrawal right under the relevant national implementation.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Directive 2023/2673: online contract withdrawal function](https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32023L2673) — Article 2 inserting Article 11a; Article 3 application date (search-result; [SRC-EU-WITHDRAWAL](SOURCES.md#src-eu-withdrawal)).

**Discovery articles:** [SRC-IUB-WITHDRAWAL](SOURCES.md#src-iub-withdrawal).

**Features:** [FEAT-CONTRACT-ACTIONS](../FEATURES.md#feat-contract-actions), [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-eu-withdrawal"></a>

**VERIFY-EU-WITHDRAWAL (partial):** An eligible contract exposes an accessible action, collects the required statement details, confirms submission, and produces acknowledgment through the application's delivery channel.

**Timing:** Member States were to apply implementing measures from 19 June 2026.

**Implementation boundary:** Initial shared declaration/form/receipt and host dispatch mechanics only. Applicability, national/sector exceptions, prompt real delivery, original contract matching and fulfillment remain separate; no production regional pack is claimed.

**Limits/open review:** A directive needs national implementation checks; exceptions and the withdrawal window depend on the contract. Privacy withdrawal is a separate action.

**Code/test references:** [packages/notabenda/src/contract-action-policy.ts](../../packages/notabenda/src/contract-action-policy.ts), [packages/notabenda/src/contract-action.ts](../../packages/notabenda/src/contract-action.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/contract-action-policy.ts](../../packages/notabenda-cf/src/contract-action-policy.ts), [packages/notabenda-cf/src/contracts.ts](../../packages/notabenda-cf/src/contracts.ts), [packages/notabenda/test/contract-action.test.mjs](../../packages/notabenda/test/contract-action.test.mjs), [packages/notabenda-cf/test/contracts.test.mjs](../../packages/notabenda-cf/test/contracts.test.mjs), [docs/verification/contract-actions.md](../../docs/verification/contract-actions.md)

<a id="req-de-cancel"></a>

### REQ-DE-CANCEL — Cancellation button for qualifying continuing consumer contracts

Provide the prescribed cancellation entry, confirmation flow, and electronic confirmation for covered contracts.

**Applies when:** BGB section 312k applies to an online continuing paid consumer contract and no stated exclusion applies.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Germany BGB section 312k: cancellation](https://www.gesetze-im-internet.de/bgb/BJNR001950896.html#BJNR001950896BJNE030201160) — Section 312k(1)–(6): direct confirmation page, timing, savable declaration and electronic confirmation (read; [SRC-DE-CANCEL](SOURCES.md#src-de-cancel)).

**Discovery articles:** [SRC-IUB-TERMS](SOURCES.md#src-iub-terms).

**Features:** [FEAT-CONTRACT-ACTIONS](../FEATURES.md#feat-contract-actions), [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-de-cancel"></a>

**VERIFY-DE-CANCEL (partial):** A qualifying fixture exposes the cancellation route, confirmation step, saveable statement and durable electronic acknowledgment without sending a fake success.

**Implementation boundary:** Initial shared declaration/form/receipt and host dispatch mechanics only. Applicability, national/sector exceptions, prompt real delivery, original contract matching and fulfillment remain separate; no production regional pack is claimed.

**Limits/open review:** Review statutory exclusions and accessibility requirements; this is separate from withdrawal during a cooling-off period.

**Code/test references:** [packages/notabenda/src/contract-action-policy.ts](../../packages/notabenda/src/contract-action-policy.ts), [packages/notabenda/src/contract-action.ts](../../packages/notabenda/src/contract-action.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/contract-action-policy.ts](../../packages/notabenda-cf/src/contract-action-policy.ts), [packages/notabenda-cf/src/contracts.ts](../../packages/notabenda-cf/src/contracts.ts), [packages/notabenda/test/contract-action.test.mjs](../../packages/notabenda/test/contract-action.test.mjs), [packages/notabenda-cf/test/contracts.test.mjs](../../packages/notabenda-cf/test/contracts.test.mjs), [docs/verification/contract-actions.md](../../docs/verification/contract-actions.md)

<a id="req-de-withdrawal"></a>

### REQ-DE-WITHDRAWAL — German electronic withdrawal function

Support the section 356a withdrawal function for covered online distance contracts.

**Applies when:** The contract falls within the current BGB withdrawal-function requirements.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Germany BGB: electronic withdrawal function](https://www.gesetze-im-internet.de/bgb/BJNR001950896.html#BJNR001950896BJNE028702123) — Section 356a (read; [SRC-DE-WITHDRAW](SOURCES.md#src-de-withdraw)).

**Discovery articles:** [SRC-IUB-WITHDRAWAL](SOURCES.md#src-iub-withdrawal).

**Features:** [FEAT-CONTRACT-ACTIONS](../FEATURES.md#feat-contract-actions), [FEAT-TERMS](../FEATURES.md#feat-terms).

<a id="verify-de-withdrawal"></a>

**VERIFY-DE-WITHDRAWAL (partial):** The German fixture uses reviewed labels, required details, accessible entry during the applicable window, and the appropriate confirmation route.

**Timing:** Current consolidated section read on 18 October 2026; implementation transition and sector scope remain review tasks.

**Implementation boundary:** Initial shared declaration/form/receipt and host dispatch mechanics only. Applicability, national/sector exceptions, prompt real delivery, original contract matching and fulfillment remain separate; no production regional pack is claimed.

**Limits/open review:** Pack review must inspect the current consolidated section and related provisions before production support.

**Code/test references:** [packages/notabenda/src/contract-action-policy.ts](../../packages/notabenda/src/contract-action-policy.ts), [packages/notabenda/src/contract-action.ts](../../packages/notabenda/src/contract-action.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/contract-action-policy.ts](../../packages/notabenda-cf/src/contract-action-policy.ts), [packages/notabenda-cf/src/contracts.ts](../../packages/notabenda-cf/src/contracts.ts), [packages/notabenda/test/contract-action.test.mjs](../../packages/notabenda/test/contract-action.test.mjs), [packages/notabenda-cf/test/contracts.test.mjs](../../packages/notabenda-cf/test/contracts.test.mjs), [docs/verification/contract-actions.md](../../docs/verification/contract-actions.md)

<a id="req-br-contract"></a>

### REQ-BR-CONTRACT — Consumer right of regret for qualifying distance contracts

Represent the applicable seven-day right of regret and a usable exercise route.

**Applies when:** Consumer Defence Code article 49 applies to the transaction.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Brazil Consumer Defence Code](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm) — Article 49 (read; [SRC-BR-CONSUMER](SOURCES.md#src-br-consumer)); [Brazil Decree 7,962/2013: electronic consumer contracts](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm) — Article 5(1), (3), (4): same-tool route, financial notification and immediate acknowledgement (read; [SRC-BR-ECOMMERCE](SOURCES.md#src-br-ecommerce)).

**Discovery articles:** [SRC-IUB-TERMS](SOURCES.md#src-iub-terms).

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-CONTRACT-ACTIONS](../FEATURES.md#feat-contract-actions).

<a id="verify-br-contract"></a>

**VERIFY-BR-CONTRACT (partial):** An applicable Brazilian terms profile includes the reviewed right and links to a usable contract request route.

**Implementation boundary:** Initial shared declaration/form/receipt and host dispatch mechanics only. Applicability, national/sector exceptions, prompt real delivery, original contract matching and fulfillment remain separate; no production regional pack is claimed.

**Limits/open review:** Trigger, start date, exceptions, refunds, and sector rules require review; do not apply a universal EU window.

**Code/test references:** [packages/notabenda/src/contract-action-policy.ts](../../packages/notabenda/src/contract-action-policy.ts), [packages/notabenda/src/contract-action.ts](../../packages/notabenda/src/contract-action.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/contract-action-policy.ts](../../packages/notabenda-cf/src/contract-action-policy.ts), [packages/notabenda-cf/src/contracts.ts](../../packages/notabenda-cf/src/contracts.ts), [packages/notabenda/test/contract-action.test.mjs](../../packages/notabenda/test/contract-action.test.mjs), [packages/notabenda-cf/test/contracts.test.mjs](../../packages/notabenda-cf/test/contracts.test.mjs), [docs/verification/contract-actions.md](../../docs/verification/contract-actions.md)

<a id="req-google-mode"></a>

### REQ-GOOGLE-MODE — Consent Mode does not itself block all traffic

Distinguish Basic tag blocking from Advanced mode's possible cookieless pings.

**Applies when:** The site opts into the Google adapter.

**Type:** platform-policy. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Google Consent Mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode) — Basic and advanced consent mode; consent types (read; [SRC-GOOGLE-CONSENT](SOURCES.md#src-google-consent)); [Google consent mode implementation guide](https://developers.google.com/tag-platform/security/guides/consent) — Default consent before measurement commands; gtag.js and GTM APIs (read; [SRC-GOOGLE-CONSENT-SETUP](SOURCES.md#src-google-consent-setup)); [Google tag privacy controls and Analytics disable flag](https://developers.google.com/tag-platform/security/guides/privacy) — Turn off Google Analytics; turn off default page view measurement (read; [SRC-GOOGLE-PRIVACY-CONTROLS](SOURCES.md#src-google-privacy-controls)).

**Features:** [FEAT-GOOGLE](../FEATURES.md#feat-google), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-google-mode"></a>

**VERIFY-GOOGLE-MODE (automated):** The default DOM loader attempts no Google request before grant or after initial refusal; explicit four-signal product gates and defaults precede initialization. Required receipts, GPC, late loads, reentrant changes and withdrawal remain restrictive. Already attempted tags require a terminal full-document reset. Local simulator/interception results are not vendor behavior or certification.

**Implementation boundary:** Optional Basic adapter validates explicit product-specific four-signal mappings, binds IDs/mappings into material scope, and gates a single owned Google service on effective permission, receipts and processing restrictions. Browser loader interception verifies initial silence/ordering; late/reentrant loads and synchronous terminal withdrawal are covered. Public local simulator and docs distinguish adapter tests from real vendor/browser acceptance. Post-load network silence, GTM/TCF/certification, connected-account settings and wider platform acceptance are not established.

**Limits/open review:** Google platform behavior does not establish the legal validity of a processing purpose. All-declared-purpose gating is conservative. GA4 disable flags are not a universal Ads kill switch; already loaded code and denied updates may still send traffic until a full document reset.

**Code/test references:** [packages/notabenda/src/google-basic.ts](../../packages/notabenda/src/google-basic.ts), [packages/notabenda/src/google-basic-policy.ts](../../packages/notabenda/src/google-basic-policy.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [examples/google-basic/build.mjs](../../examples/google-basic/build.mjs), [examples/google-basic/client.mjs](../../examples/google-basic/client.mjs), [packages/notabenda/test/google-basic.test.mjs](../../packages/notabenda/test/google-basic.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/google-basic.test.mjs](../../site/test/google-basic.test.mjs), [docs/verification/google-basic.md](../../docs/verification/google-basic.md)

<a id="req-google-cmp"></a>

### REQ-GOOGLE-CMP — Publisher certification is a distinct requirement

A Consent Mode adapter is not a certified TCF CMP.

**Applies when:** Serving personalized ads in Google's covered publisher-product regions.

**Type:** platform-policy. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [Google publisher CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en) — Certified CMP and TCF requirements (read; [SRC-GOOGLE-CMP](SOURCES.md#src-google-cmp)); [IAB Europe TCF](https://iabeurope.eu/transparency-consent-framework/) — Current TCF version and participation (read; [SRC-IAB-TCF](SOURCES.md#src-iab-tcf)).

**Features:** [FEAT-AD-CMP](../FEATURES.md#feat-ad-cmp).

<a id="verify-google-cmp"></a>

**VERIFY-GOOGLE-CMP (planned):** Documentation rejects the equivalence between a working adapter and Google CMP certification; no unregistered CMP identity is emitted.

**Limits/open review:** Recheck platform policies and current specifications before implementing the deferred CMP project.

**Code/test references:** None yet; nothing implemented.

<a id="req-product-a11y"></a>

### REQ-PRODUCT-A11Y — Accessible controls across themes

Use WCAG 2.2 AA as the product's accessibility target.

**Applies when:** Any built-in widget or integration example is shipped.

**Type:** product-standard. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — Keyboard, contrast, focus, labels, reflow, target size (read; [SRC-WCAG](SOURCES.md#src-wcag)); [W3C ARIA in HTML: roles and author naming](https://www.w3.org/TR/html-aria/) — Maintainer audit: naming, labels, contrast, supported environments and explicit incomplete results. (read; [SRC-W3C-ARIA-HTML](SOURCES.md#src-w3c-aria-html)); [axe-core: rules and supported environments](https://github.com/dequelabs/axe-core/blob/develop/README.md) — Maintainer audit: naming, labels, contrast, supported environments and explicit incomplete results. (read; [SRC-AXE-CORE](SOURCES.md#src-axe-core)); [W3C: understanding minimum text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — Maintainer audit: naming, labels, contrast, supported environments and explicit incomplete results. (read; [SRC-WCAG-CONTRAST](SOURCES.md#src-wcag-contrast)); [W3C: understanding Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) — Maintainer audit: naming, labels, contrast, supported environments and explicit incomplete results. (read; [SRC-WCAG-LABEL-NAME](SOURCES.md#src-wcag-label-name)).

**Discovery articles:** [SRC-LINEAR-DESIGN-2026](SOURCES.md#src-linear-design-2026).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-a11y"></a>

**VERIFY-PRODUCT-A11Y (partial):** Keyboard, focus, screen-reader, contrast, zoom, mobile and RTL checks run against each built-in theme. Current-page semantic scans and actual mounted/synthetic-operator fixtures retain environment exclusions and incomplete results. Native Chromium runs check contrast and visible labels at desktop/mobile widths; stale audit results cannot credit another scenario, and comparison/raw blocks remain keyboard reachable. These checks extend partial evidence rather than establish full acceptance.

**Implementation boundary:** Document semantics and initial native-dialog focus/Escape checks are implemented. Full WCAG, screen-reader, contrast, zoom and platform audit remains pending. Native entry relationships, separately named purpose controls and focus recovery for disappearing retry/notice controls are covered through both consent factories; broad accessibility acceptance remains pending. Shared defaults now use neutral surfaces, restrained navigation, compact operator headings/record rows, consistent small corners and deliberate light/dark permission controls. Real browser checks retain equal accept/reject actions, mobile setup targets and no horizontal overflow on inspected families. Full accessibility certification and untested platforms remain open. Long headings/Close labels now wrap, action columns adapt to text size, and logical side placement mirrors RTL. Whole-dialog scrolling is the safe fallback; measured resize observation retains fixed chrome only with a useful text-relative body viewport, preserves draft/focus and disconnects on teardown. Repeatable local fixtures and initial Chromium width/short-screen/large-text/RTL/no-observer checks extend evidence; actual browser zoom and broader platform/assistive-technology acceptance remain open. A pinned maintainer semantic audit now covers current static pages, with real mounted controls and synthetic operator renderers in regression tests. Desktop/mobile Chromium audit fixtures include actual dialog/error/setup states and expanded record/diff views; run IDs, request IDs and URL matching reject stale results. Skip targets, headings, named code groups, visible-label/name mismatches, shared secondary text contrast and keyboard-scrollable diff/raw record blocks are corrected. JSDOM excludes contrast and canvas/layout-dependent label checks; browser results retain incompletes. Full platform/assistive-technology acceptance remains pending.

**Limits/open review:** This is an engineering standard, not a claim of blanket legal compliance or certification.

**Code/test references:** [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [docs/DESIGN.md](../../docs/DESIGN.md), [examples/static/choices-page.mjs](../../examples/static/choices-page.mjs), [examples/static/choices-page.css](../../examples/static/choices-page.css), [site/examples-page.mjs](../../site/examples-page.mjs), [site/style.css](../../site/style.css), [examples/static/example-design.mjs](../../examples/static/example-design.mjs), [examples/static/example-pages.css](../../examples/static/example-pages.css), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [packages/notabenda-cf/src/presentation.ts](../../packages/notabenda-cf/src/presentation.ts), [site/admin-presentation.mjs](../../site/admin-presentation.mjs), [site/build.mjs](../../site/build.mjs), [packages/notabenda/src/services.css](../../packages/notabenda/src/services.css), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [site/demo-admin.css](../../site/demo-admin.css), [site/syntax.mjs](../../site/syntax.mjs), [examples/static/example-theme.css](../../examples/static/example-theme.css), [examples/discovery/style.css](../../examples/discovery/style.css), [examples/form-permissions/style.css](../../examples/form-permissions/style.css), [examples/contract-actions/style.css](../../examples/contract-actions/style.css), [scripts/build-controls-layout.mjs](../../scripts/build-controls-layout.mjs), [scripts/accessibility-audit.mjs](../../scripts/accessibility-audit.mjs), [scripts/audit-accessibility.mjs](../../scripts/audit-accessibility.mjs), [scripts/accessibility-fixtures.mjs](../../scripts/accessibility-fixtures.mjs), [scripts/build-accessibility-fixture.mjs](../../scripts/build-accessibility-fixture.mjs), [scripts/accessibility-browser-app.mjs](../../scripts/accessibility-browser-app.mjs), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [examples/google-basic/build.mjs](../../examples/google-basic/build.mjs), [scripts/serve-accessibility.mjs](../../scripts/serve-accessibility.mjs), [packages/notabenda/test/documents.test.mjs](../../packages/notabenda/test/documents.test.mjs), [docs/verification/consent-browser.md](../../docs/verification/consent-browser.md), [docs/verification/terms-browser.md](../../docs/verification/terms-browser.md), [docs/verification/website-browser.md](../../docs/verification/website-browser.md), [docs/verification/design-pass.md](../../docs/verification/design-pass.md), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/ux-review.md](../../docs/verification/ux-review.md), [site/test/guide-navigation.test.mjs](../../site/test/guide-navigation.test.mjs), [packages/notabenda/test/controls.test.mjs](../../packages/notabenda/test/controls.test.mjs), [packages/notabenda/test/consent-delivery.test.mjs](../../packages/notabenda/test/consent-delivery.test.mjs), [docs/verification/consent-focus.md](../../docs/verification/consent-focus.md), [packages/notabenda/test/controls-layout.test.mjs](../../packages/notabenda/test/controls-layout.test.mjs), [docs/verification/controls-layout.md](../../docs/verification/controls-layout.md), [site/test/accessibility.test.mjs](../../site/test/accessibility.test.mjs), [site/test/accessibility-fixture.test.mjs](../../site/test/accessibility-fixture.test.mjs), [site/test/syntax.test.mjs](../../site/test/syntax.test.mjs), [docs/verification/accessibility.md](../../docs/verification/accessibility.md)

<a id="req-product-mobile"></a>

### REQ-PRODUCT-MOBILE — Visible permission request without intrusive mobile takeover

Default to a compact bottom notice and user-opened drawer, preserving clear choices and page usability.

**Applies when:** Any built-in mobile consent surface is shipped.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Discovery articles:** [SRC-LINEAR-DESIGN-2026](SOURCES.md#src-linear-design-2026).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-mobile"></a>

**VERIFY-PRODUCT-MOBILE (partial):** At 320/360/390/430px widths and short landscape heights, the initial notice remains nonmodal and readable; all choices work by tap/keyboard; a deliberate action opens the drawer; dismissal grants nothing; safe areas, keyboard, long text, zoom and reduced motion preserve access.

**Implementation boundary:** Nonmodal initial notice and deliberately opened native drawer implemented. Initial Chromium phone-width checks recorded; full platform, zoom, assistive technology and device matrix remains pending. Native entry relationships, separately named purpose controls and focus recovery for disappearing retry/notice controls are covered through both consent factories; broad accessibility acceptance remains pending. Shared defaults now use neutral surfaces, restrained navigation, compact operator headings/record rows, consistent small corners and deliberate light/dark permission controls. Real browser checks retain equal accept/reject actions, mobile setup targets and no horizontal overflow on inspected families. Full accessibility certification and untested platforms remain open. Long headings/Close labels now wrap, action columns adapt to text size, and logical side placement mirrors RTL. Whole-dialog scrolling is the safe fallback; measured resize observation retains fixed chrome only with a useful text-relative body viewport, preserves draft/focus and disconnects on teardown. Repeatable local fixtures and initial Chromium width/short-screen/large-text/RTL/no-observer checks extend evidence; actual browser zoom and broader platform/assistive-technology acceptance remain open.

**Limits/open review:** Voluntary project UX requirement, not a claim that a law mandates drawers. Never clip or hide required choices to meet a height target.

**Code/test references:** [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [docs/DESIGN.md](../../docs/DESIGN.md), [examples/static/choices-page.mjs](../../examples/static/choices-page.mjs), [examples/static/choices-page.css](../../examples/static/choices-page.css), [site/examples-page.mjs](../../site/examples-page.mjs), [site/style.css](../../site/style.css), [examples/static/example-design.mjs](../../examples/static/example-design.mjs), [examples/static/example-pages.css](../../examples/static/example-pages.css), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [packages/notabenda-cf/src/presentation.ts](../../packages/notabenda-cf/src/presentation.ts), [site/admin-presentation.mjs](../../site/admin-presentation.mjs), [site/build.mjs](../../site/build.mjs), [packages/notabenda/src/services.css](../../packages/notabenda/src/services.css), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [site/demo-admin.css](../../site/demo-admin.css), [site/syntax.mjs](../../site/syntax.mjs), [examples/static/example-theme.css](../../examples/static/example-theme.css), [examples/discovery/style.css](../../examples/discovery/style.css), [examples/form-permissions/style.css](../../examples/form-permissions/style.css), [examples/contract-actions/style.css](../../examples/contract-actions/style.css), [scripts/build-controls-layout.mjs](../../scripts/build-controls-layout.mjs), [docs/verification/consent-browser.md](../../docs/verification/consent-browser.md), [docs/verification/terms-browser.md](../../docs/verification/terms-browser.md), [docs/verification/website-browser.md](../../docs/verification/website-browser.md), [docs/verification/design-pass.md](../../docs/verification/design-pass.md), [docs/verification/ux-review.md](../../docs/verification/ux-review.md), [site/test/guide-navigation.test.mjs](../../site/test/guide-navigation.test.mjs), [packages/notabenda/test/controls.test.mjs](../../packages/notabenda/test/controls.test.mjs), [packages/notabenda/test/consent-delivery.test.mjs](../../packages/notabenda/test/consent-delivery.test.mjs), [docs/verification/consent-focus.md](../../docs/verification/consent-focus.md), [packages/notabenda/test/controls-layout.test.mjs](../../packages/notabenda/test/controls-layout.test.mjs), [docs/verification/controls-layout.md](../../docs/verification/controls-layout.md), [docs/verification/accessibility.md](../../docs/verification/accessibility.md)

<a id="req-product-config"></a>

### REQ-PRODUCT-CONFIG — Typed, validated site facts and public projection

Validate declared site facts, stable references, and public output boundaries.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-config"></a>

**VERIFY-PRODUCT-CONFIG (automated):** Malformed input and broken references yield diagnostics; private/unknown nested fields never enter public output. File-based check/build/imports reject misspelled keys with value-free paths before output; valid authored sources retain semantic and review checks.

**Implementation boundary:** File-authoring commands and the Node reader enforce the installed field schema before semantic/review checks. The optional plain-data validator and assessment share shape diagnostics. Programmatic semantic validation/public projection retains its existing host-object contract.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-compile.ts](../../packages/notabenda/src/consent-compile.ts), [packages/notabenda/src/setup-purpose.ts](../../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/src/setup-purpose-ui.ts](../../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-purpose-cli.ts](../../packages/notabenda/src/setup-purpose-cli.ts), [packages/notabenda/src/config-authoring.ts](../../packages/notabenda/src/config-authoring.ts), [packages/notabenda/test/config.test.mjs](../../packages/notabenda/test/config.test.mjs), [packages/notabenda/test/consent-runtime.test.mjs](../../packages/notabenda/test/consent-runtime.test.mjs), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs), [packages/notabenda/test/config-authoring.test.mjs](../../packages/notabenda/test/config-authoring.test.mjs)

<a id="req-product-config-sources"></a>

### REQ-PRODUCT-CONFIG-SOURCES — YAML and Markdown-frontmatter site configuration

Accept JSON, YAML and complete SiteConfig frontmatter in Markdown through the CLI, browser setup and Node reader, preserving one semantic model and keeping body notes outside public releases and saved setup drafts.

**Applies when:** An operator maintains site facts in a local configuration source.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [yaml package parsing and document API](https://eemeli.org/yaml/) — YAML 1.2 core schema, document errors, visitors and aliases (read; [SRC-YAML-API](SOURCES.md#src-yaml-api)).

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-config-sources"></a>

**VERIFY-PRODUCT-CONFIG-SOURCES (automated):** Equivalent inputs preserve public output and release identity; notes never render; invalid YAML and unsafe file inputs fail clearly; all config-consuming CLI paths use the loader, and packed/browser boundaries hold. Browser import/export and CLI output choices preserve data, exclude private source notes and keep agent filenames consistent; stale work cannot revive output.

**Implementation boundary:** An optional universal ESM codec powers browser and Node parsing/formatting. Browser imports enforce the shared authoring checks and new draft downloads select JSON/YAML/Markdown, with stale-job invalidation, private-note exclusion and matching agent filenames. The CLI wizard has the same explicit output-format choice. Saved tab drafts retain only the format enum alongside their existing public configuration and questionnaire. CLI build can explicitly emit the bounded local/required descriptor and consent-only CSS from any supported configuration format. An output directory with an existing descriptor requires an explicit mode on rebuild; host lifecycle and receipt connections remain separate.

**Limits/open review:** Bounded UTF-8 input only. Node file readers refuse symlinks/special files. No code evaluation, includes, environment expansion or automatic source archival. Reports remain JSON; policy MD/MDX bodies use the separate authoring package. Browser/CLI JSON output remains the default; format choice changes no runtime permissions.

**Code/test references:** [packages/notabenda/src/config-source.ts](../../packages/notabenda/src/config-source.ts), [packages/notabenda/src/config-yaml.ts](../../packages/notabenda/src/config-yaml.ts), [packages/notabenda/src/cli-json.ts](../../packages/notabenda/src/cli-json.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/discovery-cli.ts](../../packages/notabenda/src/discovery-cli.ts), [packages/notabenda/src/catalog-review-cli.ts](../../packages/notabenda/src/catalog-review-cli.ts), [packages/notabenda/scripts/copy-assets.mjs](../../packages/notabenda/scripts/copy-assets.mjs), [scripts/check-package-release.mjs](../../scripts/check-package-release.mjs), [docs/CONFIGURATION-SOURCES.md](../../docs/CONFIGURATION-SOURCES.md), [skills/notabenda/SKILL.md](../../skills/notabenda/SKILL.md), [examples/configuration/notabenda.config.yaml](../../examples/configuration/notabenda.config.yaml), [examples/configuration/notabenda.config.md](../../examples/configuration/notabenda.config.md), [site/build.mjs](../../site/build.mjs), [packages/notabenda/src/config-authoring.ts](../../packages/notabenda/src/config-authoring.ts), [packages/notabenda/src/config-document.ts](../../packages/notabenda/src/config-document.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/pack-session.ts](../../packages/notabenda/src/pack-session.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [examples/setup/build.mjs](../../examples/setup/build.mjs), [site/website-notice.mjs](../../site/website-notice.mjs), [packages/notabenda/test/config-sources.test.mjs](../../packages/notabenda/test/config-sources.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/configuration-sources.md](../../docs/verification/configuration-sources.md), [packages/notabenda/test/config-authoring.test.mjs](../../packages/notabenda/test/config-authoring.test.mjs), [packages/notabenda/test/config-browser.test.mjs](../../packages/notabenda/test/config-browser.test.mjs), [site/test/config-browser.test.mjs](../../site/test/config-browser.test.mjs), [packages/notabenda/test/consent-build-cli.test.mjs](../../packages/notabenda/test/consent-build-cli.test.mjs)

<a id="req-product-documents"></a>

### REQ-PRODUCT-DOCUMENTS — Static privacy, cookie, and supplied terms pages

Render versioned, safely structured documents with visible drafts and production review checks.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-TERMS](../FEATURES.md#feat-terms).

<a id="verify-product-documents"></a>

**VERIFY-PRODUCT-DOCUMENTS (automated):** All three no-JS document outputs render declared/supplied content, navigation and version metadata; production rejects drafts/placeholders and generated terms.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/test/documents.test.mjs](../../packages/notabenda/test/documents.test.mjs), [packages/notabenda/test/config.test.mjs](../../packages/notabenda/test/config.test.mjs), [packages/notabenda/test/cli.test.mjs](../../packages/notabenda/test/cli.test.mjs)

<a id="req-product-safe-content"></a>

### REQ-PRODUCT-SAFE-CONTENT — Safe content, links, routes, and output writing

Escape supplied text and reject unsafe links, inconsistent fields, traversal routes, and symbolic-link output destinations.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-safe-content"></a>

**VERIFY-PRODUCT-SAFE-CONTENT (automated):** Hostile content is inert; unsafe mailto/site links, malformed optional text, unsafe paths, and symlink destinations fail without leaking private metadata or replacing their targets.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/files.ts](../../packages/notabenda/src/files.ts), [packages/notabenda/test/config.test.mjs](../../packages/notabenda/test/config.test.mjs), [packages/notabenda/test/documents.test.mjs](../../packages/notabenda/test/documents.test.mjs), [packages/notabenda/test/content.test.mjs](../../packages/notabenda/test/content.test.mjs), [packages/notabenda/test/cli.test.mjs](../../packages/notabenda/test/cli.test.mjs)

<a id="req-product-artifacts"></a>

### REQ-PRODUCT-ARTIFACTS — Portable content-addressed legal releases

Retain deterministic public configuration, exact HTML, and structured content with versioned hashes.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-product-artifacts"></a>

**VERIFY-PRODUCT-ARTIFACTS (automated):** Publicly identical input has stable hashes; content changes create distinct artifacts, including cookie-table changes; exact pages and structured models remain retrievable.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/catalog-release.ts](../../packages/notabenda/src/catalog-release.ts), [packages/notabenda/test/content.test.mjs](../../packages/notabenda/test/content.test.mjs), [packages/notabenda/test/cli.test.mjs](../../packages/notabenda/test/cli.test.mjs), [packages/notabenda/test/history-integration.test.mjs](../../packages/notabenda/test/history-integration.test.mjs), [packages/notabenda/test/catalog-release.test.mjs](../../packages/notabenda/test/catalog-release.test.mjs), [docs/verification/catalog-release.md](../../docs/verification/catalog-release.md), [site/test/host.test.mjs](../../site/test/host.test.mjs)

<a id="req-product-package"></a>

### REQ-PRODUCT-PACKAGE — Installable npm API, CLI, types, styles, and Apache license

Pack @notabenda/core, @notabenda/cloudflare and @notabenda/authoring with usable scoped exports, local CLI binaries, types and optional styles. Preserve retained protocol identifiers; no npm publication is performed.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-package"></a>

**VERIFY-PRODUCT-PACKAGE (automated):** A packed tarball installs offline and exposes usable API/CLI/types/styles/license; its browser dependency graph excludes Node and framework imports.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/package.json](../../packages/notabenda/package.json), [packages/notabenda/src/headless.ts](../../packages/notabenda/src/headless.ts), [packages/notabenda/scripts/consent-styles.mjs](../../packages/notabenda/scripts/consent-styles.mjs), [scripts/measure-bundles.mjs](../../scripts/measure-bundles.mjs), [packages/notabenda-cf/package.json](../../packages/notabenda-cf/package.json), [packages/notabenda-authoring/package.json](../../packages/notabenda-authoring/package.json), [packages/notabenda-cf/bin/notabenda-cf.mjs](../../packages/notabenda-cf/bin/notabenda-cf.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [packages/notabenda/test/cli.test.mjs](../../packages/notabenda/test/cli.test.mjs), [packages/notabenda/test/delivery.test.mjs](../../packages/notabenda/test/delivery.test.mjs), [site/test/delivery.test.mjs](../../site/test/delivery.test.mjs), [packages/notabenda-authoring/test/package.test.mjs](../../packages/notabenda-authoring/test/package.test.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs)

<a id="req-product-cf-admin"></a>

### REQ-PRODUCT-CF-ADMIN — Scoped backoffice with host-owned authorization

Require host authorization and present bounded, searchable stored evidence without executing payloads.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-cf-admin"></a>

**VERIFY-PRODUCT-CF-ADMIN (automated):** Missing/denied/failed authorization never reads data; scope isolation, bounded scanning, search, safe details and sanitized errors pass simulated Worker/DO tests.

<a id="verify-product-recorded-cookie-application"></a>

**VERIFY-PRODUCT-RECORDED-COOKIE-APPLICATION (automated):** Separate example application preserves denying auth defaults and fixed notice registration/activation; HTTP and bundled-client DOM tests cover request bounds, host-derived stream preconditions, RPC errors, outages, lost committed response, reload, withdrawal and identity changes. Optional real local SQLite runner verifies actual RPC/persistence, registration-only refusal, canonical operator aliases, exact current/pinned notice/legal bytes and restart. Manual real-browser observations remain separately scoped; no production identity or deployment acceptance claim.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/store.ts](../../packages/notabenda-cf/src/store.ts), [packages/notabenda-cf/src/types.ts](../../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/src/export.ts](../../packages/notabenda-cf/src/export.ts), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [packages/notabenda-cf/src/presentation.ts](../../packages/notabenda-cf/src/presentation.ts), [site/admin-presentation.mjs](../../site/admin-presentation.mjs), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda-cf/src/order-render.ts](../../packages/notabenda-cf/src/order-render.ts), [packages/notabenda-cf/src/order-admin-style.ts](../../packages/notabenda-cf/src/order-admin-style.ts), [examples/recorded-cookies/host.mjs](../../examples/recorded-cookies/host.mjs), [examples/recorded-cookies/workspace.mjs](../../examples/recorded-cookies/workspace.mjs), [examples/recorded-cookies/worker.mjs](../../examples/recorded-cookies/worker.mjs), [examples/recorded-cookies/README.md](../../examples/recorded-cookies/README.md), [packages/notabenda-cf/test/admin.test.mjs](../../packages/notabenda-cf/test/admin.test.mjs), [packages/notabenda-cf/test/export.test.mjs](../../packages/notabenda-cf/test/export.test.mjs), [packages/notabenda-cf/test/orders.test.mjs](../../packages/notabenda-cf/test/orders.test.mjs), [packages/notabenda-cf/test/recorded-cookie-application.test.mjs](../../packages/notabenda-cf/test/recorded-cookie-application.test.mjs), [scripts/check-recorded-cookie-runtime.mjs](../../scripts/check-recorded-cookie-runtime.mjs), [docs/verification/recorded-cookie-application.md](../../docs/verification/recorded-cookie-application.md)

<a id="req-product-cf-history"></a>

### REQ-PRODUCT-CF-HISTORY — Immutable release archive and readable diffs

Archive exact legal-document releases transactionally and compare versions within an authorized site/store.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENT-HISTORY](../FEATURES.md#feat-document-history), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-product-cf-history"></a>

**VERIFY-PRODUCT-CF-HISTORY (automated):** Repeated recording is idempotent, conflicts/tampering fail, exact history is retained, and actual core-generated privacy/cookie/terms artifacts can be compared safely.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda-cf/src/history.ts](../../packages/notabenda-cf/src/history.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/catalog-release.ts](../../packages/notabenda/src/catalog-release.ts), [packages/notabenda/src/catalog-release-policy.ts](../../packages/notabenda/src/catalog-release-policy.ts), [packages/notabenda-cf/src/catalog-release-policy.ts](../../packages/notabenda-cf/src/catalog-release-policy.ts), [packages/notabenda-cf/src/catalog-render.ts](../../packages/notabenda-cf/src/catalog-render.ts), [examples/catalog-releases/build.mjs](../../examples/catalog-releases/build.mjs), [packages/notabenda-cf/test/admin.test.mjs](../../packages/notabenda-cf/test/admin.test.mjs), [packages/notabenda/test/history-integration.test.mjs](../../packages/notabenda/test/history-integration.test.mjs), [packages/notabenda/test/catalog-release.test.mjs](../../packages/notabenda/test/catalog-release.test.mjs), [docs/verification/catalog-release.md](../../docs/verification/catalog-release.md), [site/test/host.test.mjs](../../site/test/host.test.mjs)

<a id="req-product-consent-runtime"></a>

### REQ-PRODUCT-CONSENT-RUNTIME — Conservative local choice state and cooperative service lifecycle

Keep registered optional work blocked until explicit current local permission, retire revoked starts, and keep prompt dismissal separate from permission.

**Applies when:** The local consent controller is used with cooperative service adapters.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-CHOICES](../FEATURES.md#feat-choices), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-product-consent-runtime"></a>

**VERIFY-PRODUCT-CONSENT-RUNTIME (automated):** Real controller tests exercise all-purpose gating, material scope, refusal persistence, malformed/unavailable storage, expiry/resume, cross-tab refresh, failed-grant dismissal, permanently retired async starts, cleanup failures, destruction, and snapshot isolation.

**Implementation boundary:** CLI build can explicitly emit the bounded local/required descriptor and consent-only CSS from any supported configuration format. An output directory with an existing descriptor requires an explicit mode on rebuild; host lifecycle and receipt connections remain separate.

**Limits/open review:** Local-only state is untrusted and is not durable consent evidence, automatic arbitrary-script blocking, or a supported regional rule pack. Browser suspension and host adapter behavior bound enforcement.

**Code/test references:** [packages/notabenda/src/consent.ts](../../packages/notabenda/src/consent.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-runtime.ts](../../packages/notabenda/src/consent-runtime.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/test/consent.test.mjs](../../packages/notabenda/test/consent.test.mjs), [packages/notabenda/test/consent-runtime.test.mjs](../../packages/notabenda/test/consent-runtime.test.mjs), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs), [packages/notabenda/test/consent-build-cli.test.mjs](../../packages/notabenda/test/consent-build-cli.test.mjs)

<a id="req-eu-order-action"></a>

### REQ-EU-ORDER-ACTION — Paid electronic orders need a clear payment action and required information

For applicable paid electronic distance contracts, present the required pre-order information and an unambiguous payment-obligation action. Contract confirmation on a durable medium is a separate requirement.

**Applies when:** An electronic distance contract with a consumer creates a payment obligation within the Directive and applicable national implementing law.

**Type:** primary-law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Consumer Rights Directive 2011/83/EU, consolidated 27 September 2026](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011L0083-20260927) — Current Article 8(2): Article 6(1)(a), (e), (la), (o), (p); Article 8(7) confirmation (read; [SRC-EU-CRD-20260927](SOURCES.md#src-eu-crd-20260927)); [CJEU C-400/22 Conny judgment](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A62022CJ0400) — Paragraphs 44–56 and operative part: conditional payment obligations (read; [SRC-EU-ORDER-CONNY](SOURCES.md#src-eu-order-conny)); [CJEU C-249/21 Fuhrmann-2 judgment](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62021CJ0249) — Indexed primary paragraphs 28/34: button wording itself; complete judgment retrieval remains open (search-result; [SRC-EU-ORDER-FUHRMANN](SOURCES.md#src-eu-order-fuhrmann)).

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-CONTRACT-ACTIONS](../FEATURES.md#feat-contract-actions), [FEAT-PAID-ORDERS](../FEATURES.md#feat-paid-orders).

<a id="verify-eu-order-action"></a>

**VERIFY-EU-ORDER-ACTION (partial):** Verify exact mixed/deferred/recurring/conditional facts and payment action, readiness/recovery, immutable review/original-byte archives, production document gates, CAS activation, one admission across intent revisions, atomic local host plans, private admin/file inspection, retirement/restore and isolated SQLite demo integration. Durable confirmation and real production/regional acceptance remain open.

**Timing:** Current consolidation reread on 19 October 2026. Conditional harmonised durability label is now included in the pre-order cross-references.

**Limits/open review:** Selected frontend mechanics and reusable Cloudflare archives/local admission are implemented. Applicability, national/linguistic review, complete pre-contract information, early-performance/digital-content permissions, real payment/stock-system acceptance and durable-medium confirmation remain separate open work. A received request does not mean payment, fulfillment or contract confirmation.

**Code/test references:** [packages/notabenda/src/paid-order-policy.ts](../../packages/notabenda/src/paid-order-policy.ts), [packages/notabenda/src/paid-order.ts](../../packages/notabenda/src/paid-order.ts), [packages/notabenda/src/paid-order-action.ts](../../packages/notabenda/src/paid-order-action.ts), [packages/notabenda/src/paid-order-ui.ts](../../packages/notabenda/src/paid-order-ui.ts), [packages/notabenda/src/orders.css](../../packages/notabenda/src/orders.css), [packages/notabenda-authoring/src/paid-order-build.ts](../../packages/notabenda-authoring/src/paid-order-build.ts), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/PaidOrderReview.astro](../../packages/notabenda/src/astro/PaidOrderReview.astro), [examples/orders/build.mjs](../../examples/orders/build.mjs), [examples/orders/client.mjs](../../examples/orders/client.mjs), [site/order-demo.mjs](../../site/order-demo.mjs), [site/order-demo-admin.mjs](../../site/order-demo-admin.mjs), [site/order-admin.css](../../site/order-admin.css), [packages/notabenda-cf/src/orders.ts](../../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/src/order-context.ts](../../packages/notabenda-cf/src/order-context.ts), [packages/notabenda-cf/src/order-blobs.ts](../../packages/notabenda-cf/src/order-blobs.ts), [packages/notabenda-cf/src/order-render.ts](../../packages/notabenda-cf/src/order-render.ts), [packages/notabenda-cf/src/order-admin-style.ts](../../packages/notabenda-cf/src/order-admin-style.ts), [packages/notabenda-cf/src/order-review.ts](../../packages/notabenda-cf/src/order-review.ts), [packages/notabenda-cf/src/order-review-style.ts](../../packages/notabenda-cf/src/order-review-style.ts), [packages/notabenda-cf/src/order-policy.ts](../../packages/notabenda-cf/src/order-policy.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/scripts/sync-order-policy.mjs](../../packages/notabenda-cf/scripts/sync-order-policy.mjs), [site/order-demo-legacy.mjs](../../site/order-demo-legacy.mjs), [site/order-demo-admin-legacy.mjs](../../site/order-demo-admin-legacy.mjs), [packages/notabenda/test/paid-order.test.mjs](../../packages/notabenda/test/paid-order.test.mjs), [site/test/order-demo.test.mjs](../../site/test/order-demo.test.mjs), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [docs/verification/paid-orders.md](../../docs/verification/paid-orders.md), [packages/notabenda-cf/test/orders.test.mjs](../../packages/notabenda-cf/test/orders.test.mjs), [packages/notabenda-cf/test/orders-package.test.mjs](../../packages/notabenda-cf/test/orders-package.test.mjs), [scripts/check-order-archive-runtime.mjs](../../scripts/check-order-archive-runtime.mjs)

<a id="req-product-terms-acceptance"></a>

### REQ-PRODUCT-TERMS-ACCEPTANCE — Explicit version-bound terms agreement with acknowledged storage

Use an unchecked statement tied to exact archived terms and UI wording; only report recorded agreement after a matching server receipt. Bind subject, operation, intended scope, and active offer through trusted host context.

**Applies when:** An adopter opts into the terms-acceptance controller and transactional Cloudflare helpers.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-terms-acceptance"></a>

**VERIFY-PRODUCT-TERMS-ACCEPTANCE (automated):** Exercise unchecked/coalesced submission, exact pinned document/action hashes, no optimistic success, lost-ack retry, active-offer transaction race, idempotency conflicts, server-bound subject/site/scope/operation, independent preview rejection, invalid clocks, store isolation and readable authorized evidence.

**Implementation boundary:** Immutable offer registration, explicit activation, active-check plus acceptance write in one transaction, deterministic per-site/subject/request idempotence, conservative client acknowledgment and readable agreement context are implemented. No public ingestion/auth endpoint is supplied.

**Limits/open review:** Host supplies auth, CSRF protection, authorization, clock, retention, exact pinned-document serving and workflow completion. A stored assertion does not prove a human click, identity, enforceability, delivery or purchase completion. Preview requires independent server opt-in. Browser/platform accessibility remains partial.

**Code/test references:** [packages/notabenda/src/terms.ts](../../packages/notabenda/src/terms.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/terms.ts](../../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [examples/static/terms-build.mjs](../../examples/static/terms-build.mjs), [examples/static/example-theme.css](../../examples/static/example-theme.css), [packages/notabenda/test/terms.test.mjs](../../packages/notabenda/test/terms.test.mjs), [docs/verification/terms-browser.md](../../docs/verification/terms-browser.md), [packages/notabenda-cf/test/admin.test.mjs](../../packages/notabenda-cf/test/admin.test.mjs)

<a id="req-product-cf-host"></a>

### REQ-PRODUCT-CF-HOST — A separate fail-closed Cloudflare host integration

Serve repository-built assets with a host-owned authorization boundary before protected assets and a fixed synthetic Durable Object workspace. Keep credentials outside packages, public outputs and version control.

**Applies when:** Using this repository website as an integration example for Workers Static Assets and a SQLite-backed Durable Object.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Discovery articles:** [SRC-CF-NO-TRANSFORM](SOURCES.md#src-cf-no-transform).

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-cf-host"></a>

**VERIFY-PRODUCT-CF-HOST (partial):** Verify missing/bad keys before assets or DO access; normalized/direct-file routes; protected no-store responses; exact-origin bounded writes; persisted retry across object instances; allowlisted assets and a real local Workers runtime.

**Implementation boundary:** Repository-built landing/docs/examples, host-only env-key Basic authentication over HTTPS (loopback exception), canonical route protection, bounded same-origin demo writes and fixed-scope storage are implemented. Wrangler bundles successfully; actual local SQLite receipts survive process restart. Cloud deployment and production operational checks remain incomplete. Host website disclosure is separate from sample documents, requires explicit operator/contact facts for the public build and explains real demo storage before recorded forms. Public asset cache directives now append no-transform; protected/session responses remain private/no-store and add no-transform. This preserves built/archived representations against intermediary rewriting without admitting external script origins. Actual edge/browser verification remains distinct from build checks. Public website entry points, examples and guides share task groups; a complete reference index retains all guide/report routes.

**Limits/open review:** Host template only; not package authentication or a multi-tenant identity provider. Stores synthetic examples, not durable visitor consent receipts. Cloud deployment, production routing, backup/retention and full browser/platform review remain separate.

**Code/test references:** [site/host.mjs](../../site/host.mjs), [site/worker.mjs](../../site/worker.mjs), [site/build.mjs](../../site/build.mjs), [site/website-notice.mjs](../../site/website-notice.mjs), [site/website-notice.css](../../site/website-notice.css), [site/navigation.mjs](../../site/navigation.mjs), [site/guide-pages.mjs](../../site/guide-pages.mjs), [site/examples-page.mjs](../../site/examples-page.mjs), [site/style.css](../../site/style.css), [site/footer.mjs](../../site/footer.mjs), [site/footer.css](../../site/footer.css), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/website-browser.md](../../docs/verification/website-browser.md), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [site/test/website-notice.test.mjs](../../site/test/website-notice.test.mjs), [site/test/site-organization.test.mjs](../../site/test/site-organization.test.mjs)

<a id="req-product-consent-evidence"></a>

### REQ-PRODUCT-CONSENT-EVIDENCE — Version-bound cookie-choice evidence and ordered receipt handling

Register exact notice wording and archived privacy/cookie references, atomically order host-authorized browser reports, and preserve withdrawal under retries and stale snapshots. Browser delivery must be explicitly integrated before claiming recorded visitor choices.

**Applies when:** An operator opts into the optional cookie-choice evidence backend.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Discovery articles:** [SRC-EU-EDPB-CONSENT](SOURCES.md#src-eu-edpb-consent).

**Features:** [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-CHOICES](../FEATURES.md#feat-choices), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-consent-evidence"></a>

**VERIFY-PRODUCT-CONSENT-EVIDENCE (automated):** Ledger and browser tests verify exact notice/command binding, transactional retries/CAS, old-notice revoke-all, fail-closed receipt gating, lost acknowledgments, stale reads, storage failures, reload/stream changes, server expiry, maximum response bounds and safe inspection. Manual Chromium and real local Worker observations supplement automation; production operations remain unverified.

<a id="verify-product-recorded-cookie-application"></a>

**VERIFY-PRODUCT-RECORDED-COOKIE-APPLICATION (automated):** Separate example application preserves denying auth defaults and fixed notice registration/activation; HTTP and bundled-client DOM tests cover request bounds, host-derived stream preconditions, RPC errors, outages, lost committed response, reload, withdrawal and identity changes. Optional real local SQLite runner verifies actual RPC/persistence, registration-only refusal, canonical operator aliases, exact current/pinned notice/legal bytes and restart. Manual real-browser observations remain separately scoped; no production identity or deployment acceptance claim.

**Implementation boundary:** Immutable notices, transactional stream revisions, restrictive revoke-all and historical receipts/current heads are implemented. Optional construction-time browser gating, exact-response validation, bounded single-command retries, immediate local withdrawal, reload/resume confirmation, storage-failure barriers and stale-generation retirement are covered by tests. Default browser mode remains local-only.

**Limits/open review:** Host supplies authorization, opaque stream resolution, CSRF/origin controls, quotas, retention/erasure and replay policy. Reports are not verified human actions or legal-validity proof. Production visitor capability lifecycle, cloud deployment, retention and full platform/accessibility review remain incomplete.

**Code/test references:** [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/consent.ts](../../packages/notabenda/src/consent.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [examples/static/recorded-consent.mjs](../../examples/static/recorded-consent.mjs), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/consent-runtime.ts](../../packages/notabenda/src/consent-runtime.ts), [packages/notabenda/src/consent-evidence-factory.ts](../../packages/notabenda/src/consent-evidence-factory.ts), [packages/notabenda/src/consent-runtime-evidence.ts](../../packages/notabenda/src/consent-runtime-evidence.ts), [examples/recorded-cookies/host.mjs](../../examples/recorded-cookies/host.mjs), [examples/recorded-cookies/workspace.mjs](../../examples/recorded-cookies/workspace.mjs), [examples/recorded-cookies/worker.mjs](../../examples/recorded-cookies/worker.mjs), [examples/recorded-cookies/README.md](../../examples/recorded-cookies/README.md), [packages/notabenda/test/consent-evidence.test.mjs](../../packages/notabenda/test/consent-evidence.test.mjs), [docs/verification/consent-evidence-browser.md](../../docs/verification/consent-evidence-browser.md), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [packages/notabenda/test/consent-delivery.test.mjs](../../packages/notabenda/test/consent-delivery.test.mjs), [packages/notabenda/test/consent-runtime.test.mjs](../../packages/notabenda/test/consent-runtime.test.mjs), [docs/verification/consent-focus.md](../../docs/verification/consent-focus.md), [packages/notabenda-cf/test/recorded-cookie-application.test.mjs](../../packages/notabenda-cf/test/recorded-cookie-application.test.mjs), [scripts/check-recorded-cookie-runtime.mjs](../../scripts/check-recorded-cookie-runtime.mjs), [docs/verification/recorded-cookie-application.md](../../docs/verification/recorded-cookie-application.md)

<a id="req-product-authoring"></a>

### REQ-PRODUCT-AUTHORING — Markdown and MDX document authoring with YAML frontmatter

Support both Markdown and MDX legal-document sources with YAML frontmatter for document configuration, host-supplied custom MDX components and immutable original-source/rendered-output history. Keep the core framework-independent.

**Applies when:** An operator authors privacy, cookie or terms revisions in .md or .mdx project files.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-DOCUMENT-HISTORY](../FEATURES.md#feat-document-history), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-authoring"></a>

**VERIFY-PRODUCT-AUTHORING (automated):** Both .md and .mdx compile with validated YAML frontmatter, stable section IDs, custom component rendering, source and output hashes, review guards and readable revision diffs. Invalid metadata fails clearly; default core remains import-safe and framework-free.

**Implementation boundary:** Optional Node build package compiles Markdown/MDX with strict YAML frontmatter and static custom components. Source/output hashes bind immutable private archives; the host-authorized backend supports escaped source inspection and source/rendered comparisons. Core and CF packages retain zero runtime dependencies.

**Limits/open review:** MDX is trusted executable build-time project code. Output is static, validated and sanitized; no browser hydration. The legal-document authoring API is optional; site configuration separately supports JSON, YAML and Markdown frontmatter. Private source archives have explicit size limits; host auth, retention and reproducible component builds remain adopter responsibilities.

**Code/test references:** [packages/notabenda-authoring/src/index.ts](../../packages/notabenda-authoring/src/index.ts), [packages/notabenda-authoring/src/frontmatter.ts](../../packages/notabenda-authoring/src/frontmatter.ts), [packages/notabenda-authoring/src/html.ts](../../packages/notabenda-authoring/src/html.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/history.ts](../../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/authoring/build.mjs](../../examples/authoring/build.mjs), [packages/notabenda-cf/src/source-diff.ts](../../packages/notabenda-cf/src/source-diff.ts), [examples/authoring/terms.mdx](../../examples/authoring/terms.mdx), [examples/authoring/cookies.md](../../examples/authoring/cookies.md), [packages/notabenda-authoring/test/authoring.test.mjs](../../packages/notabenda-authoring/test/authoring.test.mjs), [packages/notabenda-authoring/test/package.test.mjs](../../packages/notabenda-authoring/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [docs/verification/authoring.md](../../docs/verification/authoring.md), [site/test/documentation-links.test.mjs](../../site/test/documentation-links.test.mjs)

<a id="req-product-react"></a>

### REQ-PRODUCT-REACT — Optional React integration with one shared consent engine

Provide optional React provider/hooks, static legal components and native controls around the existing host-owned controller. Keep default imports framework-independent, SSR/hydration conservative, snapshots immutable and saved choices distinct from effective permissions.

**Applies when:** A host integrates the toolkit into a React 19 application.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-product-react"></a>

**VERIFY-PRODUCT-REACT (automated):** SSR emits no effective grants or remote resources; hydration matches then recovers current browser state. Required-receipt grants remain blocked until acknowledged. StrictMode leaves one controls mount, controller replacement unsubscribes old state, and optional peer imports never enter the default dependency graph. React form fields preserve conservative SSR/hydration, immutable snapshots, host ownership, form independence and explicit exact-request recovery through remount. Both full and compiled controller profiles pass the same consent SSR, hydration and receipt scenarios. Cross-entry hooks reject missing matching providers, controls share one ownership registry, compiled graphs exclude full config/document/form code, and packed declarations preserve both getter contracts.

**Implementation boundary:** Optional React 19 provider/hooks use cached immutable core snapshots and pure effective permissions, deterministic conservative SSR/hydration, host-owned controller lifecycle and one native controls bridge. Static legal wrappers have a separate server-safe subpath. Light/dark example, packed consumer checks, lifecycle/hydration tests and initial real Chromium flows pass; broader framework/platform review remains separate. Ordinary form-permission provider/hooks/native field share the core controller and optional journal, perform no mount-time transport, preserve host ownership through StrictMode, and keep SSR and form submission conservative. A separate react/consent entry accepts compiled or full controllers with an honestly narrower getter; the compatibility entry retains its full public getter. Both use one binding implementation with separate typed contexts and shared controls ownership. Prompt decisions and nested reference arrays are deeply immutable. Light/dark cookie examples use bounded compiled descriptors and explicit legal-link metadata.

**Limits/open review:** Optional React 19 peer only. The host owns controller creation, lifecycle registration and destruction. UI permission is not an execution boundary: optional work must use registerService. Structured document wrappers do not reconstruct rich MDX artifacts. Astro and a complete browser/platform audit remain separate.

**Code/test references:** [packages/notabenda/src/react.ts](../../packages/notabenda/src/react.ts), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [examples/react/build.mjs](../../examples/react/build.mjs), [examples/react/client.mjs](../../examples/react/client.mjs), [examples/react/view.mjs](../../examples/react/view.mjs), [packages/notabenda/src/react-form-permission.ts](../../packages/notabenda/src/react-form-permission.ts), [examples/form-permissions/react-build.mjs](../../examples/form-permissions/react-build.mjs), [examples/form-permissions/react-client.mjs](../../examples/form-permissions/react-client.mjs), [examples/form-permissions/react-view.mjs](../../examples/form-permissions/react-view.mjs), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/react-consent-bindings.ts](../../packages/notabenda/src/react-consent-bindings.ts), [packages/notabenda/src/react-consent.ts](../../packages/notabenda/src/react-consent.ts), [packages/notabenda/test/react.test.mjs](../../packages/notabenda/test/react.test.mjs), [packages/notabenda/test/react-package.test.mjs](../../packages/notabenda/test/react-package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/react-browser.md](../../docs/verification/react-browser.md), [packages/notabenda/test/react-form-permission.test.mjs](../../packages/notabenda/test/react-form-permission.test.mjs), [packages/notabenda/test/react-consent.test.mjs](../../packages/notabenda/test/react-consent.test.mjs), [docs/verification/consent-focus.md](../../docs/verification/consent-focus.md)

<a id="req-product-astro"></a>

### REQ-PRODUCT-ASTRO — Astro static documents and one host-owned browser controller

Ship reusable Astro document/control surfaces, a browser lifecycle bridge and a real static-build example. Keep legal pages readable without scripts and optional services governed by the existing controller across Astro navigation.

**Applies when:** A host integrates the toolkit into an Astro 7 site.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-product-astro"></a>

**VERIFY-PRODUCT-ASTRO (automated):** A real Astro build produces no-script legal pages and self-hosted optional runtime. Before-swap closes drafts without writing consent; page-load mounts once, preserves refusal and reuses existing lifecycles. Core installation does not install Astro; packed components compile in a separate Astro consumer. Astro form fields preserve exact-offer named binding, host-owned draft/pending state and no automatic transport across navigation; the host closes replaced session/contact/offer contexts before refreshing the bridge.

**Implementation boundary:** Optional Astro 7 components and a host-owned browser lifecycle bridge ship with a real static-build example. Packed components compile in a separate consumer; default installs exclude Astro. Lifecycle/build tests and initial real Chromium navigation/mobile checks pass. Broader platform and accessibility review remains separate. Named Astro fields and a navigation bridge reuse the same permission controller without mount/page-load transport. Exact-offer matching, duplicate ownership, draft/pending retention, actual two-page builds and host session/contact/offer replacement are checked.

**Limits/open review:** Host owns controller creation, service registration and destruction. Every client-routed page retaining optional services needs a working preferences surface. Bridge does not select legal applicability or police unrelated scripts. Rich MDX releases use generated HTML/fragments, not a reconstructed structured projection. Astro 7 build example needs Node 22.22 or later.

**Code/test references:** [packages/notabenda/src/astro-client.ts](../../packages/notabenda/src/astro-client.ts), [packages/notabenda/src/astro/LegalDocument.astro](../../packages/notabenda/src/astro/LegalDocument.astro), [packages/notabenda/src/astro/LegalLinks.astro](../../packages/notabenda/src/astro/LegalLinks.astro), [packages/notabenda/src/astro/ConsentControls.astro](../../packages/notabenda/src/astro/ConsentControls.astro), [packages/notabenda/src/astro/PreferencesButton.astro](../../packages/notabenda/src/astro/PreferencesButton.astro), [examples/astro/build.mjs](../../examples/astro/build.mjs), [examples/astro/src/scripts/client.mjs](../../examples/astro/src/scripts/client.mjs), [examples/astro/src/pages/astro/index.astro](../../examples/astro/src/pages/astro/index.astro), [packages/notabenda/src/astro-form-permission.ts](../../packages/notabenda/src/astro-form-permission.ts), [packages/notabenda/src/astro/FormPermissionField.astro](../../packages/notabenda/src/astro/FormPermissionField.astro), [examples/form-permissions/example.mjs](../../examples/form-permissions/example.mjs), [examples/astro/src/lib/permission.mjs](../../examples/astro/src/lib/permission.mjs), [examples/astro/src/layouts/PermissionLayout.astro](../../examples/astro/src/layouts/PermissionLayout.astro), [examples/astro/src/scripts/permission-client.mjs](../../examples/astro/src/scripts/permission-client.mjs), [examples/astro/src/pages/form-permissions/astro/index.astro](../../examples/astro/src/pages/form-permissions/astro/index.astro), [examples/astro/src/pages/form-permissions/astro/review.astro](../../examples/astro/src/pages/form-permissions/astro/review.astro), [packages/notabenda/test/astro.test.mjs](../../packages/notabenda/test/astro.test.mjs), [packages/notabenda/test/astro-build.test.mjs](../../packages/notabenda/test/astro-build.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/astro-browser.md](../../docs/verification/astro-browser.md), [packages/notabenda/test/astro-form-permission.test.mjs](../../packages/notabenda/test/astro-form-permission.test.mjs), [site/test/astro-permission.test.mjs](../../site/test/astro-permission.test.mjs)

<a id="req-product-embeds"></a>

### REQ-PRODUCT-EMBEDS — Inert media placeholders and shared consent-gated lifecycles

Gate iframe and image sources behind every declared service purpose, with one lifecycle for several mounts, inert SSR copy and withdrawal cleanup. Initial allowed resource origins participate in consent scope.

**Applies when:** A host mounts optional iframe or image content through the toolkit.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [MDN iframe element reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) — sandbox, referrerpolicy, src and error/load behavior (read; [SRC-MDN-IFRAME](SOURCES.md#src-mdn-iframe)); [MDN image element reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) — src, alt and error behavior (read; [SRC-MDN-IMAGE](SOURCES.md#src-mdn-image)).

**Features:** [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-CONTROLS](../FEATURES.md#feat-controls).

<a id="verify-product-embeds"></a>

**VERIFY-PRODUCT-EMBEDS (automated):** No resource attribute before effective permission, including detached media and required-receipt pending grants. All purposes required; withdrawal/expiry removes nodes synchronously. Several mounts share one lifecycle, stale local storage is rechecked, late events cannot resurrect media and origin changes invalidate grants.

**Implementation boundary:** Inert SSR and browser iframe/image surfaces share one host-owned service lifecycle, declared initial origins and all-purpose/evidence gating. Lifecycle, actual-ledger and packed consumer tests pass; initial Chromium fresh/refusal/grant/withdrawal/reload and mobile checks are recorded. Broader platform, vendor and regional review remains separate.

**Limits/open review:** Initial URL origin matching does not constrain redirects or nested requests. Removing media cannot recall already sent data or erase remote storage. Host owns group lifetime, CSP and vendor applicability.

**Code/test references:** [packages/notabenda/src/embeds.ts](../../packages/notabenda/src/embeds.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [examples/embeds/build.mjs](../../examples/embeds/build.mjs), [examples/embeds/client.mjs](../../examples/embeds/client.mjs), [packages/notabenda/test/embeds.test.mjs](../../packages/notabenda/test/embeds.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/embeds-browser.md](../../docs/verification/embeds-browser.md)

<a id="req-product-privacy-signals"></a>

### REQ-PRODUCT-PRIVACY-SIGNALS — Independent Global Privacy Control processing restriction

Apply a declared GPC policy before optional service work. Keep cookie choices separate, classify every service, combine host/browser signals monotonically and expose pure service eligibility plus server-readable restrictions.

**Applies when:** The host explicitly enables a signal policy and classifies processing activities; it owns applicability and account/server enforcement.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [W3C Global Privacy Control editor draft](https://w3c.github.io/gpc/) — Sec-GPC header, JavaScript property and preference caching (read; [SRC-W3C-GPC](SOURCES.md#src-w3c-gpc)).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-CONTROLS](../FEATURES.md#feat-controls).

<a id="verify-product-privacy-signals"></a>

**VERIFY-PRODUCT-PRIVACY-SIGNALS (automated):** A signal applies before queued optional work and aborts active or pending starts. Accept-all and late receipt acknowledgments never bypass it. Service eligibility stays separate from cookie grants, snapshots remain pure, and absent signals never create consent. Initial server observations combine with browser signals without erasing an observed true.

**Implementation boundary:** Explicit GPC policy and exhaustive activity classification govern service eligibility independently of cookie/receipt permission. Navigator/header, lifecycle, actual-ledger, React and site checks plus an initial labeled Chromium fixture verify this runtime mechanism. Legal CA/CO/CT obligations, durable account/profile opt-outs and downstream propagation remain partial.

**Limits/open review:** Runtime observation latches within one controller, not an account-wide retained opt-out. No geographic inference, re-opt-in workflow, persistent opt-out record or origin-wide support declaration is supplied. Browser absence never establishes permission.

**Code/test references:** [packages/notabenda/src/privacy-signals.ts](../../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [examples/privacy-signals/build.mjs](../../examples/privacy-signals/build.mjs), [examples/privacy-signals/client.mjs](../../examples/privacy-signals/client.mjs), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/react-consent-bindings.ts](../../packages/notabenda/src/react-consent-bindings.ts), [packages/notabenda/test/privacy-signals.test.mjs](../../packages/notabenda/test/privacy-signals.test.mjs), [packages/notabenda/test/react.test.mjs](../../packages/notabenda/test/react.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/privacy-signals-browser.md](../../docs/verification/privacy-signals-browser.md)

<a id="req-product-processing-choices"></a>

### REQ-PRODUCT-PROCESSING-CHOICES — Separate recorded processing opt-out and monotonic restrictions

Provide a deliberate processing opt-out independent of cookie permission, pinned privacy wording, recoverable pending requests, a host-bound monotonic CF ledger and readable authorized evidence views.

**Applies when:** The operator explicitly classifies every service and supplies trusted stable context, request transports and applicable legal wording.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [California CCPA regulations effective 1 January 2026](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) — Section 7026: opt-out methods and status; host cessation/propagation remains separate (read; [SRC-US-CA-REGS-2026](SOURCES.md#src-us-ca-regs-2026)).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-product-processing-choices"></a>

**VERIFY-PRODUCT-PROCESSING-CHOICES (automated):** No request or acknowledgment can remove a restriction or substitute trusted context, provenance or policy artifact. Concurrency, rollback, stale reads, lost acknowledgment/reload, notice replacement, surviving local intent, teardown and cookie acceptance preserve effective restrictions. Authorized search shows exact wording and historical/current distinctions.

**Implementation boundary:** Validated one-way requests union retained restrictions transactionally. Missing/failed state blocks covered work; cookie acceptance never removes restrictions. Original pending UUID and artifact bindings survive uncertain delivery. Search distinguishes event-time and current retained state.

**Limits/open review:** No identity system, automatic expiry, reset or re-opt-in. Context mapping, alternative methods, downstream execution, retention/erasure and legal applicability remain operator work. The synthetic protected fixture is not a production account model.

**Code/test references:** [packages/notabenda/src/processing.ts](../../packages/notabenda/src/processing.ts), [packages/notabenda/src/processing-choices.ts](../../packages/notabenda/src/processing-choices.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda-cf/src/processing.ts](../../packages/notabenda-cf/src/processing.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/processing-choices/build.mjs](../../examples/processing-choices/build.mjs), [examples/processing-choices/client.mjs](../../examples/processing-choices/client.mjs), [site/worker.mjs](../../site/worker.mjs), [site/host.mjs](../../site/host.mjs), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/react-consent-bindings.ts](../../packages/notabenda/src/react-consent-bindings.ts), [packages/notabenda/test/processing.test.mjs](../../packages/notabenda/test/processing.test.mjs), [packages/notabenda/test/react.test.mjs](../../packages/notabenda/test/react.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [docs/verification/processing-choices-browser.md](../../docs/verification/processing-choices-browser.md)

<a id="req-product-retained-releases"></a>

### REQ-PRODUCT-RETAINED-RELEASES — Explicit retained public document releases in clean builds

Include selected prior public artifacts and exact pinned HTML in a clean deployment while current routes remain current. Reject private source envelopes, unsupported/corrupt inputs and wrong-site artifacts; keep publication and private history separate.

**Applies when:** The host supplies trusted public compiler artifacts it intends to make available alongside the current release.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-DOCUMENT-HISTORY](../FEATURES.md#feat-document-history), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-retained-releases"></a>

**VERIFY-PRODUCT-RETAINED-RELEASES (automated):** An empty output directory receives the current mutable pages and exact supplied previous pinned pages. Public artifact hashes remain valid; private metadata/source archives, wrong-site inputs, corrupt hashes, unsupported schemas, accidental previews and excessive/non-JSON inputs fail before writes. Identical duplicates deduplicate and rich historical output is not re-evaluated.

**Implementation boundary:** A bounded build-time API and repeatable CLI input emit only immutable artifact paths. Exact historical bytes and rich bodies are preserved without source evaluation. Clean-build tests and a two-version example connect public pinned URLs to private authorized comparison.

**Limits/open review:** Input selection and publication are explicit host decisions. Hashes are not an HTML sanitizer or author authentication. Linked CSS/assets, route redirects, production activation, notifications and retention/erasure remain host responsibilities. No automatic workspace/output discovery or schema upgrade.

**Code/test references:** [packages/notabenda/src/release-files.ts](../../packages/notabenda/src/release-files.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [examples/releases/build.mjs](../../examples/releases/build.mjs), [examples/authoring/build.mjs](../../examples/authoring/build.mjs), [examples/rights/build.mjs](../../examples/rights/build.mjs), [examples/catalog-releases/build.mjs](../../examples/catalog-releases/build.mjs), [packages/notabenda/test/retained-releases.test.mjs](../../packages/notabenda/test/retained-releases.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/retained-releases.md](../../docs/verification/retained-releases.md), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [packages/notabenda/test/rights.test.mjs](../../packages/notabenda/test/rights.test.mjs), [packages/notabenda/test/catalog-release.test.mjs](../../packages/notabenda/test/catalog-release.test.mjs), [docs/verification/catalog-release.md](../../docs/verification/catalog-release.md), [site/test/demo-upgrade.test.mjs](../../site/test/demo-upgrade.test.mjs)

<a id="req-product-storage-cleanup"></a>

### REQ-PRODUCT-STORAGE-CLEANUP — Exact declared optional storage cleanup within service generations

Remove explicitly selected accessible browser storage when an owned optional service is blocked, stopped, fails or is destroyed; preserve unrelated items and report limited outcomes.

**Applies when:** The host opts one consent-managed service into exact declared local/session storage or explicit JavaScript-accessible cookie expiration scopes.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-product-storage-cleanup"></a>

**VERIFY-PRODUCT-STORAGE-CLEANUP (automated):** Only selected owned optional storage is touched; no producer starts after revocation, old final deletion precedes new writes, cleanup covers partial failures and zero-generation destruction, and cookie outcomes remain expiration requests.

**Implementation boundary:** Exact inventory ownership validation precedes mutation; independent blocked observation covers queued cancellation. Abort, failed startup, final teardown and destroy cleanup participate in the same generation lifecycle.

**Limits/open review:** Web storage absence is point-in-time. Cookie expiration requests are not verified deletion. Host controls producer teardown; server, third-party, HttpOnly, partitioned and undeclared storage remain outside this adapter. This does not complete legal erasure or withdrawal obligations.

**Code/test references:** [packages/notabenda/src/storage-cleanup.ts](../../packages/notabenda/src/storage-cleanup.ts), [examples/storage-cleanup/build.mjs](../../examples/storage-cleanup/build.mjs), [examples/storage-cleanup/client.mjs](../../examples/storage-cleanup/client.mjs), [packages/notabenda/test/storage-cleanup.test.mjs](../../packages/notabenda/test/storage-cleanup.test.mjs), [docs/verification/storage-cleanup.md](../../docs/verification/storage-cleanup.md)

<a id="req-product-setup"></a>

### REQ-PRODUCT-SETUP — Shared advisory setup wizard and admin questionnaire

Ask about coverage interests, actual practices and justifications, then advise configuration/integrations with catalog references and export a draft plus a separate private report.

**Applies when:** An operator initiates guided setup through the CLI or a host-authorized admin page.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-setup"></a>

**VERIFY-PRODUCT-SETUP (automated):** CLI and admin UI use the same bounded recommendation engine; unanswered topics stay unknown, imported settings persist, private notes never reach public artifacts, stale exports invalidate, reports resume, and host authorization guards every admin request.

**Implementation boundary:** Shared tri-state questionnaire and bounded normalized answers; explicit selected markets trigger review. Config/imported runtime settings stay separate from private notes. Contradictions remain unresolved; current exports invalidate on edits and saved reports resume answers only. Questionnaire revision 3 adds actual distance/continuing-contract practices and conditional regional/handoff review, accepts earlier reports and preserves unresolved new answers. Explicit public purpose add/edit/remove plans now power CLI/admin authoring; unresolved basis/retention/consequence text stays production-blocking, linked removals reject, existing restrictions/scopes persist, and stale catalog notes remain review items. Explicit wizard --project scanning now feeds the same actual-use confirmation as manual catalog search and writes separate private discovery findings. Noninteractive runs preserve prior pins and never select services from matches. Setup/catalog JSON and tracked source reads reject nonregular inputs without FIFO blocking. Browser/admin local-filesystem scanning remains unavailable. Explicit CLI/admin renewal compares selected reference/service/purpose facts, requires a new private reason and confirmation, rejects stale full-service snapshots and retains prior/next pins in bounded private report history. Operator labels and enforcement settings remain unchanged; focused CLI review does not reapply historical setup facts. Practice assessment now uses four grouped responsive grids with directly exposed native radio choices, visible explanations, optional private notes and unresolved counts. No per-question opening, automatic navigation, bulk answers or applicability-based hiding.

**Limits/open review:** Advisory and draft only. No jurisdiction applicability, exemption, legal basis, compliance or content-review conclusion. No automatic service activation, deployment, account system or server persistence. Operator-private imported config fields are excluded from advisory exports; retain original files.

**Code/test references:** [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [examples/setup/build.mjs](../../examples/setup/build.mjs), [examples/setup/client.mjs](../../examples/setup/client.mjs), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [packages/notabenda-cf/src/presentation.ts](../../packages/notabenda-cf/src/presentation.ts), [site/admin-presentation.mjs](../../site/admin-presentation.mjs), [packages/notabenda/src/setup-purpose.ts](../../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/src/setup-purpose-ui.ts](../../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-purpose-cli.ts](../../packages/notabenda/src/setup-purpose-cli.ts), [packages/notabenda/src/setup-catalog-cli.ts](../../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda/src/cli-json.ts](../../packages/notabenda/src/cli-json.ts), [packages/notabenda/src/catalog-node.ts](../../packages/notabenda/src/catalog-node.ts), [packages/notabenda/src/catalog-review.ts](../../packages/notabenda/src/catalog-review.ts), [packages/notabenda/src/catalog-review-ui.ts](../../packages/notabenda/src/catalog-review-ui.ts), [packages/notabenda/src/catalog-review-cli.ts](../../packages/notabenda/src/catalog-review-cli.ts), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs), [packages/notabenda-cf/test/setup.test.mjs](../../packages/notabenda-cf/test/setup.test.mjs), [docs/verification/setup.md](../../docs/verification/setup.md), [docs/verification/ux-review.md](../../docs/verification/ux-review.md), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs), [packages/notabenda/test/setup-project.test.mjs](../../packages/notabenda/test/setup-project.test.mjs), [packages/notabenda/test/catalog-review.test.mjs](../../packages/notabenda/test/catalog-review.test.mjs), [docs/verification/catalog-review.md](../../docs/verification/catalog-review.md)

<a id="req-product-collection-notice"></a>

### REQ-PRODUCT-COLLECTION-NOTICE — Version-bound inline direct-collection notice

Render selected declared collection facts beside a host form, with a pinned privacy release, independent wording review, accessible static details and no implied acceptance or evidence write. Optional complete versioned static-interface messages support explicit language/direction; build-time notice verification checks retained facts and selected copy.

**Applies when:** The host supplies an appropriate direct/mixed-source inventory purpose and places a notice at a collection surface.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents).

<a id="verify-product-collection-notice"></a>

**VERIFY-PRODUCT-COLLECTION-NOTICE (automated):** Selected direct/mixed purposes produce deterministic reviewed/draft notices with intact pinned privacy references, explicit purpose-level semantics, safe static markup, stable unique IDs and no consent/submission side effects; corruption and invalid selections fail. Collection notices retain exact v2 copy, reject tampering/downgrade at release verification, preserve English v1 and cookie scopes, use static localized details and allocate no demo evidence store.

**Implementation boundary:** Trusted public release integrity checks precede a bounded selected-facts projection. Content identity covers locale, scope, render policy and reviewed wording; unique instance/summary IDs support static vanilla, React and Astro markup.

**Limits/open review:** Purpose-level categories and optionality do not map individual fields. Host reviews inventory/policy/context, legal particulars, timing and availability. No indirect-notification workflow, marketing permission, parental authorization or proof of display/read/acceptance.

**Code/test references:** [packages/notabenda/src/collection.ts](../../packages/notabenda/src/collection.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/CollectionNotice.astro](../../packages/notabenda/src/astro/CollectionNotice.astro), [examples/collection/build.mjs](../../examples/collection/build.mjs), [packages/notabenda/src/collection-localization-policy.ts](../../packages/notabenda/src/collection-localization-policy.ts), [examples/localization/collection-build.mjs](../../examples/localization/collection-build.mjs), [packages/notabenda/test/collection.test.mjs](../../packages/notabenda/test/collection.test.mjs), [packages/notabenda/test/react.test.mjs](../../packages/notabenda/test/react.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [packages/notabenda/test/react-package.test.mjs](../../packages/notabenda/test/react-package.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/collection.md](../../docs/verification/collection.md), [packages/notabenda/test/collection-localization.test.mjs](../../packages/notabenda/test/collection-localization.test.mjs), [site/test/collection-localization.test.mjs](../../site/test/collection-localization.test.mjs)

<a id="req-product-evidence-export"></a>

### REQ-PRODUCT-EVIDENCE-EXPORT — Explicitly authorized filtered evidence export

Download bounded, filter-preserving evidence segments from a fixed host-authorized store, with fresh per-request export permission and explicit live-read continuation.

**Applies when:** The host explicitly grants a caller bulk-download permission on an already scoped evidence store.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-evidence-export"></a>

**VERIFY-PRODUCT-EVIDENCE-EXPORT (automated):** Unauthorized or revoked export access reaches no store. Exact filtered scoped fields, bounded traversal including empty continuing segments, fresh-read semantics and safe attachment headers pass; hostile adapter pages, backward cursors and out-of-filter records fail closed without payload leaks.

**Implementation boundary:** Script-free live review and attachment-only JSON preserve filters and incoming/forward cursors. Shared page validation checks normalized records against filters and UTF-8 order; each request requires fresh host authorization plus explicit bulk-read permission.

**Limits/open review:** All adapter-returned fields are included without redaction. No snapshot, signature, full subject-data export, automatic source/archive lookup, legal sufficiency, retention/erasure or backup/restore claim. Hosts own scope, access auditing and downloaded-copy handling.

**Code/test references:** [packages/notabenda-cf/src/export.ts](../../packages/notabenda-cf/src/export.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/src/types.ts](../../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/test/export.test.mjs](../../packages/notabenda-cf/test/export.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [docs/verification/evidence-export.md](../../docs/verification/evidence-export.md)

<a id="req-product-discovery"></a>

### REQ-PRODUCT-DISCOVERY — Explicit origin/name-only browser discovery and local inventory review

Provide opt-in browser observations, private local review and a standalone capture-file CLI with declared-inventory candidate mappings, clear coverage limits and no mandated CI workflow.

**Applies when:** An authorized developer/operator explicitly invokes discovery for a declared HTTP(S) site origin.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [W3C Resource Timing candidate recommendation draft](https://www.w3.org/TR/2026/CRD-resource-timing-20260901/) — Resources included; frame boundaries; cross-origin restrictions; resource timing buffers (read; [SRC-W3C-RESOURCE-TIMING](SOURCES.md#src-w3c-resource-timing)).

**Features:** [FEAT-DISCOVERY](../FEATURES.md#feat-discovery).

<a id="verify-product-discovery"></a>

**VERIFY-PRODUCT-DISCOVERY (automated):** Origin/name-only observations and candidate mappings remain bounded and detached, blocked APIs are explicit, hostile inputs/markup fail safely, UI captures only on request and revokes stale downloads, and CLI explicit inputs cannot overwrite existing output.

**Implementation boundary:** Explicit point-in-time ResourceTiming/DOM/storage-name capture with bounded strict JSON normalization; optional browser UI and local CLI preserve per-scenario observations and public-inventory candidates. Source paths, URL credentials/queries/fragments, storage values, headers and bodies are excluded. Browser setup links to offline project discovery and displays the npx command for dependency/infrastructure coverage, with manual review and private-report handling. The UI does not execute commands or inspect the local project.

**Limits/open review:** No complete network trace, vendor/purpose inference, proof of no tracking, legal score or automatic configuration. Hosts authorize operator access and review potentially sensitive origin/name/label files. Framework/server/HttpOnly/partitioned storage and deeper inspection remain outside this baseline.

**Code/test references:** [packages/notabenda/src/discovery.ts](../../packages/notabenda/src/discovery.ts), [packages/notabenda/src/discovery-ui.ts](../../packages/notabenda/src/discovery-ui.ts), [packages/notabenda/src/discovery-cli.ts](../../packages/notabenda/src/discovery-cli.ts), [examples/discovery/build.mjs](../../examples/discovery/build.mjs), [examples/discovery/client.mjs](../../examples/discovery/client.mjs), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/test/discovery.test.mjs](../../packages/notabenda/test/discovery.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/discovery.md](../../docs/verification/discovery.md), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs)

<a id="req-product-regional-prompts"></a>

### REQ-PRODUCT-REGIONAL-PROMPTS — Explicit and explainable regional solicitation guards

Keep solicitation separate from permission, preserve withholding memory, require exact declared material transitions and bind their public explanation into evidence notices.

**Applies when:** An operator explicitly configures the supported repeat-prompt policy.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CHOICES](../FEATURES.md#feat-choices).

<a id="verify-product-regional-prompts"></a>

**VERIFY-PRODUCT-REGIONAL-PROMPTS (automated):** Explicit profile validates, explains and suppresses prompts without granting; exact transition/disclosure binds to the archived notice and stays distinct from permission scope. Legacy/cross-tab/lifetime/storage cases and calendar boundaries remain conservative.

**Limits/open review:** Implements the documented software guard, not legal applicability or a complete jurisdiction profile.

**Code/test references:** [packages/notabenda/src/prompt-policy.ts](../../packages/notabenda/src/prompt-policy.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [examples/repeat-prompts/build.mjs](../../examples/repeat-prompts/build.mjs), [examples/repeat-prompts/client.mjs](../../examples/repeat-prompts/client.mjs), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/test/prompt-policy.test.mjs](../../packages/notabenda/test/prompt-policy.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs)

<a id="req-product-evidence-lifecycle"></a>

### REQ-PRODUCT-EVIDENCE-LIFECYCLE — Scoped evidence retirement, holds and resumable payload purge

Retire a fixed host-bound evidence context before bounded transactional deletion; preserve holds, replay barriers and restore reapplication while exposing readable operational progress.

**Applies when:** A host invokes lifecycle operations for a configured consent, processing or terms ledger.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-evidence-lifecycle"></a>

**VERIFY-PRODUCT-EVIDENCE-LIFECYCLE (automated):** Retirement blocks new and duplicate commands and empty-head resurrection; transactional purge is bounded, scoped, held, resumable and atomic. Restore reapplies the barrier before traffic. Terminal frontend and read-only admin preserve restrictions and describe remaining data.

<a id="verify-product-transaction-recovery"></a>

**VERIFY-PRODUCT-TRANSACTION-RECOVERY (automated):** Optional local Wrangler SQLite exercise restores eight declaration/order contexts from a pre-delivery KV snapshot while an independent provider retains its history. Verify default-closed access, later hold-first replay, restart-persistent purge, physical event/blob deletion, actual retired admission refusal before host decisions, exact surviving receipts/chunked files, persisted uncertainty and stable-ID retries: nine provider jobs, eighteen attempts, nine commits. Trusted fixture journal and simulated provider only; no all-family or production acceptance claim.

**Implementation boundary:** Atomic retirement precedes retries and empty-head reads. Exact family/site/context event matching, transactional bounded scans, CAS holds and restartable manifests preserve restrictions. Browser controllers close terminal contexts. Read-only admin cards show holds, scan counters, timestamps and retained-data limitations.

**Limits/open review:** Host supplies authorization, identity resolution, eligibility, scheduling and authoritative manifests outside backup rollback. Minimal pseudonymous metadata, shared archives, exports, backups and other application data remain. No complete erasure, legal sufficiency, automatic retention period or public deletion endpoint.

**Code/test references:** [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/processing.ts](../../packages/notabenda-cf/src/processing.ts), [packages/notabenda-cf/src/terms.ts](../../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/processing-choices.ts](../../packages/notabenda/src/processing-choices.ts), [packages/notabenda/src/terms.ts](../../packages/notabenda/src/terms.ts), [site/worker.mjs](../../site/worker.mjs), [examples/lifecycle.mjs](../../examples/lifecycle.mjs), [packages/notabenda-cf/src/records.ts](../../packages/notabenda-cf/src/records.ts), [packages/notabenda-cf/src/contract-dispatch.ts](../../packages/notabenda-cf/src/contract-dispatch.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda-cf/src/orders.ts](../../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/test/lifecycle.test.mjs](../../packages/notabenda-cf/test/lifecycle.test.mjs), [packages/notabenda/test/consent-delivery.test.mjs](../../packages/notabenda/test/consent-delivery.test.mjs), [packages/notabenda/test/processing.test.mjs](../../packages/notabenda/test/processing.test.mjs), [packages/notabenda/test/terms.test.mjs](../../packages/notabenda/test/terms.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [docs/verification/evidence-lifecycle.md](../../docs/verification/evidence-lifecycle.md), [packages/notabenda-cf/test/contract-dispatch.test.mjs](../../packages/notabenda-cf/test/contract-dispatch.test.mjs), [docs/verification/contract-dispatch.md](../../docs/verification/contract-dispatch.md), [packages/notabenda-cf/test/orders.test.mjs](../../packages/notabenda-cf/test/orders.test.mjs), [scripts/check-transaction-recovery.mjs](../../scripts/check-transaction-recovery.mjs), [scripts/fixtures/transaction-recovery-worker.mjs](../../scripts/fixtures/transaction-recovery-worker.mjs)

<a id="req-eu-retention-erasure"></a>

### REQ-EU-RETENTION-ERASURE — Storage limitation and qualified erasure

Limit identifiable retention to necessary purposes; assess applicable erasure grounds, exceptions and recipient notification obligations.

**Applies when:** GDPR applies to the stored personal data and controller processing context.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) — Articles 5(1)(c),(e), 5(2), 17(1)–(3), 19 (read; [SRC-EU-GDPR](SOURCES.md#src-eu-gdpr)).

**Features:** [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-eu-retention-erasure"></a>

**VERIFY-EU-RETENTION-ERASURE (partial):** Scoped mechanics preserve holds and exact deletion boundaries; operator review must still establish purpose-specific periods, valid grounds/exceptions, identity scope, recipient handling and disposition of remaining metadata/copies.

**Implementation boundary:** Host-controlled holds, retirement and scoped payload deletion provide engineering mechanics. Full identity resolution, lawful schedules, recipient handling, metadata disposition, copies and legal review remain incomplete.

**Limits/open review:** Purpose, necessity, exceptions and recipient duties need contextual review. A scoped ledger purge leaves metadata and external copies; it does not establish fulfillment of an erasure request or a legal basis for continued retention.

**Code/test references:** [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/processing.ts](../../packages/notabenda-cf/src/processing.ts), [packages/notabenda-cf/src/terms.ts](../../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/test/lifecycle.test.mjs](../../packages/notabenda-cf/test/lifecycle.test.mjs), [docs/verification/evidence-lifecycle.md](../../docs/verification/evidence-lifecycle.md)

<a id="req-product-scope-guards"></a>

### REQ-PRODUCT-SCOPE-GUARDS — Explicit processing-scope guards for unsupported contexts

Declare tri-state operator scope facts and prevent affected optional-purpose grants and registered service starts while preserving static documents and restrictive actions.

**Applies when:** An operator explicitly configures the scope-guard policy for a site or purpose; legacy absence remains visibly unassessed.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SCOPE-GUARDS](../FEATURES.md#feat-scope-guards), [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-scope-guards"></a>

**VERIFY-PRODUCT-SCOPE-GUARDS (automated):** Explicit present/unknown facts block affected optional work and grants; siblings remain usable, archives bind the policy, revisions invalidate grants, refusals survive, ordinary pages and restrictive actions remain usable, and private assessment notes stay out of public artifacts.

**Implementation boundary:** Site and purpose restrictions compose conservatively; optional eligibility and granular grants are checked in the browser and against CF archives. Available-choice actions use save, wholly blocked actions invent no refusal, and read-only evidence distinguishes guarded-off values. The wizard preserves imported restrictions and private reasoning.

**Limits/open review:** Declarations are public operator facts, not visitor attributes, authorization or legal clearance. Specialized child/sensitive/profiling/sector flows remain unsupported. Hosts own applicability, factual assessment, material revision discipline, unregistered/server code and separate workflows.

**Code/test references:** [packages/notabenda/src/scope-guard-policy.ts](../../packages/notabenda/src/scope-guard-policy.ts), [packages/notabenda/src/scope-guards.ts](../../packages/notabenda/src/scope-guards.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/starter.ts](../../packages/notabenda/src/starter.ts), [packages/notabenda-cf/src/scope-guard-policy.ts](../../packages/notabenda-cf/src/scope-guard-policy.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/history.ts](../../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/scope-guards/build.mjs](../../examples/scope-guards/build.mjs), [examples/scope-guards/client.mjs](../../examples/scope-guards/client.mjs), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/react-consent-bindings.ts](../../packages/notabenda/src/react-consent-bindings.ts), [packages/notabenda/src/setup-purpose.ts](../../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/test/scope-guards.test.mjs](../../packages/notabenda/test/scope-guards.test.mjs), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs), [packages/notabenda/test/react.test.mjs](../../packages/notabenda/test/react.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [docs/verification/scope-guards.md](../../docs/verification/scope-guards.md), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs)

<a id="req-product-demo-workspace"></a>

### REQ-PRODUCT-DEMO-WORKSPACE — Isolated fictional admin workspace for public examples

Public example visitors get a separately provisioned DO database, fictional seeded journeys, generation-bound actions and session-bound access and idle cleanup; operational admin remains separately authorized. Example and demo-admin screens carry a visible corner marker, distinct from the project website and documentation.

**Applies when:** Public example or demo admin navigation.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-demo-workspace"></a>

**VERIFY-PRODUCT-DEMO-WORKSPACE (automated):** Separate browser capabilities select only independent demo DOs; fake journeys are seeded with real APIs; expiry, generation mismatch, quota and origin checks prevent cross-session writes and resurrection.

**Implementation boundary:** Separate DO binding, bounded provisioning, session cookie and rolling idle expiry, seeded immutable ledgers and browser generation checks.

**Limits/open review:** Capability grants access only to fictional demo data. Hosts own production authorization. Scheduled cleanup is distinct from the one-day idle access expiry.

**Code/test references:** [site/demo-host.mjs](../../site/demo-host.mjs), [site/demo-seed.mjs](../../site/demo-seed.mjs), [site/demo-presentation.mjs](../../site/demo-presentation.mjs), [site/demo-admin.css](../../site/demo-admin.css), [site/worker.mjs](../../site/worker.mjs), [site/host.mjs](../../site/host.mjs), [scripts/serve-example.mjs](../../scripts/serve-example.mjs), [site/demo-marker.mjs](../../site/demo-marker.mjs), [site/demo-marker.css](../../site/demo-marker.css), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [docs/verification/demo-workspace.md](../../docs/verification/demo-workspace.md), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [site/test/demo-upgrade.test.mjs](../../site/test/demo-upgrade.test.mjs)

<a id="req-product-rights-center"></a>

### REQ-PRODUCT-RIGHTS-CENTER — Discoverable rights entry points with explicit application handoff

Render operator-selected rights navigation with clear scope, safe public destinations and an account-independent contact fallback. Do not infer applicability, submit a request or claim fulfillment.

**Applies when:** An operator explicitly configures a rights center.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-RIGHTS](../FEATURES.md#feat-rights), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-rights-center"></a>

**VERIFY-PRODUCT-RIGHTS-CENTER (automated):** Only configured actions appear; safe destinations and public fallback are explicit; static navigation changes no permissions and makes no request or receipt; private data is excluded; authored builds retain the supporting page.

**Implementation boundary:** Static core/React/Astro surfaces, production review and strict configuration; supporting page emitted alongside legal builds, with its declaration bound in public configuration. Three immutable legal document kinds are preserved.

**Limits/open review:** Navigation and public information only. The host owns identity, intake, acknowledgments, response deadlines, decisions, fulfillment and appeals. A contact fallback does not establish that all required submission methods exist.

**Code/test references:** [packages/notabenda/src/rights-policy.ts](../../packages/notabenda/src/rights-policy.ts), [packages/notabenda/src/rights.ts](../../packages/notabenda/src/rights.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/RightsCenter.astro](../../packages/notabenda/src/astro/RightsCenter.astro), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda-authoring/src/index.ts](../../packages/notabenda-authoring/src/index.ts), [examples/rights/build.mjs](../../examples/rights/build.mjs), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/test/rights.test.mjs](../../packages/notabenda/test/rights.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [docs/verification/rights-center.md](../../docs/verification/rights-center.md)

<a id="req-product-cf-starter"></a>

### REQ-PRODUCT-CF-STARTER — Local Cloudflare starter with host-owned authorization and scoped evidence

Provide an installable local scaffold for a standalone Worker, SQLite Durable Object, static setup assets and scoped admin. Never replace existing files, ship credentials, choose a tenant from browser input, install or deploy automatically.

**Applies when:** An adopter explicitly runs notabenda-cf init.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [Cloudflare: Durable Object class exports](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/) — Define a Durable Object class; exports and legacy migrations are mutually exclusive (read; [SRC-CF-DO-EXPORTS](SOURCES.md#src-cf-do-exports)); [Cloudflare: Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) — Static assets, run_worker_first, bindings and exports (read; [SRC-CF-WRANGLER-CONFIG](SOURCES.md#src-cf-wrangler-config)); [Cloudflare: SQLite-backed Durable Object storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) — SQLite-backed storage and asynchronous KV API (read; [SRC-CF-DO-SQLITE](SOURCES.md#src-cf-do-sqlite)).

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-cf-starter"></a>

**VERIFY-PRODUCT-CF-STARTER (automated):** Packed CLI scaffolds without overwrite or side effects; default authorization denies before storage/assets; caller input cannot select namespaces or grant export; fresh stores are empty; matching immutable and authored archives remain readable; local Wrangler bundles and serves the project.

**Implementation boundary:** Exclusive local scaffolding, a fail-closed host hook, fixed configured-site namespace selection, separate setup/export permission, private archive RPC and explicit Wrangler build/check/dev/deploy scripts.

**Limits/open review:** Host code owns identity, sessions, access policy, public ingestion if any, recording identity, retention, restore and routing. Builds and local checks are not proof of production deployment or compliance. CLI init performs no network or remote resource operations.

**Code/test references:** [packages/notabenda-cf/bin/notabenda-cf.mjs](../../packages/notabenda-cf/bin/notabenda-cf.mjs), [packages/notabenda-cf/package.json](../../packages/notabenda-cf/package.json), [packages/notabenda-cf/templates/src/worker.mjs](../../packages/notabenda-cf/templates/src/worker.mjs), [packages/notabenda-cf/templates/src/host.mjs](../../packages/notabenda-cf/templates/src/host.mjs), [packages/notabenda-cf/templates/src/workspace.mjs](../../packages/notabenda-cf/templates/src/workspace.mjs), [packages/notabenda-cf/templates/src/authorize.mjs](../../packages/notabenda-cf/templates/src/authorize.mjs), [packages/notabenda-cf/templates/src/setup.mjs](../../packages/notabenda-cf/templates/src/setup.mjs), [packages/notabenda-cf/templates/scripts/build-assets.mjs](../../packages/notabenda-cf/templates/scripts/build-assets.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/cloudflare-starter.md](../../docs/verification/cloudflare-starter.md), [scripts/check-cf-starter-runtime.mjs](../../scripts/check-cf-starter-runtime.mjs)

<a id="req-product-form-permissions"></a>

### REQ-PRODUCT-FORM-PERMISSIONS — Purpose/channel form permissions and evaluated evidence

Separate optional fields from terms/cookies; bind stable purpose/channel permission to reviewed disclosures and a trusted person/contact generation, with acknowledged grants, independent withdrawal and evaluated current state.

**Applies when:** A host provides a reviewed ordinary consent context and its own identity, authorization and downstream operations.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-product-form-permissions"></a>

**VERIFY-PRODUCT-FORM-PERMISSIONS (automated):** Exact offers and host stream preconditions; CAS/activation ordering; independent withdrawals including failed/hung first reads; safe nonce retries; monotonic responses; scoped lifecycle and read-time evidence; isolated session routing and local SQLite restart. Broader UI/platform acceptance tracked separately. Transactional reload recovery preserves original command/artifact binding, storage failures never bypass withdrawal, and keyboard focus survives hidden controls. React form fields preserve conservative SSR/hydration, immutable snapshots, host ownership, form independence and explicit exact-request recovery through remount. Astro form fields preserve exact-offer named binding, host-owned draft/pending state and no automatic transport across navigation; the host closes replaced session/contact/offer contexts before refreshing the bridge. Localized v2 interface copy must match the retained release, and a pending v1 withdrawal retries its original command after v2 activation.

**Implementation boundary:** Ordinary opt-in/withdrawal mechanics, scoped history, isolated examples and optional IndexedDB recovery are implemented. Exact pending requests, withdrawal epochs and head/activation fences survive reload; stale-tab grants and storage failures are covered. React provider/hooks/native field and light/midnight examples reuse that controller with no mount-time network or ordinary-form writes. Wider platform acceptance and regional packs remain incomplete. Named Astro fields and a navigation bridge reuse the same permission controller without mount/page-load transport. Exact-offer matching, duplicate ownership, draft/pending retention, actual two-page builds and host session/contact/offer replacement are checked. Complete optional host-supplied fixed/status/recovery messages use v2 offers and retained-release comparison; English v1 behavior and exact historical retries remain supported. Direct-collection notice UI localization and broader regional/platform coverage remain separate work.

**Limits/open review:** No implied-consent classifier, specialized authorization, identity/contact proof, sending or complete regional coverage. Browser recovery is opt-in and depends on retained transactional storage; it never authorizes background delivery. A historical receipt never decides current eligibility.

**Code/test references:** [packages/notabenda/src/form-permission.ts](../../packages/notabenda/src/form-permission.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/permissions.ts](../../packages/notabenda-cf/src/permissions.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/form-permissions/build.mjs](../../examples/form-permissions/build.mjs), [examples/form-permissions/client.mjs](../../examples/form-permissions/client.mjs), [site/permission-context.mjs](../../site/permission-context.mjs), [site/demo-host.mjs](../../site/demo-host.mjs), [site/worker.mjs](../../site/worker.mjs), [site/permission-seed.mjs](../../site/permission-seed.mjs), [packages/notabenda/src/form-permission-journal.ts](../../packages/notabenda/src/form-permission-journal.ts), [packages/notabenda/src/react-form-permission.ts](../../packages/notabenda/src/react-form-permission.ts), [examples/form-permissions/react-build.mjs](../../examples/form-permissions/react-build.mjs), [examples/form-permissions/react-client.mjs](../../examples/form-permissions/react-client.mjs), [examples/form-permissions/react-view.mjs](../../examples/form-permissions/react-view.mjs), [packages/notabenda/src/astro-form-permission.ts](../../packages/notabenda/src/astro-form-permission.ts), [packages/notabenda/src/astro/FormPermissionField.astro](../../packages/notabenda/src/astro/FormPermissionField.astro), [examples/form-permissions/example.mjs](../../examples/form-permissions/example.mjs), [examples/astro/src/lib/permission.mjs](../../examples/astro/src/lib/permission.mjs), [examples/astro/src/layouts/PermissionLayout.astro](../../examples/astro/src/layouts/PermissionLayout.astro), [examples/astro/src/scripts/permission-client.mjs](../../examples/astro/src/scripts/permission-client.mjs), [examples/astro/src/pages/form-permissions/astro/index.astro](../../examples/astro/src/pages/form-permissions/astro/index.astro), [examples/astro/src/pages/form-permissions/astro/review.astro](../../examples/astro/src/pages/form-permissions/astro/review.astro), [packages/notabenda/src/form-permission-localization-policy.ts](../../packages/notabenda/src/form-permission-localization-policy.ts), [packages/notabenda-cf/src/form-permission-localization-policy.ts](../../packages/notabenda-cf/src/form-permission-localization-policy.ts), [examples/localization/permission-build.mjs](../../examples/localization/permission-build.mjs), [examples/localization/permission.mjs](../../examples/localization/permission.mjs), [packages/notabenda/test/form-permission.test.mjs](../../packages/notabenda/test/form-permission.test.mjs), [docs/verification/form-permissions.md](../../docs/verification/form-permissions.md), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [scripts/check-form-permission-runtime.mjs](../../scripts/check-form-permission-runtime.mjs), [docs/verification/ux-review.md](../../docs/verification/ux-review.md), [packages/notabenda/test/react-form-permission.test.mjs](../../packages/notabenda/test/react-form-permission.test.mjs), [packages/notabenda/test/react-package.test.mjs](../../packages/notabenda/test/react-package.test.mjs), [packages/notabenda/test/astro-form-permission.test.mjs](../../packages/notabenda/test/astro-form-permission.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [packages/notabenda/test/astro-build.test.mjs](../../packages/notabenda/test/astro-build.test.mjs), [site/test/astro-permission.test.mjs](../../site/test/astro-permission.test.mjs), [packages/notabenda/test/form-permission-localization.test.mjs](../../packages/notabenda/test/form-permission-localization.test.mjs)

<a id="req-eu-marketing"></a>

### REQ-EU-MARKETING — Electronic direct marketing and conditioned exceptions

Article 13 distinguishes prior consent for specified electronic marketing, a conditioned existing-customer exception, national choices for other communications and sender/stop-address requirements.

**Applies when:** Relevant electronic direct marketing under applicable national implementation of ePrivacy Article 13.

**Type:** legislation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [ePrivacy Directive consolidated 19 December 2009, Article 13](https://eur-lex.europa.eu/eli/dir/2002/58/2009-12-19/eng) — Article 13(1)–(5) (read; [SRC-EU-EPRIVACY-MARKETING](SOURCES.md#src-eu-eprivacy-marketing)); [EDPB Guidelines 05/2020 on consent, version 1.1](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf) — Sections 3.1.3, 3.3.1, 3.4, 5.1–5.2 (read; [SRC-EU-EDPB-CONSENT](SOURCES.md#src-eu-edpb-consent)).

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-eu-marketing"></a>

**VERIFY-EU-MARKETING (planned):** Review national applicability, conditioned customer exceptions and each message workflow; generic ledger tests are only supporting mechanism evidence.

**Implementation boundary:** Ordinary opt-in/withdrawal mechanics, scoped evidence, examples and optional transactional recovery are implemented. Broader legal/platform acceptance remains incomplete; no supported regional pack or downstream sending claim.

**Limits/open review:** National rules, natural/legal persons, customer exception and actual messages require separate review. Generic optional permission records do not establish permission to send.

**Code/test references:** [packages/notabenda/src/form-permission.ts](../../packages/notabenda/src/form-permission.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/permissions.ts](../../packages/notabenda-cf/src/permissions.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/test/form-permission.test.mjs](../../packages/notabenda/test/form-permission.test.mjs), [docs/verification/form-permissions.md](../../docs/verification/form-permissions.md)

<a id="req-ca-casl-optin"></a>

### REQ-CA-CASL-OPTIN — Affirmative CASL express-consent requests

Express-consent requests require clear purpose and prescribed identification/information; CRTC guidance rejects default opt-out and separates requests from general terms.

**Applies when:** An operator seeks express consent for commercial electronic messages within CASL scope.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [CASL section 10: express consent and implied-consent circumstances](https://laws-lois.justice.gc.ca/eng/acts/E-1.6/section-10.html) — Subsection 10(1); distinguish 10(9)–(10) (read; [SRC-CA-CASL-S10](SOURCES.md#src-ca-casl-s10)); [CRTC 2012-548: consent requests and unsubscribe guidance](https://crtc.gc.ca/eng/archive/2012/2012-548.htm) — Paragraphs 5–20, particularly 16 and 20 (read; [SRC-CA-CRTC-548](SOURCES.md#src-ca-crtc-548)); [CRTC 2012-549: affirmative express consent](https://crtc.gc.ca/eng/archive/2012/2012-549.htm) — Paragraphs 4–8 (read; [SRC-CA-CRTC-549](SOURCES.md#src-ca-crtc-549)).

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-ca-casl-optin"></a>

**VERIFY-CA-CASL-OPTIN (planned):** Review complete prescribed information and affirmative request flow, distinct terms, confirmation and actual unsubscribe delivery/fulfillment; supporting field tests alone do not pass this scenario.

**Implementation boundary:** Ordinary opt-in/withdrawal mechanics, scoped evidence, examples and optional transactional recovery are implemented. Broader legal/platform acceptance remains incomplete; no supported regional pack or downstream sending claim.

**Limits/open review:** Prescribed request/sender particulars, confirmation delivery, message-level unsubscribe fulfillment, applicability and exceptions remain incomplete. Cookie consent and terms acceptance are not CASL permission.

**Code/test references:** [packages/notabenda/src/form-permission.ts](../../packages/notabenda/src/form-permission.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/permissions.ts](../../packages/notabenda-cf/src/permissions.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/test/form-permission.test.mjs](../../packages/notabenda/test/form-permission.test.mjs), [docs/verification/form-permissions.md](../../docs/verification/form-permissions.md)

<a id="req-product-cf-doctor"></a>

### REQ-PRODUCT-CF-DOCTOR — Read-only Cloudflare starter diagnostics with explicit verification boundaries

Inspect a generated local starter without executing project code, reading credentials, installing, contacting endpoints or modifying files. Report bounded local errors separately from manual host access and operational acceptance.

**Applies when:** An adopter explicitly runs notabenda-cf doctor against a local starter.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [Cloudflare: Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) — JSON/JSONC configuration, environment inheritance, static asset worker-first routing and bindings (read; [SRC-CF-WRANGLER-CONFIG](SOURCES.md#src-cf-wrangler-config)); [Cloudflare: Durable Object class exports](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/) — Live SQLite exports and mutual exclusion with legacy migrations (read; [SRC-CF-DO-EXPORTS](SOURCES.md#src-cf-do-exports)).

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-cf-doctor"></a>

**VERIFY-PRODUCT-CF-DOCTOR (automated):** Unchanged local project snapshots; throwing host/build/dynamic settings are not executed; no secret/source strings in diagnostics; malformed JSON/JSONC, missing env bindings, unsafe assets, lifecycle conflicts, symlinks and traversal stay blocked. Packed installed CLI works offline; manual auth/runtime/lifecycle checks cannot be promoted to a production verdict.

**Implementation boundary:** Bounded static JSON/JSONC inspection, explicit named-environment binding selection, worker-first/private file diagnostics, default deny-stub detection and separate review results. Exit status records local blockers only; production readiness stays not-assessed. Packed CLI tested offline.

**Limits/open review:** Checks target the generated starter contract, not arbitrary Wrangler projects. Filename/manifests checks do not establish private-content absence, installed-code integrity, secure authorization, actual endpoint behavior, account/routing correctness, data lifecycle or legal compliance. Doctor performs no automated repair, build or deployment.

**Code/test references:** [packages/notabenda-cf/bin/doctor.mjs](../../packages/notabenda-cf/bin/doctor.mjs), [packages/notabenda-cf/bin/notabenda-cf.mjs](../../packages/notabenda-cf/bin/notabenda-cf.mjs), [packages/notabenda-cf/test/doctor.test.mjs](../../packages/notabenda-cf/test/doctor.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/cloudflare-doctor.md](../../docs/verification/cloudflare-doctor.md)

<a id="req-product-contract-actions"></a>

### REQ-PRODUCT-CONTRACT-ACTIONS — Distinct contract declarations with durable receipt and independent host handoffs

Provide versioned cancellation/withdrawal forms, explicit final actions, a savable exact receipt and transactional application/acknowledgement jobs. Preserve retries and separate visitor claims, receipt, provider acceptance and legal/contract fulfillment. Retire individual declarations without blocking future rights.

**Applies when:** A host explicitly enables the optional contract-action module for its reviewed transaction scope.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Sources:** [Germany BGB section 312k: cancellation](https://www.gesetze-im-internet.de/bgb/BJNR001950896.html#BJNR001950896BJNE030201160) — Section 312k(2)–(5) (read; [SRC-DE-CANCEL](SOURCES.md#src-de-cancel)); [Germany BGB: electronic withdrawal function](https://www.gesetze-im-internet.de/bgb/BJNR001950896.html#BJNR001950896BJNE028702123) — Section 356a(1)–(5) (read; [SRC-DE-WITHDRAW](SOURCES.md#src-de-withdraw)); [Directive 2023/2673: online contract withdrawal function](https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32023L2673) — Article 11a; national implementation remains required (search-result; [SRC-EU-WITHDRAWAL](SOURCES.md#src-eu-withdrawal)); [Brazil Decree 7,962/2013: electronic consumer contracts](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm) — Article 5; additional application-side obligations (read; [SRC-BR-ECOMMERCE](SOURCES.md#src-br-ecommerce)); [Cloudflare: Durable Object alarms](https://developers.cloudflare.com/durable-objects/api/alarms/) — Background and alarm handler retries; host continuation remains necessary (read; [SRC-CF-DO-ALARMS](SOURCES.md#src-cf-do-alarms)).

**Features:** [FEAT-CONTRACT-ACTIONS](../FEATURES.md#feat-contract-actions), [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-contract-actions"></a>

**VERIFY-PRODUCT-CONTRACT-ACTIONS (partial):** Reviewed definition/archive integrity, profile-specific visible actions, deliberate confirmation, exact uncertain retries, atomic receipt/jobs, independent acknowledgement dispatch, expired-lease fencing, private semantic inspection/search, savable copy, per-declaration lifecycle, tab-scoped example recovery and local SQLite restart. Real delivery runners, regional legal review and broader platform acceptance remain open. Dispatch configuration validates before either claim; preflight abort/clock fences prevent external work; provider acceptance stays distinct from unknown settlement; local restart reclaims expired leases with stable downstream deduplication IDs. No timeout/abort authorizes retirement.

<a id="verify-product-transaction-recovery"></a>

**VERIFY-PRODUCT-TRANSACTION-RECOVERY (automated):** Optional local Wrangler SQLite exercise restores eight declaration/order contexts from a pre-delivery KV snapshot while an independent provider retains its history. Verify default-closed access, later hold-first replay, restart-persistent purge, physical event/blob deletion, actual retired admission refusal before host decisions, exact surviving receipts/chunked files, persisted uncertainty and stable-ID retries: nine provider jobs, eighteen attempts, nine commits. Trusted fixture journal and simulated provider only; no all-family or production acceptance claim.

**Implementation boundary:** Versioned archive-bound definitions, visible-field validation, native forms/headless state, bounded exact retry/recovery, transactional capture and independent leased jobs, immutable at-capture copy, provider CAS, private semantic inspection/search and per-declaration lifecycle. The isolated example deliberately retains its recovery command within a session-scoped tab, with no mount-time transport. Local SQLite capture/restart verified; real runners, provider delivery, regional and platform acceptance remain open. Optional single/paired dispatch runners validate before claim, bound asynchronous provider attempts, preserve independent acknowledgement, fence late results and report provider/settlement outcomes separately. Real SQLite restart/deduplication is verified with test-only provider simulation; production scheduling/provider delivery remains open.

**Limits/open review:** Initial email-acknowledgement mechanics, not complete regional packs or a delivery service. Host admission/anti-abuse, actual prompt dispatch, identity/contract matching, provider idempotency, fulfillment, refunds, retention and operational rehearsal remain necessary. Published form documents do not establish the original contract terms.

**Code/test references:** [packages/notabenda/src/contract-action-policy.ts](../../packages/notabenda/src/contract-action-policy.ts), [packages/notabenda/src/contract-action.ts](../../packages/notabenda/src/contract-action.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/contract-action-policy.ts](../../packages/notabenda-cf/src/contract-action-policy.ts), [packages/notabenda-cf/src/contracts.ts](../../packages/notabenda-cf/src/contracts.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/records.ts](../../packages/notabenda-cf/src/records.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/contract-actions/build.mjs](../../examples/contract-actions/build.mjs), [examples/contract-actions/client.mjs](../../examples/contract-actions/client.mjs), [examples/contract-actions/style.css](../../examples/contract-actions/style.css), [site/contract-context.mjs](../../site/contract-context.mjs), [site/contract-seed.mjs](../../site/contract-seed.mjs), [site/demo-host.mjs](../../site/demo-host.mjs), [site/worker.mjs](../../site/worker.mjs), [site/host.mjs](../../site/host.mjs), [packages/notabenda-cf/src/contract-dispatch.ts](../../packages/notabenda-cf/src/contract-dispatch.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/test/contract-action.test.mjs](../../packages/notabenda/test/contract-action.test.mjs), [packages/notabenda-cf/test/contracts.test.mjs](../../packages/notabenda-cf/test/contracts.test.mjs), [docs/verification/contract-actions.md](../../docs/verification/contract-actions.md), [site/test/contracts.test.mjs](../../site/test/contracts.test.mjs), [scripts/check-contract-actions-runtime.mjs](../../scripts/check-contract-actions-runtime.mjs), [packages/notabenda-cf/test/contract-dispatch.test.mjs](../../packages/notabenda-cf/test/contract-dispatch.test.mjs), [scripts/check-contract-dispatch-runtime.mjs](../../scripts/check-contract-dispatch-runtime.mjs), [scripts/fixtures/contract-dispatch-worker.mjs](../../scripts/fixtures/contract-dispatch-worker.mjs), [docs/verification/contract-dispatch.md](../../docs/verification/contract-dispatch.md), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs), [docs/verification/setup.md](../../docs/verification/setup.md), [site/test/demo-upgrade.test.mjs](../../site/test/demo-upgrade.test.mjs), [scripts/check-transaction-recovery.mjs](../../scripts/check-transaction-recovery.mjs), [scripts/fixtures/transaction-recovery-worker.mjs](../../scripts/fixtures/transaction-recovery-worker.mjs)

<a id="req-product-syntax-highlighting"></a>

### REQ-PRODUCT-SYNTAX-HIGHLIGHTING — Readable syntax-highlighted source examples

Render source examples with safe static language-aware highlighting, selectable source, accessible contrast and contained mobile scrolling.

**Applies when:** The website presents fenced source code or installation commands.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — Contrast, keyboard focus and reflow (read; [SRC-WCAG](SOURCES.md#src-wcag)).

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-syntax-highlighting"></a>

**VERIFY-PRODUCT-SYNTAX-HIGHLIGHTING (automated):** Built examples preserve exact text, safely escape content, load external token CSS, meet light/dark palette contrast and support focus/forced colors without browser scripts.

**Implementation boundary:** Build-time Shiki grammars emit escaped text spans and external contrast-adjusted theme CSS. No runtime highlighting scripts or inline styles.

**Limits/open review:** Unknown languages render as escaped plain text. This is a presentation standard, not a complete accessibility certification.

**Code/test references:** [site/syntax.mjs](../../site/syntax.mjs), [site/build.mjs](../../site/build.mjs), [docs/DESIGN.md](../../docs/DESIGN.md), [site/test/syntax.test.mjs](../../site/test/syntax.test.mjs), [docs/verification/syntax-highlighting.md](../../docs/verification/syntax-highlighting.md)

<a id="req-product-bundle-budget"></a>

### REQ-PRODUCT-BUNDLE-BUDGET — Measured browser delivery and optional component styles

Measure actual browser bundles and published CSS; target 15 KiB gzip for core plus vanilla controls and 5 KiB for default consent CSS, reporting broader optional surfaces separately. Preserve validation and effective-permission behavior. Measure fresh-controller setup, granted snapshots and synchronous choice calls through public factories with explicit synthetic inputs, sample distributions and timing limits.

**Applies when:** Documenting or releasing browser runtime and stylesheet entry points.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Sources:** [W3C High Resolution Time](https://www.w3.org/TR/hr-time-3/) — Introduction; sections 5, 7.1 and 9.1: monotonic timestamps, now() and clock resolution. (read; [SRC-W3C-HIGH-RESOLUTION-TIME](SOURCES.md#src-w3c-high-resolution-time)).

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-CONTROLS](../FEATURES.md#feat-controls).

<a id="verify-product-bundle-budget"></a>

**VERIFY-PRODUCT-BUNDLE-BUDGET (partial):** Compiled local consent plus controls stays below 15 KiB gzip and excludes full site validation, evidence implementation and build/backend/framework modules; exact scope and lifecycle parity tests pass. Required receipt and compatibility profiles are reported separately. Consent CSS stays below 5 KiB; compatibility target, full page startup/interaction and broader platforms remain open. Synthetic fresh-constructor, snapshot and synchronous choice distributions are reported without timing pass/fail gates; semantic tests retain fresh restrictions, expiry, detached snapshots and lifecycle cleanup.

**Implementation boundary:** Build-time full validation produces a bounded, independently parsed browser inventory with exact legacy material scopes. The shared engine keeps required evidence in an explicit optional entry and records authorization provenance on local choices. Consent-only CSS preserves canonical cascade and accessibility rules. Compatibility core-controls still exceeds target. Detached service indexing and direct per-service GPC checks avoid repeated full-inventory restriction maps. Processing state is shared only inside one snapshot; live queries and lifecycle starts recheck restrictions. Optional Node/browser tools measure three synthetic inventories through both public local factories, including native control updates in the browser, without runtime imports or remote services. Startup module loading, paint/INP, receipts, attached processing controllers and broader platforms remain outside these timing results. CLI build can explicitly emit the bounded local/required descriptor and consent-only CSS from any supported configuration format. An output directory with an existing descriptor requires an explicit mode on rebuild; host lifecycle and receipt connections remain separate.

**Limits/open review:** The compiled local consent-plus-controls profile meets 15 KiB gzip; the fully validating compatibility entry remains above target. Optional required-receipt code is reported separately. Transfer size is not startup/interaction timing or a full performance audit. Adopters choose whether to gate on the optional measurement tool.

**Code/test references:** [scripts/measure-bundles.mjs](../../scripts/measure-bundles.mjs), [packages/notabenda/scripts/consent-styles.mjs](../../packages/notabenda/scripts/consent-styles.mjs), [examples/static/build.mjs](../../examples/static/build.mjs), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [examples/static/choices-page.mjs](../../examples/static/choices-page.mjs), [examples/static/consent.mjs](../../examples/static/consent.mjs), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-compile.ts](../../packages/notabenda/src/consent-compile.ts), [packages/notabenda/src/consent-runtime.ts](../../packages/notabenda/src/consent-runtime.ts), [packages/notabenda/src/consent-evidence-factory.ts](../../packages/notabenda/src/consent-evidence-factory.ts), [packages/notabenda/src/consent-runtime-evidence.ts](../../packages/notabenda/src/consent-runtime-evidence.ts), [packages/notabenda/src/react-consent.ts](../../packages/notabenda/src/react-consent.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [scripts/consent-performance.mjs](../../scripts/consent-performance.mjs), [scripts/performance-inventories.mjs](../../scripts/performance-inventories.mjs), [scripts/measure-consent-performance.mjs](../../scripts/measure-consent-performance.mjs), [scripts/build-performance-fixture.mjs](../../scripts/build-performance-fixture.mjs), [scripts/performance-browser-app.mjs](../../scripts/performance-browser-app.mjs), [scripts/serve-performance.mjs](../../scripts/serve-performance.mjs), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/test/delivery.test.mjs](../../packages/notabenda/test/delivery.test.mjs), [docs/verification/browser-delivery.md](../../docs/verification/browser-delivery.md), [site/test/delivery.test.mjs](../../site/test/delivery.test.mjs), [packages/notabenda/test/consent-runtime.test.mjs](../../packages/notabenda/test/consent-runtime.test.mjs), [packages/notabenda/test/react-consent.test.mjs](../../packages/notabenda/test/react-consent.test.mjs), [packages/notabenda/test/consent-performance.test.mjs](../../packages/notabenda/test/consent-performance.test.mjs), [docs/verification/consent-performance.md](../../docs/verification/consent-performance.md), [packages/notabenda/test/consent-build-cli.test.mjs](../../packages/notabenda/test/consent-build-cli.test.mjs)

<a id="req-product-service-catalog"></a>

### REQ-PRODUCT-SERVICE-CATALOG — Source-backed third-party catalog and resolved disclosures

Standardize provider/product identities and source-backed facts, resolve reviewed site-specific use into shared public rendering, and pin revisions for immutable release history.

**Applies when:** Confirmed service selection or catalog-backed legal/preference/directory rendering.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Sources:** [Open Cookie Database: cookie metadata CSV](https://github.com/jkwakman/Open-Cookie-Database) — README: download formats, wildcard matching and contributions (read; [SRC-OPEN-COOKIE-DATABASE](SOURCES.md#src-open-cookie-database)); [Open Cookie Database repository license](https://github.com/jkwakman/Open-Cookie-Database/blob/master/LICENSE) — Apache-2.0 sections 2 and 4; candidate reuse and attribution (read; [SRC-OPEN-COOKIE-LICENSE](SOURCES.md#src-open-cookie-license)).

**Features:** [FEAT-SERVICE-CATALOG](../FEATURES.md#feat-service-catalog), [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-service-catalog"></a>

**VERIFY-PRODUCT-SERVICE-CATALOG (partial):** Schema and source/version validation, operator overrides/custom entries, selected-only browser graphs, shared renderer parity and unchanged pinned historical documents.

**Implementation boundary:** Optional versioned catalog normalization/search, licensed offline seed and source-linked public directory views now connect to CLI/admin setup review. Explicit selection supplies actual provider/location/purposes, preserves integrations/restrictions, and keeps minimized pinned reference metadata plus justification in a bounded private setup report. Resume checks the matching declared service facts. Optional browser recognition now preserves its complete rule/source snapshot. Optional documentation profiles now cover eight products; independent provider-practice review and broader coverage remain open. Explicit wizard --project scanning now feeds the same actual-use confirmation as manual catalog search and writes separate private discovery findings. Noninteractive runs preserve prior pins and never select services from matches. Setup/catalog JSON and tracked source reads reject nonregular inputs without FIFO blocking. Browser/admin local-filesystem scanning remains unavailable. Explicit CLI/admin renewal compares selected reference/service/purpose facts, requires a new private reason and confirmation, rejects stale full-service snapshots and retains prior/next pins in bounded private report history. Operator labels and enforcement settings remain unchanged; focused CLI review does not reapply historical setup facts. Explicit post-compilation catalog finalization now binds current selected reference/site-use facts to a digest-only public descriptor and separate archive. Exact legal/source bytes are preserved; CF validates immutable storage and separately granted inspection/comparison. Justifications and questionnaire/re-review history stay outside the attachment.

**Limits/open review:** Catalog facts and imported categories do not decide a site’s legal basis, provider role, actual settings, necessity or complete disclosure. Entries remain unreviewed after an operator declares actual use. Purposes must be explicitly declared through setup authoring or imported config; setup does not invent their meaning or legal basis. Private report pins do not automatically become archived legal-release evidence.

**Code/test references:** [packages/notabenda/src/catalog.ts](../../packages/notabenda/src/catalog.ts), [packages/notabenda/src/catalog-seed.ts](../../packages/notabenda/src/catalog-seed.ts), [packages/notabenda/src/catalog-cli.ts](../../packages/notabenda/src/catalog-cli.ts), [scripts/build-service-catalog.py](../../scripts/build-service-catalog.py), [docs/SERVICE-CATALOG.md](../../docs/SERVICE-CATALOG.md), [packages/notabenda/src/service-inventory.ts](../../packages/notabenda/src/service-inventory.ts), [packages/notabenda/src/service-directory.ts](../../packages/notabenda/src/service-directory.ts), [packages/notabenda/src/services.css](../../packages/notabenda/src/services.css), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/ServiceDirectory.astro](../../packages/notabenda/src/astro/ServiceDirectory.astro), [examples/services/build.mjs](../../examples/services/build.mjs), [docs/SERVICES.md](../../docs/SERVICES.md), [packages/notabenda/src/catalog-plain.ts](../../packages/notabenda/src/catalog-plain.ts), [packages/notabenda/src/catalog-selection.ts](../../packages/notabenda/src/catalog-selection.ts), [packages/notabenda/src/catalog-ui.ts](../../packages/notabenda/src/catalog-ui.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/src/setup-purpose.ts](../../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/src/setup-purpose-ui.ts](../../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-purpose-cli.ts](../../packages/notabenda/src/setup-purpose-cli.ts), [packages/notabenda/src/catalog-browser.ts](../../packages/notabenda/src/catalog-browser.ts), [packages/notabenda/src/catalog-browser-policy.ts](../../packages/notabenda/src/catalog-browser-policy.ts), [packages/notabenda/src/catalog-browser-capture.ts](../../packages/notabenda/src/catalog-browser-capture.ts), [packages/notabenda/src/catalog-browser-cli.ts](../../packages/notabenda/src/catalog-browser-cli.ts), [packages/notabenda/src/catalog-browser-ui.ts](../../packages/notabenda/src/catalog-browser-ui.ts), [packages/notabenda/src/discovery-capture.ts](../../packages/notabenda/src/discovery-capture.ts), [packages/notabenda/src/discovery-ui.ts](../../packages/notabenda/src/discovery-ui.ts), [catalog/browser-rules.json](../../catalog/browser-rules.json), [catalog/browser-providers.json](../../catalog/browser-providers.json), [packages/notabenda/src/setup-catalog-cli.ts](../../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda/src/cli-json.ts](../../packages/notabenda/src/cli-json.ts), [packages/notabenda/src/catalog-node.ts](../../packages/notabenda/src/catalog-node.ts), [packages/notabenda/src/catalog-review.ts](../../packages/notabenda/src/catalog-review.ts), [packages/notabenda/src/catalog-review-ui.ts](../../packages/notabenda/src/catalog-review-ui.ts), [packages/notabenda/src/catalog-review-cli.ts](../../packages/notabenda/src/catalog-review-cli.ts), [packages/notabenda/src/catalog-release.ts](../../packages/notabenda/src/catalog-release.ts), [packages/notabenda/src/catalog-release-policy.ts](../../packages/notabenda/src/catalog-release-policy.ts), [packages/notabenda/src/catalog-reference.ts](../../packages/notabenda/src/catalog-reference.ts), [packages/notabenda-cf/src/catalog-release-policy.ts](../../packages/notabenda-cf/src/catalog-release-policy.ts), [packages/notabenda-cf/src/catalog-reference.ts](../../packages/notabenda-cf/src/catalog-reference.ts), [packages/notabenda-cf/src/history.ts](../../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/catalog-render.ts](../../packages/notabenda-cf/src/catalog-render.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [examples/catalog-releases/build.mjs](../../examples/catalog-releases/build.mjs), [packages/notabenda/test/catalog.test.mjs](../../packages/notabenda/test/catalog.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/service-catalog.md](../../docs/verification/service-catalog.md), [packages/notabenda/test/services.test.mjs](../../packages/notabenda/test/services.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/services.test.mjs](../../site/test/services.test.mjs), [packages/notabenda/test/catalog-selection.test.mjs](../../packages/notabenda/test/catalog-selection.test.mjs), [site/test/catalog-setup.test.mjs](../../site/test/catalog-setup.test.mjs), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs), [packages/notabenda/test/catalog-browser.test.mjs](../../packages/notabenda/test/catalog-browser.test.mjs), [packages/notabenda/test/catalog-browser-workflow.test.mjs](../../packages/notabenda/test/catalog-browser-workflow.test.mjs), [packages/notabenda/test/setup-project.test.mjs](../../packages/notabenda/test/setup-project.test.mjs), [packages/notabenda/test/catalog-review.test.mjs](../../packages/notabenda/test/catalog-review.test.mjs), [docs/verification/catalog-review.md](../../docs/verification/catalog-review.md), [packages/notabenda/test/catalog-release.test.mjs](../../packages/notabenda/test/catalog-release.test.mjs), [docs/verification/catalog-release.md](../../docs/verification/catalog-release.md), [site/test/host.test.mjs](../../site/test/host.test.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs)

<a id="req-product-service-detection"></a>

### REQ-PRODUCT-SERVICE-DETECTION — Explainable passive third-party recognition

Recognize candidate products with bounded exact, pattern and combined passive signals, minimize retained observations and require review before configuration changes. Initial static project discovery covers declared SDK dependencies/imports and Terraform names without project execution or network probes. Go discovery distinguishes declared and indirect requirements and test-file imports; unresolved module/workspace choices remain limited coverage.

**Applies when:** An authorized operator explicitly invokes catalog-backed service discovery.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Sources:** [Google Tag official technical reference](https://developers.google.com/tag-platform/gtagjs) — Google tag loader path and gtag bootstrap; one tag can have multiple product destinations (read; [SRC-BROWSER-GOOGLE-TAG](SOURCES.md#src-browser-google-tag)); [Google Gtm official technical reference](https://developers.google.com/tag-platform/tag-manager/protocol-relative-url?hl=en) — Tag Manager script/frame paths; only HTTPS is recognized by these rules (read; [SRC-BROWSER-GOOGLE-GTM](SOURCES.md#src-browser-google-gtm)); [Stripe Js official technical reference](https://docs.stripe.com/js) — Documented script delivery host; no payment feature or provider-practice classification (read; [SRC-BROWSER-STRIPE-JS](SOURCES.md#src-browser-stripe-js)); [Stripe Version official technical reference](https://docs.stripe.com/sdks/stripejs-versioning) — Versioned loader path and supported legacy v3 delivery. Rule is not a version recommendation (read; [SRC-BROWSER-STRIPE-VERSION](SOURCES.md#src-browser-stripe-version)); [Turnstile official technical reference](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) — Widget loader path, div class marker and turnstile API object. No challenge is executed (read; [SRC-BROWSER-TURNSTILE](SOURCES.md#src-browser-turnstile)); [Intercom official technical reference](https://developers.intercom.com/installing-intercom/web/installation) — Widget loader prefix and Intercom function; app/workspace suffix is never exported as a witness (read; [SRC-BROWSER-INTERCOM](SOURCES.md#src-browser-intercom)); [Posthog Cookie official technical reference](https://posthog.com/tutorials/nextjs-analytics) — Official tutorial excerpt describes a project-token-derived cookie name; only the name pattern is matched, never its value (read; [SRC-BROWSER-POSTHOG-COOKIE](SOURCES.md#src-browser-posthog-cookie)); [Posthog Loader official technical reference](https://posthog.com/tutorials/framer-analytics) — Official tutorial excerpt describes asset-host rewriting and the array.js path. Custom hosts and proxies may not match (read; [SRC-BROWSER-POSTHOG-LOADER](SOURCES.md#src-browser-posthog-loader)); [Posthog Regions official technical reference](https://posthog.com/docs/advanced/proxy/nextjs-middleware) — Official proxy guide names US and EU asset hosts (read; [SRC-BROWSER-POSTHOG-REGIONS](SOURCES.md#src-browser-posthog-regions)); [Go modules reference](https://go.dev/ref/mod) — Line-oriented require declarations, quoted paths, indirect comments and replacement/exclusion semantics. Used for passive lexical discovery, not build graph resolution; external documentation is not reproduced. (read; [SRC-GO-MODULES](SOURCES.md#src-go-modules)); [Go specification: import declarations](https://go.dev/ref/spec#Import_declarations) — Import specifications, aliases, blank/dot imports and string literals. The scanner uses a bounded lexical subset without compiling source or interpreting escaped import paths. (read; [SRC-GO-IMPORTS](SOURCES.md#src-go-imports)); [Go module-file indirect requirement recognition](https://github.com/golang/mod/blob/master/modfile/rule.go) — isIndirect and setIndirect: exact marker and explanatory suffix handling. (read; [SRC-GO-MODFILE](SOURCES.md#src-go-modfile)); [Segment Snippet technical recognition reference](https://github.com/segmentio/analytics-react/blob/master/README.md) — First-party repository snippet names the cdn.segment.com analytics.js/v1/key/analytics.min.js loader and analytics queue. The older snippet is a recognition reference, not an SDK installation recommendation. (read; [SRC-BROWSER-SEGMENT-SNIPPET](SOURCES.md#src-browser-segment-snippet)); [Sentry Loader technical recognition reference](https://docs.sentry.io/platforms/javascript/install/loader/) — Retrieved official loader documentation, including public-key-derived .min.js loader shape and configurable SDK features. (read; [SRC-BROWSER-SENTRY-LOADER](SOURCES.md#src-browser-sentry-loader)); [Sentry Loader Host technical recognition reference](https://sentry.io/resources/debugging-ecommerce-session-replay/) — Official tutorial names js.sentry-cdn.com/[hash].min.js. Feature settings cannot be inferred from that URL. (read; [SRC-BROWSER-SENTRY-LOADER-HOST](SOURCES.md#src-browser-sentry-loader-host)); [Datadog Rum technical recognition reference](https://docs.datadoghq.com/real_user_monitoring/application_monitoring/browser/setup/) — Retrieved current setup examples for eight v7 region/root CDN URLs. The authored directory-path rule deliberately generalizes region/version strings under the same exact host and filename; it does not validate SDK versions. (read; [SRC-BROWSER-DATADOG-RUM](SOURCES.md#src-browser-datadog-rum)); [Zendesk Widget technical recognition reference](https://developer.zendesk.com/documentation/classic-web-widget-sdks/web-widget/quickstart-tutorials/web-widget-javascript-apis/) — Official Web Widget Classic snippet names static.zdassets.com/ekr/snippet.js with a query key. No widget feature, workspace key or settings are inspected. (read; [SRC-BROWSER-ZENDESK-WIDGET](SOURCES.md#src-browser-zendesk-widget)); [Cloudflare Analytics technical recognition reference](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/) — Official Web Analytics reference names static.cloudflareinsights.com/beacon.min.js. This is not evidence of a Worker, Turnstile or a particular account setting. (read; [SRC-BROWSER-CLOUDFLARE-ANALYTICS](SOURCES.md#src-browser-cloudflare-analytics)); [Plausible Loader technical recognition reference](https://plausible.io/docs/nextjs-integration) — Official integration guide supplies a site-specific plausible.io/js/pa-XXXXX.js script reference. The single-star rule generalizes its opaque site suffix; it does not inspect that suffix. (read; [SRC-BROWSER-PLAUSIBLE-LOADER](SOURCES.md#src-browser-plausible-loader)); [Plausible Update technical recognition reference](https://plausible.io/docs/script-update-guide) — Official October 2025 script update explains site-specific snippets and optional enhanced measurements. Recognition cannot determine which settings are enabled. (read; [SRC-BROWSER-PLAUSIBLE-UPDATE](SOURCES.md#src-browser-plausible-update)); [Fathom Loader technical recognition reference](https://usefathom.com/docs/script/script-advanced) — Official examples use cdn.usefathom.com/script.js and describe optional script attributes. Only the script host/path is recognized; no settings are read. (read; [SRC-BROWSER-FATHOM-LOADER](SOURCES.md#src-browser-fathom-loader)); [Umami Loader technical recognition reference](https://docs.umami.is/docs/bypass-ad-blockers) — Official reference names cloud.umami.is/script.js and separately describes proxies, renamed scripts and self-hosting, which this cloud-path rule may miss. (read; [SRC-BROWSER-UMAMI-LOADER](SOURCES.md#src-browser-umami-loader)); [Clarity Loader technical recognition reference](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup) — Official manual installation page supplies the tracking-code image; the separate image was inspected to read its host/path and clarity queue function. (read; [SRC-BROWSER-CLARITY-LOADER](SOURCES.md#src-browser-clarity-loader)); [Clarity Code Image technical recognition reference](https://learn.microsoft.com/en-us/clarity/media/copy-tracking-code.png) — Inspected official code image: www.clarity.ms/tag/ plus a project suffix and a clarity function. No project ID is retained in witnesses and no SDK method is invoked. (read; [SRC-BROWSER-CLARITY-CODE-IMAGE](SOURCES.md#src-browser-clarity-code-image)); [Crisp Loader technical recognition reference](https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/language-customization/) — Official snippet names client.crisp.chat/l.js and the $crisp queue object. Recognition checks only own data-descriptor presence, never queue contents or website/session identifiers. (read; [SRC-BROWSER-CRISP-LOADER](SOURCES.md#src-browser-crisp-loader)); [Plausible Npm technical recognition reference](https://plausible.io/docs/plausible-script) — Official script guide identifies @plausible-analytics/tracker as its npm library; package declaration/import evidence is separate from browser execution. (read; [SRC-BROWSER-PLAUSIBLE-NPM](SOURCES.md#src-browser-plausible-npm)); [Crisp Npm technical recognition reference](https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/npm/) — Official SDK documentation identifies crisp-sdk-web and its import; installing or importing the wrapper does not establish loading, actual settings or use. (read; [SRC-BROWSER-CRISP-NPM](SOURCES.md#src-browser-crisp-npm)); [Plausible Legacy technical recognition reference](https://plausible.github.io/docs/plausible-script) — Archived first-party documentation supplies the older /js/script.js loader. Retained for recognition, not a current installation recommendation. Technical reference only; no provider-practice or legal classification. (read; [SRC-BROWSER-PLAUSIBLE-LEGACY](SOURCES.md#src-browser-plausible-legacy)); [Plausible Extensions technical recognition reference](https://plausible.github.io/docs/excluding-pages) — Archived first-party documentation supplies script.exclusions.js and a chained-extension example. The authored single-star pattern generalizes the extension suffix; it does not determine active options. Technical reference only; no provider-practice or legal classification. (read; [SRC-BROWSER-PLAUSIBLE-EXTENSIONS](SOURCES.md#src-browser-plausible-extensions)).

**Features:** [FEAT-SERVICE-CATALOG](../FEATURES.md#feat-service-catalog), [FEAT-DISCOVERY](../FEATURES.md#feat-discovery), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-service-detection"></a>

**VERIFY-PRODUCT-SERVICE-DETECTION (partial):** Positive/negative and shared-host fixtures, bounded hostile patterns, no probe requests or SDK/getter execution, minimized witnesses with explicit legacy-name sensitivity, exact snapshot compatibility, unavailable/limited coverage and review-before-apply. Go cases distinguish direct/indirect/test evidence, skip comment/literal confusers, flag unresolved replacements/workspaces and preserve private output and prior pins. Expanded source cases exercise ten product families through both observation channels, partial queues/getters, confusers, historical snapshot preservation and three npm identities.

**Implementation boundary:** Bounded offline Node scanner and npx CLI, Git ignore-aware selection with fsmonitor disabled, built-in non-Git skips, source/development evidence labels and private exclusive review outputs are implemented. Optional browser path/name/global/marker and combined rules now add minimized channel witnesses, exact rule/source snapshots, local review UI and explicit CLI analysis. Arbitrary regex/executable rules are unsupported. Broader project detectors and automated release-provenance archival remain planned. Explicit wizard --project scanning now feeds the same actual-use confirmation as manual catalog search and writes separate private discovery findings. Noninteractive runs preserve prior pins and never select services from matches. Setup/catalog JSON and tracked source reads reject nonregular inputs without FIFO blocking. Browser/admin local-filesystem scanning remains unavailable. Browser setup links to offline project discovery and displays the npx command for dependency/infrastructure coverage, with manual review and private-report handling. The UI does not execute commands or inspect the local project. Ten additional browser-service signatures now cover common analytics, monitoring and support references, for nineteen rules across sixteen products. Seventeen new first-party references and three official npm identifiers connect to reviewed candidates; older capture snapshots and unaffected product pins remain unchanged. Rule patterns do not validate SDK versions or infer enabled features, execution, identity or legal exemptions.

**Limits/open review:** A matched signature is a candidate, not execution, ownership, permission, legal classification or absence-of-tracking proof. Existing version-1 captures remain origin/name-only. Advanced code never arrives as executable catalog data. New recognition witnesses exclude observed paths/query/storage/global values; the embedded v1 origins, storage names and labels may still include identifiers. Combined signals need not be simultaneous or causal. Snapshots are unverified reports, not authenticated evidence.

**Code/test references:** [packages/notabenda/src/catalog-project.ts](../../packages/notabenda/src/catalog-project.ts), [packages/notabenda/src/catalog-cli.ts](../../packages/notabenda/src/catalog-cli.ts), [packages/notabenda/src/discovery-cli.ts](../../packages/notabenda/src/discovery-cli.ts), [packages/notabenda/src/catalog-browser.ts](../../packages/notabenda/src/catalog-browser.ts), [packages/notabenda/src/catalog-browser-policy.ts](../../packages/notabenda/src/catalog-browser-policy.ts), [packages/notabenda/src/catalog-browser-capture.ts](../../packages/notabenda/src/catalog-browser-capture.ts), [packages/notabenda/src/catalog-browser-cli.ts](../../packages/notabenda/src/catalog-browser-cli.ts), [packages/notabenda/src/catalog-browser-ui.ts](../../packages/notabenda/src/catalog-browser-ui.ts), [packages/notabenda/src/discovery-capture.ts](../../packages/notabenda/src/discovery-capture.ts), [packages/notabenda/src/discovery-ui.ts](../../packages/notabenda/src/discovery-ui.ts), [catalog/browser-rules.json](../../catalog/browser-rules.json), [catalog/browser-providers.json](../../catalog/browser-providers.json), [packages/notabenda/src/setup-catalog-cli.ts](../../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda/src/cli-json.ts](../../packages/notabenda/src/cli-json.ts), [packages/notabenda/src/catalog-node.ts](../../packages/notabenda/src/catalog-node.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/catalog-go.ts](../../packages/notabenda/src/catalog-go.ts), [catalog/go-providers.json](../../catalog/go-providers.json), [packages/notabenda/src/catalog-go-policy.ts](../../packages/notabenda/src/catalog-go-policy.ts), [packages/notabenda-cf/src/catalog-go-policy.ts](../../packages/notabenda-cf/src/catalog-go-policy.ts), [packages/notabenda-cf/src/catalog-reference.ts](../../packages/notabenda-cf/src/catalog-reference.ts), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [catalog/browser-expansion.json](../../catalog/browser-expansion.json), [scripts/build-service-catalog.py](../../scripts/build-service-catalog.py), [packages/notabenda/test/catalog.test.mjs](../../packages/notabenda/test/catalog.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/service-catalog.md](../../docs/verification/service-catalog.md), [packages/notabenda/test/catalog-browser.test.mjs](../../packages/notabenda/test/catalog-browser.test.mjs), [packages/notabenda/test/catalog-browser-workflow.test.mjs](../../packages/notabenda/test/catalog-browser-workflow.test.mjs), [packages/notabenda/test/setup-project.test.mjs](../../packages/notabenda/test/setup-project.test.mjs), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs), [packages/notabenda/test/catalog-go.test.mjs](../../packages/notabenda/test/catalog-go.test.mjs), [docs/verification/go-discovery.md](../../docs/verification/go-discovery.md), [packages/notabenda/test/catalog-release.test.mjs](../../packages/notabenda/test/catalog-release.test.mjs), [packages/notabenda/test/catalog-browser-expansion.test.mjs](../../packages/notabenda/test/catalog-browser-expansion.test.mjs), [site/test/browser-service-coverage.test.mjs](../../site/test/browser-service-coverage.test.mjs)

<a id="req-product-service-profiles"></a>

### REQ-PRODUCT-SERVICE-PROFILES — Sourced product documentation in service review

Keep bounded, optional product notes, document links and site-specific review questions tied to public sources, selected revisions and retained review history.

**Applies when:** A catalog product supplies a documentation profile during explicit service review or retained-reference inspection.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Sources:** [Workers placement](https://developers.cloudflare.com/workers/configuration/placement/) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-CLOUDFLARE-PLACEMENT](SOURCES.md#src-profile-cloudflare-placement)); [Regional Services for Workers](https://developers.cloudflare.com/data-localization/how-to/workers/) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-CLOUDFLARE-REGIONAL](SOURCES.md#src-profile-cloudflare-regional)); [Cloudflare privacy policy](https://www.cloudflare.com/privacypolicy/) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-CLOUDFLARE-PRIVACY](SOURCES.md#src-profile-cloudflare-privacy)); [Cloudflare customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-CLOUDFLARE-DPA](SOURCES.md#src-profile-cloudflare-dpa)); [Stripe privacy center](https://stripe.com/legal/privacy-center) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-STRIPE-ROLES](SOURCES.md#src-profile-stripe-roles)); [Stripe privacy policy](https://stripe.com/privacy) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-STRIPE-PRIVACY](SOURCES.md#src-profile-stripe-privacy)); [Stripe DPA](https://stripe.com/legal/dpa) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-STRIPE-DPA](SOURCES.md#src-profile-stripe-dpa)); [Supabase project regions](https://supabase.com/docs/guides/platform/regions) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-REGIONS](SOURCES.md#src-profile-supabase-regions)); [Supabase residency and transfers FAQ](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-RESIDENCY](SOURCES.md#src-profile-supabase-residency)); [Supabase self-hosting](https://supabase.com/docs/guides/self-hosting) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-SELF-HOSTING](SOURCES.md#src-profile-supabase-self-hosting)); [Supabase privacy policy](https://supabase.com/privacy) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-PRIVACY](SOURCES.md#src-profile-supabase-privacy)); [Supabase DPA](https://supabase.com/legal/customer-resources/data-processing-addendum) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-DPA](SOURCES.md#src-profile-supabase-dpa)); [Resend GDPR and storage FAQ](https://resend.com/security/gdpr) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-RESEND-STORAGE](SOURCES.md#src-profile-resend-storage)); [Resend domain settings](https://resend.com/docs/dashboard/domains/introduction) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-RESEND-DOMAINS](SOURCES.md#src-profile-resend-domains)); [Resend privacy policy](https://resend.com/legal/privacy-policy) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-RESEND-PRIVACY](SOURCES.md#src-profile-resend-privacy)); [Clerk authentication cookies](https://clerk.com/docs/guides/how-clerk-works/cookies) — How Clerk uses cookies; deployment-specific storage inventory remains required. (read; [SRC-PROFILE-CLERK-COOKIES](SOURCES.md#src-profile-clerk-cookies)); [Clerk user metadata](https://clerk.com/docs/guides/users/extending) — Types of metadata and metadata in the session token. (read; [SRC-PROFILE-CLERK-METADATA](SOURCES.md#src-profile-clerk-metadata)); [Clerk privacy policy](https://clerk.com/legal/privacy) — Scope: customer records, customer privacy policies and contractual processing. (read; [SRC-PROFILE-CLERK-PRIVACY](SOURCES.md#src-profile-clerk-privacy)); [Clerk data processing addendum](https://clerk.com/legal/dpa) — Parties and Background; actual customer agreement must be verified. (read; [SRC-PROFILE-CLERK-DPA](SOURCES.md#src-profile-clerk-dpa)); [Vercel Function regions](https://vercel.com/docs/functions/configuring-functions/region) — Static delivery, project and per-function regions, middleware and failover. (read; [SRC-PROFILE-VERCEL-REGIONS](SOURCES.md#src-profile-vercel-regions)); [Vercel logs and drains](https://vercel.com/docs/logs) — Build, runtime, activity, audit logs and configured log drains. (read; [SRC-PROFILE-VERCEL-LOGS](SOURCES.md#src-profile-vercel-logs)); [Vercel privacy notice](https://vercel.com/legal/privacy-notice) — Scope of the notice versus processing under customer instructions. (read; [SRC-PROFILE-VERCEL-PRIVACY](SOURCES.md#src-profile-vercel-privacy)); [Vercel data processing addendum](https://vercel.com/legal/dpa) — Introduction and Role and Scope; plan and agreement conditions. (read; [SRC-PROFILE-VERCEL-DPA](SOURCES.md#src-profile-vercel-dpa)); [PostHog collection controls](https://posthog.com/docs/privacy/data-collection) — Opt-in/out, opt-out persistence and separate autocapture controls. (read; [SRC-PROFILE-POSTHOG-COLLECTION](SOURCES.md#src-profile-posthog-collection)); [PostHog replay privacy controls](https://posthog.com/docs/session-replay/privacy) — Input masking, content controls and network capture. (read; [SRC-PROFILE-POSTHOG-REPLAY](SOURCES.md#src-profile-posthog-replay)); [PostHog storage and deletion controls](https://posthog.com/docs/privacy/data-storage) — Collection versus server-side transformations and IP discarding. (read; [SRC-PROFILE-POSTHOG-STORAGE](SOURCES.md#src-profile-posthog-storage)); [PostHog privacy policy](https://posthog.com/privacy) — Full policy introduction and customer-data scope; summaries are not binding. (read; [SRC-PROFILE-POSTHOG-PRIVACY](SOURCES.md#src-profile-posthog-privacy)); [PostHog DPA preview and account agreement](https://posthog.com/dpa) — Introduction: public preview versus account-generated countersigned agreement. (read; [SRC-PROFILE-POSTHOG-DPA](SOURCES.md#src-profile-posthog-dpa)); [Sentry JavaScript data collection](https://docs.sentry.io/platforms/javascript/data-management/data-collected/) — SDK/integration-specific data, explicit user fields, source maps and separate replay controls. (read; [SRC-PROFILE-SENTRY-COLLECTION](SOURCES.md#src-profile-sentry-collection)); [Sentry JavaScript replay privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/) — Masking, blocking and configured network/console capture. (read; [SRC-PROFILE-SENTRY-REPLAY](SOURCES.md#src-profile-sentry-replay)); [Sentry privacy policy](https://sentry.io/privacy/) — Opening scope excludes submitted Service Data governed by the customer agreement. (read; [SRC-PROFILE-SENTRY-PRIVACY](SOURCES.md#src-profile-sentry-privacy)); [Sentry data processing addendum](https://sentry.io/legal/dpa/) — Opening agreement and definitions of Customer Data and Service. (read; [SRC-PROFILE-SENTRY-DPA](SOURCES.md#src-profile-sentry-dpa)).

**Discovery articles:** [SRC-PROFILE-RESEND-DPA](SOURCES.md#src-profile-resend-dpa).

**Features:** [FEAT-SERVICE-CATALOG](../FEATURES.md#feat-service-catalog), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-service-profiles"></a>

**VERIFY-PRODUCT-SERVICE-PROFILES (partial):** Reject malformed/source-unbound profiles; distinguish unread URLs; render escaped linked notes without network or automatic settings; preserve manual URLs, old pins and exact legal bytes while profile-only changes alter retained reference digests. Expanded project candidates resolve to sourced profiles without site-fact output; original product revisions remain fixed, renewal is explicit and resulting profile-only archives preserve legal page bytes.

**Implementation boundary:** Version-1 optional closed-schema profiles, static escaped renderer and terminal inspection; explicit picker copying preserves entered URLs and clears confirmation on edits. Selected source/profile revisions survive private setup pins, renewed comparison and separately authorized retained-release views. No external fetch, automatic setting, consent grant or public policy prose insertion. Clerk, Vercel, PostHog and Sentry profiles connect existing project matches to sourced questions; new guidance requires explicit renewed review. Per-product revisions preserve the four unchanged original profiles.

**Limits/open review:** Documentation can change and describes provider claims or options. Source retrieval is not independent practice verification, a signed agreement or legal approval. Requirement links are conditional review context. Profiles cover eight products; other entries may have no profile. Actual entity, location, purpose, basis, retention and settings remain operator-supplied.

**Code/test references:** [catalog/product-profiles.json](../../catalog/product-profiles.json), [catalog/schema.json](../../catalog/schema.json), [scripts/build-service-catalog.py](../../scripts/build-service-catalog.py), [packages/notabenda/src/catalog-reference.ts](../../packages/notabenda/src/catalog-reference.ts), [packages/notabenda-cf/src/catalog-reference.ts](../../packages/notabenda-cf/src/catalog-reference.ts), [packages/notabenda/src/catalog-profile.ts](../../packages/notabenda/src/catalog-profile.ts), [packages/notabenda-cf/src/catalog-profile.ts](../../packages/notabenda-cf/src/catalog-profile.ts), [packages/notabenda/src/catalog-ui.ts](../../packages/notabenda/src/catalog-ui.ts), [packages/notabenda/src/catalog-review-ui.ts](../../packages/notabenda/src/catalog-review-ui.ts), [packages/notabenda/src/catalog-cli.ts](../../packages/notabenda/src/catalog-cli.ts), [packages/notabenda/src/setup-catalog-cli.ts](../../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda-cf/src/catalog-render.ts](../../packages/notabenda-cf/src/catalog-render.ts), [packages/notabenda/test/catalog-profile.test.mjs](../../packages/notabenda/test/catalog-profile.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/catalog-profiles.md](../../docs/verification/catalog-profiles.md), [packages/notabenda/test/catalog-profile-coverage.test.mjs](../../packages/notabenda/test/catalog-profile-coverage.test.mjs)

<a id="req-product-indirect-notice"></a>

### REQ-PRODUCT-INDIRECT-NOTICE — Version-bound indirect-collection particulars

Provide optional static HTML and plain-text indirect-collection notices with explicit reviewed context and pinned privacy facts, separate from direct forms, consent and delivery.

**Applies when:** A host explicitly chooses the NZ IPP3A profile for reviewed indirect or mixed-source collection facts.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents).

<a id="verify-product-indirect-notice"></a>

**VERIFY-PRODUCT-INDIRECT-NOTICE (automated):** Deterministic scoped identity and trusted-release comparison, strict bounded non-executable inputs, all core particulars visible, absolute text links, safe server-side framework rendering and no changes to direct notices or permissions.

**Implementation boundary:** Bounded strict inputs require selected categories, recipient wording, particular-law review and usable rights route. The collecting/holding agency comes from the privacy release; neither source nor storage provider replaces it. Phase, reviewed wording and full purpose facts affect identity. Framework wrappers share the same script-free renderer.

**Limits/open review:** No recipient case data, delivery receipts, legal applicability, timing or exception assessment. Structural normalization alone does not verify identity; digest/fact comparison does not authenticate the author.

**Code/test references:** [packages/notabenda/src/indirect-collection.ts](../../packages/notabenda/src/indirect-collection.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/IndirectCollectionNotice.astro](../../packages/notabenda/src/astro/IndirectCollectionNotice.astro), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [examples/indirect-collection/build.mjs](../../examples/indirect-collection/build.mjs), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/test/indirect-collection.test.mjs](../../packages/notabenda/test/indirect-collection.test.mjs), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/indirect-collection.md](../../docs/verification/indirect-collection.md)

<a id="req-eu-guarantee-notice"></a>

### REQ-EU-GUARANTEE-NOTICE — Prominent harmonised goods legal-guarantee notice

Use the prescribed shop-level goods notice with appropriate language and online colour, preserving its contents and QR information.

**Applies when:** Applicable goods consumer contracts and relevant EU/national implementing law require this guarantee information.

**Type:** primary-law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Consumer Rights Directive 2011/83/EU, consolidated 27 September 2026](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011L0083-20260927) — Articles 6(1)(l) and 22a (read; [SRC-EU-CRD-20260927](SOURCES.md#src-eu-crd-20260927)); [Commission Implementing Regulation (EU) 2025/1960](https://eur-lex.europa.eu/eli/reg_impl/2025/1960/oj) — Articles 1 and 3; Annex I (read; [SRC-EU-GUARANTEE-REG](SOURCES.md#src-eu-guarantee-reg)); [Commission practical guidelines on the guarantee notice and GARAN label, April 2026](https://commission.europa.eu/document/download/3e4dbee6-8184-4256-923d-c52551c7e9f0_en?filename=Practical%20guidelines%20Harmonised%20Label%26Notice%20product%20guarantees_ARES%2027042026.pdf) — Sections 2.1 and 2.3 (read; [SRC-EU-GUARANTEE-GUIDE](SOURCES.md#src-eu-guarantee-guide)); [Commission official guarantee notice and label source files](https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en) — Colour SVG notice archive and corresponding colour PDF page 1 (read; [SRC-EU-GUARANTEE-ASSETS](SOURCES.md#src-eu-guarantee-assets)).

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents).

<a id="verify-eu-guarantee-notice"></a>

**VERIFY-EU-GUARANTEE-NOTICE (automated):** Mechanism checks preserve all source bytes, language binding, fixed destination and text alternatives. Legal/linguistic/design acceptance remains open.

**Timing:** 2025/1960 applies from 27 September 2026; applicable national transposition and scope require review.

**Implementation boundary:** Optional static vanilla/React/Astro renderer with 24 unchanged official colour assets, selected-file content-addressed output, fixed QR information destination, PDF-extracted text alternative and explicit review. Colour/reference discrepancy, actual prominence, linguistic/legal review and device/QR acceptance remain open.

**Limits/open review:** Source integrity is not legal conformity, linguistic review or proof of prominent/legible placement. Actual source colour discrepancy remains open. No product guarantee, checkout action or confirmation is implied.

**Code/test references:** [packages/notabenda/src/guarantee-notice.ts](../../packages/notabenda/src/guarantee-notice.ts), [packages/notabenda/src/guarantee-notice-build.ts](../../packages/notabenda/src/guarantee-notice-build.ts), [packages/notabenda/src/guarantee-notice-json.ts](../../packages/notabenda/src/guarantee-notice-json.ts), [packages/notabenda/src/guarantee-notice-data.ts](../../packages/notabenda/src/guarantee-notice-data.ts), [packages/notabenda/src/guarantees.css](../../packages/notabenda/src/guarantees.css), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/LegalGuaranteeNotice.astro](../../packages/notabenda/src/astro/LegalGuaranteeNotice.astro), [packages/notabenda/assets/guarantees/manifest.json](../../packages/notabenda/assets/guarantees/manifest.json), [examples/guarantees/build.mjs](../../examples/guarantees/build.mjs), [packages/notabenda/test/guarantee-notice.test.mjs](../../packages/notabenda/test/guarantee-notice.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/guarantees.md](../../docs/verification/guarantees.md)

<a id="req-eu-guarantee-label"></a>

### REQ-EU-GUARANTEE-LABEL — Conditional product durability-guarantee label

Distinguish qualifying producer durability guarantees and show the prescribed product-specific label, including directly before applicable electronic ordering.

**Applies when:** Applicable goods consumer contracts and relevant EU/national implementing law require this guarantee information.

**Type:** primary-law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Consumer Rights Directive 2011/83/EU, consolidated 27 September 2026](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011L0083-20260927) — Articles 6(1)(la), 8(2) and 22a (read; [SRC-EU-CRD-20260927](SOURCES.md#src-eu-crd-20260927)); [Commission Implementing Regulation (EU) 2025/1960](https://eur-lex.europa.eu/eli/reg_impl/2025/1960/oj) — Article 2; Annex II (read; [SRC-EU-GUARANTEE-REG](SOURCES.md#src-eu-guarantee-reg)); [Commission practical guidelines on the guarantee notice and GARAN label, April 2026](https://commission.europa.eu/document/download/3e4dbee6-8184-4256-923d-c52551c7e9f0_en?filename=Practical%20guidelines%20Harmonised%20Label%26Notice%20product%20guarantees_ARES%2027042026.pdf) — Sections 3.1-3.3 (read; [SRC-EU-GUARANTEE-GUIDE](SOURCES.md#src-eu-guarantee-guide)).

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents).

<a id="verify-eu-guarantee-label"></a>

**VERIFY-EU-GUARANTEE-LABEL (automated):** Mechanism tests bind explicit product/offer declarations to unchanged finished bytes, reject unsupported input and exclude build parsers from frontend graphs. The complete draft example verifies pinned source/fonts, unchanged fixed artwork, field bindings, binary delivery and software QR decoding at selected sizes. Physical-device, legal/design, production-placement and order acceptance remain open.

**Timing:** 2025/1960 applies from 27 September 2026; applicable national transposition and scope require review.

**Implementation boundary:** Optional bounded PNG/JPEG/outlined-SVG importer preserves original binary bytes and binds explicit qualifying facts, product, producer, duration, review and wording. A fixed maintainer fixture fills only the official template’s three fields with pinned Inter outlines, records source/font provenance and compares fixed artwork. Light/dark examples include optional enlarged inspection; software QR decoding uses development-only tools. No public template generator, automatic no-guarantee inference, payment action or confirmation.

**Limits/open review:** Finished-file ingestion and static product-specific rendering include a sourced complete draft example. Qualification and review remain explicit host declarations, not producer identity/offer or statutory design verification. Software QR decoding covers selected raster sizes; physical devices, assistive technology, target placement, independent legal/design review, final order action and durable confirmation remain open. Original-file retention is host-owned and not integrated into the DO archive.

**Code/test references:** [packages/notabenda/src/guarantee-label.ts](../../packages/notabenda/src/guarantee-label.ts), [packages/notabenda/src/guarantee-notice-json.ts](../../packages/notabenda/src/guarantee-notice-json.ts), [packages/notabenda-authoring/src/guarantee-label-build.ts](../../packages/notabenda-authoring/src/guarantee-label-build.ts), [packages/notabenda-authoring/src/guarantee-label-image.ts](../../packages/notabenda-authoring/src/guarantee-label-image.ts), [packages/notabenda/src/guarantees.css](../../packages/notabenda/src/guarantees.css), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/DurabilityGuaranteeLabel.astro](../../packages/notabenda/src/astro/DurabilityGuaranteeLabel.astro), [docs/GUARANTEE-LABELS.md](../../docs/GUARANTEE-LABELS.md), [packages/notabenda-authoring/src/guarantee-label-clips.ts](../../packages/notabenda-authoring/src/guarantee-label-clips.ts), [examples/guarantees/product-build.mjs](../../examples/guarantees/product-build.mjs), [examples/guarantees/producer/prepare.py](../../examples/guarantees/producer/prepare.py), [examples/guarantees/producer/verify.py](../../examples/guarantees/producer/verify.py), [examples/guarantees/producer/manifest.json](../../examples/guarantees/producer/manifest.json), [docs/GUARANTEE-PRODUCER-EXAMPLE.md](../../docs/GUARANTEE-PRODUCER-EXAMPLE.md), [packages/notabenda/src/files.ts](../../packages/notabenda/src/files.ts), [packages/notabenda-cf/src/order-blobs.ts](../../packages/notabenda-cf/src/order-blobs.ts), [packages/notabenda-cf/src/orders.ts](../../packages/notabenda-cf/src/orders.ts), [packages/notabenda-authoring/test/guarantee-label.test.mjs](../../packages/notabenda-authoring/test/guarantee-label.test.mjs), [packages/notabenda-authoring/test/package.test.mjs](../../packages/notabenda-authoring/test/package.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [docs/verification/guarantees.md](../../docs/verification/guarantees.md), [packages/notabenda-authoring/test/guarantee-producer.test.mjs](../../packages/notabenda-authoring/test/guarantee-producer.test.mjs), [packages/notabenda/test/cli.test.mjs](../../packages/notabenda/test/cli.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [packages/notabenda-cf/test/orders.test.mjs](../../packages/notabenda-cf/test/orders.test.mjs)

<a id="req-product-guarantee-notice"></a>

### REQ-PRODUCT-GUARANTEE-NOTICE — Source-preserving multilingual guarantee notice display

Build and render one selected unchanged official notice with traceable asset/text provenance and a readable static alternative.

**Applies when:** A host explicitly selects the sourced EU goods legal-guarantee notice.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents).

<a id="verify-product-guarantee-notice"></a>

**VERIFY-PRODUCT-GUARANTEE-NOTICE (automated):** All 24 selected-file builds preserve known source hashes and provenance; bounded safe static renderers expose image, text, source attribution and QR information without a checkout or consent action.

**Limits/open review:** Source integrity is not legal conformity, linguistic review or proof of prominent/legible placement. Actual source colour discrepancy remains open. No product guarantee, checkout action or confirmation is implied.

**Code/test references:** [packages/notabenda/src/guarantee-notice.ts](../../packages/notabenda/src/guarantee-notice.ts), [packages/notabenda/src/guarantee-notice-build.ts](../../packages/notabenda/src/guarantee-notice-build.ts), [packages/notabenda/src/guarantee-notice-json.ts](../../packages/notabenda/src/guarantee-notice-json.ts), [packages/notabenda/src/guarantee-notice-data.ts](../../packages/notabenda/src/guarantee-notice-data.ts), [packages/notabenda/src/guarantees.css](../../packages/notabenda/src/guarantees.css), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/LegalGuaranteeNotice.astro](../../packages/notabenda/src/astro/LegalGuaranteeNotice.astro), [packages/notabenda/assets/guarantees/manifest.json](../../packages/notabenda/assets/guarantees/manifest.json), [examples/guarantees/build.mjs](../../examples/guarantees/build.mjs), [packages/notabenda/test/guarantee-notice.test.mjs](../../packages/notabenda/test/guarantee-notice.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/guarantees.md](../../docs/verification/guarantees.md)

<a id="req-product-paid-order-archives"></a>

### REQ-PRODUCT-PAID-ORDER-ARCHIVES — Retained paid-order reviews, original files and atomic local admission

Retain exact reviews and original producer files separately from small searchable receipts; bind one admission to a host checkout intent across quote revisions, with local host writes and replay protection in the same transaction.

**Applies when:** An adopter opts into notabenda-cf/orders.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [Cloudflare: SQLite-backed Durable Object storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) — Asynchronous KV transaction contract and local atomicity (read; [SRC-CF-DO-SQLITE](SOURCES.md#src-cf-do-sqlite)); [Cloudflare: Durable Object storage limits](https://developers.cloudflare.com/durable-objects/platform/limits/) — SQLite combined key/value and legacy KV value limits; package chunk profile is separate (read; [SRC-CF-DO-LIMITS](SOURCES.md#src-cf-do-limits)).

**Features:** [FEAT-PAID-ORDERS](../FEATURES.md#feat-paid-orders), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-product-paid-order-archives"></a>

**VERIFY-PRODUCT-PAID-ORDER-ARCHIVES (automated):** Exercise file/review hash reconstruction and corruption, draft-document gates, activation/nonce races, one admission across revisions, exact recovery before clock/current checks, atomic host writes and rollback, near-budget reviews, separate archive/file permissions, scoped export exclusion, lifecycle purge/restore and a packed CF-only type/runtime consumer. Local SQLite HTTP/restart and Chromium mobile review supplement automation.

<a id="verify-product-transaction-recovery"></a>

**VERIFY-PRODUCT-TRANSACTION-RECOVERY (automated):** Optional local Wrangler SQLite exercise restores eight declaration/order contexts from a pre-delivery KV snapshot while an independent provider retains its history. Verify default-closed access, later hold-first replay, restart-persistent purge, physical event/blob deletion, actual retired admission refusal before host decisions, exact surviving receipts/chunked files, persisted uncertainty and stable-ID retries: nine provider jobs, eighteen attempts, nine commits. Trusted fixture journal and simulated provider only; no all-family or production acceptance claim.

**Implementation boundary:** 64 KiB sealed chunks, bounded review/files, CAS activation, intent-level consumption, fresh post-decision clock, local mutation plans, scoped private archives, safe admin rendering/downloads and resumable retirement. Existing demo receipts retain their compatibility path.

**Limits/open review:** Host authorization, commercial correctness and external operations remain host-owned. No payment, fulfillment, contract formation or durable-medium confirmation is performed. Hashes do not provide WORM storage or prove customer presentation. Production/regional legal acceptance remains separate.

**Code/test references:** [packages/notabenda-cf/src/orders.ts](../../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/src/order-context.ts](../../packages/notabenda-cf/src/order-context.ts), [packages/notabenda-cf/src/order-blobs.ts](../../packages/notabenda-cf/src/order-blobs.ts), [packages/notabenda-cf/src/order-render.ts](../../packages/notabenda-cf/src/order-render.ts), [packages/notabenda-cf/src/order-admin-style.ts](../../packages/notabenda-cf/src/order-admin-style.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/types.ts](../../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/scripts/sync-order-policy.mjs](../../packages/notabenda-cf/scripts/sync-order-policy.mjs), [site/order-demo.mjs](../../site/order-demo.mjs), [site/order-demo-admin.mjs](../../site/order-demo-admin.mjs), [packages/notabenda-cf/test/orders.test.mjs](../../packages/notabenda-cf/test/orders.test.mjs), [packages/notabenda-cf/test/orders-package.test.mjs](../../packages/notabenda-cf/test/orders-package.test.mjs), [scripts/check-order-archive-runtime.mjs](../../scripts/check-order-archive-runtime.mjs), [site/test/order-demo.test.mjs](../../site/test/order-demo.test.mjs), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [docs/verification/paid-orders.md](../../docs/verification/paid-orders.md), [scripts/check-transaction-recovery.mjs](../../scripts/check-transaction-recovery.mjs), [scripts/fixtures/transaction-recovery-worker.mjs](../../scripts/fixtures/transaction-recovery-worker.mjs)

<a id="req-eu-order-confirmation"></a>

### REQ-EU-ORDER-CONFIRMATION — Provide the concluded distance contract confirmation on a durable medium

Applicable confirmation includes required pre-contract information and any relevant digital-content consent/acknowledgment; actual provision and timing remain separate from server retention.

**Applies when:** An in-scope distance consumer contract is concluded; assess national implementation and exceptions.

**Type:** primary-law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Consumer Rights Directive 2011/83/EU, consolidated 27 September 2026](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011L0083-20260927) — Article 2(10), Article 8(7), with Article 6(1) and 16(m) (read; [SRC-EU-CRD-20260927](SOURCES.md#src-eu-crd-20260927)); [CJEU Content Services, C-49/11, 5 July 2012](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:62011CJ0049) — Paragraphs 35, 42–51 and operative part; earlier directive context (search-result; [SRC-EU-DURABLE-CONTENT-SERVICES](SOURCES.md#src-eu-durable-content-services)).

**Features:** [FEAT-ORDER-CONFIRMATION](../FEATURES.md#feat-order-confirmation), [FEAT-PAID-ORDERS](../FEATURES.md#feat-paid-orders).

<a id="verify-eu-order-confirmation"></a>

**VERIFY-EU-ORDER-CONFIRMATION (planned):** Independent review of applicable information, actual contract facts and digital-content acknowledgments; real personally addressed channel, unchanged reproduction, access period, actual provision and timing before goods delivery/service performance.

**Timing:** Article 8(7) selected text reread on 19 October 2026. Host coordinates actual goods delivery/service commencement and reasonable confirmation timing.

**Implementation boundary:** Bounded original files and manifest plus pending job seal atomically. Stable delivery identity, host callback dispatch, separate private inspection and lifecycle fencing preserve the admission capture. Production/regional and real delivery acceptance remain open.

**Limits/open review:** File retention and provider acceptance do not establish consumer receipt, legal sufficiency or timing. The host supplies reviewed complete personally addressed content, actual contract facts, frozen destination resolution, scheduling and provider/recipient reconciliation. This initial profile does not support omitting information based on prior durable provision or overwriting a mistaken confirmation.

**Code/test references:** [packages/notabenda-cf/src/order-confirmations.ts](../../packages/notabenda-cf/src/order-confirmations.ts), [packages/notabenda-cf/src/order-confirmation-state.ts](../../packages/notabenda-cf/src/order-confirmation-state.ts), [packages/notabenda-cf/src/order-confirmation-dispatch.ts](../../packages/notabenda-cf/src/order-confirmation-dispatch.ts), [packages/notabenda-cf/src/order-confirmation-render.ts](../../packages/notabenda-cf/src/order-confirmation-render.ts), [packages/notabenda-cf/src/orders.ts](../../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/types.ts](../../packages/notabenda-cf/src/types.ts), [site/order-confirmation-seed.mjs](../../site/order-confirmation-seed.mjs), [site/order-demo-admin.mjs](../../site/order-demo-admin.mjs), [packages/notabenda-cf/test/order-confirmations.test.mjs](../../packages/notabenda-cf/test/order-confirmations.test.mjs), [packages/notabenda-cf/test/orders-package.test.mjs](../../packages/notabenda-cf/test/orders-package.test.mjs), [site/test/order-demo.test.mjs](../../site/test/order-demo.test.mjs), [scripts/check-order-confirmation-runtime.mjs](../../scripts/check-order-confirmation-runtime.mjs), [docs/verification/order-confirmations.md](../../docs/verification/order-confirmations.md)

<a id="req-product-order-confirmation"></a>

### REQ-PRODUCT-ORDER-CONFIRMATION — Immutable customer confirmation bundles and recoverable host delivery

Bind personally addressed complete host files, immutable destination version and concluded-contract facts to an admitted order; atomically retain exact files and a delivery job, with bounded leases, separate inspection and retirement fences.

**Applies when:** A host opts into notabenda-cf/order-confirmations.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [Consumer Rights Directive 2011/83/EU, consolidated 27 September 2026](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011L0083-20260927) — Article 2(10), Article 8(7), with Article 6(1) and 16(m) (read; [SRC-EU-CRD-20260927](SOURCES.md#src-eu-crd-20260927)); [CJEU Content Services, C-49/11, 5 July 2012](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:62011CJ0049) — Paragraphs 35, 42–51 and operative part; earlier directive context (search-result; [SRC-EU-DURABLE-CONTENT-SERVICES](SOURCES.md#src-eu-durable-content-services)).

**Features:** [FEAT-ORDER-CONFIRMATION](../FEATURES.md#feat-order-confirmation), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-product-order-confirmation"></a>

**VERIFY-PRODUCT-ORDER-CONFIRMATION (automated):** Reject receipt-only/reference-only and unsafe/beyond-budget payloads; exact file retention, atomic rollback, detached inputs, immutable retry/destination version, independent admission recovery, stable provider deduplication after lost response/restart, stale lease/abort/timeout and uncertain settlement, separate admin permissions/downloads/export exclusion, orphan-job retirement/holds/purge and packed consumer.

<a id="verify-product-transaction-recovery"></a>

**VERIFY-PRODUCT-TRANSACTION-RECOVERY (automated):** Optional local Wrangler SQLite exercise restores eight declaration/order contexts from a pre-delivery KV snapshot while an independent provider retains its history. Verify default-closed access, later hold-first replay, restart-persistent purge, physical event/blob deletion, actual retired admission refusal before host decisions, exact surviving receipts/chunked files, persisted uncertainty and stable-ID retries: nine provider jobs, eighteen attempts, nine commits. Trusted fixture journal and simulated provider only; no all-family or production acceptance claim.

**Implementation boundary:** Bounded original files and manifest plus pending job seal atomically. Stable delivery identity, host callback dispatch, separate private inspection and lifecycle fencing preserve the admission capture. Production/regional and real delivery acceptance remain open. Actual local SQLite confirmation/provider stores survived restart with the exact large attachment, manifest/destination and original admission. Lost-response recovery made two provider attempts with one simulated downstream commit; stale settlement was refused.

**Limits/open review:** File retention and provider acceptance do not establish consumer receipt, legal sufficiency or timing. The host supplies reviewed complete personally addressed content, actual contract facts, frozen destination resolution, scheduling and provider/recipient reconciliation. This initial profile does not support omitting information based on prior durable provision or overwriting a mistaken confirmation.

**Code/test references:** [packages/notabenda-cf/src/order-confirmations.ts](../../packages/notabenda-cf/src/order-confirmations.ts), [packages/notabenda-cf/src/order-confirmation-state.ts](../../packages/notabenda-cf/src/order-confirmation-state.ts), [packages/notabenda-cf/src/order-confirmation-dispatch.ts](../../packages/notabenda-cf/src/order-confirmation-dispatch.ts), [packages/notabenda-cf/src/order-confirmation-render.ts](../../packages/notabenda-cf/src/order-confirmation-render.ts), [packages/notabenda-cf/src/orders.ts](../../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/types.ts](../../packages/notabenda-cf/src/types.ts), [site/order-confirmation-seed.mjs](../../site/order-confirmation-seed.mjs), [site/order-demo-admin.mjs](../../site/order-demo-admin.mjs), [packages/notabenda-cf/test/order-confirmations.test.mjs](../../packages/notabenda-cf/test/order-confirmations.test.mjs), [packages/notabenda-cf/test/orders-package.test.mjs](../../packages/notabenda-cf/test/orders-package.test.mjs), [site/test/order-demo.test.mjs](../../site/test/order-demo.test.mjs), [scripts/check-order-confirmation-runtime.mjs](../../scripts/check-order-confirmation-runtime.mjs), [docs/verification/order-confirmations.md](../../docs/verification/order-confirmations.md), [scripts/check-transaction-recovery.mjs](../../scripts/check-transaction-recovery.mjs), [scripts/fixtures/transaction-recovery-worker.mjs](../../scripts/fixtures/transaction-recovery-worker.mjs)

<a id="req-product-storage-exceptions"></a>

### REQ-PRODUCT-STORAGE-EXCEPTIONS — Independent and durable storage-exception objections

Gate explicit statistical/appearance declarations behind hydration and usable controls, persist objections atomically across revisions, and require a current explicit action before resuming. Reuse lifecycle and exact-key cleanup without granting consent.

**Applies when:** An operator opts into the optional storage-exception controller.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-product-storage-exceptions"></a>

**VERIFY-PRODUCT-STORAGE-EXCEPTIONS (automated):** Default activity waits for hydration and presentation; objections abort immediately, survive reload/material revisions and failed saves; stale resume cannot clear newer state; notifications cannot reopen stale results; exact-key cleanup and consent remain separate.

**Limits/open review:** Engineering gate only. The host owns qualification, truthful disclosure, connected controls, producer behavior, preference storage and downstream legal obligations. No server evidence or automatic provider qualification is implied.

**Code/test references:** [packages/notabenda/src/storage-exception-policy.ts](../../packages/notabenda/src/storage-exception-policy.ts), [packages/notabenda/src/storage-exceptions.ts](../../packages/notabenda/src/storage-exceptions.ts), [packages/notabenda/src/storage-exception-controls.ts](../../packages/notabenda/src/storage-exception-controls.ts), [packages/notabenda/src/storage-exceptions.css](../../packages/notabenda/src/storage-exceptions.css), [packages/notabenda/src/service-runner.ts](../../packages/notabenda/src/service-runner.ts), [packages/notabenda/src/storage-cleanup.ts](../../packages/notabenda/src/storage-cleanup.ts), [examples/storage-exceptions/config.mjs](../../examples/storage-exceptions/config.mjs), [examples/storage-exceptions/build.mjs](../../examples/storage-exceptions/build.mjs), [examples/storage-exceptions/client.mjs](../../examples/storage-exceptions/client.mjs), [packages/notabenda/test/storage-exceptions.test.mjs](../../packages/notabenda/test/storage-exceptions.test.mjs), [docs/verification/storage-exceptions.md](../../docs/verification/storage-exceptions.md), [site/test/storage-exceptions.test.mjs](../../site/test/storage-exceptions.test.mjs)

<a id="req-product-localization"></a>

### REQ-PRODUCT-LOCALIZATION — Complete versioned messages for legal pages, collection notices, consent, terms and form permissions

Validate complete selected plain-text dictionaries and fixed placeholders; render language/direction consistently; pin consent, terms-interface and form-permission copy to its retained release; distinguish presentation revisions from material disclosure scopes while preserving legacy English artifacts. Static direct-collection notices use complete v2 copy and verify against an intact release, while English v1 remains supported.

**Applies when:** An operator supplies the optional localization declaration for legal pages, cookie-choice controls ordinary terms acceptance or form permissions.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-LOCALIZATION](../FEATURES.md#feat-localization), [FEAT-CONTROLS](../FEATURES.md#feat-controls).

<a id="verify-product-localization"></a>

**VERIFY-PRODUCT-LOCALIZATION (automated):** Complete dictionaries reject omissions, extra keys, malformed placeholders, markup and oversized text; legal and consent roots expose language/direction; errors and ARIA use selected copy; cosmetic revisions preserve matching grants, material revisions preserve refusals; CF checks archived wording/scopes independently. Terms offers bind complete widget copy to the retained release, require a matching receipt, preserve v1 English behavior and support private language/copy inspection. Form offers pin complete fixed/recovery messages, reject archive mismatches or a v1 downgrade, preserve exact pending v1 withdrawals across localized activation and do not change cookie scopes; isolated demo routes retain exact language/copy. Collection notices retain exact v2 copy, reject tampering/downgrade at release verification, preserve English v1 and cookie scopes, use static localized details and allocate no demo evidence store.

**Limits/open review:** Host owns translation, review, declared facts and semantic disclosure revisions. This contract covers legal pages, direct-collection notices, cookie-choice controls, ordinary terms acceptance and form permissions; it is not a country compliance pack, automatic translation, comprehensive interface localization or proof of valid consent or an enforceable agreement.

**Code/test references:** [packages/notabenda/src/localization-policy.ts](../../packages/notabenda/src/localization-policy.ts), [packages/notabenda/src/document-localization.ts](../../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/localized-documents.ts](../../packages/notabenda/src/localized-documents.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/localization-policy.ts](../../packages/notabenda-cf/src/localization-policy.ts), [examples/localization/config.mjs](../../examples/localization/config.mjs), [examples/localization/build.mjs](../../examples/localization/build.mjs), [packages/notabenda/src/react-consent-bindings.ts](../../packages/notabenda/src/react-consent-bindings.ts), [packages/notabenda/src/astro-client.ts](../../packages/notabenda/src/astro-client.ts), [packages/notabenda/src/astro/PreferencesButton.astro](../../packages/notabenda/src/astro/PreferencesButton.astro), [packages/notabenda/src/terms-localization-policy.ts](../../packages/notabenda/src/terms-localization-policy.ts), [packages/notabenda/src/terms.ts](../../packages/notabenda/src/terms.ts), [packages/notabenda-cf/src/terms-localization-policy.ts](../../packages/notabenda-cf/src/terms-localization-policy.ts), [packages/notabenda-cf/src/terms.ts](../../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/localization/agreement-build.mjs](../../examples/localization/agreement-build.mjs), [examples/localization/agreement.mjs](../../examples/localization/agreement.mjs), [packages/notabenda/src/form-permission-localization-policy.ts](../../packages/notabenda/src/form-permission-localization-policy.ts), [packages/notabenda/src/form-permission.ts](../../packages/notabenda/src/form-permission.ts), [packages/notabenda-cf/src/form-permission-localization-policy.ts](../../packages/notabenda-cf/src/form-permission-localization-policy.ts), [packages/notabenda-cf/src/permissions.ts](../../packages/notabenda-cf/src/permissions.ts), [examples/localization/permission-build.mjs](../../examples/localization/permission-build.mjs), [examples/localization/permission.mjs](../../examples/localization/permission.mjs), [packages/notabenda/src/collection-localization-policy.ts](../../packages/notabenda/src/collection-localization-policy.ts), [packages/notabenda/src/collection.ts](../../packages/notabenda/src/collection.ts), [examples/localization/collection-build.mjs](../../examples/localization/collection-build.mjs), [examples/localization/messages.json](../../examples/localization/messages.json), [examples/localization/form-messages.json](../../examples/localization/form-messages.json), [examples/localization/collection-messages.json](../../examples/localization/collection-messages.json), [packages/notabenda/test/localization.test.mjs](../../packages/notabenda/test/localization.test.mjs), [docs/verification/localization.md](../../docs/verification/localization.md), [site/test/localization.test.mjs](../../site/test/localization.test.mjs), [packages/notabenda/test/terms-localization.test.mjs](../../packages/notabenda/test/terms-localization.test.mjs), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [packages/notabenda/test/form-permission-localization.test.mjs](../../packages/notabenda/test/form-permission-localization.test.mjs), [packages/notabenda/test/collection-localization.test.mjs](../../packages/notabenda/test/collection-localization.test.mjs), [site/test/collection-localization.test.mjs](../../site/test/collection-localization.test.mjs), [packages/notabenda/test/localization-boundaries.test.mjs](../../packages/notabenda/test/localization-boundaries.test.mjs)

<a id="req-product-agent-integration"></a>

### REQ-PRODUCT-AGENT-INTEGRATION — Agent integration skill and public Markdown documentation

Distribute a versioned integration skill with the package and website; provide a curated llms.txt and Markdown versions of maintained guides with working links and explicit review boundaries. Connect requested outcomes to version-matched configuration paths, separate host work, facts, current setup questions and observable acceptance scenarios. Resolve ambiguous task scope from explicit yes/no/unknown decisions without treating missing answers as negative or enabling adjacent features. Reconcile explicit configuration and practice answers with selected targets using a read-only assessment; distinguish minimum missing fields, conflicts, declarations, review and unverified host behavior. Expose a version-matched, type-derived authoring schema with field lookup so agents can inspect exact known keys, required fields and allowed type values before making targeted changes; preserve the separate runtime validator and unresolved factual decisions. Assessment also enforces the installed authoring shape, reports bounded exact JSON Pointer errors and evaluates declared target-specific conditional prerequisites without altering facts.

**Applies when:** An agent helps an adopter configure, update or validate a Notabenda integration.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [llms.txt proposal: format and Markdown documentation discovery](https://llmstxt.org/) — Proposal and Format: concise Markdown index, file-list links, Markdown alternates and describedby discovery. (read; [SRC-LLMS-TXT](SOURCES.md#src-llms-txt)); [JSON Schema draft 2020-12: core](https://json-schema.org/draft/2020-12/json-schema-core) — Sections 8.2.3–8.2.4 and 9: local references, definitions and schema processing. (read; [SRC-JSON-SCHEMA-2020-12](SOURCES.md#src-json-schema-2020-12)).

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-agent-integration"></a>

**VERIFY-PRODUCT-AGENT-INTEGRATION (automated):** A locally packed/installed package exposes the exact versioned skill; its documented discovery, setup and preview commands run in a fresh fixture while production rejects drafts. Every generated Markdown guide and curated index target resolves, code examples retain their bytes, and public agent assets use read-only routes without evidence access or private report exposure. Advertised config paths typecheck against the actual SiteConfig declaration, current wizard IDs remain connected, unknowns stay unknown and describe reads no project facts or writes files. Explicit selection scenarios distinguish documents, controls, agreement, evidence and localization; unknown/declined answers select no work, malformed or executable decisions reject, and selected scope never implies production readiness. Assessment detects missing target config and contradictory facts, limits questions to selected/prerequisite work, preserves inputs and private values, rejects executable/non-file inputs, and never declares readiness from valid config or recorded answers. Generated authoring schemas match actual types, pass draft 2020-12 schema validation, reject field/literal errors and preserve nested policy alternatives and mapped message keys. Every advertised target path resolves offline with no project reads or writes; a structurally valid unknown purpose reference still fails the runtime validator. Assessment enforces the installed shape independently of runtime validation, omits rejected values, escapes JSON Pointer paths, caps errors and checks conditional selected-interface dictionaries. Form scope prerequisites/questions and exception-only target separation remain explicit. Published Markdown/MDX examples and agent/reference files retain exact source bytes and direct HTML/Markdown links; all static guide targets and local fragments resolve. Unknown repository links fail explicitly and grouped navigation has human labels.

**Implementation boundary:** One maintained skill is copied into package distribution and explicit public website assets. Source-backed guides emit Markdown alternates; positional link edits retain authored examples. Tests pack and install the local package offline, execute documented commands, retain draft rejection and verify generated public links/types without opening evidence stores. Read-only describe CLI and optional integration API expose target/prerequisite maps, factual questions, separate host work and a shared-engine unknown-answer template. Actual compiler typechecks protect advertised config paths; project facts are never read by describe and no target is automatically enabled. A bounded explicit selection file or selectIntegration API resolves scope decisions to requested targets, prerequisite review and unresolved questions; empty selections stay empty and scope completion never asserts production readiness. Read-only assess accepts explicit bounded JSON and returns scoped question states, minimum target prerequisites, array coverage observations, factual/practice conflicts and both validation modes. No config body or private notes are returned, and no values are inferred; presence and recorded answers never establish host behavior or readiness. The package build generates a draft 2020-12 authoring schema from SiteConfig using the pinned build-only TypeScript API. Unsupported constructs fail the build. Read-only schema field lookup returns referenced definitions, optional ancestors, array item paths and alternative-parent context without reading project inputs or suggesting default facts. Unknown keys reject in the authoring shape; runtime cross-field, policy, URL, bound and review rules remain separate. An offline packed-install test resolves the exact schema export and runs full/field CLI commands without a compiler runtime dependency. A build-time Ajv standalone validator enforces that authoring shape during read-only assessment without runtime compiler/schema-library dependencies. Unknown fields ignored by runtime projection still produce invalid-config. The target map distinguishes assessed storage exceptions from consent enrollment, requires form scope assessment and exposes conditional non-English terms/form dictionaries. An explicit static collection-notice target selects no permission controller and requires only its own non-English dictionary when applicable. Repository-relative documentation links resolve only to explicit published documents, assets or catalog-backed source views. Unknown references stop the build with source/target details; they never silently become the guide index. Grouped guide navigation requires an explicit human label.

**Limits/open review:** Instructions are advisory and version-specific. Facts, legal review, host authorization, deployment permission and optional CI remain adopter decisions. No package registry publication, automatic skill installation, account grant or compliance claim.

**Code/test references:** [skills/notabenda/SKILL.md](../../skills/notabenda/SKILL.md), [skills/notabenda/agents/openai.yaml](../../skills/notabenda/agents/openai.yaml), [llms.txt](../../llms.txt), [site/agent-docs.mjs](../../site/agent-docs.mjs), [site/build.mjs](../../site/build.mjs), [site/host.mjs](../../site/host.mjs), [site/navigation.mjs](../../site/navigation.mjs), [site/guide-pages.mjs](../../site/guide-pages.mjs), [packages/notabenda/package.json](../../packages/notabenda/package.json), [packages/notabenda/scripts/copy-assets.mjs](../../packages/notabenda/scripts/copy-assets.mjs), [docs/AGENT-SETUP.md](../../docs/AGENT-SETUP.md), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [skills/notabenda/references/configuration-target.md](../../skills/notabenda/references/configuration-target.md), [packages/notabenda/src/integration-assessment.ts](../../packages/notabenda/src/integration-assessment.ts), [packages/notabenda/scripts/config-schema.mjs](../../packages/notabenda/scripts/config-schema.mjs), [packages/notabenda/src/schema-cli.ts](../../packages/notabenda/src/schema-cli.ts), [packages/notabenda/scripts/config-shape-validator.mjs](../../packages/notabenda/scripts/config-shape-validator.mjs), [packages/notabenda/src/site-config-validator.d.ts](../../packages/notabenda/src/site-config-validator.d.ts), [site/documentation-links.mjs](../../site/documentation-links.mjs), [scripts/regulatory.py](../../scripts/regulatory.py), [packages/notabenda/src/config-authoring.ts](../../packages/notabenda/src/config-authoring.ts), [packages/notabenda/test/agent-integration.test.mjs](../../packages/notabenda/test/agent-integration.test.mjs), [site/test/agent-docs.test.mjs](../../site/test/agent-docs.test.mjs), [docs/verification/agent-integration.md](../../docs/verification/agent-integration.md), [site/test/host.test.mjs](../../site/test/host.test.mjs), [packages/notabenda/test/integration-reference.test.mjs](../../packages/notabenda/test/integration-reference.test.mjs), [packages/notabenda/test/integration-assessment.test.mjs](../../packages/notabenda/test/integration-assessment.test.mjs), [packages/notabenda/test/config-schema.test.mjs](../../packages/notabenda/test/config-schema.test.mjs), [site/test/documentation-links.test.mjs](../../site/test/documentation-links.test.mjs), [site/test/guide-navigation.test.mjs](../../site/test/guide-navigation.test.mjs), [packages/notabenda/test/config-authoring.test.mjs](../../packages/notabenda/test/config-authoring.test.mjs)

<a id="req-br-cookie-rights-link"></a>

### REQ-BR-COOKIE-RIGHTS-LINK — Accessible rights entry in the first cookie layer

Expose a clear host-supplied rights link in the initial notice and detailed preferences.

**Applies when:** The operator applies ANPD’s cookie-banner recommendations after assessing the actual processing context.

**Type:** regulator-recommendation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** implemented.

**Sources:** [ANPD: final cookies and personal-data guide](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf/@@display-file/file) — Printed p. 31 (PDF index 30), first-layer rights link. (read; [SRC-BR-ANPD](SOURCES.md#src-br-anpd)).

**Discovery articles:** [SRC-IUB-BR-COOKIE-GUIDE](SOURCES.md#src-iub-br-cookie-guide).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CHOICES](../FEATURES.md#feat-choices).

<a id="verify-br-cookie-rights-link"></a>

**VERIFY-BR-COOKIE-RIGHTS-LINK (automated):** A configured rights entry is reachable on both layers and configured browser guidance starts collapsed. Safe text/links survive config, compiled runtime, notice and backend inspection; invalid shapes/URLs and rehashed archive mismatches reject. Opening help or drafting settings never grants a purpose.

**Timing:** Guide version 1.0 was published in October 2022; this is guidance, not a newly established statutory commencement date.

**Implementation boundary:** Bounded consent.information is projected to the browser and immutable notice, verified against the released config by the frontend and standalone CF backend, and shown with stored choice details. Setup advises these fields without activating them. Browser guidance uses a collapsed native disclosure; links never grant permission.

**Limits/open review:** Optional technical mechanism, not a reviewed Brazilian compliance pack. The host supplies truthful wording, actual rights handling and relevant browser/platform coverage. Link snapshots preserve captions/URLs, not remote page contents or proof of a visit. No locale/jurisdiction inference or legal-basis selection.

**Code/test references:** [packages/notabenda/src/consent-information.ts](../../packages/notabenda/src/consent-information.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda-cf/src/consent-information.ts](../../packages/notabenda-cf/src/consent-information.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/localization/config.mjs](../../examples/localization/config.mjs), [examples/localization/build.mjs](../../examples/localization/build.mjs), [packages/notabenda/test/consent-information.test.mjs](../../packages/notabenda/test/consent-information.test.mjs), [site/test/br-cookie-ui.test.mjs](../../site/test/br-cookie-ui.test.mjs), [docs/verification/regional-consent.md](../../docs/verification/regional-consent.md)

<a id="req-br-cookie-browser-help"></a>

### REQ-BR-COOKIE-BROWSER-HELP — Browser-control guidance in cookie preferences

Offer host-supplied browser-control instructions and links, including limitations for the actual trackers.

**Applies when:** The operator applies ANPD’s cookie-banner recommendations after assessing the actual processing context.

**Type:** regulator-recommendation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** implemented.

**Sources:** [ANPD: final cookies and personal-data guide](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf/@@display-file/file) — Printed p. 32 (PDF index 31), browser-control information and limitations. (read; [SRC-BR-ANPD](SOURCES.md#src-br-anpd)).

**Discovery articles:** [SRC-IUB-BR-COOKIE-GUIDE](SOURCES.md#src-iub-br-cookie-guide).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CHOICES](../FEATURES.md#feat-choices).

<a id="verify-br-cookie-browser-help"></a>

**VERIFY-BR-COOKIE-BROWSER-HELP (automated):** A configured rights entry is reachable on both layers and configured browser guidance starts collapsed. Safe text/links survive config, compiled runtime, notice and backend inspection; invalid shapes/URLs and rehashed archive mismatches reject. Opening help or drafting settings never grants a purpose.

**Timing:** Guide version 1.0 was published in October 2022; this is guidance, not a newly established statutory commencement date.

**Implementation boundary:** Bounded consent.information is projected to the browser and immutable notice, verified against the released config by the frontend and standalone CF backend, and shown with stored choice details. Setup advises these fields without activating them. Browser guidance uses a collapsed native disclosure; links never grant permission.

**Limits/open review:** Optional technical mechanism, not a reviewed Brazilian compliance pack. The host supplies truthful wording, actual rights handling and relevant browser/platform coverage. Link snapshots preserve captions/URLs, not remote page contents or proof of a visit. No locale/jurisdiction inference or legal-basis selection.

**Code/test references:** [packages/notabenda/src/consent-information.ts](../../packages/notabenda/src/consent-information.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda-cf/src/consent-information.ts](../../packages/notabenda-cf/src/consent-information.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/localization/config.mjs](../../examples/localization/config.mjs), [examples/localization/build.mjs](../../examples/localization/build.mjs), [packages/notabenda/test/consent-information.test.mjs](../../packages/notabenda/test/consent-information.test.mjs), [site/test/br-cookie-ui.test.mjs](../../site/test/br-cookie-ui.test.mjs), [docs/verification/regional-consent.md](../../docs/verification/regional-consent.md)

<a id="req-product-compliance-map"></a>

### REQ-PRODUCT-COMPLIANCE-MAP — Compliance responsibility maps and separate software/storage architecture

Graphically explain what notices, permissions, contract actions and records serve, with linked component guides and separate build/browser/host/storage boundaries. Keep applicability, independent choices and actual host fulfillment explicit.

**Applies when:** A reader chooses components or needs to understand the role of a feature in a broader compliance workflow.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-REQUIREMENTS](../FEATURES.md#feat-requirements), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-compliance-map"></a>

**VERIFY-PRODUCT-COMPLIANCE-MAP (automated):** Component roles, separate legal/software views, reachable guide links, labeled static figures, unique IDs, narrow-screen reading order, equivalent Markdown descriptions and safe directive expansion with untouched code examples. No implied universal applicability or automatic host fulfillment.

**Limits/open review:** Illustrative responsibilities, not a mandatory sequence, legal applicability decision, checklist of universally required features or evidence that a host duty is fulfilled.

**Code/test references:** [site/compliance-diagrams.mjs](../../site/compliance-diagrams.mjs), [site/compliance-diagrams.css](../../site/compliance-diagrams.css), [site/build.mjs](../../site/build.mjs), [site/guide-pages.mjs](../../site/guide-pages.mjs), [site/navigation.mjs](../../site/navigation.mjs), [docs/COMPLIANCE-MAP.md](../../docs/COMPLIANCE-MAP.md), [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md), [docs/GUARANTEE-PRODUCER-EXAMPLE.md](../../docs/GUARANTEE-PRODUCER-EXAMPLE.md), [docs/CLOUDFLARE-STARTER.md](../../docs/CLOUDFLARE-STARTER.md), [site/test/compliance-diagrams.test.mjs](../../site/test/compliance-diagrams.test.mjs), [docs/verification/compliance-map.md](../../docs/verification/compliance-map.md)

<a id="req-product-cartridges"></a>

### REQ-PRODUCT-CARTRIDGES — Pack-led setup with focused facts and a reusable handoff

Present bounded functional jobs and specific regulatory overlays as versioned packs. Resolve their existing integration contracts, ask only the selected job questions and carry selections, explicit answers and draft config through export/resume. Keep requested work separate from supporting foundations and actual verification. Show every installed pack by default in named groups, with counts and direct navigation; additional functions and regional packs must not be hidden.

**Applies when:** Choosing, preparing or resuming Notabenda integration work in the website, CLI or reusable setup UI.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-cartridges"></a>

**VERIFY-PRODUCT-CARTRIDGES (automated):** Selection and dependency tests prove no activation or invented answers; focused UI/CLI drafts preserve imports and selection across report resume. Public onboarding stays local and separate from session demo storage. Browser checks cover desktop/mobile choice, focus and draft handoff; deployment verification is not inferred from selection.

**Implementation boundary:** One registry references installed integration targets and requirement IDs. Focused setup preserves unanswered and unrelated facts; prerequisites require review/reuse. Private report metadata pins selected pack revisions; selection never fabricates a yes/no practice answer. Draft config, report and agent brief are separate outputs. No persistence is introduced in the visitor browser. The same packaged SSR/mountable console and separate stylesheet serve public/operator setup and new CF starters; link destinations are host supplied and starter assets require configuration access. Packs is the public name. Existing CLI/import aliases and pinned report data remain compatible. All twenty packs are shown in five shelves with a counted index. The homepage and architecture guide list all twenty packs from the installed registry, with direct links to stable setup card anchors. The main navigation shows the library count; the reusable setup index names every pack.

**Limits/open review:** Initial product flow and draft/agent handoff. Selecting a pack does not activate a policy, establish applicability, alter an existing deployment or prove verification. Remaining interfaces and advanced flows still need the same product treatment. Regional packs describe named preview mechanisms, not complete country packs.

**Code/test references:** [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/cartridges-cli.ts](../../packages/notabenda/src/cartridges-cli.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [site/cartridge-page.mjs](../../site/cartridge-page.mjs), [site/cartridges-app.mjs](../../site/cartridges-app.mjs), [site/build.mjs](../../site/build.mjs), [site/host.mjs](../../site/host.mjs), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/src/cartridges-ui.ts](../../packages/notabenda/src/cartridges-ui.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [packages/notabenda-cf/templates/src/setup.mjs](../../packages/notabenda-cf/templates/src/setup.mjs), [packages/notabenda-cf/templates/scripts/build-assets.mjs](../../packages/notabenda-cf/templates/scripts/build-assets.mjs), [site/pack-directory.mjs](../../site/pack-directory.mjs), [site/style.css](../../site/style.css), [packages/notabenda/test/cartridges.test.mjs](../../packages/notabenda/test/cartridges.test.mjs), [site/test/cartridges.test.mjs](../../site/test/cartridges.test.mjs), [docs/verification/cartridges.md](../../docs/verification/cartridges.md), [packages/notabenda/test/cartridges-ui.test.mjs](../../packages/notabenda/test/cartridges-ui.test.mjs), [packages/notabenda-cf/test/setup.test.mjs](../../packages/notabenda-cf/test/setup.test.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs), [site/test/site-organization.test.mjs](../../site/test/site-organization.test.mjs)

<a id="req-product-workspace-overview"></a>

### REQ-PRODUCT-WORKSPACE-OVERVIEW — Job-focused workspace overview and bounded record finder

Group primary operator jobs, keep additional areas available and search only host-authorized scoped stores through bounded segments. Preserve continuations and distinguish unavailable, incomplete and empty results without readiness claims.

**Applies when:** The optional workspace overview is mounted.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-workspace-overview"></a>

**VERIFY-PRODUCT-WORKSPACE-OVERVIEW (automated):** No record reads on opening; one validated bounded search segment per granted area. Authorization, setup permission, continuation, sanitized failures and cross-session separation are exercised with real workers and generated starter routes.

**Limits/open review:** The overview does not prove current permission, installed packs, complete history, newest events, a snapshot or legal compliance. Host adapters and destination authorization remain host responsibilities.

**Code/test references:** [packages/notabenda-cf/src/overview.ts](../../packages/notabenda-cf/src/overview.ts), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/templates/src/host.mjs](../../packages/notabenda-cf/templates/src/host.mjs), [packages/notabenda-cf/templates/src/workspace.mjs](../../packages/notabenda-cf/templates/src/workspace.mjs), [site/worker.mjs](../../site/worker.mjs), [site/admin-presentation.mjs](../../site/admin-presentation.mjs), [site/order-demo-admin.mjs](../../site/order-demo-admin.mjs), [packages/notabenda-cf/test/overview.test.mjs](../../packages/notabenda-cf/test/overview.test.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [docs/verification/workspace-overview.md](../../docs/verification/workspace-overview.md), [site/test/order-demo.test.mjs](../../site/test/order-demo.test.mjs)

<a id="req-product-draft-preview"></a>

### REQ-PRODUCT-DRAFT-PREVIEW — Deliberate local preview of configured legal pages

Offer an optional reader for the prepared draft using the ordinary document renderer. Keep a fixed public snapshot, preserve review declarations, disable outside navigation and reject stale asynchronous previews without changing the draft or deployment.

**Applies when:** Previewing config-based legal pages during pack setup or through the optional standalone viewer.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-draft-preview"></a>

**VERIFY-PRODUCT-DRAFT-PREVIEW (automated):** Fixed public snapshot, no persistence/publication/review mutation, safe text, inert outside links, isolated IDs and stale-load cancellation. Separate on-demand delivery and generated-starter configuration access remain checked.

**Limits/open review:** Config-only reading preview. Separate MD/MDX project files and custom components, live widgets, actual deployment identity and legal content review remain separate work. JSDOM checks do not prove native browser focus behavior.

**Code/test references:** [packages/notabenda/src/setup-preview.ts](../../packages/notabenda/src/setup-preview.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [site/build.mjs](../../site/build.mjs), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda-cf/templates/scripts/build-assets.mjs](../../packages/notabenda-cf/templates/scripts/build-assets.mjs), [packages/notabenda-cf/templates/src/host.mjs](../../packages/notabenda-cf/templates/src/host.mjs), [packages/notabenda-cf/bin/doctor.mjs](../../packages/notabenda-cf/bin/doctor.mjs), [packages/notabenda/test/setup-preview.test.mjs](../../packages/notabenda/test/setup-preview.test.mjs), [site/test/setup-preview.test.mjs](../../site/test/setup-preview.test.mjs), [site/test/accessibility.test.mjs](../../site/test/accessibility.test.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs), [packages/notabenda-cf/test/doctor.test.mjs](../../packages/notabenda-cf/test/doctor.test.mjs), [docs/verification/draft-preview.md](../../docs/verification/draft-preview.md)

<a id="req-product-pack-connection"></a>

### REQ-PRODUCT-PACK-CONNECTION — Pack-specific connection guidance and a saved agent handoff

Show the selected pack connection work and application checks from the installed integration reference, distinguish existing foundations and explicit regional policy proposals, and save the corresponding connection-stage brief beside scoped wizard output. Guidance must not mark work as installed or verified. Put current configuration findings, unanswered selected practices and explicit scope-review topics before draft preview/export, with direct review actions and access to all review notes. Counts establish no completion or approval.

**Applies when:** A scoped pack setup draft is prepared in the browser or terminal wizard.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-pack-connection"></a>

**VERIFY-PRODUCT-PACK-CONNECTION (automated):** Selected pack steps, dependency reuse, exact policy proposals, scoped handoff parity and invalidation without installation or verification claims. Prepared review precedes preview/export, counts current scoped findings independently, preserves full notes, focuses real destinations, preserves saved answers and refuses stale/detached actions. Zero counts and source reviews never imply approval or verified installation.

**Implementation boundary:** Connection tasks and checks resolve the existing target registry. Regional proposals retain exact selected policy paths/required fields and stay disabled. UI and scoped CLI save the same connect-stage brief, referencing the actual config/report filenames; existing prepare-stage briefs remain available. The prepared browser summary uses the current report and selected target questions. Actions reveal actual findings/notes or focus an unresolved practice; edits remove stale actions without adding approval or verification state.

**Limits/open review:** Advisory guidance only. Actual integration, reviewed wording, applicability and deployment verification remain host work. The brief contains no operator answers; those remain in the separate private report.

**Code/test references:** [packages/notabenda/src/setup-connection-ui.ts](../../packages/notabenda/src/setup-connection-ui.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/src/setup-review-ui.ts](../../packages/notabenda/src/setup-review-ui.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/test/pack-connection.test.mjs](../../packages/notabenda/test/pack-connection.test.mjs), [site/test/accessibility.test.mjs](../../site/test/accessibility.test.mjs), [docs/verification/pack-connection.md](../../docs/verification/pack-connection.md), [packages/notabenda/test/setup-review.test.mjs](../../packages/notabenda/test/setup-review.test.mjs)

<a id="req-product-consent-authoring"></a>

### REQ-PRODUCT-CONSENT-AUTHORING — Explicit cookie control enrollment and memory-period draft authoring

Let operators author real consent settings through a shared bounded draft API, setup editor and CLI. Require explicit service enrollment, complete purpose dependencies, material versions and separate lifetimes. Bind edits to reviewed public facts, preserve policies/wording/restrictions and keep configuration separate from runtime permission or deployment.

**Applies when:** An operator explicitly configures or edits cookie control settings in a local setup draft.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-consent-authoring"></a>

**VERIFY-PRODUCT-CONSENT-AUTHORING (automated):** No implicit settings, complete purpose enrollment, preserved policies/guards/pins, stale/cancel fences, equivalent UI/CLI output and actual synthetic runtime enforcement.

**Implementation boundary:** Explicit service selection exposes its mechanical purpose closure, with operator-supplied purpose/service material versions and grant/refusal/dismissal memory. Public baseline comparison rejects stale changes. Existing consent information, regional policies, scope guards and catalog review pins are preserved. Saves invalidate exported draft artifacts; unsaved/canceled proposals do not change config. Synthetic actual lifecycle checks cover rejection, granular grants, withdrawal/reload and restrictive scopes. Imported timing policies are shown in the editor for review. Enter in draft fields cannot advance the parent setup; packed imports and strict consumer types cover both new subpaths.

**Limits/open review:** No recommended legal lifetimes or applicability decision is supplied. Unknown/present scope guards remain restrictive. Actual service lifecycles, qualified wording, regional changes and deployment acceptance remain host work.

**Code/test references:** [packages/notabenda/src/setup-consent.ts](../../packages/notabenda/src/setup-consent.ts), [packages/notabenda/src/setup-consent-ui.ts](../../packages/notabenda/src/setup-consent-ui.ts), [packages/notabenda/src/setup-consent-cli.ts](../../packages/notabenda/src/setup-consent-cli.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/setup-connection-ui.ts](../../packages/notabenda/src/setup-connection-ui.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/test/setup-consent.test.mjs](../../packages/notabenda/test/setup-consent.test.mjs), [site/test/accessibility.test.mjs](../../site/test/accessibility.test.mjs), [docs/verification/consent-authoring.md](../../docs/verification/consent-authoring.md), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs)

<a id="req-product-privacy-packs"></a>

### REQ-PRODUCT-PRIVACY-PACKS — Focused privacy-information and processing-restriction packs

Provide separate direct and supported indirect collection, privacy request navigation and processing opt-out setup paths. Preserve unknown practices and imported restrictions; identify missing declarations and manual builder/host work in UI, private reports and matching agent briefs without enabling features.

**Applies when:** Choosing, preparing or resuming Notabenda integration work in the website, CLI or reusable setup UI.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-privacy-packs"></a>

**VERIFY-PRODUCT-PRIVACY-PACKS (automated):** UI and CLI preserve four distinct new pack selections and private notes. Direct versus indirect language/profile paths remain separate, missing classifications differ from explicit [], rights workflows remain host work, and regenerated input reviews and matching briefs identify missing/manual inputs without creating policies, routes, permissions or verified states. Older reports resume with added questions unresolved.

**Limits/open review:** Setup and input review only. Declared fields do not establish truth, profile applicability or working destinations. Builder descriptors, actual notification, request fulfillment and downstream enforcement remain host work; no regional profile is enabled.

**Code/test references:** [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/cartridges-ui.ts](../../packages/notabenda/src/cartridges-ui.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/setup-connection-ui.ts](../../packages/notabenda/src/setup-connection-ui.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [site/pack-directory.mjs](../../site/pack-directory.mjs), [site/style.css](../../site/style.css), [site/navigation.mjs](../../site/navigation.mjs), [packages/notabenda/test/privacy-packs.test.mjs](../../packages/notabenda/test/privacy-packs.test.mjs), [packages/notabenda/test/pack-connection.test.mjs](../../packages/notabenda/test/pack-connection.test.mjs), [site/test/cartridges.test.mjs](../../site/test/cartridges.test.mjs), [docs/verification/privacy-packs.md](../../docs/verification/privacy-packs.md), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs)

<a id="req-product-publication-check"></a>

### REQ-PRODUCT-PUBLICATION-CHECK — Explicit bounded observation of published pinned release files

Compare a trusted local public compiler artifact with four anonymous exact-path deployment observations. Report canonical JSON and exact HTML matches, origins, preview mode and narrow unverified boundaries.

**Applies when:** An operator deliberately invokes the Node-only publication checker against a selected origin.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-publication-check"></a>

**VERIFY-PRODUCT-PUBLICATION-CHECK (automated):** Explicit four-GET observation honors preflight, origins, preview mode, anonymous authority, content comparison, media/charset checks, decompressed/streamed limits, deadlines, sanitized reports and narrow claims. Setup itself performs no observation.

**Limits/open review:** No crawling, redirects, scripts, authentication, writes or automatic setup requests. No installed-pack, legal approval, current-route, active-control, atomic-snapshot or future-retention claim. Input and decompressed response limits remain 128 KiB; HTTPS is not SSRF protection. Keep operator reports private.

**Code/test references:** [packages/notabenda/src/publication.ts](../../packages/notabenda/src/publication.ts), [packages/notabenda/src/publication-cli.ts](../../packages/notabenda/src/publication-cli.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [site/host.mjs](../../site/host.mjs), [packages/notabenda/test/publication.test.mjs](../../packages/notabenda/test/publication.test.mjs), [docs/verification/publication-check.md](../../docs/verification/publication-check.md), [site/test/host.test.mjs](../../site/test/host.test.mjs)

<a id="req-product-consumer-packs"></a>

### REQ-PRODUCT-CONSUMER-PACKS — Independent consumer transaction setup packs

Keep withdrawal, supported German cancellation, paid-order review, customer copies and guarantee information separately selectable, with focused facts, real builder inputs, explicit backend dependencies and host acceptance checks shared across UI, CLI and agent handoff.

**Applies when:** Preparing or resuming a selected supported consumer-transaction setup job.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-consumer-packs"></a>

**VERIFY-PRODUCT-CONSUMER-PACKS (automated):** Five targets preserve unknowns, prior pins, private answers and restrictions. Focused input review distinguishes inventory declarations from separate manual builder/host work, profile-language limits, guarantee branches and existing confirmation archive foundation; selection causes no runtime effects.

**Limits/open review:** Setup behavior only; no expanded legal coverage. No inferred profile, quote, route, guarantee qualification or delivery. Fixed contract-profile language and existing confirmation admission/archive dependency remain explicit. Terms agreement, cookie controls and backoffice are not automatic prerequisites.

**Code/test references:** [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [site/pack-directory.mjs](../../site/pack-directory.mjs), [site/style.css](../../site/style.css), [site/navigation.mjs](../../site/navigation.mjs), [packages/notabenda/test/consumer-packs.test.mjs](../../packages/notabenda/test/consumer-packs.test.mjs), [docs/verification/consumer-packs.md](../../docs/verification/consumer-packs.md)

<a id="req-product-specialist-packs"></a>

### REQ-PRODUCT-SPECIALIST-PACKS — Focused technology, assessed-storage and Google Basic setup packs

Connect three existing supported mechanisms to distinct prerequisites, focused practice questions, concrete missing-input and host-work reviews, versioned private reports and matching UI/CLI/agent handoffs. Preserve exact inventory and unresolved applicability.

**Applies when:** Preparing or resuming the technology-notices, assessed-storage-settings or google-basic setup path.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-specialist-packs"></a>

**VERIFY-PRODUCT-SPECIALIST-PACKS (automated):** Three packs retain distinct foundations, concrete declaration gaps, technology inventory/language boundaries, every storage condition path, independent objections and per-document Google ownership. Target assessment requires at least one Google declaration without demanding it from unrelated services. Old reports resume with added facts unknown; shared reviews and private handoffs regenerate without effects or inferred configuration.

**Limits/open review:** Setup only, with no expanded legal coverage or activation. Conditions and review flags remain unverified. Technology declarations/scope binding, usable storage presentation/atomic journal and actual Google document ownership/account/network behavior remain host work. No consent prerequisite for exception storage, inferred targets/profiles, weakened guards, post-load silence or CMP certification.

**Code/test references:** [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/integration-assessment.ts](../../packages/notabenda/src/integration-assessment.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [site/navigation.mjs](../../site/navigation.mjs), [packages/notabenda/test/specialist-packs.test.mjs](../../packages/notabenda/test/specialist-packs.test.mjs), [docs/verification/specialist-packs.md](../../docs/verification/specialist-packs.md)

<a id="req-product-rights-authoring"></a>

### REQ-PRODUCT-RIGHTS-AUTHORING — Explicit privacy request page and privacy-link draft authoring

Author complete public request-page settings through a bounded baseline-bound API, operator editor and versioned CLI JSON proposal. Require actual destinations, scope, public fallback, next steps, revision and an explicit atomic privacy-link decision; preserve unrelated facts and show an inert supporting-page preview.

**Applies when:** An operator explicitly configures or edits a request-page draft.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-RIGHTS](../FEATURES.md#feat-rights).

<a id="verify-product-rights-authoring"></a>

**VERIFY-PRODUCT-RIGHTS-AUTHORING (automated):** Detached atomic page/link edits, explicit complete settings, no inferred destinations/rights, revision and stale-baseline checks, preserved unrelated settings, inert supporting preview, explicit missing-translation limitation, UI/CLI parity and packaged strict types.

**Implementation boundary:** Complete explicit settings and current public baseline are validated before returning a detached draft. Changing the public page requires a different current revision and resets review. Privacy route/link update together after explicit acknowledgement. UI cancel/import/reset and CLI final confirmation fence stale work. Preview links cannot navigate or contact workflows.

**Limits/open review:** Non-English native pages and authoring require complete localization.rights messages; operator setup remains English. Authoring supplies no entitlement, intake, identity, response deadline, fulfillment or appeal workflow. Historical revision uniqueness, applicable submission methods and working destinations remain host work. The supporting page stays outside the three pinned legal-document kinds.

**Code/test references:** [packages/notabenda/src/setup-rights.ts](../../packages/notabenda/src/setup-rights.ts), [packages/notabenda/src/setup-rights-ui.ts](../../packages/notabenda/src/setup-rights-ui.ts), [packages/notabenda/src/setup-rights-cli.ts](../../packages/notabenda/src/setup-rights-cli.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/setup-preview.ts](../../packages/notabenda/src/setup-preview.ts), [packages/notabenda/src/setup-connection-ui.ts](../../packages/notabenda/src/setup-connection-ui.ts), [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/test/setup-rights.test.mjs](../../packages/notabenda/test/setup-rights.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/accessibility.test.mjs](../../site/test/accessibility.test.mjs), [docs/verification/rights-authoring.md](../../docs/verification/rights-authoring.md)

<a id="req-product-rights-localization"></a>

### REQ-PRODUCT-RIGHTS-LOCALIZATION — Complete host-supplied localization for privacy request pages

Require a complete bounded plain-text rights-page message set for non-English native presentation and authoring. Reuse the matching site language/direction/revision/review metadata and document navigation labels; preserve operator facts, inert preview and immutable release boundaries.

**Applies when:** A host renders, authors or previews a native non-English privacy request page.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-RIGHTS](../FEATURES.md#feat-rights), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-rights-localization"></a>

**VERIFY-PRODUCT-RIGHTS-LOCALIZATION (automated):** Complete/closed bounded messages, explicit missing-language limits, escaped visitor labels, lang/dir and RTL ordinals, preserved locale and stale-dictionary authoring fences, inert supporting preview, release retention, consent registration and actual choice recording without page messages, and installed strict types.

**Implementation boundary:** Public configuration validates exact five-field rights messages. Vanilla/React/Astro share selected page labels, lang/dir and logical spacing. Draft localization remains visible and production-blocking. Authoring compares the complete public baseline, including messages. Consent runtime and backend archive verification project only explicit consent metadata/messages, allowing real notice registration and choice recording from a release with additional page dictionaries.

**Limits/open review:** Host-supplied demonstration translations are not reviewed legal-language packs. Missing page messages remain unresolved without changing the site locale. Operator setup and preview chrome stay English. Entitlement, intake, identity, deadlines, fulfillment and appeals remain host work; this supporting page stays outside the three pinned legal-document HTML kinds.

**Code/test references:** [packages/notabenda/src/rights-localization-policy.ts](../../packages/notabenda/src/rights-localization-policy.ts), [packages/notabenda/src/document-localization.ts](../../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/rights.ts](../../packages/notabenda/src/rights.ts), [packages/notabenda/src/setup-rights.ts](../../packages/notabenda/src/setup-rights.ts), [packages/notabenda/src/setup-rights-ui.ts](../../packages/notabenda/src/setup-rights-ui.ts), [packages/notabenda/src/setup-preview.ts](../../packages/notabenda/src/setup-preview.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [examples/localization/rights-build.mjs](../../examples/localization/rights-build.mjs), [examples/localization/build.mjs](../../examples/localization/build.mjs), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/test/rights-localization.test.mjs](../../packages/notabenda/test/rights-localization.test.mjs), [packages/notabenda/test/setup-rights.test.mjs](../../packages/notabenda/test/setup-rights.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/accessibility.test.mjs](../../site/test/accessibility.test.mjs), [docs/verification/rights-localization.md](../../docs/verification/rights-localization.md)

<a id="req-product-storage-authoring"></a>

### REQ-PRODUCT-STORAGE-AUTHORING — Explicit storage inventory authoring and affected material service versions

Author bounded ordinary storage batches through a shared baseline-bound API, operator editor and CLI. Require actual public facts, explicit classification and public necessity reasons, fresh material versions for every enrolled old/new owner, and separate review of previous markers/technology inputs. Preserve restrictions, policies, enrollment and protected exception ownership.

**Applies when:** An operator adds, edits or removes storage declarations in a local setup draft.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-INVENTORY](../FEATURES.md#feat-inventory).

<a id="verify-product-storage-authoring"></a>

**VERIFY-PRODUCT-STORAGE-AUTHORING (automated):** Atomic detached batches, exact affected-owner versions, stale/malformed/no-op/duplicate rejection, exception/technology boundaries, preserved policies/guards/enrollment, retained migration facts, actual grant/refusal behavior, UI cancel/confirm/search/reset, private CLI review and installed types. Exact whitespace-bearing keys, fresh stale-card facts, hostile inherited array hooks, async cancellation/host replacement, browser/build hash parity without Node dependencies, cumulative site-bound migration history and pre-adoption download limits.

**Implementation boundary:** A closed atomic batch changes only declared storage and explicit affected enrolled service versions. The complete public baseline rejects stale work. Old declarations and scope changes remain in a separate private review; config/source files are not overwritten. UI search pages are bounded; unapplied edits remain separate, while saves invalidate prepared exports. Actual compatibility/compiled runtimes reject old grants under the new scope and preserve restrictive refusal/solicitation behavior. Browser-safe platform hashing detaches declarations before awaiting and rechecks the current host baseline before adoption. Cancel/import/reset/destroy abandon pending work. Exact storage names are preserved; stale cards reopen current facts. The cumulative private review retains each site context across reset/import, bounded to 128 steps/512 KiB, and must be downloadable before adoption. Setup configs remain within the 512 KiB import bound.

**Limits/open review:** No exemption or actual storage behavior is inferred. Exception-owned storage needs full separate profile review; technology owners need a revised explicit binding and descriptor rebuild. Disclosure types exceed the built-in cleanup adapter. Historical version uniqueness, old-marker migration, inaccessible storage and actual loader/network checks remain host work.

**Code/test references:** [packages/notabenda/src/setup-storage.ts](../../packages/notabenda/src/setup-storage.ts), [packages/notabenda/src/setup-storage-ui.ts](../../packages/notabenda/src/setup-storage-ui.ts), [packages/notabenda/src/setup-storage-cli.ts](../../packages/notabenda/src/setup-storage-cli.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/src/setup-connection-ui.ts](../../packages/notabenda/src/setup-connection-ui.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/src/technology-collection-policy.ts](../../packages/notabenda/src/technology-collection-policy.ts), [packages/notabenda/src/catalog-plain.ts](../../packages/notabenda/src/catalog-plain.ts), [packages/notabenda-cf/src/catalog-plain.ts](../../packages/notabenda-cf/src/catalog-plain.ts), [packages/notabenda/test/setup-storage.test.mjs](../../packages/notabenda/test/setup-storage.test.mjs), [packages/notabenda/test/setup-storage-ui.test.mjs](../../packages/notabenda/test/setup-storage-ui.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/accessibility.test.mjs](../../site/test/accessibility.test.mjs), [docs/verification/storage-authoring.md](../../docs/verification/storage-authoring.md)

<a id="req-product-connection-inspection"></a>

### REQ-PRODUCT-CONNECTION-INSPECTION — Read-only consent inventory and lifecycle-registration inspection

Distinguish missing lifecycle registrations from registered-but-blocked services on the supplied actual controller. Compare an optional intended compiled consent inventory without taking consent actions; leave publication and application behavior explicitly unverified.

**Applies when:** An operator or agent inspects a cookie-service connection before application tests.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-product-connection-inspection"></a>

**VERIFY-PRODUCT-CONNECTION-INSPECTION (automated):** Real profiles distinguish missing, blocked, active, transitional, removed, failed-cleanup and destroyed states without writes, backend requests or permission actions; required-evidence snapshots preserve local storage freshness reads. Expected inventory differences, excluded other packs, hostile-input rejection, detached maps, installed types and a stale-result-invalidating example remain explicit.

**Implementation boundary:** Both runtime profiles expose detached enrollment maps. An optional browser-safe inspector uses the shared compiler projection, reports phases without awaiting or refreshing, and separates configuration, registration, publication and behavior. The lazy example invalidates snapshots after controller changes.

**Limits/open review:** In-process controller observations are not authenticated receipts. Registration does not prove resource behavior or truthful callbacks. Comparison excludes other packs, evidence mode and deployed files. Broader evidence-bound pack readiness remains incomplete.

**Code/test references:** [packages/notabenda/src/consent-inspect.ts](../../packages/notabenda/src/consent-inspect.ts), [packages/notabenda/src/consent-inventory.ts](../../packages/notabenda/src/consent-inventory.ts), [packages/notabenda/src/consent-compile.ts](../../packages/notabenda/src/consent-compile.ts), [packages/notabenda/src/consent-types.ts](../../packages/notabenda/src/consent-types.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/static/connection-inspector.mjs](../../examples/static/connection-inspector.mjs), [examples/static/consent.mjs](../../examples/static/consent.mjs), [examples/static/choices-page.mjs](../../examples/static/choices-page.mjs), [examples/static/choices-page.css](../../examples/static/choices-page.css), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [packages/notabenda/test/consent-inspect.test.mjs](../../packages/notabenda/test/consent-inspect.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/connection-inspection.test.mjs](../../site/test/connection-inspection.test.mjs), [docs/verification/connection-inspection.md](../../docs/verification/connection-inspection.md), [site/test/delivery.test.mjs](../../site/test/delivery.test.mjs)

<a id="req-product-cf-recovery-rehearsal"></a>

### REQ-PRODUCT-CF-RECOVERY-REHEARSAL — Isolated local starter recovery with later retirement replay

Provide optional maintainer tooling to restore a bounded pre-erasure KV snapshot into a different local SQLite object, keep tested access paths closed until retirement replay and purge finish, and verify preserved held records and private source bytes.

**Applies when:** Maintainers explicitly run the isolated Cloudflare starter runtime rehearsal.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-product-cf-recovery-rehearsal"></a>

**VERIFY-PRODUCT-CF-RECOVERY-REHEARSAL (automated):** Optional real local Wrangler run verifies different-object restore, private-file integrity, later retirement replay before opening, restart persistence, physical erased-head deletion, retained and held heads, exact source bytes and old-grant refusal. A direct regression rejects seeding an isolated hydrated fixture; no production restore control is added.

**Implementation boundary:** Different fixed target, owner-only backup/manifest/report, default-closed fixture gate, source-only seed guard, manifest decision check, restart/resumable purge, exact old-grant refusal, surviving heads and private MDX source response comparison.

**Limits/open review:** One synthetic consent retirement and a pre-existing held context in local Wrangler SQLite KV. Not provider-native backup, remote recovery, all-family acceptance, newer hold-journal replay, external-copy deletion or legal readiness. Host owns complete authenticated retirement/hold reconciliation and all production access paths; fixture controls are never shipped. Adopters choose CI.

**Code/test references:** [scripts/check-cf-starter-runtime.mjs](../../scripts/check-cf-starter-runtime.mjs), [scripts/fixtures/starter-recovery.mjs](../../scripts/fixtures/starter-recovery.mjs), [packages/notabenda-cf/test/recovery-rehearsal.test.mjs](../../packages/notabenda-cf/test/recovery-rehearsal.test.mjs), [scripts/check-cf-starter-runtime.mjs](../../scripts/check-cf-starter-runtime.mjs), [docs/verification/cloudflare-recovery.md](../../docs/verification/cloudflare-recovery.md)

<a id="req-product-terms-adapters"></a>

### REQ-PRODUCT-TERMS-ADAPTERS — Host-owned terms agreement views for React and Astro

Provide first-class framework views over the existing terms controller, preserving conservative SSR, explicit version-bound actions, uncertain attempts and exact operation ownership across remounts and navigation.

**Applies when:** An adopter connects the terms agreement pack to a React or Astro application.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-terms-adapters"></a>

**VERIFY-PRODUCT-TERMS-ADAPTERS (automated):** Real controllers and recorder verify conservative SSR/hydration, StrictMode and view-only cleanup, inert detached controls, same-request uncertain recovery, pending operation replacement, terminal and localized native states, offer/context navigation rejection, permanent key binding, failed-mount cleanup, shared framework ownership, offline installed types and real Astro compilation. Demo pages remain session-scoped with no acceptance on rendering.

**Implementation boundary:** React provider, cached immutable hooks and native wrapper; Astro inert named shell, exact offer and remembered controller-context binding; shared view ownership, removed detached handlers, no mount/navigation delivery and existing isolated-recording examples.

**Limits/open review:** Host owns authenticated operation/subject binding, exact offer registration/activation, controller bootstrap and destruction, cross-reload recovery and business fulfillment. A public Astro context key supplies no authority. Broader platform and assistive-technology acceptance remain open.

**Code/test references:** [packages/notabenda/src/react-terms.ts](../../packages/notabenda/src/react-terms.ts), [packages/notabenda/src/astro-terms.ts](../../packages/notabenda/src/astro-terms.ts), [packages/notabenda/src/terms-view-owner.ts](../../packages/notabenda/src/terms-view-owner.ts), [packages/notabenda/src/astro/TermsAcceptance.astro](../../packages/notabenda/src/astro/TermsAcceptance.astro), [packages/notabenda/src/terms.ts](../../packages/notabenda/src/terms.ts), [packages/notabenda/src/react.ts](../../packages/notabenda/src/react.ts), [packages/notabenda/src/astro-client.ts](../../packages/notabenda/src/astro-client.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/agreements/example.mjs](../../examples/agreements/example.mjs), [examples/agreements/build.mjs](../../examples/agreements/build.mjs), [examples/agreements/react-view.mjs](../../examples/agreements/react-view.mjs), [examples/agreements/react-client.mjs](../../examples/agreements/react-client.mjs), [examples/agreements/transport.mjs](../../examples/agreements/transport.mjs), [examples/astro/src/layouts/AgreementLayout.astro](../../examples/astro/src/layouts/AgreementLayout.astro), [examples/astro/src/scripts/agreement-client.mjs](../../examples/astro/src/scripts/agreement-client.mjs), [site/demo-host.mjs](../../site/demo-host.mjs), [examples/agreements/astro-session.mjs](../../examples/agreements/astro-session.mjs), [packages/notabenda/test/react-terms.test.mjs](../../packages/notabenda/test/react-terms.test.mjs), [packages/notabenda/test/astro-terms.test.mjs](../../packages/notabenda/test/astro-terms.test.mjs), [packages/notabenda/test/astro-agreement-example.test.mjs](../../packages/notabenda/test/astro-agreement-example.test.mjs), [packages/notabenda/test/react-package.test.mjs](../../packages/notabenda/test/react-package.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [docs/verification/terms-adapters.md](../../docs/verification/terms-adapters.md)

<a id="req-product-pack-education"></a>

### REQ-PRODUCT-PACK-EDUCATION — Plain pack descriptions and example-specific learning flows

Explain the concrete job and use case of every installed pack in shared short descriptions. Each default example teaches its real flow and result without altering records or claiming legal readiness.

**Applies when:** A user browses packs, follows an example or hands a selected job to an agent.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-pack-education"></a>

**VERIFY-PRODUCT-PACK-EDUCATION (automated):** Every public default pack destination has its corresponding case/three-step/result explanation; listings share the installed outcome; order variants and timing rules remain distinct; teaching is collapsed/no-script, outside React roots, absent from pinned policy/offer inputs, and uses existing private demo nonces without changing scope or selection pins.

**Implementation boundary:** Twenty shared outcomes/intros and individual use-case/flow/result records; scoped static teaching disclosures, two timing walkthroughs, order-specific variants, legal-page showcase, framework-root separation and nonce-preserving demo admin education.

**Limits/open review:** Descriptions identify supported mechanisms rather than complete legal coverage. Walkthroughs do not run checks, reset remembered state, send notifications or establish fulfillment. Policy text, accepted statements and pinned artifacts retain their identities.

**Code/test references:** [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/cartridges-ui.ts](../../packages/notabenda/src/cartridges-ui.ts), [examples/static/pack-learning.mjs](../../examples/static/pack-learning.mjs), [examples/static/build.mjs](../../examples/static/build.mjs), [site/navigation.mjs](../../site/navigation.mjs), [site/examples-page.mjs](../../site/examples-page.mjs), [site/demo-host.mjs](../../site/demo-host.mjs), [packages/notabenda/test/pack-education.test.mjs](../../packages/notabenda/test/pack-education.test.mjs), [site/test/pack-education.test.mjs](../../site/test/pack-education.test.mjs), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [docs/verification/pack-education.md](../../docs/verification/pack-education.md)

<a id="req-product-storage-localization"></a>

### REQ-PRODUCT-STORAGE-LOCALIZATION — Complete host-supplied native storage-settings messages

Localize every fixed visitor label and state in native storage-exception controls, with explicit language/direction and no partial fallback. Keep declared entry facts, eligibility and saved objections separate.

**Applies when:** An adopter uses the native storage-exception controls in a selected site language.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-LOCALIZATION](../FEATURES.md#feat-localization), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-storage-localization"></a>

**VERIFY-PRODUCT-STORAGE-LOCALIZATION (automated):** Missing or invalid message sets cannot attach native presentation. Real localized controls retain objections through copy changes, handle failure/retry and become inert on removal; selected language/direction is explicit, archived copy changes artifact identity while cookie permission scopes stay unchanged, and the static Portuguese example uses only local services and separate storage.

**Implementation boundary:** Complete optional dictionary, native metadata and state labels, missing-language assessment, copy-only journal continuity, inert detached controls and a separate local Portuguese example.

**Limits/open review:** Host-supplied translations are not reviewed locale or jurisdiction coverage. Entry facts and applicability remain separate. Changing UI copy cannot clear an objection or qualify an exception.

**Code/test references:** [packages/notabenda/src/storage-exception-localization.ts](../../packages/notabenda/src/storage-exception-localization.ts), [packages/notabenda/src/storage-exception-controls.ts](../../packages/notabenda/src/storage-exception-controls.ts), [packages/notabenda/src/document-localization.ts](../../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/localization/storage-build.mjs](../../examples/localization/storage-build.mjs), [examples/localization/storage-client.mjs](../../examples/localization/storage-client.mjs), [examples/localization/storage-messages.json](../../examples/localization/storage-messages.json), [packages/notabenda/src/storage-exceptions.css](../../packages/notabenda/src/storage-exceptions.css), [packages/notabenda/test/storage-localization.test.mjs](../../packages/notabenda/test/storage-localization.test.mjs), [site/test/storage-localization.test.mjs](../../site/test/storage-localization.test.mjs), [docs/verification/storage-localization.md](../../docs/verification/storage-localization.md)

<a id="req-product-release-candidate"></a>

### REQ-PRODUCT-RELEASE-CANDIDATE — Reviewable local package candidates and migration guidance

Prepare three offline tarballs with strict byte-level contents, identity, export, license, source-map and dependency checks. Retain digests and explicit verification boundaries; provide private security reporting and migration/removal guidance without publishing.

**Applies when:** A maintainer prepares package artifacts or an adopter replaces/removes an existing integration.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-release-candidate"></a>

**VERIFY-PRODUCT-RELEASE-CANDIDATE (automated):** Adversarial archives fail before extraction or execution; actual packages have expected content/identity, safe maps, exports and license bytes with recorded hashes. Existing output is untouched and failures remain explicit. Opaque legacy grants are not imported; on-demand presentation grants nothing and withdrawal clears only declared markers while retaining old/unrelated storage.

**Implementation boundary:** Offline pack-only command with fresh ignored/external output, bounded strict ustar parsing without extraction, exact source/build inventory and license checks, source-map and export/bin validation, file/archive digests, failed-report preservation and separate public security/migration docs.

**Limits/open review:** Package-content checks do not prove secret absence, correct builds, vulnerability-free dependencies, legal review, operational acceptance or authorization to publish. Migration must preserve real restrictions and evidence; legacy choice mapping remains host work.

**Code/test references:** [scripts/release-package.mjs](../../scripts/release-package.mjs), [scripts/check-package-release.mjs](../../scripts/check-package-release.mjs), [SECURITY.md](../../SECURITY.md), [docs/RELEASE-CANDIDATE.md](../../docs/RELEASE-CANDIDATE.md), [docs/MIGRATION.md](../../docs/MIGRATION.md), [packages/notabenda/test/release-check.test.mjs](../../packages/notabenda/test/release-check.test.mjs), [packages/notabenda/test/migration.test.mjs](../../packages/notabenda/test/migration.test.mjs), [docs/verification/release-candidate.md](../../docs/verification/release-candidate.md)

<a id="req-product-recording-inspection"></a>

### REQ-PRODUCT-RECORDING-INSPECTION — Read-only inspection of current backend recording selections

Distinguish registered/archived descriptors from current fixed-scope recording selections. Validate the selected cookie, terms or form offer against its retained release and expose a host-authorized operator view without visitor reads or changes.

**Applies when:** An operator checks the current recording configuration of an explicitly granted host scope.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-recording-inspection"></a>

**VERIFY-PRODUCT-RECORDING-INSPECTION (automated):** Absent, inactive and selected activations remain distinct; invalid/missing/cross-scope/preview data fails without reads of visitor state or writes. The operator view rejects selectors before callbacks, bounds reads, preserves late-result isolation and private nonce-based responses, and integrates through existing host authorization.

**Implementation boundary:** Atomic selection/archive readers, bounded fixed-reader HTML/JSON inspector with timeout/failure isolation, explicit overview grant, denying starter integration and session-isolated website example.

**Limits/open review:** An active recording selection does not prove publication, installation, legal eligibility or an individual grant. Host authorization, storage resolution and callback truth/freshness remain separate. Checks do not enumerate unknown scopes or inspect visitor heads.

**Code/test references:** [packages/notabenda-cf/src/recording-selection.ts](../../packages/notabenda-cf/src/recording-selection.ts), [packages/notabenda-cf/src/recording-inspection.ts](../../packages/notabenda-cf/src/recording-inspection.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/terms.ts](../../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/permissions.ts](../../packages/notabenda-cf/src/permissions.ts), [packages/notabenda-cf/src/index.ts](../../packages/notabenda-cf/src/index.ts), [packages/notabenda-cf/src/overview.ts](../../packages/notabenda-cf/src/overview.ts), [packages/notabenda-cf/templates/src/workspace.mjs](../../packages/notabenda-cf/templates/src/workspace.mjs), [site/worker.mjs](../../site/worker.mjs), [site/navigation.mjs](../../site/navigation.mjs), [packages/notabenda-cf/templates/src/host.mjs](../../packages/notabenda-cf/templates/src/host.mjs), [packages/notabenda-cf/test/recording-inspection.test.mjs](../../packages/notabenda-cf/test/recording-inspection.test.mjs), [site/test/recording-inspection.test.mjs](../../site/test/recording-inspection.test.mjs), [docs/verification/recording-inspection.md](../../docs/verification/recording-inspection.md), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs), [site/test/agent-docs.test.mjs](../../site/test/agent-docs.test.mjs)

<a id="req-product-agent-handoff"></a>

### REQ-PRODUCT-AGENT-HANDOFF — Readable, dismissible browser instructions for agent handoff

Replace browser brief downloads with a shared read-only drawer containing current stage-specific instructions, deliberate copy and manual selection fallback. Preserve focus and discard stale handoffs after edits.

**Applies when:** A user hands a selected pack plan or prepared setup draft to a coding agent.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-agent-handoff"></a>

**VERIFY-PRODUCT-AGENT-HANDOFF (automated):** Current instructions open without a text download; copy is explicit and exact, clipboard failures remain usable, stale async callbacks cannot change closed/reopened views, edits/destruction dismiss the drawer and private notes never enter it.

**Implementation boundary:** Native modal drawer with safe literal text, copy/fallback, focus return and stale async result fencing. Both pack and prepared-draft actions share it. Terminal files remain supported.

**Limits/open review:** Copying is explicit and can fail under browser policy. The UI does not send instructions, install a skill or execute an agent; private answers remain separate.

**Code/test references:** [packages/notabenda/src/agent-handoff.ts](../../packages/notabenda/src/agent-handoff.ts), [packages/notabenda/src/agent-handoff.css](../../packages/notabenda/src/agent-handoff.css), [packages/notabenda/src/cartridges-ui.ts](../../packages/notabenda/src/cartridges-ui.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [packages/notabenda/scripts/copy-assets.mjs](../../packages/notabenda/scripts/copy-assets.mjs), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/test/agent-handoff.test.mjs](../../packages/notabenda/test/agent-handoff.test.mjs), [packages/notabenda/test/cartridges-ui.test.mjs](../../packages/notabenda/test/cartridges-ui.test.mjs), [packages/notabenda/test/pack-connection.test.mjs](../../packages/notabenda/test/pack-connection.test.mjs), [site/test/agent-handoff.test.mjs](../../site/test/agent-handoff.test.mjs), [docs/verification/agent-handoff.md](../../docs/verification/agent-handoff.md), [site/test/cartridges.test.mjs](../../site/test/cartridges.test.mjs)

<a id="req-product-authored-preview"></a>

### REQ-PRODUCT-AUTHORED-PREVIEW — Read and export an exact compiled authored release

Preview actual MD/MDX/custom-component HTML from a verified compiler result and export the same public bytes, with original source kept in its separate private archive.

**Applies when:** An adopter reviews an already compiled legal release before publication.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-authored-preview"></a>

**VERIFY-PRODUCT-AUTHORED-PREVIEW (automated):** Actual custom component markup is readable without another compilation; public ZIP files match compiler bytes and pass the retained publication checker, while private fields/source comments and active reading content stay out. Invalid/private/altered files and preview downgrades fail. Optional tarballs and real website frames remain usable.

**Implementation boundary:** Optional build-time reader and deterministic stored public ZIP, exact public-map validation, immutable snapshots and static isolated frames. Configuration preview copy and agent integration reference distinguish the two workflows.

**Limits/open review:** The static reading projection disables active markup, links, images and fonts; host styling remains trusted code and can request same-origin styles. Original exported HTML is not certified safe. Source/build truth, applicability, content review and actual application behavior remain separate.

**Code/test references:** [packages/notabenda-authoring/src/preview.ts](../../packages/notabenda-authoring/src/preview.ts), [packages/notabenda-authoring/src/preview-zip.ts](../../packages/notabenda-authoring/src/preview-zip.ts), [packages/notabenda-authoring/src/preview.css](../../packages/notabenda-authoring/src/preview.css), [packages/notabenda-authoring/scripts/copy-assets.mjs](../../packages/notabenda-authoring/scripts/copy-assets.mjs), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-preview.ts](../../packages/notabenda/src/setup-preview.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/authoring/build.mjs](../../examples/authoring/build.mjs), [examples/static/pack-learning.mjs](../../examples/static/pack-learning.mjs), [site/host.mjs](../../site/host.mjs), [site/navigation.mjs](../../site/navigation.mjs), [packages/notabenda-authoring/test/preview.test.mjs](../../packages/notabenda-authoring/test/preview.test.mjs), [packages/notabenda-authoring/test/package.test.mjs](../../packages/notabenda-authoring/test/package.test.mjs), [packages/notabenda/test/setup-preview.test.mjs](../../packages/notabenda/test/setup-preview.test.mjs), [site/test/authored-preview.test.mjs](../../site/test/authored-preview.test.mjs), [docs/verification/authored-preview.md](../../docs/verification/authored-preview.md)

<a id="req-product-processing-localization"></a>

### REQ-PRODUCT-PROCESSING-LOCALIZATION — Complete retained localization for recorded processing opt-outs

Supply one complete selected status/recovery dictionary with explicit language and direction, retain it with the exact notice and preserve restrictions and pending identities across copy revisions.

**Applies when:** An operator provides recorded processing opt-out controls in an explicitly selected language.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-LOCALIZATION](../FEATURES.md#feat-localization), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-processing-localization"></a>

**VERIFY-PRODUCT-PROCESSING-LOCALIZATION (automated):** Complete selected copy and metadata remain bound to the retained release; substitution and schema downgrade fail. Original requests survive copy revisions without duplicate events or weakened restrictions. All native states, RTL, real localized bootstrap and session-scoped recording/inspection remain usable.

**Implementation boundary:** Schema-2 notices retain a bounded complete selected interface; existing schema-1 English notices and request/receipt formats remain valid. Standalone CF validation matches exact archived copy. Native controls translate all states and recovery paths with explicit lang/dir.

**Limits/open review:** Host wording and translation review, legal applicability, identity mapping and downstream enforcement remain separate. Signals-only handling needs no recorded-interface dictionary. Copy changes cannot reset restrictions.

**Code/test references:** [packages/notabenda/src/processing-localization-policy.ts](../../packages/notabenda/src/processing-localization-policy.ts), [packages/notabenda/src/document-localization.ts](../../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/processing.ts](../../packages/notabenda/src/processing.ts), [packages/notabenda/src/processing-choices.ts](../../packages/notabenda/src/processing-choices.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/index.ts](../../packages/notabenda/src/index.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda-cf/src/processing-localization-policy.ts](../../packages/notabenda-cf/src/processing-localization-policy.ts), [packages/notabenda-cf/src/processing.ts](../../packages/notabenda-cf/src/processing.ts), [packages/notabenda-cf/scripts/sync-order-policy.mjs](../../packages/notabenda-cf/scripts/sync-order-policy.mjs), [examples/localization/processing-build.mjs](../../examples/localization/processing-build.mjs), [examples/localization/processing-client.mjs](../../examples/localization/processing-client.mjs), [examples/localization/processing.css](../../examples/localization/processing.css), [examples/localization/processing-messages.json](../../examples/localization/processing-messages.json), [examples/localization/build.mjs](../../examples/localization/build.mjs), [site/build.mjs](../../site/build.mjs), [site/host.mjs](../../site/host.mjs), [site/demo-host.mjs](../../site/demo-host.mjs), [site/worker.mjs](../../site/worker.mjs), [site/navigation.mjs](../../site/navigation.mjs), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/test/processing-localization.test.mjs](../../packages/notabenda/test/processing-localization.test.mjs), [packages/notabenda/test/processing.test.mjs](../../packages/notabenda/test/processing.test.mjs), [site/test/processing-localization.test.mjs](../../site/test/processing-localization.test.mjs), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [docs/verification/processing-localization.md](../../docs/verification/processing-localization.md)

<a id="req-product-setup-session"></a>

### REQ-PRODUCT-SETUP-SESSION — Expiring tab-local setup recovery

Optionally retain pack selection, active step, raw answers, public inventory, private review notes, unfinished editor proposals and storage-change history across same-tab reloads. Show clear/expiry/save-failure status and retain the last recoverable copy.

**Applies when:** A host opts into session persistence for the pack setup console; the project website opts in at /start/.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-setup-session"></a>

**VERIFY-PRODUCT-SETUP-SESSION (automated):** Same-tab reload preserves valid work, active view and separate unconfirmed proposals. Expiry and clear remove only this copy; failed or oversized writes retain the last recoverable draft and show unsaved status.

**Implementation boundary:** Website TTL is 24 hours after the last changed snapshot; restoration does not renew it. Reusable hosts supply a separate key per context and optional bounded TTL. Validate saved versions and reset review acknowledgments.

**Limits/open review:** Tab-local convenience storage, not evidence or a backup. Session restoration/duplication is browser-controlled. Cleanup runs while open or on next access; private notes are accessible to same-origin scripts. No server upload, automatic adoption or runtime grant.

**Code/test references:** [packages/notabenda/src/pack-session.ts](../../packages/notabenda/src/pack-session.ts), [packages/notabenda/src/setup-session-fields.ts](../../packages/notabenda/src/setup-session-fields.ts), [packages/notabenda/src/setup-session-editors.ts](../../packages/notabenda/src/setup-session-editors.ts), [packages/notabenda/src/cartridges-ui.ts](../../packages/notabenda/src/cartridges-ui.ts), [packages/notabenda/src/cartridges.css](../../packages/notabenda/src/cartridges.css), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-purpose-ui.ts](../../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-consent-ui.ts](../../packages/notabenda/src/setup-consent-ui.ts), [packages/notabenda/src/setup-rights-ui.ts](../../packages/notabenda/src/setup-rights-ui.ts), [packages/notabenda/src/setup-storage-ui.ts](../../packages/notabenda/src/setup-storage-ui.ts), [packages/notabenda/src/setup-storage.ts](../../packages/notabenda/src/setup-storage.ts), [packages/notabenda/src/catalog-ui.ts](../../packages/notabenda/src/catalog-ui.ts), [packages/notabenda/src/catalog-review-ui.ts](../../packages/notabenda/src/catalog-review-ui.ts), [examples/setup/build.mjs](../../examples/setup/build.mjs), [site/cartridges-app.mjs](../../site/cartridges-app.mjs), [site/website-notice.mjs](../../site/website-notice.mjs), [packages/notabenda/test/pack-session.test.mjs](../../packages/notabenda/test/pack-session.test.mjs), [site/test/website-notice.test.mjs](../../site/test/website-notice.test.mjs), [docs/verification/setup-session.md](../../docs/verification/setup-session.md)

<a id="req-product-service-localization"></a>

### REQ-PRODUCT-SERVICE-LOCALIZATION — Host-supplied service-directory language and retained copy

A complete selected dictionary covers static and enhanced service directories, accessible search/count/empty states and storage labels. Share native React/Astro rendering, explicit language/direction/review and exact release retention without changing permissions.

**Applies when:** A site renders its declared service directory in a selected language or supplies custom English interface copy.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-LOCALIZATION](../FEATURES.md#feat-localization), [FEAT-INVENTORY](../FEATURES.md#feat-inventory).

<a id="verify-product-service-localization"></a>

**VERIFY-PRODUCT-SERVICE-LOCALIZATION (automated):** Selected copy reaches static/native/React/Astro directories and real search; incomplete copy fails before mutation, releases retain exact text, counts/direction remain correct, and rendering/search grants or records nothing.

**Implementation boundary:** Complete optional localization.serviceDirectory dictionary with normal release review metadata, 16 KiB selected descriptor, literal local filtering and isolated formatted counts. Exact legacy English output and cookie material scopes remain unchanged.

**Limits/open review:** Host-authored display wording does not translate or verify provider facts, classify processing or choose a jurisdiction. One/other totals and a neutral filtered-count template do not implement arbitrary ICU plural rules. The directory is a view of public config, not a separately archived fourth document.

**Code/test references:** [packages/notabenda/src/service-directory-localization.ts](../../packages/notabenda/src/service-directory-localization.ts), [packages/notabenda/src/service-directory.ts](../../packages/notabenda/src/service-directory.ts), [packages/notabenda/src/document-localization.ts](../../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/index.ts](../../packages/notabenda/src/index.ts), [examples/localization/services-build.mjs](../../examples/localization/services-build.mjs), [examples/localization/service-messages.json](../../examples/localization/service-messages.json), [examples/localization/services.css](../../examples/localization/services.css), [examples/localization/build.mjs](../../examples/localization/build.mjs), [site/navigation.mjs](../../site/navigation.mjs), [site/host.mjs](../../site/host.mjs), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [packages/notabenda/test/service-localization.test.mjs](../../packages/notabenda/test/service-localization.test.mjs), [packages/notabenda/test/services.test.mjs](../../packages/notabenda/test/services.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/service-localization.test.mjs](../../site/test/service-localization.test.mjs), [docs/verification/service-localization.md](../../docs/verification/service-localization.md)

<a id="req-product-indirect-localization"></a>

### REQ-PRODUCT-INDIRECT-LOCALIZATION — Host-supplied indirect-collection notice language and retained copy

A complete selected message set covers static HTML and plain-text indirect collection notices, including collection phase, laws, recipients, contact and privacy metadata. Bind the copy to a retained release and expose matching setup guidance.

**Applies when:** A site renders an indirect-collection notice outside English or supplies custom English interface copy.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-LOCALIZATION](../FEATURES.md#feat-localization), [FEAT-FORMS](../FEATURES.md#feat-forms).

<a id="verify-product-indirect-localization"></a>

**VERIFY-PRODUCT-INDIRECT-LOCALIZATION (automated):** Selected HTML and plain-text copy cover both phases and law branches; static/native/React/packed Astro output remains accessible. Incomplete, malformed or substituted copy and downgrade fail; archived releases reproduce notices, setup keeps missing dictionaries unresolved, and no choice or notification is created.

**Implementation boundary:** Complete optional localization.indirectCollection dictionary, 16 KiB selected descriptor, explicit locale/direction/review and v2 notice identity. V1 English output remains exact. Archived copy is excluded from cookie runtime and material scopes.

**Limits/open review:** Language does not select or broaden the supported nz-ipp3a profile, establish lawful collection, notification, timing, actual awareness or legal review. Public facts and substantive wording need separate host authorship and review. No sending, tracking or delivery evidence is installed.

**Code/test references:** [packages/notabenda/src/indirect-collection-localization-policy.ts](../../packages/notabenda/src/indirect-collection-localization-policy.ts), [packages/notabenda/src/indirect-collection.ts](../../packages/notabenda/src/indirect-collection.ts), [packages/notabenda/src/document-localization.ts](../../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/index.ts](../../packages/notabenda/src/index.ts), [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/localization/indirect-build.mjs](../../examples/localization/indirect-build.mjs), [examples/localization/indirect-messages.json](../../examples/localization/indirect-messages.json), [examples/localization/build.mjs](../../examples/localization/build.mjs), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [site/navigation.mjs](../../site/navigation.mjs), [skills/notabenda/SKILL.md](../../skills/notabenda/SKILL.md), [packages/notabenda/test/indirect-localization.test.mjs](../../packages/notabenda/test/indirect-localization.test.mjs), [packages/notabenda/test/indirect-collection.test.mjs](../../packages/notabenda/test/indirect-collection.test.mjs), [packages/notabenda/test/privacy-packs.test.mjs](../../packages/notabenda/test/privacy-packs.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/indirect-localization.test.mjs](../../site/test/indirect-localization.test.mjs), [docs/verification/indirect-localization.md](../../docs/verification/indirect-localization.md)

<a id="req-product-cf-remote-recovery"></a>

### REQ-PRODUCT-CF-REMOTE-RECOVERY — Disposable provider-native SQLite recovery with an external gate

Provide optional remote maintainer tooling that restores a fresh synthetic SQLite object through its provider bookmark, preserves a non-restored gate and later hold/retirement journal, and removes only the attested disposable resources.

**Applies when:** Maintainers explicitly run the remote Cloudflare recovery command against their selected account.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Sources:** [Cloudflare: SQLite-backed Durable Object storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) — Time Travel bookmarks and onNextSessionRestoreBookmark (read; [SRC-CF-DO-SQLITE](SOURCES.md#src-cf-do-sqlite)); [Cloudflare: Durable Object state](https://developers.cloudflare.com/durable-objects/api/state/) — blockConcurrencyWhile and abort (read; [SRC-CF-DO-STATE](SOURCES.md#src-cf-do-state)); [Cloudflare: Durable Object class exports](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/) — Delete a class with a deleted export (read; [SRC-CF-DO-EXPORTS](SOURCES.md#src-cf-do-exports)); [Cloudflare: list Durable Object namespaces](https://developers.cloudflare.com/api/resources/durable_objects/subresources/namespaces/methods/list/) — Paginated namespace identity, script, class and SQLite fields (read; [SRC-CF-DO-NAMESPACE-API](SOURCES.md#src-cf-do-namespace-api)); [Cloudflare: list Worker scripts](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/list/) — Script identity, tag and modification metadata (read; [SRC-CF-WORKER-SCRIPTS-API](SOURCES.md#src-cf-worker-scripts-api)).

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-RECORDS](../FEATURES.md#feat-records).

<a id="verify-product-cf-remote-recovery"></a>

**VERIFY-PRODUCT-CF-REMOTE-RECOVERY (automated):** Direct regressions cover gate ordering, journal identity, plain RPC data, HTTP authority, source attestation and cleanup ownership. The real remote command verified native SQL/KV rollback, hold-first replay, purge restart, closed ordinary operations, surviving heads/source bytes, old-grant refusal and provider-confirmed namespace/Worker removal on 20 October 2026.

**Implementation boundary:** External default-closed control object, whole-operation serialization, hold-first replay, bounded purge restart, exact source hashes, private atomic ownership checkpoints and namespace-first cleanup with source/tag/ID checks. Real remote SQLite Time Travel run passed on 20 October 2026, including SQL and KV rollback, later hold-first replay, external gate persistence, purge restart, exact source bytes and verified removal of both namespaces and Worker.

**Limits/open review:** Fixed synthetic consent streams, holds, document archives and one SQL table only; not generated-starter or all-family recovery, portable backup, host authentication/journal completeness, downstream deletion or legal readiness. No production bindings or routes. Adopters choose CI.

**Code/test references:** [scripts/check-cf-remote-recovery.mjs](../../scripts/check-cf-remote-recovery.mjs), [scripts/fixtures/remote-recovery.mjs](../../scripts/fixtures/remote-recovery.mjs), [scripts/fixtures/remote-recovery-worker.mjs](../../scripts/fixtures/remote-recovery-worker.mjs), [docs/CLOUDFLARE-REMOTE-RECOVERY.md](../../docs/CLOUDFLARE-REMOTE-RECOVERY.md), [site/navigation.mjs](../../site/navigation.mjs), [packages/notabenda-cf/test/remote-recovery.test.mjs](../../packages/notabenda-cf/test/remote-recovery.test.mjs), [scripts/check-cf-remote-recovery.mjs](../../scripts/check-cf-remote-recovery.mjs), [docs/verification/cloudflare-remote-recovery.md](../../docs/verification/cloudflare-remote-recovery.md)

<a id="req-product-terms-connection"></a>

### REQ-PRODUCT-TERMS-CONNECTION — Read-only terms offer and local operation inspection

Compare an actual terms controller with the complete normalized intended offer and optional local host operation without taking acceptance actions. Keep publication, backend selection and application behavior separate.

**Applies when:** An operator or agent checks which offer and operation a mounted terms flow uses.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-terms-connection"></a>

**VERIFY-PRODUCT-TERMS-CONNECTION (automated):** Actual and custom controllers compare normalized offers/localization and local operations without acceptance actions, retain uncertain/recovery/destroyed semantics, exclude private identifiers and wording, reject hostile inputs, work across separate bundles, expose installed types and support stale-result-invalidating accessible example UI.

**Implementation boundary:** Optional browser/SSR entry with fixed private projection, independent-bundle-compatible local comparator, full offer/localization comparison, uncertain and destroyed states, generic validation failures and a deliberately loaded example panel that invalidates stale snapshots.

**Limits/open review:** Local methods are trusted host assertions, not authenticated reports or server bindings. Receipt confirmation may be historical; an error can follow a saved record. No current permission, fulfillment, installation or compliance verdict follows.

**Code/test references:** [packages/notabenda/src/terms-inspect.ts](../../packages/notabenda/src/terms-inspect.ts), [packages/notabenda/src/terms.ts](../../packages/notabenda/src/terms.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/static/terms-inspector.mjs](../../examples/static/terms-inspector.mjs), [examples/static/terms-inspector.css](../../examples/static/terms-inspector.css), [examples/static/agreement.mjs](../../examples/static/agreement.mjs), [examples/static/terms-build.mjs](../../examples/static/terms-build.mjs), [packages/notabenda/test/terms-inspect.test.mjs](../../packages/notabenda/test/terms-inspect.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/terms-connection.test.mjs](../../site/test/terms-connection.test.mjs), [docs/verification/terms-connection.md](../../docs/verification/terms-connection.md)

<a id="req-product-consent-rehearsal"></a>

### REQ-PRODUCT-CONSENT-REHEARSAL — Disposable draft-bound cookie-control rehearsal

Let operators try their actual draft with native controls, inert service callbacks and isolated temporary choice memory before connecting providers. Keep local simulation distinct from actual installation, required receipts and account processing.

**Applies when:** A prepared Cookie choices draft is reviewed before host integration.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-CONTROLS](../FEATURES.md#feat-controls).

<a id="verify-product-consent-rehearsal"></a>

**VERIFY-PRODUCT-CONSENT-REHEARSAL (automated):** Actual controls cover granular/all-purpose service gating, rejection/return/withdrawal, scope restrictions and selected copy without provider or real choice-storage effects; styles/navigation/lifecycle, stale setup loads, public installed types and independently authorized lazy starter assets remain explicit.

**Implementation boundary:** Lazy native-controls rehearsal with detached public inventory, script-disabled frame, bounded same-origin CSS loading, private Map storage, inert start/stop counters, real cancellable timers, fresh/return visits, explicit GPC simulation and generation-fenced teardown on close/edit/import.

**Limits/open review:** Local-choice model only. Real providers, archived notice overrides, required acknowledgement, account processing restrictions, deployment and legal eligibility need separate checks. Frame isolation does not constrain its trusted same-origin parent.

**Code/test references:** [packages/notabenda/src/setup-consent-rehearsal.ts](../../packages/notabenda/src/setup-consent-rehearsal.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-connection-ui.ts](../../packages/notabenda/src/setup-connection-ui.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [packages/notabenda-cf/templates/scripts/build-assets.mjs](../../packages/notabenda-cf/templates/scripts/build-assets.mjs), [packages/notabenda-cf/templates/src/host.mjs](../../packages/notabenda-cf/templates/src/host.mjs), [packages/notabenda-cf/bin/doctor.mjs](../../packages/notabenda-cf/bin/doctor.mjs), [site/build.mjs](../../site/build.mjs), [site/host.mjs](../../site/host.mjs), [packages/notabenda/test/consent-rehearsal.test.mjs](../../packages/notabenda/test/consent-rehearsal.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs), [packages/notabenda-cf/test/doctor.test.mjs](../../packages/notabenda-cf/test/doctor.test.mjs), [site/test/consent-rehearsal.test.mjs](../../site/test/consent-rehearsal.test.mjs), [docs/verification/consent-rehearsal.md](../../docs/verification/consent-rehearsal.md), [scripts/check-cf-starter-runtime.mjs](../../scripts/check-cf-starter-runtime.mjs)

<a id="req-product-docs-search"></a>

### REQ-PRODUCT-DOCS-SEARCH — Local search of published guides and section links

Help readers find maintained guidance by topic, API name or requirement ID, with explicit local matching, usable section destinations and a complete script-free guide list.

**Applies when:** Readers navigate the project website documentation.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-docs-search"></a>

**VERIFY-PRODUCT-DOCS-SEARCH (automated):** Every indexed published guide and emitted section address exists; matching handles titles, identifiers and diacritics, returns bounded unique-page results, keeps queries local, handles unavailable/invalid indexes, fences disposed loads, preserves text-only rendering and supplies a complete no-script directory. Native responsive/keyboard checks supplement structural accessibility tests.

**Implementation boundary:** Build-time source-guide allowlist, bounded chunked public index, accent-insensitive identifier-aware lexical ranking, section links, local result rendering/pagination and a complete no-script directory.

**Limits/open review:** Published guide content only. Matching is lexical and does not assess applicability or recommend legal settings. No operator records, private archives or workspace scan. Queries stay in the current page; the explicit search page loads one bounded same-origin index.

**Code/test references:** [site/guide-search.mjs](../../site/guide-search.mjs), [site/guide-search-build.mjs](../../site/guide-search-build.mjs), [site/guide-search-client.mjs](../../site/guide-search-client.mjs), [site/guide-search.css](../../site/guide-search.css), [site/build.mjs](../../site/build.mjs), [site/navigation.mjs](../../site/navigation.mjs), [site/host.mjs](../../site/host.mjs), [site/guide-pages.mjs](../../site/guide-pages.mjs), [site/test/guide-search.test.mjs](../../site/test/guide-search.test.mjs), [docs/verification/guide-search.md](../../docs/verification/guide-search.md), [site/test/guide-navigation.test.mjs](../../site/test/guide-navigation.test.mjs), [site/test/syntax.test.mjs](../../site/test/syntax.test.mjs), [site/test/site-organization.test.mjs](../../site/test/site-organization.test.mjs)

<a id="req-product-embed-localization"></a>

### REQ-PRODUCT-EMBED-LOCALIZATION — Complete host-supplied gated-media interface messages

Keep inert and mounted media placeholders in the selected language across waiting, permitted and error states, without changing consent or resource gates.

**Applies when:** A site uses native gated-media placeholders in a selected language.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-LOCALIZATION](../FEATURES.md#feat-localization), [FEAT-CONTROLS](../FEATURES.md#feat-controls).

<a id="verify-product-embed-localization"></a>

**VERIFY-PRODUCT-EMBED-LOCALIZATION (automated):** Complete selected messages cover inert SSR and actual controller/media states; missing/mismatched/draft dictionaries fail explicitly, archives retain copy, material cookie scope remains unchanged, and localized example/runtime destinations preserve the existing resource gates.

**Implementation boundary:** Versioned four-message dictionary in public configuration, strict standalone selection/validation, automatic full-controller or explicit compiled-controller copy, inert SSR and native lang/dir, with exact unconfigured English output.

**Limits/open review:** Complete host-written copy only; no language negotiation, translation approval or jurisdiction selection. Resource facts and actual provider behavior remain separate. Compiled cookie runtimes omit this dictionary; explicit view copy is not evidence of presentation.

**Code/test references:** [packages/notabenda/src/embed-localization.ts](../../packages/notabenda/src/embed-localization.ts), [packages/notabenda/src/document-localization.ts](../../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/embeds.ts](../../packages/notabenda/src/embeds.ts), [packages/notabenda/src/index.ts](../../packages/notabenda/src/index.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [examples/localization/embed-messages.json](../../examples/localization/embed-messages.json), [examples/localization/embeds-build.mjs](../../examples/localization/embeds-build.mjs), [examples/localization/embeds-client.mjs](../../examples/localization/embeds-client.mjs), [examples/localization/build.mjs](../../examples/localization/build.mjs), [site/host.mjs](../../site/host.mjs), [site/navigation.mjs](../../site/navigation.mjs), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [packages/notabenda/test/embed-localization.test.mjs](../../packages/notabenda/test/embed-localization.test.mjs), [packages/notabenda/test/embeds.test.mjs](../../packages/notabenda/test/embeds.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/embed-localization.test.mjs](../../site/test/embed-localization.test.mjs), [docs/verification/embed-localization.md](../../docs/verification/embed-localization.md), [packages/notabenda/test/integration-assessment.test.mjs](../../packages/notabenda/test/integration-assessment.test.mjs)

<a id="req-product-terms-authoring"></a>

### REQ-PRODUCT-TERMS-AUTHORING — Named terms agreement settings and final-release offers

Optional complete scope/revision/wording settings with baseline-bound local UI and CLI authoring; generate exact offers from the final retained artifact and validate configured copy in the standalone backend.

**Applies when:** An operator chooses configured wording for an explicit terms agreement workflow.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-SETUP](../FEATURES.md#feat-setup), [FEAT-TERMS](../FEATURES.md#feat-terms).

<a id="verify-product-terms-authoring"></a>

**VERIFY-PRODUCT-TERMS-AUTHORING (automated):** Strict whole declarations, baseline/revision authoring, UI/CLI/session parity, unchanged legacy/cookie behavior, final artifact scope files, standalone backend copy binding and historical retries.

**Implementation boundary:** Validate the whole declaration before explicit scope selection; draft edits require fresh current revisions and unchanged public baselines. CLI emits scope files after final attachments; retained artifacts reconstruct exact copy. No automatic enrollment, cookie scope changes, acceptance, activation or retirement.

**Limits/open review:** Review, historical revision uniqueness, host identity/operation, publication, registration and activation remain host work. Removing settings does not deactivate a backend offer. Non-English acceptance requires complete localization.terms. Host-authored offers remain supported.

**Code/test references:** [packages/notabenda/src/terms-settings.ts](../../packages/notabenda/src/terms-settings.ts), [packages/notabenda/src/setup-terms.ts](../../packages/notabenda/src/setup-terms.ts), [packages/notabenda/src/setup-terms-ui.ts](../../packages/notabenda/src/setup-terms-ui.ts), [packages/notabenda/src/setup-terms-cli.ts](../../packages/notabenda/src/setup-terms-cli.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/setup-session-editors.ts](../../packages/notabenda/src/setup-session-editors.ts), [packages/notabenda/src/setup-connection-ui.ts](../../packages/notabenda/src/setup-connection-ui.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/release-files.ts](../../packages/notabenda/src/release-files.ts), [packages/notabenda/src/catalog-release.ts](../../packages/notabenda/src/catalog-release.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/src/cartridges.ts](../../packages/notabenda/src/cartridges.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda-cf/src/terms-settings.ts](../../packages/notabenda-cf/src/terms-settings.ts), [packages/notabenda-cf/src/terms.ts](../../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/scripts/sync-order-policy.mjs](../../packages/notabenda-cf/scripts/sync-order-policy.mjs), [examples/agreements/example.mjs](../../examples/agreements/example.mjs), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/test/setup-terms.test.mjs](../../packages/notabenda/test/setup-terms.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/terms-authoring.md](../../docs/verification/terms-authoring.md), [site/test/terms-authoring.test.mjs](../../site/test/terms-authoring.test.mjs)

<a id="req-product-terms-history"></a>

### REQ-PRODUCT-TERMS-HISTORY — Readable archived agreement wording and revision comparison

Separately authorize and validate retained workflow declarations, selected interface copy and terms document references. Compare exact scopes without confusing declaration, document, release identity or current activation.

**Applies when:** An operator reviews retained agreement settings alongside policy revisions.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENT-HISTORY](../FEATURES.md#feat-document-history), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice), [FEAT-TERMS](../FEATURES.md#feat-terms).

<a id="verify-product-terms-history"></a>

**VERIFY-PRODUCT-TERMS-HISTORY (automated):** Full archive validation, independent authorization before reads, precise per-scope and interface/document comparisons, absence handling, unchanged generic projections, escaping and desktop/mobile presentation.

**Implementation boundary:** Optional fixed-release getter and strict bounded projection; per-request independent grant, script-free readable workflow/interface/document comparison and unchanged generic history/export data. Existing release selector reaches the view; old absent declarations remain comparable.

**Limits/open review:** Missing declarations do not establish absence of a host-authored integration. Historical built-in messages are not reconstructed. Host authorization and storage scope remain separate; no activation, acceptance, legal materiality or publication is inferred.

**Code/test references:** [packages/notabenda-cf/src/terms-history.ts](../../packages/notabenda-cf/src/terms-history.ts), [packages/notabenda-cf/src/terms-history-render.ts](../../packages/notabenda-cf/src/terms-history-render.ts), [packages/notabenda-cf/src/history.ts](../../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/src/types.ts](../../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/src/index.ts](../../packages/notabenda-cf/src/index.ts), [packages/notabenda-cf/templates/src/host.mjs](../../packages/notabenda-cf/templates/src/host.mjs), [packages/notabenda-cf/templates/src/workspace.mjs](../../packages/notabenda-cf/templates/src/workspace.mjs), [packages/notabenda-cf/templates/src/authorize.mjs](../../packages/notabenda-cf/templates/src/authorize.mjs), [examples/agreements/history.mjs](../../examples/agreements/history.mjs), [site/build.mjs](../../site/build.mjs), [site/worker.mjs](../../site/worker.mjs), [packages/notabenda-cf/src/terms.ts](../../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/test/terms-history.test.mjs](../../packages/notabenda-cf/test/terms-history.test.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/terms-history.test.mjs](../../site/test/terms-history.test.mjs), [docs/verification/terms-history.md](../../docs/verification/terms-history.md)

<a id="req-product-contract-localization"></a>

### REQ-PRODUCT-CONTRACT-LOCALIZATION — Versioned host-supplied contract form and acknowledgement copy

Retain complete selected-language contract interface labels and acknowledgement text without changing profile mechanics or historical receipt bytes.

**Applies when:** An operator supplies custom contract form and acknowledgement labels.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-LOCALIZATION](../FEATURES.md#feat-localization), [FEAT-CONTRACT-ACTIONS](../FEATURES.md#feat-contract-actions), [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-contract-localization"></a>

**VERIFY-PRODUCT-CONTRACT-LOCALIZATION (automated):** Complete strict selected copy binds to the exact archived locale/configuration; v1 bytes, uncertain recovery and independent jobs remain unchanged, maximum composed data remains inspectable, and the German example retains a separate release.

**Implementation boundary:** Complete bounded 29-field localization.contractActions selection, v2 definition/archive binding, exact explicit substantive wording, shared native/receipt labels and lang/dir, with legacy retries and immutable acknowledgements preserved.

**Limits/open review:** No automatic translation, legal-profile selection or reviewed jurisdiction claim. Actual statutory wording, contract eligibility, host admission and independent delivery remain separate. Existing v1 profile language and formatter remain supported.

**Code/test references:** [packages/notabenda/src/contract-action-localization.ts](../../packages/notabenda/src/contract-action-localization.ts), [packages/notabenda/src/contract-action-policy.ts](../../packages/notabenda/src/contract-action-policy.ts), [packages/notabenda/src/contract-action.ts](../../packages/notabenda/src/contract-action.ts), [packages/notabenda/src/document-localization.ts](../../packages/notabenda/src/document-localization.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda-cf/scripts/sync-order-policy.mjs](../../packages/notabenda-cf/scripts/sync-order-policy.mjs), [packages/notabenda-cf/src/contract-action-localization.ts](../../packages/notabenda-cf/src/contract-action-localization.ts), [packages/notabenda-cf/src/contract-action-policy.ts](../../packages/notabenda-cf/src/contract-action-policy.ts), [packages/notabenda-cf/src/contracts.ts](../../packages/notabenda-cf/src/contracts.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/localization/contracts-config.mjs](../../examples/localization/contracts-config.mjs), [examples/localization/contracts-messages.json](../../examples/localization/contracts-messages.json), [examples/contract-actions/build.mjs](../../examples/contract-actions/build.mjs), [examples/contract-actions/client.mjs](../../examples/contract-actions/client.mjs), [site/build.mjs](../../site/build.mjs), [site/worker.mjs](../../site/worker.mjs), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [packages/notabenda/test/contract-localization.test.mjs](../../packages/notabenda/test/contract-localization.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/contract-localization.test.mjs](../../site/test/contract-localization.test.mjs), [site/test/demo-upgrade.test.mjs](../../site/test/demo-upgrade.test.mjs), [docs/verification/contract-localization.md](../../docs/verification/contract-localization.md)

<a id="req-us-ca-alternative-link"></a>

### REQ-US-CA-ALTERNATIVE-LINK — California alternative opt-out link and its destination

When choosing the alternative link, use the specified title and adjacent opt-out icon conspicuously in the homepage header/footer; its destination explains and enables both sale/sharing opt-out and sensitive-information limits.

**Applies when:** An in-scope business chooses the alternative opt-out link under section 7015 after assessing applicable obligations and exceptions.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [California CCPA regulations effective 1 January 2026](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) — Section 7015(a)–(c), p. 32; section 7025(e), p. 48; referenced section 7004 method protections (read; [SRC-US-CA-REGS-2026](SOURCES.md#src-us-ca-regs-2026)); [California DOJ CCPA opt-out icon download](https://www.oag.ca.gov/privacy/ccpa/icons-download) — Department-created recognizable opt-out icon; official download (read; [SRC-US-CA-DOJ-ICON](SOURCES.md#src-us-ca-doj-icon)); [California DOJ Conditions of Use](https://www.oag.ca.gov/conditions) — Ownership: Department-created content versus third-party materials (read; [SRC-US-CA-DOJ-CONDITIONS](SOURCES.md#src-us-ca-doj-conditions)).

**Discovery articles:** [SRC-IUB-US](SOURCES.md#src-iub-us).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-RIGHTS](../FEATURES.md#feat-rights).

<a id="verify-us-ca-alternative-link"></a>

**VERIFY-US-CA-ALTERNATIVE-LINK (planned):** On an actual in-scope homepage, inspect prominent header/footer placement, neighboring icon sizing, specified wording/icon, destination explanations and usable mechanisms for both rights, applicable request safeguards, continued signal handling and downstream effects.

**Timing:** Selected source is the consolidated regulations effective 1 January 2026; this is not a claim that the original link obligation commenced on that date.

**Implementation boundary:** Optional explicit versioned navigation and California presentation are supplied, with a retained original icon and script-free presentation preview. No automatic region selection or complete California workflow claim.

**Limits/open review:** Renderer supplies selected title/icon only. Host placement, visibility/size, actual destination with both rights, method safeguards, applicability, sensitive-information workflow and downstream handling remain unverified. Posting a link does not replace applicable preference-signal handling.

**Code/test references:** [packages/notabenda/src/privacy-choices-policy.ts](../../packages/notabenda/src/privacy-choices-policy.ts), [packages/notabenda/src/privacy-choices-link.ts](../../packages/notabenda/src/privacy-choices-link.ts), [packages/notabenda/src/privacy-choices-icon.ts](../../packages/notabenda/src/privacy-choices-icon.ts), [site/privacy-choice-preview.mjs](../../site/privacy-choice-preview.mjs), [packages/notabenda/test/privacy-choices-link.test.mjs](../../packages/notabenda/test/privacy-choices-link.test.mjs), [docs/verification/privacy-choice-links.md](../../docs/verification/privacy-choice-links.md)

<a id="req-product-privacy-choice-link"></a>

### REQ-PRODUCT-PRIVACY-CHOICE-LINK — Explicit script-free privacy-choice return navigation

Offer optional reviewed public choice links independently of cookie preferences and request-page navigation, with deterministic safe rendering and explicit preview.

**Applies when:** The host configures privacy.choicesLink or renders the standalone component.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-RIGHTS](../FEATURES.md#feat-rights).

<a id="verify-product-privacy-choice-link"></a>

**VERIFY-PRODUCT-PRIVACY-CHOICE-LINK (automated):** Reject unsafe/incomplete/unreviewed default navigation; explicit preview works across core/React/Astro. Retained icon paths and language semantics match the source, no scripts or state actions render, optional link updates change presentation without changing structured text/material cookie scope and separate request authoring preserves it.

**Implementation boundary:** Strict versioned declaration, safe URL/plain label, explicit draft boundary, optional official-icon presentation with English lang/dir, core/React/Astro navigation, release binding, independent request-page editing, source assets and installed-agent guidance.

**Limits/open review:** No request intake, preference update, legal applicability decision or destination coverage is inferred. Public URLs must contain no secrets. Review of actual deployment remains host work.

**Code/test references:** [packages/notabenda/src/privacy-choices-policy.ts](../../packages/notabenda/src/privacy-choices-policy.ts), [packages/notabenda/src/privacy-choices-link.ts](../../packages/notabenda/src/privacy-choices-link.ts), [packages/notabenda/src/privacy-choices-icon.ts](../../packages/notabenda/src/privacy-choices-icon.ts), [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/rights.ts](../../packages/notabenda/src/rights.ts), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/LegalLinks.astro](../../packages/notabenda/src/astro/LegalLinks.astro), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/scripts/consent-styles.mjs](../../packages/notabenda/scripts/consent-styles.mjs), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [examples/processing-choices/build.mjs](../../examples/processing-choices/build.mjs), [site/privacy-choice-preview.mjs](../../site/privacy-choice-preview.mjs), [site/build.mjs](../../site/build.mjs), [packages/notabenda/test/privacy-choices-link.test.mjs](../../packages/notabenda/test/privacy-choices-link.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/privacy-choice-links.test.mjs](../../site/test/privacy-choice-links.test.mjs), [docs/verification/privacy-choice-links.md](../../docs/verification/privacy-choice-links.md)

<a id="req-product-consent-notice-files"></a>

### REQ-PRODUCT-CONSENT-NOTICE-FILES — Native consent notice builds and explicit pinned notice retention

Generate an exact native consent notice from the final public legal release, emit separate current and notice-ID-pinned JSON, and retain selected historical notices only after checking their complete descriptors against intact same-site releases.

**Applies when:** An operator builds native required-receipt consent delivery or explicitly publishes selected earlier notices.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-consent-notice-files"></a>

**VERIFY-PRODUCT-CONSENT-NOTICE-FILES (automated):** Exact current/pinned bytes and hash identity; independent copy revisions; same-site and mode-bound retained descriptor verification; malformed, accessor and unsafe-file rejection before writes; stale-alias guards; actual CLI output registration, explicit activation and receipt-gated service start/withdrawal; public session-free example routing.

<a id="verify-product-recorded-cookie-application"></a>

**VERIFY-PRODUCT-RECORDED-COOKIE-APPLICATION (automated):** Separate example application preserves denying auth defaults and fixed notice registration/activation; HTTP and bundled-client DOM tests cover request bounds, host-derived stream preconditions, RPC errors, outages, lost committed response, reload, withdrawal and identity changes. Optional real local SQLite runner verifies actual RPC/persistence, registration-only refusal, canonical operator aliases, exact current/pinned notice/legal bytes and restart. Manual real-browser observations remain separately scoped; no production identity or deployment acceptance claim.

**Implementation boundary:** Build-time helpers reuse full release verification and the existing notice factory. CLI native scope builds support all configuration formats; retained notice files remain bounded ordinary JSON. Notice-ID paths avoid copy-revision collisions under an unchanged artifact. Tests cover exact bytes, validly rehashed tampering, stale-alias guards, no accessor execution and actual CLI-to-ledger-to-runtime receipt gating in a local synthetic store.

**Limits/open review:** Public files do not register, activate, authenticate or grant anything. Scope, custom UI display, host receipt/identity wiring, publication, review and retention remain operator decisions. The API verifies supported trusted public releases, not arbitrary HTML safety or provenance. Preview and existing output aliases require explicit decisions.

**Code/test references:** [packages/notabenda/src/consent-release-files.ts](../../packages/notabenda/src/consent-release-files.ts), [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/release-files.ts](../../packages/notabenda/src/release-files.ts), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [docs/CONSENT-EVIDENCE.md](../../docs/CONSENT-EVIDENCE.md), [docs/RELEASES.md](../../docs/RELEASES.md), [site/navigation.mjs](../../site/navigation.mjs), [examples/recorded-cookies/host.mjs](../../examples/recorded-cookies/host.mjs), [examples/recorded-cookies/workspace.mjs](../../examples/recorded-cookies/workspace.mjs), [examples/recorded-cookies/worker.mjs](../../examples/recorded-cookies/worker.mjs), [examples/recorded-cookies/README.md](../../examples/recorded-cookies/README.md), [packages/notabenda/test/consent-release-files.test.mjs](../../packages/notabenda/test/consent-release-files.test.mjs), [packages/notabenda/test/consent-notice-cli.test.mjs](../../packages/notabenda/test/consent-notice-cli.test.mjs), [packages/notabenda-cf/test/consent-cli-delivery.test.mjs](../../packages/notabenda-cf/test/consent-cli-delivery.test.mjs), [site/test/consent-notice-files.test.mjs](../../site/test/consent-notice-files.test.mjs), [docs/verification/consent-notice-files.md](../../docs/verification/consent-notice-files.md), [packages/notabenda-cf/test/recorded-cookie-application.test.mjs](../../packages/notabenda-cf/test/recorded-cookie-application.test.mjs), [scripts/check-recorded-cookie-runtime.mjs](../../scripts/check-recorded-cookie-runtime.mjs), [docs/verification/recorded-cookie-application.md](../../docs/verification/recorded-cookie-application.md)

<a id="req-us-or-gpc"></a>

### REQ-US-OR-GPC — Oregon universal opt-out handling

Honor applicable universal opt-out signals for sale and targeted advertising and provide a usable public opt-out route.

**Applies when:** The current OCPA applies to the controller and processing, and a qualifying signal is received.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Oregon DOJ privacy law FAQs for businesses](https://www.doj.state.or.us/consumer-protection/for-businesses/privacy-law-faqs-for-businesses/) — Consumer Privacy Rights: universal opt-out commencement; Processing Consumer Personal Data: controller obligations and separate prohibitions (read; [SRC-US-OR-FAQ](SOURCES.md#src-us-or-faq)); [Oregon DOJ universal opt-out announcement, 28 January 2026](https://www.doj.state.or.us/media-home/news-media-releases/oregon-doj-highlights-new-universal-opt-out-tool-on-data-privacy-day/) — 28 January 2026 announcement: universal opt-outs from 1 January 2026; sale and targeted-advertising context (read; [SRC-US-OR-UOOM](SOURCES.md#src-us-or-uoom)).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-us-or-mn-signal-review"></a>

**VERIFY-US-OR-MN-SIGNAL-REVIEW (automated):** Shared setup/API/CLI/browser DOM guidance resolves to read primary sources and partial/unreviewed legal items; market interest and imported jurisdictions preserve explicit config and historical answers. Existing GPC gates block synthetic browser/server producers without login or receipt storage, ordinary cookie acceptance cannot bypass them, and signal absence cannot clear an independently retained restriction. No real-provider, full statutory, accessibility or production acceptance claim.

**Timing:** Selected commencement date; applicability and exceptions require independent review.

**Implementation boundary:** Source-linked setup and agent reviews use existing explicit browser/header processing restrictions. Market selection grants nothing and changes no policy. Actual account/downstream effects, retention and legal/operational acceptance remain host work.

**Limits/open review:** DOJ guidance was read; current consolidated statute access was blocked. Review amendments, territorial scope, thresholds/exemptions including motor-vehicle entities, signal criteria and separate under-16/geolocation bans. A cookie choice cannot authorize prohibited processing.

**Code/test references:** [packages/notabenda/src/privacy-signal-reviews.ts](../../packages/notabenda/src/privacy-signal-reviews.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/privacy-signals.ts](../../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/src/privacy-signal-policy.ts](../../packages/notabenda/src/privacy-signal-policy.ts), [docs/PRIVACY-SIGNALS.md](../../docs/PRIVACY-SIGNALS.md), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/test/privacy-signal-reviews.test.mjs](../../packages/notabenda/test/privacy-signal-reviews.test.mjs)

<a id="req-us-mn-gpc"></a>

### REQ-US-MN-GPC — Minnesota universal signals and conflicting settings

Honor qualifying sale and targeted-advertising signals over conflicting settings; distinguish universal signals from authorized-agent requests and ordinary cookie choices.

**Applies when:** The Minnesota Act applies to the controller and processing, subject to statutory scope, exemptions and the specified postsecondary-institution compliance date.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** partial.

**Sources:** [Minnesota Statutes section 325M.14, consumer rights](https://www.revisor.mn.gov/statutes/cite/325M.14) — Section 325M.14 subdivisions 2(d), 3(a)-(d), 4(b)-(c), 4(h), and effective-date note (read; [SRC-US-MN-RIGHTS](SOURCES.md#src-us-mn-rights)); [Minnesota AG controller structural obligations](https://www.ag.state.mn.us/Data-Privacy/Business/Controller/Structural-Obligations.asp) — Consumer Rights Request Portal; Controllers Must Honor Manual and Automatic Opt-Out Requests (read; [SRC-US-MN-STRUCTURAL](SOURCES.md#src-us-mn-structural)).

**Features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-us-or-mn-signal-review"></a>

**VERIFY-US-OR-MN-SIGNAL-REVIEW (automated):** Shared setup/API/CLI/browser DOM guidance resolves to read primary sources and partial/unreviewed legal items; market interest and imported jurisdictions preserve explicit config and historical answers. Existing GPC gates block synthetic browser/server producers without login or receipt storage, ordinary cookie acceptance cannot bypass them, and signal absence cannot clear an independently retained restriction. No real-provider, full statutory, accessibility or production acceptance claim.

**Timing:** Selected commencement date; applicability and exceptions require independent review.

**Implementation boundary:** Source-linked setup and agent reviews use existing explicit browser/header processing restrictions. Market selection grants nothing and changes no policy. Actual account/downstream effects, retention and legal/operational acceptance remain host work.

**Limits/open review:** Review signal criteria, other-state recognition, residency and the documented-fraud exception. No opt-out authentication prerequisite is implemented. Specified postsecondary institutions have a July 2029 compliance date. Broader profiling, response/appeal duties and a separate confirmation/re-opt-in workflow remain outside this mechanism.

**Code/test references:** [packages/notabenda/src/privacy-signal-reviews.ts](../../packages/notabenda/src/privacy-signal-reviews.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/integration-reference.ts](../../packages/notabenda/src/integration-reference.ts), [packages/notabenda/src/privacy-signals.ts](../../packages/notabenda/src/privacy-signals.ts), [packages/notabenda/src/privacy-signal-policy.ts](../../packages/notabenda/src/privacy-signal-policy.ts), [docs/PRIVACY-SIGNALS.md](../../docs/PRIVACY-SIGNALS.md), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/test/privacy-signal-reviews.test.mjs](../../packages/notabenda/test/privacy-signal-reviews.test.mjs)

## Research gaps

### GAP-SG — SG

**needs-source-verification:** Retrieve and verify the current selected-topics cookie chapter and applicable PDPA exceptions before encoding a Singapore rule.

**Planned features:** [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-FORMS](../FEATURES.md#feat-forms).

**Starting sources:** [SRC-SG-PDPC](SOURCES.md#src-sg-pdpc).

### GAP-JP — JP

**needs-source-verification:** Verify the current Japanese APPI text, personally referable information/recipient linkage, and applicable transfer rules; do not reuse the obsolete June 2020 translation.

**Planned features:** [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-INVENTORY](../FEATURES.md#feat-inventory).

**Starting sources:** [SRC-JP-PPC](SOURCES.md#src-jp-ppc).

### GAP-US-STATES — US-OTHER

**not-researched:** Continue individual research beyond selected CA/CO/CT/VA and Oregon/Minnesota signal items. Verify remaining state thresholds/exemptions, current amendments, sensitive/health/child rules and signal criteria; no blanket state-law support claim.

**Planned features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions).

**Starting sources:** [SRC-IUB-US](SOURCES.md#src-iub-us).

### GAP-EU-NATIONAL — EU-OTHER

**not-researched:** Follow the comparison's remaining national-authority references, verify current primary sources, and encode each difference separately.

**Planned features:** [FEAT-REGIONS](../FEATURES.md#feat-regions).

**Starting sources:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

### GAP-GLOBAL — OTHER

**not-researched:** Expand to further jurisdictions and sector/marketing/consumer laws according to explicit scope; including India commencement phases, South Korea, and additional national regimes.

**Planned features:** [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-SCOPE-GUARDS](../FEATURES.md#feat-scope-guards).

### GAP-EU-GUARANTEE-ASSETS — EU-EEA

**needs-source-verification:** Resolve the official SVG/reference-colour discrepancy and independently review PDF text equivalents and actual digital legibility/QR usability. Do not silently recolour supplied files or claim statutory design conformity from source hashes.

**Planned features:** [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents).

**Starting sources:** [SRC-EU-GUARANTEE-REG](SOURCES.md#src-eu-guarantee-reg), [SRC-EU-GUARANTEE-ASSETS](SOURCES.md#src-eu-guarantee-assets), [SRC-EU-GUARANTEE-GUIDE](SOURCES.md#src-eu-guarantee-guide).

### GAP-US-OR-STATUTE — US-OR

**needs-source-verification:** Retrieve current consolidated Oregon provisions and amendments, assess applicability and universal-signal criteria, and review separate child/geolocation prohibitions. DOJ guidance supports only the selected initial findings.

**Planned features:** [FEAT-US-CHOICES](../FEATURES.md#feat-us-choices), [FEAT-REGIONS](../FEATURES.md#feat-regions).

**Starting sources:** [SRC-US-OR-STATUTE](SOURCES.md#src-us-or-statute), [SRC-US-OR-FAQ](SOURCES.md#src-us-or-faq).
