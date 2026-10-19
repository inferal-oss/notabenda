# Requirements catalog

Generated from [regulatory/catalog.json](../../regulatory/catalog.json). Edit the catalog and run `python3 scripts/regulatory.py` to refresh these pages.

Research baseline: **2026-10-18**. Implementation and verification status are recorded per item. Legal research is initial and legally unreviewed; no jurisdiction pack is production-supported. Search-result evidence is labeled separately from a retrieved full source.

[Feature index](../FEATURES.md) · [Source index](SOURCES.md) · [Research workflow](../../regulatory/README.md)

## Scope index

| Scope | Requirements | Coverage |
| --- | --- | --- |
| EU-EEA | [REQ-EU-NOTICE](#req-eu-notice), [REQ-EU-CONSENT](#req-eu-consent), [REQ-EU-DEVICE](#req-eu-device), [REQ-EU-FAIR-CHOICE](#req-eu-fair-choice), [REQ-EU-TERMS](#req-eu-terms), [REQ-EU-WITHDRAWAL](#req-eu-withdrawal), [REQ-EU-ORDER-ACTION](#req-eu-order-action), [REQ-EU-RETENTION-ERASURE](#req-eu-retention-erasure), [REQ-EU-MARKETING](#req-eu-marketing), [REQ-EU-GUARANTEE-NOTICE](#req-eu-guarantee-notice), [REQ-EU-GUARANTEE-LABEL](#req-eu-guarantee-label) | Selected items: partial |
| FR | [REQ-FR-SCOPE](#req-fr-scope) | Selected items: planned |
| DE | [REQ-DE-DEVICE](#req-de-device), [REQ-DE-CANCEL](#req-de-cancel), [REQ-DE-WITHDRAWAL](#req-de-withdrawal) | Selected items: partial, planned |
| IT | [REQ-IT-REPROMPT](#req-it-reprompt) | Selected items: partial |
| ES | [REQ-ES-CHOICE](#req-es-choice) | Selected items: partial |
| IE | [REQ-IE-DEVICE](#req-ie-device) | Selected items: planned |
| UK | [REQ-UK-EXCEPTIONS](#req-uk-exceptions) | Selected items: planned |
| CH | [REQ-CH-PROFILING](#req-ch-profiling) | Selected items: partial |
| BR | [REQ-BR-COOKIE-UI](#req-br-cookie-ui), [REQ-BR-CONTRACT](#req-br-contract) | Selected items: partial, planned |
| CA-FED | [REQ-CA-MEANINGFUL](#req-ca-meaningful), [REQ-CA-OBA](#req-ca-oba), [REQ-CA-CASL-OPTIN](#req-ca-casl-optin) | Selected items: partial |
| CA-QC | [REQ-QC-PROFILING](#req-qc-profiling) | Selected items: planned |
| AU | [REQ-AU-PIXELS](#req-au-pixels) | Selected items: partial |
| NZ | [REQ-NZ-NOTICE](#req-nz-notice), [REQ-NZ-INDIRECT](#req-nz-indirect) | Selected items: partial |
| ZA | [REQ-ZA-MARKETING](#req-za-marketing) | Selected items: planned |
| US-CA | [REQ-US-CA-CHOICES](#req-us-ca-choices), [REQ-US-CA-GPC](#req-us-ca-gpc), [REQ-US-CA-UI](#req-us-ca-ui) | Selected items: partial, planned |
| US-CO | [REQ-US-CO-GPC](#req-us-co-gpc) | Selected items: partial |
| US-CT | [REQ-US-CT-GPC](#req-us-ct-gpc) | Selected items: partial |
| US-VA | [REQ-US-VA-RIGHTS](#req-us-va-rights) | Selected items: partial |
| US-FED | [REQ-US-COPPA-SCOPE](#req-us-coppa-scope) | Selected items: partial |
| TR | [REQ-TR-BASIS](#req-tr-basis) | Selected items: planned |
| PLATFORM | [REQ-GOOGLE-MODE](#req-google-mode), [REQ-GOOGLE-CMP](#req-google-cmp) | Selected items: partial, planned |
| PRODUCT | [REQ-PRODUCT-A11Y](#req-product-a11y), [REQ-PRODUCT-MOBILE](#req-product-mobile), [REQ-PRODUCT-CONFIG](#req-product-config), [REQ-PRODUCT-DOCUMENTS](#req-product-documents), [REQ-PRODUCT-SAFE-CONTENT](#req-product-safe-content), [REQ-PRODUCT-ARTIFACTS](#req-product-artifacts), [REQ-PRODUCT-PACKAGE](#req-product-package), [REQ-PRODUCT-CF-ADMIN](#req-product-cf-admin), [REQ-PRODUCT-CF-HISTORY](#req-product-cf-history), [REQ-PRODUCT-CONSENT-RUNTIME](#req-product-consent-runtime), [REQ-PRODUCT-TERMS-ACCEPTANCE](#req-product-terms-acceptance), [REQ-PRODUCT-CF-HOST](#req-product-cf-host), [REQ-PRODUCT-CONSENT-EVIDENCE](#req-product-consent-evidence), [REQ-PRODUCT-AUTHORING](#req-product-authoring), [REQ-PRODUCT-REACT](#req-product-react), [REQ-PRODUCT-ASTRO](#req-product-astro), [REQ-PRODUCT-EMBEDS](#req-product-embeds), [REQ-PRODUCT-PRIVACY-SIGNALS](#req-product-privacy-signals), [REQ-PRODUCT-PROCESSING-CHOICES](#req-product-processing-choices), [REQ-PRODUCT-RETAINED-RELEASES](#req-product-retained-releases), [REQ-PRODUCT-STORAGE-CLEANUP](#req-product-storage-cleanup), [REQ-PRODUCT-SETUP](#req-product-setup), [REQ-PRODUCT-COLLECTION-NOTICE](#req-product-collection-notice), [REQ-PRODUCT-EVIDENCE-EXPORT](#req-product-evidence-export), [REQ-PRODUCT-DISCOVERY](#req-product-discovery), [REQ-PRODUCT-REGIONAL-PROMPTS](#req-product-regional-prompts), [REQ-PRODUCT-EVIDENCE-LIFECYCLE](#req-product-evidence-lifecycle), [REQ-PRODUCT-SCOPE-GUARDS](#req-product-scope-guards), [REQ-PRODUCT-DEMO-WORKSPACE](#req-product-demo-workspace), [REQ-PRODUCT-RIGHTS-CENTER](#req-product-rights-center), [REQ-PRODUCT-CF-STARTER](#req-product-cf-starter), [REQ-PRODUCT-FORM-PERMISSIONS](#req-product-form-permissions), [REQ-PRODUCT-CF-DOCTOR](#req-product-cf-doctor), [REQ-PRODUCT-CONTRACT-ACTIONS](#req-product-contract-actions), [REQ-PRODUCT-SYNTAX-HIGHLIGHTING](#req-product-syntax-highlighting), [REQ-PRODUCT-BUNDLE-BUDGET](#req-product-bundle-budget), [REQ-PRODUCT-SERVICE-CATALOG](#req-product-service-catalog), [REQ-PRODUCT-SERVICE-DETECTION](#req-product-service-detection), [REQ-PRODUCT-SERVICE-PROFILES](#req-product-service-profiles), [REQ-PRODUCT-INDIRECT-NOTICE](#req-product-indirect-notice), [REQ-PRODUCT-GUARANTEE-NOTICE](#req-product-guarantee-notice), [REQ-PRODUCT-PAID-ORDER-ARCHIVES](#req-product-paid-order-archives) | Selected items: implemented, partial |

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

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [CNIL: tracker requirements](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi) — Valid consent; prior consent; additional purposes (read; [SRC-FR-CNIL](SOURCES.md#src-fr-cnil)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-CHOICES](../FEATURES.md#feat-choices), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-fr-scope"></a>

**VERIFY-FR-SCOPE (planned):** Adding an optional purpose leaves that purpose blocked until granted; a cosmetic release alone does not invalidate existing choices.

**Limits/open review:** Audience-measurement exemptions depend on configuration and conditions, not a vendor label.

**Code/test references:** None yet; nothing implemented.

<a id="req-de-device"></a>

### REQ-DE-DEVICE — Terminal storage and access conditions

Obtain informed consent unless a section 25 exception applies.

**Applies when:** German TDDDG section 25 applies to the activity.

**Type:** law. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [Germany TDDDG section 25](https://www.gesetze-im-internet.de/ttdsg/__25.html) — Section 25(1)–(2) (read; [SRC-DE-TDDDG](SOURCES.md#src-de-tdddg)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-de-device"></a>

**VERIFY-DE-DEVICE (planned):** A declared exemption must name its condition; an advertising loader cannot bypass the decision engine by being labeled necessary.

**Limits/open review:** Transmission and requested-service necessity are narrow exceptions.

**Code/test references:** None yet; nothing implemented.

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

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [Irish DPC: cookies and tracking guidance](https://www.dataprotection.ie/en/dpc-guidance/guidance-cookies-and-other-tracking-technologies) — Consent and strictly necessary exception (search-result; [SRC-IE-DPC](SOURCES.md#src-ie-dpc)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement), [FEAT-REGIONS](../FEATURES.md#feat-regions).

<a id="verify-ie-device"></a>

**VERIFY-IE-DEVICE (planned):** The Irish profile leaves optional trackers inert until an explicit choice and documents the requested-service reason for exemptions.

**Limits/open review:** Do not import prompt durations or exemption assumptions from another country's pack.

**Code/test references:** None yet; nothing implemented.

<a id="req-uk-exceptions"></a>

### REQ-UK-EXCEPTIONS — Conditional storage/access exceptions and objection

Only enable an exception when its conditions hold; statistical/appearance exceptions require information and a simple free objection route.

**Applies when:** UK PECR applies and an operator opts into a qualifying exception.

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [ICO: storage/access exception conditions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/) — At a glance; statistical/appearance exceptions; simple means of objecting (read; [SRC-UK-ICO](SOURCES.md#src-uk-ico)).

**Discovery articles:** [SRC-IUB-COOKIES](SOURCES.md#src-iub-cookies).

**Features:** [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-uk-exceptions"></a>

**VERIFY-UK-EXCEPTIONS (planned):** An exception lacks effect without configured prerequisites and an objection action; objection stops the relevant purpose.

**Timing:** ICO finalized updated guidance on 29 April 2026.

**Limits/open review:** Default remains opt-in. Advertising does not qualify; device-access exceptions do not settle all UK GDPR obligations.

**Code/test references:** None yet; nothing implemented.

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

**Type:** regulator-recommendation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [ANPD: final cookies and personal-data guide](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf/@@display-file/file) — Section 4: cookie banners and examples (read; [SRC-BR-ANPD](SOURCES.md#src-br-anpd)).

**Discovery articles:** [SRC-IUB-BR](SOURCES.md#src-iub-br).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-CHOICES](../FEATURES.md#feat-choices).

<a id="verify-br-cookie-ui"></a>

**VERIFY-BR-COOKIE-UI (planned):** The Portuguese-language fixture exposes rejection and granular settings with optional choices initially off.

**Limits/open review:** These are regulator recommendations; LGPD legal bases require purpose-specific analysis, not a claim that consent is mandatory for all cookies.

**Code/test references:** None yet; nothing implemented.

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

**Type:** regulator-interpretation. **Research:** initial-research. **Legal review:** unreviewed. **Implementation:** planned.

**Sources:** [Québec CAI: private-sector collection and profiling functions](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/collecte-renseignements-personnels_entreprises) — Technologies d'identification, de localisation et de profilage (search-result; [SRC-QC-CAI](SOURCES.md#src-qc-cai)).

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-REGIONS](../FEATURES.md#feat-regions), [FEAT-ENFORCEMENT](../FEATURES.md#feat-enforcement).

<a id="verify-qc-profiling"></a>

**VERIFY-QC-PROFILING (planned):** A covered profiling function stays disabled until activation, and its collection surface describes it.

**Limits/open review:** Scope and exceptions need Québec-specific review; this is not a statement that every cookie is covered.

**Code/test references:** None yet; nothing implemented.

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

**Sources:** [California agency: consumer rights and 2026 regulation update](https://www.cppa.ca.gov/faq.html) — Consumer rights; business obligations (read; [SRC-US-CA](SOURCES.md#src-us-ca)); [California CCPA regulations effective 1 January 2026](https://www.cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) — Section 7026: methods, status, cessation, downstream notifications and re-opt-in solicitation conditions (read; [SRC-US-CA-REGS-2026](SOURCES.md#src-us-ca-regs-2026)); [California Attorney General: CCPA consumer request methods](https://www.oag.ca.gov/privacy/ccpa) — Sections B–E: designated methods; account creation; verification distinctions (read; [SRC-US-CA-AG-RIGHTS](SOURCES.md#src-us-ca-ag-rights)).

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

**Sources:** [California agency: consumer rights and 2026 regulation update](https://www.cppa.ca.gov/faq.html) — Opt-out preference signals (read; [SRC-US-CA](SOURCES.md#src-us-ca)); [California CCPA regulations effective 1 January 2026](https://www.cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) — §7025(b)–(c), pp. 44–48 (read; [SRC-US-CA-REGS-2026](SOURCES.md#src-us-ca-regs-2026)).

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

**Sources:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — Keyboard, contrast, focus, labels, reflow, target size (read; [SRC-WCAG](SOURCES.md#src-wcag)).

**Discovery articles:** [SRC-LINEAR-DESIGN-2026](SOURCES.md#src-linear-design-2026).

**Features:** [FEAT-CONTROLS](../FEATURES.md#feat-controls), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-a11y"></a>

**VERIFY-PRODUCT-A11Y (partial):** Keyboard, focus, screen-reader, contrast, zoom, mobile and RTL checks run against each built-in theme.

**Implementation boundary:** Document semantics and initial native-dialog focus/Escape checks are implemented. Full WCAG, screen-reader, contrast, zoom and platform audit remains pending. Native entry relationships, separately named purpose controls and focus recovery for disappearing retry/notice controls are covered through both consent factories; broad accessibility acceptance remains pending. Shared defaults now use neutral surfaces, restrained navigation, compact operator headings/record rows, consistent small corners and deliberate light/dark permission controls. Real browser checks retain equal accept/reject actions, mobile setup targets and no horizontal overflow on inspected families. Full accessibility certification and untested platforms remain open. Long headings/Close labels now wrap, action columns adapt to text size, and logical side placement mirrors RTL. Whole-dialog scrolling is the safe fallback; measured resize observation retains fixed chrome only with a useful text-relative body viewport, preserves draft/focus and disconnects on teardown. Repeatable local fixtures and initial Chromium width/short-screen/large-text/RTL/no-observer checks extend evidence; actual browser zoom and broader platform/assistive-technology acceptance remain open.

**Limits/open review:** This is an engineering standard, not a claim of blanket legal compliance or certification.

**Code/test references:** [packages/notabenda/src/documents.ts](../../packages/notabenda/src/documents.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [docs/DESIGN.md](../../docs/DESIGN.md), [examples/static/choices-page.mjs](../../examples/static/choices-page.mjs), [examples/static/choices-page.css](../../examples/static/choices-page.css), [site/examples-page.mjs](../../site/examples-page.mjs), [site/style.css](../../site/style.css), [examples/static/example-design.mjs](../../examples/static/example-design.mjs), [examples/static/example-pages.css](../../examples/static/example-pages.css), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [packages/notabenda-cf/src/presentation.ts](../../packages/notabenda-cf/src/presentation.ts), [site/admin-presentation.mjs](../../site/admin-presentation.mjs), [site/build.mjs](../../site/build.mjs), [packages/notabenda/src/services.css](../../packages/notabenda/src/services.css), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [site/demo-admin.css](../../site/demo-admin.css), [site/syntax.mjs](../../site/syntax.mjs), [examples/static/example-theme.css](../../examples/static/example-theme.css), [examples/discovery/style.css](../../examples/discovery/style.css), [examples/form-permissions/style.css](../../examples/form-permissions/style.css), [examples/contract-actions/style.css](../../examples/contract-actions/style.css), [scripts/build-controls-layout.mjs](../../scripts/build-controls-layout.mjs), [packages/notabenda/test/documents.test.mjs](../../packages/notabenda/test/documents.test.mjs), [docs/verification/consent-browser.md](../../docs/verification/consent-browser.md), [docs/verification/terms-browser.md](../../docs/verification/terms-browser.md), [docs/verification/website-browser.md](../../docs/verification/website-browser.md), [docs/verification/design-pass.md](../../docs/verification/design-pass.md), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/ux-review.md](../../docs/verification/ux-review.md), [site/test/guide-navigation.test.mjs](../../site/test/guide-navigation.test.mjs), [packages/notabenda/test/controls.test.mjs](../../packages/notabenda/test/controls.test.mjs), [packages/notabenda/test/consent-delivery.test.mjs](../../packages/notabenda/test/consent-delivery.test.mjs), [docs/verification/consent-focus.md](../../docs/verification/consent-focus.md), [packages/notabenda/test/controls-layout.test.mjs](../../packages/notabenda/test/controls-layout.test.mjs), [docs/verification/controls-layout.md](../../docs/verification/controls-layout.md)

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

**Code/test references:** [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/styles.css](../../packages/notabenda/src/styles.css), [docs/DESIGN.md](../../docs/DESIGN.md), [examples/static/choices-page.mjs](../../examples/static/choices-page.mjs), [examples/static/choices-page.css](../../examples/static/choices-page.css), [site/examples-page.mjs](../../site/examples-page.mjs), [site/style.css](../../site/style.css), [examples/static/example-design.mjs](../../examples/static/example-design.mjs), [examples/static/example-pages.css](../../examples/static/example-pages.css), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [packages/notabenda-cf/src/presentation.ts](../../packages/notabenda-cf/src/presentation.ts), [site/admin-presentation.mjs](../../site/admin-presentation.mjs), [site/build.mjs](../../site/build.mjs), [packages/notabenda/src/services.css](../../packages/notabenda/src/services.css), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [site/demo-admin.css](../../site/demo-admin.css), [site/syntax.mjs](../../site/syntax.mjs), [examples/static/example-theme.css](../../examples/static/example-theme.css), [examples/discovery/style.css](../../examples/discovery/style.css), [examples/form-permissions/style.css](../../examples/form-permissions/style.css), [examples/contract-actions/style.css](../../examples/contract-actions/style.css), [scripts/build-controls-layout.mjs](../../scripts/build-controls-layout.mjs), [docs/verification/consent-browser.md](../../docs/verification/consent-browser.md), [docs/verification/terms-browser.md](../../docs/verification/terms-browser.md), [docs/verification/website-browser.md](../../docs/verification/website-browser.md), [docs/verification/design-pass.md](../../docs/verification/design-pass.md), [docs/verification/ux-review.md](../../docs/verification/ux-review.md), [site/test/guide-navigation.test.mjs](../../site/test/guide-navigation.test.mjs), [packages/notabenda/test/controls.test.mjs](../../packages/notabenda/test/controls.test.mjs), [packages/notabenda/test/consent-delivery.test.mjs](../../packages/notabenda/test/consent-delivery.test.mjs), [docs/verification/consent-focus.md](../../docs/verification/consent-focus.md), [packages/notabenda/test/controls-layout.test.mjs](../../packages/notabenda/test/controls-layout.test.mjs), [docs/verification/controls-layout.md](../../docs/verification/controls-layout.md)

<a id="req-product-config"></a>

### REQ-PRODUCT-CONFIG — Typed, validated site facts and public projection

Validate declared site facts, stable references, and public output boundaries.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-config"></a>

**VERIFY-PRODUCT-CONFIG (automated):** Malformed input and broken references yield diagnostics; private/unknown nested fields never enter public output.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda/src/config.ts](../../packages/notabenda/src/config.ts), [packages/notabenda/src/types.ts](../../packages/notabenda/src/types.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-compile.ts](../../packages/notabenda/src/consent-compile.ts), [packages/notabenda/src/setup-purpose.ts](../../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/src/setup-purpose-ui.ts](../../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-purpose-cli.ts](../../packages/notabenda/src/setup-purpose-cli.ts), [packages/notabenda/test/config.test.mjs](../../packages/notabenda/test/config.test.mjs), [packages/notabenda/test/consent-runtime.test.mjs](../../packages/notabenda/test/consent-runtime.test.mjs), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs)

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

Pack a dependency-free browser/SSR API and separate build-time tools without publishing.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-package"></a>

**VERIFY-PRODUCT-PACKAGE (automated):** A packed tarball installs offline and exposes usable API/CLI/types/styles/license; its browser dependency graph excludes Node and framework imports.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda/src/cli.ts](../../packages/notabenda/src/cli.ts), [packages/notabenda/package.json](../../packages/notabenda/package.json), [packages/notabenda/src/headless.ts](../../packages/notabenda/src/headless.ts), [packages/notabenda/scripts/consent-styles.mjs](../../packages/notabenda/scripts/consent-styles.mjs), [scripts/measure-bundles.mjs](../../scripts/measure-bundles.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [packages/notabenda/test/cli.test.mjs](../../packages/notabenda/test/cli.test.mjs), [packages/notabenda/test/delivery.test.mjs](../../packages/notabenda/test/delivery.test.mjs), [site/test/delivery.test.mjs](../../site/test/delivery.test.mjs)

<a id="req-product-cf-admin"></a>

### REQ-PRODUCT-CF-ADMIN — Scoped backoffice with host-owned authorization

Require host authorization and present bounded, searchable stored evidence without executing payloads.

**Applies when:** The corresponding package feature is used.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-cf-admin"></a>

**VERIFY-PRODUCT-CF-ADMIN (automated):** Missing/denied/failed authorization never reads data; scope isolation, bounded scanning, search, safe details and sanitized errors pass simulated Worker/DO tests.

**Limits/open review:** Implementation checks establish the documented software behavior, not legal validity, completeness of operator facts, or production jurisdiction support.

**Code/test references:** [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/store.ts](../../packages/notabenda-cf/src/store.ts), [packages/notabenda-cf/src/types.ts](../../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/src/export.ts](../../packages/notabenda-cf/src/export.ts), [packages/notabenda-cf/src/admin-style.ts](../../packages/notabenda-cf/src/admin-style.ts), [packages/notabenda-cf/src/presentation.ts](../../packages/notabenda-cf/src/presentation.ts), [site/admin-presentation.mjs](../../site/admin-presentation.mjs), [packages/notabenda-cf/src/setup.ts](../../packages/notabenda-cf/src/setup.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda-cf/src/order-render.ts](../../packages/notabenda-cf/src/order-render.ts), [packages/notabenda-cf/src/order-admin-style.ts](../../packages/notabenda-cf/src/order-admin-style.ts), [packages/notabenda-cf/test/admin.test.mjs](../../packages/notabenda-cf/test/admin.test.mjs), [packages/notabenda-cf/test/export.test.mjs](../../packages/notabenda-cf/test/export.test.mjs), [packages/notabenda-cf/test/orders.test.mjs](../../packages/notabenda-cf/test/orders.test.mjs)

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

**Limits/open review:** Local-only state is untrusted and is not durable consent evidence, automatic arbitrary-script blocking, or a supported regional rule pack. Browser suspension and host adapter behavior bound enforcement.

**Code/test references:** [packages/notabenda/src/consent.ts](../../packages/notabenda/src/consent.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-runtime.ts](../../packages/notabenda/src/consent-runtime.ts), [packages/notabenda/test/consent.test.mjs](../../packages/notabenda/test/consent.test.mjs), [packages/notabenda/test/consent-runtime.test.mjs](../../packages/notabenda/test/consent-runtime.test.mjs), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs)

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

**Code/test references:** [site/host.mjs](../../site/host.mjs), [site/worker.mjs](../../site/worker.mjs), [site/build.mjs](../../site/build.mjs), [site/website-notice.mjs](../../site/website-notice.mjs), [site/website-notice.css](../../site/website-notice.css), [site/navigation.mjs](../../site/navigation.mjs), [site/guide-pages.mjs](../../site/guide-pages.mjs), [site/examples-page.mjs](../../site/examples-page.mjs), [site/style.css](../../site/style.css), [site/test/host.test.mjs](../../site/test/host.test.mjs), [docs/verification/website-browser.md](../../docs/verification/website-browser.md), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [site/test/website-notice.test.mjs](../../site/test/website-notice.test.mjs), [site/test/site-organization.test.mjs](../../site/test/site-organization.test.mjs)

<a id="req-product-consent-evidence"></a>

### REQ-PRODUCT-CONSENT-EVIDENCE — Version-bound cookie-choice evidence and ordered receipt handling

Register exact notice wording and archived privacy/cookie references, atomically order host-authorized browser reports, and preserve withdrawal under retries and stale snapshots. Browser delivery must be explicitly integrated before claiming recorded visitor choices.

**Applies when:** An operator opts into the optional cookie-choice evidence backend.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Discovery articles:** [SRC-EU-EDPB-CONSENT](SOURCES.md#src-eu-edpb-consent).

**Features:** [FEAT-RECORDS](../FEATURES.md#feat-records), [FEAT-CHOICES](../FEATURES.md#feat-choices), [FEAT-BACKOFFICE](../FEATURES.md#feat-backoffice).

<a id="verify-product-consent-evidence"></a>

**VERIFY-PRODUCT-CONSENT-EVIDENCE (automated):** Ledger and browser tests verify exact notice/command binding, transactional retries/CAS, old-notice revoke-all, fail-closed receipt gating, lost acknowledgments, stale reads, storage failures, reload/stream changes, server expiry, maximum response bounds and safe inspection. Manual Chromium and real local Worker observations supplement automation; production operations remain unverified.

**Implementation boundary:** Immutable notices, transactional stream revisions, restrictive revoke-all and historical receipts/current heads are implemented. Optional construction-time browser gating, exact-response validation, bounded single-command retries, immediate local withdrawal, reload/resume confirmation, storage-failure barriers and stale-generation retirement are covered by tests. Default browser mode remains local-only.

**Limits/open review:** Host supplies authorization, opaque stream resolution, CSRF/origin controls, quotas, retention/erasure and replay policy. Reports are not verified human actions or legal-validity proof. Production visitor capability lifecycle, cloud deployment, retention and full platform/accessibility review remain incomplete.

**Code/test references:** [packages/notabenda/src/consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/consent.ts](../../packages/notabenda/src/consent.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [examples/static/recorded-consent.mjs](../../examples/static/recorded-consent.mjs), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda/src/consent-runtime.ts](../../packages/notabenda/src/consent-runtime.ts), [packages/notabenda/src/consent-evidence-factory.ts](../../packages/notabenda/src/consent-evidence-factory.ts), [packages/notabenda/src/consent-runtime-evidence.ts](../../packages/notabenda/src/consent-runtime-evidence.ts), [packages/notabenda/test/consent-evidence.test.mjs](../../packages/notabenda/test/consent-evidence.test.mjs), [docs/verification/consent-evidence-browser.md](../../docs/verification/consent-evidence-browser.md), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [packages/notabenda/test/consent-delivery.test.mjs](../../packages/notabenda/test/consent-delivery.test.mjs), [packages/notabenda/test/consent-runtime.test.mjs](../../packages/notabenda/test/consent-runtime.test.mjs), [docs/verification/consent-focus.md](../../docs/verification/consent-focus.md)

<a id="req-product-authoring"></a>

### REQ-PRODUCT-AUTHORING — Markdown and MDX document authoring with YAML frontmatter

Support both Markdown and MDX legal-document sources with YAML frontmatter for document configuration, host-supplied custom MDX components and immutable original-source/rendered-output history. Keep the core framework-independent.

**Applies when:** An operator authors privacy, cookie or terms revisions in .md or .mdx project files.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-TERMS](../FEATURES.md#feat-terms), [FEAT-DOCUMENT-HISTORY](../FEATURES.md#feat-document-history), [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment).

<a id="verify-product-authoring"></a>

**VERIFY-PRODUCT-AUTHORING (automated):** Both .md and .mdx compile with validated YAML frontmatter, stable section IDs, custom component rendering, source and output hashes, review guards and readable revision diffs. Invalid metadata fails clearly; default core remains import-safe and framework-free.

**Implementation boundary:** Optional Node build package compiles Markdown/MDX with strict YAML frontmatter and static custom components. Source/output hashes bind immutable private archives; the host-authorized backend supports escaped source inspection and source/rendered comparisons. Core and CF packages retain zero runtime dependencies.

**Limits/open review:** MDX is trusted executable build-time project code. Output is static, validated and sanitized; no browser hydration. The authoring API is optional and the CLI remains JSON-based. Private source archives have explicit size limits; host auth, retention and reproducible component builds remain adopter responsibilities.

**Code/test references:** [packages/notabenda-authoring/src/index.ts](../../packages/notabenda-authoring/src/index.ts), [packages/notabenda-authoring/src/frontmatter.ts](../../packages/notabenda-authoring/src/frontmatter.ts), [packages/notabenda-authoring/src/html.ts](../../packages/notabenda-authoring/src/html.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/history.ts](../../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/authoring/build.mjs](../../examples/authoring/build.mjs), [packages/notabenda-cf/src/source-diff.ts](../../packages/notabenda-cf/src/source-diff.ts), [packages/notabenda-authoring/test/authoring.test.mjs](../../packages/notabenda-authoring/test/authoring.test.mjs), [packages/notabenda-authoring/test/package.test.mjs](../../packages/notabenda-authoring/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [docs/verification/authoring.md](../../docs/verification/authoring.md)

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

**Sources:** [California CCPA regulations effective 1 January 2026](https://www.cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) — Section 7026: opt-out methods and status; host cessation/propagation remains separate (read; [SRC-US-CA-REGS-2026](SOURCES.md#src-us-ca-regs-2026)).

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

Render selected declared collection facts beside a host form, with a pinned privacy release, independent wording review, accessible static details and no implied acceptance or evidence write.

**Applies when:** The host supplies an appropriate direct/mixed-source inventory purpose and places a notice at a collection surface.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** implemented.

**Features:** [FEAT-FORMS](../FEATURES.md#feat-forms), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents).

<a id="verify-product-collection-notice"></a>

**VERIFY-PRODUCT-COLLECTION-NOTICE (automated):** Selected direct/mixed purposes produce deterministic reviewed/draft notices with intact pinned privacy references, explicit purpose-level semantics, safe static markup, stable unique IDs and no consent/submission side effects; corruption and invalid selections fail.

**Implementation boundary:** Trusted public release integrity checks precede a bounded selected-facts projection. Content identity covers locale, scope, render policy and reviewed wording; unique instance/summary IDs support static vanilla, React and Astro markup.

**Limits/open review:** Purpose-level categories and optionality do not map individual fields. Host reviews inventory/policy/context, legal particulars, timing and availability. No indirect-notification workflow, marketing permission, parental authorization or proof of display/read/acceptance.

**Code/test references:** [packages/notabenda/src/collection.ts](../../packages/notabenda/src/collection.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/CollectionNotice.astro](../../packages/notabenda/src/astro/CollectionNotice.astro), [examples/collection/build.mjs](../../examples/collection/build.mjs), [packages/notabenda/test/collection.test.mjs](../../packages/notabenda/test/collection.test.mjs), [packages/notabenda/test/react.test.mjs](../../packages/notabenda/test/react.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [packages/notabenda/test/react-package.test.mjs](../../packages/notabenda/test/react-package.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/collection.md](../../docs/verification/collection.md)

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

**Implementation boundary:** Atomic retirement precedes retries and empty-head reads. Exact family/site/context event matching, transactional bounded scans, CAS holds and restartable manifests preserve restrictions. Browser controllers close terminal contexts. Read-only admin cards show holds, scan counters, timestamps and retained-data limitations.

**Limits/open review:** Host supplies authorization, identity resolution, eligibility, scheduling and authoritative manifests outside backup rollback. Minimal pseudonymous metadata, shared archives, exports, backups and other application data remain. No complete erasure, legal sufficiency, automatic retention period or public deletion endpoint.

**Code/test references:** [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/consent.ts](../../packages/notabenda-cf/src/consent.ts), [packages/notabenda-cf/src/processing.ts](../../packages/notabenda-cf/src/processing.ts), [packages/notabenda-cf/src/terms.ts](../../packages/notabenda-cf/src/terms.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [packages/notabenda/src/consent-evidence.ts](../../packages/notabenda/src/consent-evidence.ts), [packages/notabenda/src/controls.ts](../../packages/notabenda/src/controls.ts), [packages/notabenda/src/processing-choices.ts](../../packages/notabenda/src/processing-choices.ts), [packages/notabenda/src/terms.ts](../../packages/notabenda/src/terms.ts), [site/worker.mjs](../../site/worker.mjs), [examples/lifecycle.mjs](../../examples/lifecycle.mjs), [packages/notabenda-cf/src/records.ts](../../packages/notabenda-cf/src/records.ts), [packages/notabenda-cf/src/contract-dispatch.ts](../../packages/notabenda-cf/src/contract-dispatch.ts), [packages/notabenda/src/consent-engine.ts](../../packages/notabenda/src/consent-engine.ts), [packages/notabenda-cf/src/orders.ts](../../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/test/lifecycle.test.mjs](../../packages/notabenda-cf/test/lifecycle.test.mjs), [packages/notabenda/test/consent-delivery.test.mjs](../../packages/notabenda/test/consent-delivery.test.mjs), [packages/notabenda/test/processing.test.mjs](../../packages/notabenda/test/processing.test.mjs), [packages/notabenda/test/terms.test.mjs](../../packages/notabenda/test/terms.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [site/test/host.test.mjs](../../site/test/host.test.mjs), [scripts/check-site-runtime.mjs](../../scripts/check-site-runtime.mjs), [docs/verification/evidence-lifecycle.md](../../docs/verification/evidence-lifecycle.md), [packages/notabenda-cf/test/contract-dispatch.test.mjs](../../packages/notabenda-cf/test/contract-dispatch.test.mjs), [docs/verification/contract-dispatch.md](../../docs/verification/contract-dispatch.md), [packages/notabenda-cf/test/orders.test.mjs](../../packages/notabenda-cf/test/orders.test.mjs)

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

**VERIFY-PRODUCT-FORM-PERMISSIONS (automated):** Exact offers and host stream preconditions; CAS/activation ordering; independent withdrawals including failed/hung first reads; safe nonce retries; monotonic responses; scoped lifecycle and read-time evidence; isolated session routing and local SQLite restart. Broader UI/platform acceptance tracked separately. Transactional reload recovery preserves original command/artifact binding, storage failures never bypass withdrawal, and keyboard focus survives hidden controls. React form fields preserve conservative SSR/hydration, immutable snapshots, host ownership, form independence and explicit exact-request recovery through remount. Astro form fields preserve exact-offer named binding, host-owned draft/pending state and no automatic transport across navigation; the host closes replaced session/contact/offer contexts before refreshing the bridge.

**Implementation boundary:** Ordinary opt-in/withdrawal mechanics, scoped history, isolated examples and optional IndexedDB recovery are implemented. Exact pending requests, withdrawal epochs and head/activation fences survive reload; stale-tab grants and storage failures are covered. React provider/hooks/native field and light/midnight examples reuse that controller with no mount-time network or ordinary-form writes. Wider platform acceptance and regional packs remain incomplete. Named Astro fields and a navigation bridge reuse the same permission controller without mount/page-load transport. Exact-offer matching, duplicate ownership, draft/pending retention, actual two-page builds and host session/contact/offer replacement are checked.

**Limits/open review:** No implied-consent classifier, specialized authorization, identity/contact proof, sending or complete regional coverage. Browser recovery is opt-in and depends on retained transactional storage; it never authorizes background delivery. A historical receipt never decides current eligibility.

**Code/test references:** [packages/notabenda/src/form-permission.ts](../../packages/notabenda/src/form-permission.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/permissions.ts](../../packages/notabenda-cf/src/permissions.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/form-permissions/build.mjs](../../examples/form-permissions/build.mjs), [examples/form-permissions/client.mjs](../../examples/form-permissions/client.mjs), [site/permission-context.mjs](../../site/permission-context.mjs), [site/demo-host.mjs](../../site/demo-host.mjs), [site/worker.mjs](../../site/worker.mjs), [site/permission-seed.mjs](../../site/permission-seed.mjs), [packages/notabenda/src/form-permission-journal.ts](../../packages/notabenda/src/form-permission-journal.ts), [packages/notabenda/src/react-form-permission.ts](../../packages/notabenda/src/react-form-permission.ts), [examples/form-permissions/react-build.mjs](../../examples/form-permissions/react-build.mjs), [examples/form-permissions/react-client.mjs](../../examples/form-permissions/react-client.mjs), [examples/form-permissions/react-view.mjs](../../examples/form-permissions/react-view.mjs), [packages/notabenda/src/astro-form-permission.ts](../../packages/notabenda/src/astro-form-permission.ts), [packages/notabenda/src/astro/FormPermissionField.astro](../../packages/notabenda/src/astro/FormPermissionField.astro), [examples/form-permissions/example.mjs](../../examples/form-permissions/example.mjs), [examples/astro/src/lib/permission.mjs](../../examples/astro/src/lib/permission.mjs), [examples/astro/src/layouts/PermissionLayout.astro](../../examples/astro/src/layouts/PermissionLayout.astro), [examples/astro/src/scripts/permission-client.mjs](../../examples/astro/src/scripts/permission-client.mjs), [examples/astro/src/pages/form-permissions/astro/index.astro](../../examples/astro/src/pages/form-permissions/astro/index.astro), [examples/astro/src/pages/form-permissions/astro/review.astro](../../examples/astro/src/pages/form-permissions/astro/review.astro), [packages/notabenda/test/form-permission.test.mjs](../../packages/notabenda/test/form-permission.test.mjs), [docs/verification/form-permissions.md](../../docs/verification/form-permissions.md), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [scripts/check-form-permission-runtime.mjs](../../scripts/check-form-permission-runtime.mjs), [docs/verification/ux-review.md](../../docs/verification/ux-review.md), [packages/notabenda/test/react-form-permission.test.mjs](../../packages/notabenda/test/react-form-permission.test.mjs), [packages/notabenda/test/react-package.test.mjs](../../packages/notabenda/test/react-package.test.mjs), [packages/notabenda/test/astro-form-permission.test.mjs](../../packages/notabenda/test/astro-form-permission.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [packages/notabenda/test/astro-build.test.mjs](../../packages/notabenda/test/astro-build.test.mjs), [site/test/astro-permission.test.mjs](../../site/test/astro-permission.test.mjs)

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

**Implementation boundary:** Versioned archive-bound definitions, visible-field validation, native forms/headless state, bounded exact retry/recovery, transactional capture and independent leased jobs, immutable at-capture copy, provider CAS, private semantic inspection/search and per-declaration lifecycle. The isolated example deliberately retains its recovery command within a session-scoped tab, with no mount-time transport. Local SQLite capture/restart verified; real runners, provider delivery, regional and platform acceptance remain open. Optional single/paired dispatch runners validate before claim, bound asynchronous provider attempts, preserve independent acknowledgement, fence late results and report provider/settlement outcomes separately. Real SQLite restart/deduplication is verified with test-only provider simulation; production scheduling/provider delivery remains open.

**Limits/open review:** Initial email-acknowledgement mechanics, not complete regional packs or a delivery service. Host admission/anti-abuse, actual prompt dispatch, identity/contract matching, provider idempotency, fulfillment, refunds, retention and operational rehearsal remain necessary. Published form documents do not establish the original contract terms.

**Code/test references:** [packages/notabenda/src/contract-action-policy.ts](../../packages/notabenda/src/contract-action-policy.ts), [packages/notabenda/src/contract-action.ts](../../packages/notabenda/src/contract-action.ts), [packages/notabenda/src/content.ts](../../packages/notabenda/src/content.ts), [packages/notabenda-cf/src/contract-action-policy.ts](../../packages/notabenda-cf/src/contract-action-policy.ts), [packages/notabenda-cf/src/contracts.ts](../../packages/notabenda-cf/src/contracts.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/records.ts](../../packages/notabenda-cf/src/records.ts), [packages/notabenda-cf/src/render.ts](../../packages/notabenda-cf/src/render.ts), [examples/contract-actions/build.mjs](../../examples/contract-actions/build.mjs), [examples/contract-actions/client.mjs](../../examples/contract-actions/client.mjs), [examples/contract-actions/style.css](../../examples/contract-actions/style.css), [site/contract-context.mjs](../../site/contract-context.mjs), [site/contract-seed.mjs](../../site/contract-seed.mjs), [site/demo-host.mjs](../../site/demo-host.mjs), [site/worker.mjs](../../site/worker.mjs), [site/host.mjs](../../site/host.mjs), [packages/notabenda-cf/src/contract-dispatch.ts](../../packages/notabenda-cf/src/contract-dispatch.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/test/contract-action.test.mjs](../../packages/notabenda/test/contract-action.test.mjs), [packages/notabenda-cf/test/contracts.test.mjs](../../packages/notabenda-cf/test/contracts.test.mjs), [docs/verification/contract-actions.md](../../docs/verification/contract-actions.md), [site/test/contracts.test.mjs](../../site/test/contracts.test.mjs), [scripts/check-contract-actions-runtime.mjs](../../scripts/check-contract-actions-runtime.mjs), [packages/notabenda-cf/test/contract-dispatch.test.mjs](../../packages/notabenda-cf/test/contract-dispatch.test.mjs), [scripts/check-contract-dispatch-runtime.mjs](../../scripts/check-contract-dispatch-runtime.mjs), [scripts/fixtures/contract-dispatch-worker.mjs](../../scripts/fixtures/contract-dispatch-worker.mjs), [docs/verification/contract-dispatch.md](../../docs/verification/contract-dispatch.md), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs), [docs/verification/setup.md](../../docs/verification/setup.md), [site/test/demo-upgrade.test.mjs](../../site/test/demo-upgrade.test.mjs)

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

Measure actual browser bundles and published CSS; target 15 KiB gzip for core plus vanilla controls and 5 KiB for default consent CSS, reporting broader optional surfaces separately. Preserve validation and effective-permission behavior.

**Applies when:** Documenting or releasing browser runtime and stylesheet entry points.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Features:** [FEAT-DEPLOYMENT](../FEATURES.md#feat-deployment), [FEAT-CONTROLS](../FEATURES.md#feat-controls).

<a id="verify-product-bundle-budget"></a>

**VERIFY-PRODUCT-BUNDLE-BUDGET (partial):** Compiled local consent plus controls stays below 15 KiB gzip and excludes full site validation, evidence implementation and build/backend/framework modules; exact scope and lifecycle parity tests pass. Required receipt and compatibility profiles are reported separately. Consent CSS stays below 5 KiB; compatibility target and interaction timing remain open.

**Implementation boundary:** Build-time full validation produces a bounded, independently parsed browser inventory with exact legacy material scopes. The shared engine keeps required evidence in an explicit optional entry and records authorization provenance on local choices. Consent-only CSS preserves canonical cascade and accessibility rules. Compatibility core-controls still exceeds target.

**Limits/open review:** The compiled local consent-plus-controls profile meets 15 KiB gzip; the fully validating compatibility entry remains above target. Optional required-receipt code is reported separately. Transfer size is not startup/interaction timing or a full performance audit. Adopters choose whether to gate on the optional measurement tool.

**Code/test references:** [scripts/measure-bundles.mjs](../../scripts/measure-bundles.mjs), [packages/notabenda/scripts/consent-styles.mjs](../../packages/notabenda/scripts/consent-styles.mjs), [examples/static/build.mjs](../../examples/static/build.mjs), [examples/static/choices-build.mjs](../../examples/static/choices-build.mjs), [examples/static/choices-page.mjs](../../examples/static/choices-page.mjs), [examples/static/consent.mjs](../../examples/static/consent.mjs), [packages/notabenda/src/consent-runtime-config.ts](../../packages/notabenda/src/consent-runtime-config.ts), [packages/notabenda/src/consent-compile.ts](../../packages/notabenda/src/consent-compile.ts), [packages/notabenda/src/consent-runtime.ts](../../packages/notabenda/src/consent-runtime.ts), [packages/notabenda/src/consent-evidence-factory.ts](../../packages/notabenda/src/consent-evidence-factory.ts), [packages/notabenda/src/consent-runtime-evidence.ts](../../packages/notabenda/src/consent-runtime-evidence.ts), [packages/notabenda/src/react-consent.ts](../../packages/notabenda/src/react-consent.ts), [packages/notabenda/test/delivery.test.mjs](../../packages/notabenda/test/delivery.test.mjs), [docs/verification/browser-delivery.md](../../docs/verification/browser-delivery.md), [site/test/delivery.test.mjs](../../site/test/delivery.test.mjs), [packages/notabenda/test/consent-runtime.test.mjs](../../packages/notabenda/test/consent-runtime.test.mjs), [packages/notabenda/test/react-consent.test.mjs](../../packages/notabenda/test/react-consent.test.mjs)

<a id="req-product-service-catalog"></a>

### REQ-PRODUCT-SERVICE-CATALOG — Source-backed third-party catalog and resolved disclosures

Standardize provider/product identities and source-backed facts, resolve reviewed site-specific use into shared public rendering, and pin revisions for immutable release history.

**Applies when:** Confirmed service selection or catalog-backed legal/preference/directory rendering.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Sources:** [Open Cookie Database: cookie metadata CSV](https://github.com/jkwakman/Open-Cookie-Database) — README: download formats, wildcard matching and contributions (read; [SRC-OPEN-COOKIE-DATABASE](SOURCES.md#src-open-cookie-database)); [Open Cookie Database repository license](https://github.com/jkwakman/Open-Cookie-Database/blob/master/LICENSE) — Apache-2.0 sections 2 and 4; candidate reuse and attribution (read; [SRC-OPEN-COOKIE-LICENSE](SOURCES.md#src-open-cookie-license)).

**Features:** [FEAT-SERVICE-CATALOG](../FEATURES.md#feat-service-catalog), [FEAT-INVENTORY](../FEATURES.md#feat-inventory), [FEAT-DOCUMENTS](../FEATURES.md#feat-documents), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-service-catalog"></a>

**VERIFY-PRODUCT-SERVICE-CATALOG (partial):** Schema and source/version validation, operator overrides/custom entries, selected-only browser graphs, shared renderer parity and unchanged pinned historical documents.

**Implementation boundary:** Optional versioned catalog normalization/search, licensed offline seed and source-linked public directory views now connect to CLI/admin setup review. Explicit selection supplies actual provider/location/purposes, preserves integrations/restrictions, and keeps minimized pinned reference metadata plus justification in a bounded private setup report. Resume checks the matching declared service facts. Optional browser recognition now preserves its complete rule/source snapshot. Optional documentation profiles now cover four products; independent provider-practice review and broader coverage remain open. Explicit wizard --project scanning now feeds the same actual-use confirmation as manual catalog search and writes separate private discovery findings. Noninteractive runs preserve prior pins and never select services from matches. Setup/catalog JSON and tracked source reads reject nonregular inputs without FIFO blocking. Browser/admin local-filesystem scanning remains unavailable. Explicit CLI/admin renewal compares selected reference/service/purpose facts, requires a new private reason and confirmation, rejects stale full-service snapshots and retains prior/next pins in bounded private report history. Operator labels and enforcement settings remain unchanged; focused CLI review does not reapply historical setup facts. Explicit post-compilation catalog finalization now binds current selected reference/site-use facts to a digest-only public descriptor and separate archive. Exact legal/source bytes are preserved; CF validates immutable storage and separately granted inspection/comparison. Justifications and questionnaire/re-review history stay outside the attachment.

**Limits/open review:** Catalog facts and imported categories do not decide a site’s legal basis, provider role, actual settings, necessity or complete disclosure. Entries remain unreviewed after an operator declares actual use. Purposes must be explicitly declared through setup authoring or imported config; setup does not invent their meaning or legal basis. Private report pins do not automatically become archived legal-release evidence.

**Code/test references:** [packages/notabenda/src/catalog.ts](../../packages/notabenda/src/catalog.ts), [packages/notabenda/src/catalog-seed.ts](../../packages/notabenda/src/catalog-seed.ts), [packages/notabenda/src/catalog-cli.ts](../../packages/notabenda/src/catalog-cli.ts), [scripts/build-service-catalog.py](../../scripts/build-service-catalog.py), [docs/SERVICE-CATALOG.md](../../docs/SERVICE-CATALOG.md), [packages/notabenda/src/service-inventory.ts](../../packages/notabenda/src/service-inventory.ts), [packages/notabenda/src/service-directory.ts](../../packages/notabenda/src/service-directory.ts), [packages/notabenda/src/services.css](../../packages/notabenda/src/services.css), [packages/notabenda/src/react-documents.ts](../../packages/notabenda/src/react-documents.ts), [packages/notabenda/src/astro/ServiceDirectory.astro](../../packages/notabenda/src/astro/ServiceDirectory.astro), [examples/services/build.mjs](../../examples/services/build.mjs), [docs/SERVICES.md](../../docs/SERVICES.md), [packages/notabenda/src/catalog-plain.ts](../../packages/notabenda/src/catalog-plain.ts), [packages/notabenda/src/catalog-selection.ts](../../packages/notabenda/src/catalog-selection.ts), [packages/notabenda/src/catalog-ui.ts](../../packages/notabenda/src/catalog-ui.ts), [packages/notabenda/src/setup.ts](../../packages/notabenda/src/setup.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [examples/setup/build.mjs](../../examples/setup/build.mjs), [packages/notabenda/src/setup-purpose.ts](../../packages/notabenda/src/setup-purpose.ts), [packages/notabenda/src/setup-purpose-ui.ts](../../packages/notabenda/src/setup-purpose-ui.ts), [packages/notabenda/src/setup-purpose-cli.ts](../../packages/notabenda/src/setup-purpose-cli.ts), [packages/notabenda/src/catalog-browser.ts](../../packages/notabenda/src/catalog-browser.ts), [packages/notabenda/src/catalog-browser-policy.ts](../../packages/notabenda/src/catalog-browser-policy.ts), [packages/notabenda/src/catalog-browser-capture.ts](../../packages/notabenda/src/catalog-browser-capture.ts), [packages/notabenda/src/catalog-browser-cli.ts](../../packages/notabenda/src/catalog-browser-cli.ts), [packages/notabenda/src/catalog-browser-ui.ts](../../packages/notabenda/src/catalog-browser-ui.ts), [packages/notabenda/src/discovery-capture.ts](../../packages/notabenda/src/discovery-capture.ts), [packages/notabenda/src/discovery-ui.ts](../../packages/notabenda/src/discovery-ui.ts), [catalog/browser-rules.json](../../catalog/browser-rules.json), [catalog/browser-providers.json](../../catalog/browser-providers.json), [packages/notabenda/src/setup-catalog-cli.ts](../../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda/src/cli-json.ts](../../packages/notabenda/src/cli-json.ts), [packages/notabenda/src/catalog-node.ts](../../packages/notabenda/src/catalog-node.ts), [packages/notabenda/src/catalog-review.ts](../../packages/notabenda/src/catalog-review.ts), [packages/notabenda/src/catalog-review-ui.ts](../../packages/notabenda/src/catalog-review-ui.ts), [packages/notabenda/src/catalog-review-cli.ts](../../packages/notabenda/src/catalog-review-cli.ts), [packages/notabenda/src/catalog-release.ts](../../packages/notabenda/src/catalog-release.ts), [packages/notabenda/src/catalog-release-policy.ts](../../packages/notabenda/src/catalog-release-policy.ts), [packages/notabenda/src/catalog-reference.ts](../../packages/notabenda/src/catalog-reference.ts), [packages/notabenda-cf/src/catalog-release-policy.ts](../../packages/notabenda-cf/src/catalog-release-policy.ts), [packages/notabenda-cf/src/catalog-reference.ts](../../packages/notabenda-cf/src/catalog-reference.ts), [packages/notabenda-cf/src/history.ts](../../packages/notabenda-cf/src/history.ts), [packages/notabenda-cf/src/catalog-render.ts](../../packages/notabenda-cf/src/catalog-render.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [examples/catalog-releases/build.mjs](../../examples/catalog-releases/build.mjs), [packages/notabenda/test/catalog.test.mjs](../../packages/notabenda/test/catalog.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/service-catalog.md](../../docs/verification/service-catalog.md), [packages/notabenda/test/services.test.mjs](../../packages/notabenda/test/services.test.mjs), [packages/notabenda/test/astro-package.test.mjs](../../packages/notabenda/test/astro-package.test.mjs), [site/test/services.test.mjs](../../site/test/services.test.mjs), [packages/notabenda/test/catalog-selection.test.mjs](../../packages/notabenda/test/catalog-selection.test.mjs), [site/test/catalog-setup.test.mjs](../../site/test/catalog-setup.test.mjs), [packages/notabenda/test/setup-purpose.test.mjs](../../packages/notabenda/test/setup-purpose.test.mjs), [packages/notabenda/test/catalog-browser.test.mjs](../../packages/notabenda/test/catalog-browser.test.mjs), [packages/notabenda/test/catalog-browser-workflow.test.mjs](../../packages/notabenda/test/catalog-browser-workflow.test.mjs), [packages/notabenda/test/setup-project.test.mjs](../../packages/notabenda/test/setup-project.test.mjs), [packages/notabenda/test/catalog-review.test.mjs](../../packages/notabenda/test/catalog-review.test.mjs), [docs/verification/catalog-review.md](../../docs/verification/catalog-review.md), [packages/notabenda/test/catalog-release.test.mjs](../../packages/notabenda/test/catalog-release.test.mjs), [docs/verification/catalog-release.md](../../docs/verification/catalog-release.md), [site/test/host.test.mjs](../../site/test/host.test.mjs), [packages/notabenda-cf/test/starter.test.mjs](../../packages/notabenda-cf/test/starter.test.mjs)

<a id="req-product-service-detection"></a>

### REQ-PRODUCT-SERVICE-DETECTION — Explainable passive third-party recognition

Recognize candidate products with bounded exact, pattern and combined passive signals, minimize retained observations and require review before configuration changes. Initial static project discovery covers declared SDK dependencies/imports and Terraform names without project execution or network probes.

**Applies when:** An authorized operator explicitly invokes catalog-backed service discovery.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Sources:** [Google Tag official technical reference](https://developers.google.com/tag-platform/gtagjs) — Google tag loader path and gtag bootstrap; one tag can have multiple product destinations (read; [SRC-BROWSER-GOOGLE-TAG](SOURCES.md#src-browser-google-tag)); [Google Gtm official technical reference](https://developers.google.com/tag-platform/tag-manager/protocol-relative-url?hl=en) — Tag Manager script/frame paths; only HTTPS is recognized by these rules (read; [SRC-BROWSER-GOOGLE-GTM](SOURCES.md#src-browser-google-gtm)); [Stripe Js official technical reference](https://docs.stripe.com/js) — Documented script delivery host; no payment feature or provider-practice classification (read; [SRC-BROWSER-STRIPE-JS](SOURCES.md#src-browser-stripe-js)); [Stripe Version official technical reference](https://docs.stripe.com/sdks/stripejs-versioning) — Versioned loader path and supported legacy v3 delivery. Rule is not a version recommendation (read; [SRC-BROWSER-STRIPE-VERSION](SOURCES.md#src-browser-stripe-version)); [Turnstile official technical reference](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) — Widget loader path, div class marker and turnstile API object. No challenge is executed (read; [SRC-BROWSER-TURNSTILE](SOURCES.md#src-browser-turnstile)); [Intercom official technical reference](https://developers.intercom.com/installing-intercom/web/installation) — Widget loader prefix and Intercom function; app/workspace suffix is never exported as a witness (read; [SRC-BROWSER-INTERCOM](SOURCES.md#src-browser-intercom)); [Posthog Cookie official technical reference](https://posthog.com/tutorials/nextjs-analytics) — Official tutorial excerpt describes a project-token-derived cookie name; only the name pattern is matched, never its value (read; [SRC-BROWSER-POSTHOG-COOKIE](SOURCES.md#src-browser-posthog-cookie)); [Posthog Loader official technical reference](https://posthog.com/tutorials/framer-analytics) — Official tutorial excerpt describes asset-host rewriting and the array.js path. Custom hosts and proxies may not match (read; [SRC-BROWSER-POSTHOG-LOADER](SOURCES.md#src-browser-posthog-loader)); [Posthog Regions official technical reference](https://posthog.com/docs/advanced/proxy/nextjs-middleware) — Official proxy guide names US and EU asset hosts (read; [SRC-BROWSER-POSTHOG-REGIONS](SOURCES.md#src-browser-posthog-regions)).

**Features:** [FEAT-SERVICE-CATALOG](../FEATURES.md#feat-service-catalog), [FEAT-DISCOVERY](../FEATURES.md#feat-discovery), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-service-detection"></a>

**VERIFY-PRODUCT-SERVICE-DETECTION (partial):** Positive/negative and shared-host fixtures, bounded hostile patterns, no probe requests or SDK/getter execution, minimized witnesses with explicit legacy-name sensitivity, exact snapshot compatibility, unavailable/limited coverage and review-before-apply.

**Implementation boundary:** Bounded offline Node scanner and npx CLI, Git ignore-aware selection with fsmonitor disabled, built-in non-Git skips, source/development evidence labels and private exclusive review outputs are implemented. Optional browser path/name/global/marker and combined rules now add minimized channel witnesses, exact rule/source snapshots, local review UI and explicit CLI analysis. Arbitrary regex/executable rules are unsupported. Broader project detectors and automated release-provenance archival remain planned. Explicit wizard --project scanning now feeds the same actual-use confirmation as manual catalog search and writes separate private discovery findings. Noninteractive runs preserve prior pins and never select services from matches. Setup/catalog JSON and tracked source reads reject nonregular inputs without FIFO blocking. Browser/admin local-filesystem scanning remains unavailable. Browser setup links to offline project discovery and displays the npx command for dependency/infrastructure coverage, with manual review and private-report handling. The UI does not execute commands or inspect the local project.

**Limits/open review:** A matched signature is a candidate, not execution, ownership, permission, legal classification or absence-of-tracking proof. Existing version-1 captures remain origin/name-only. Advanced code never arrives as executable catalog data. New recognition witnesses exclude observed paths/query/storage/global values; the embedded v1 origins, storage names and labels may still include identifiers. Combined signals need not be simultaneous or causal. Snapshots are unverified reports, not authenticated evidence.

**Code/test references:** [packages/notabenda/src/catalog-project.ts](../../packages/notabenda/src/catalog-project.ts), [packages/notabenda/src/catalog-cli.ts](../../packages/notabenda/src/catalog-cli.ts), [packages/notabenda/src/discovery-cli.ts](../../packages/notabenda/src/discovery-cli.ts), [packages/notabenda/src/catalog-browser.ts](../../packages/notabenda/src/catalog-browser.ts), [packages/notabenda/src/catalog-browser-policy.ts](../../packages/notabenda/src/catalog-browser-policy.ts), [packages/notabenda/src/catalog-browser-capture.ts](../../packages/notabenda/src/catalog-browser-capture.ts), [packages/notabenda/src/catalog-browser-cli.ts](../../packages/notabenda/src/catalog-browser-cli.ts), [packages/notabenda/src/catalog-browser-ui.ts](../../packages/notabenda/src/catalog-browser-ui.ts), [packages/notabenda/src/discovery-capture.ts](../../packages/notabenda/src/discovery-capture.ts), [packages/notabenda/src/discovery-ui.ts](../../packages/notabenda/src/discovery-ui.ts), [catalog/browser-rules.json](../../catalog/browser-rules.json), [catalog/browser-providers.json](../../catalog/browser-providers.json), [packages/notabenda/src/setup-catalog-cli.ts](../../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda/src/cli-json.ts](../../packages/notabenda/src/cli-json.ts), [packages/notabenda/src/catalog-node.ts](../../packages/notabenda/src/catalog-node.ts), [packages/notabenda/src/setup-cli.ts](../../packages/notabenda/src/setup-cli.ts), [packages/notabenda/src/setup-ui.ts](../../packages/notabenda/src/setup-ui.ts), [packages/notabenda/test/catalog.test.mjs](../../packages/notabenda/test/catalog.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/service-catalog.md](../../docs/verification/service-catalog.md), [packages/notabenda/test/catalog-browser.test.mjs](../../packages/notabenda/test/catalog-browser.test.mjs), [packages/notabenda/test/catalog-browser-workflow.test.mjs](../../packages/notabenda/test/catalog-browser-workflow.test.mjs), [packages/notabenda/test/setup-project.test.mjs](../../packages/notabenda/test/setup-project.test.mjs), [packages/notabenda/test/setup.test.mjs](../../packages/notabenda/test/setup.test.mjs)

<a id="req-product-service-profiles"></a>

### REQ-PRODUCT-SERVICE-PROFILES — Sourced product documentation in service review

Keep bounded, optional product notes, document links and site-specific review questions tied to public sources, selected revisions and retained review history.

**Applies when:** A catalog product supplies a documentation profile during explicit service review or retained-reference inspection.

**Type:** product-standard. **Research:** product-decision. **Legal review:** not-applicable. **Implementation:** partial.

**Sources:** [Workers placement](https://developers.cloudflare.com/workers/configuration/placement/) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-CLOUDFLARE-PLACEMENT](SOURCES.md#src-profile-cloudflare-placement)); [Regional Services for Workers](https://developers.cloudflare.com/data-localization/how-to/workers/) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-CLOUDFLARE-REGIONAL](SOURCES.md#src-profile-cloudflare-regional)); [Cloudflare privacy policy](https://www.cloudflare.com/privacypolicy/) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-CLOUDFLARE-PRIVACY](SOURCES.md#src-profile-cloudflare-privacy)); [Cloudflare customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-CLOUDFLARE-DPA](SOURCES.md#src-profile-cloudflare-dpa)); [Stripe privacy center](https://stripe.com/legal/privacy-center) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-STRIPE-ROLES](SOURCES.md#src-profile-stripe-roles)); [Stripe privacy policy](https://stripe.com/privacy) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-STRIPE-PRIVACY](SOURCES.md#src-profile-stripe-privacy)); [Stripe DPA](https://stripe.com/legal/dpa) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-STRIPE-DPA](SOURCES.md#src-profile-stripe-dpa)); [Supabase project regions](https://supabase.com/docs/guides/platform/regions) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-REGIONS](SOURCES.md#src-profile-supabase-regions)); [Supabase residency and transfers FAQ](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-RESIDENCY](SOURCES.md#src-profile-supabase-residency)); [Supabase self-hosting](https://supabase.com/docs/guides/self-hosting) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-SELF-HOSTING](SOURCES.md#src-profile-supabase-self-hosting)); [Supabase privacy policy](https://supabase.com/privacy) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-PRIVACY](SOURCES.md#src-profile-supabase-privacy)); [Supabase DPA](https://supabase.com/legal/customer-resources/data-processing-addendum) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-SUPABASE-DPA](SOURCES.md#src-profile-supabase-dpa)); [Resend GDPR and storage FAQ](https://resend.com/security/gdpr) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-RESEND-STORAGE](SOURCES.md#src-profile-resend-storage)); [Resend domain settings](https://resend.com/docs/dashboard/domains/introduction) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-RESEND-DOMAINS](SOURCES.md#src-profile-resend-domains)); [Resend privacy policy](https://resend.com/legal/privacy-policy) — Public documentation, privacy or contractual reference; original conditional notes, not a verified provider classification. (read; [SRC-PROFILE-RESEND-PRIVACY](SOURCES.md#src-profile-resend-privacy)).

**Discovery articles:** [SRC-PROFILE-RESEND-DPA](SOURCES.md#src-profile-resend-dpa).

**Features:** [FEAT-SERVICE-CATALOG](../FEATURES.md#feat-service-catalog), [FEAT-SETUP](../FEATURES.md#feat-setup).

<a id="verify-product-service-profiles"></a>

**VERIFY-PRODUCT-SERVICE-PROFILES (partial):** Reject malformed/source-unbound profiles; distinguish unread URLs; render escaped linked notes without network or automatic settings; preserve manual URLs, old pins and exact legal bytes while profile-only changes alter retained reference digests.

**Implementation boundary:** Version-1 optional closed-schema profiles, static escaped renderer and terminal inspection; explicit picker copying preserves entered URLs and clears confirmation on edits. Selected source/profile revisions survive private setup pins, renewed comparison and separately authorized retained-release views. No external fetch, automatic setting, consent grant or public policy prose insertion.

**Limits/open review:** Documentation can change and describes provider claims or options. Source retrieval is not independent practice verification, a signed agreement or legal approval. Requirement links are conditional review context. Initial profiles cover four products; other entries may have no profile. Actual entity, location, purpose, basis, retention and settings remain operator-supplied.

**Code/test references:** [catalog/product-profiles.json](../../catalog/product-profiles.json), [catalog/schema.json](../../catalog/schema.json), [scripts/build-service-catalog.py](../../scripts/build-service-catalog.py), [packages/notabenda/src/catalog-reference.ts](../../packages/notabenda/src/catalog-reference.ts), [packages/notabenda-cf/src/catalog-reference.ts](../../packages/notabenda-cf/src/catalog-reference.ts), [packages/notabenda/src/catalog-profile.ts](../../packages/notabenda/src/catalog-profile.ts), [packages/notabenda-cf/src/catalog-profile.ts](../../packages/notabenda-cf/src/catalog-profile.ts), [packages/notabenda/src/catalog-ui.ts](../../packages/notabenda/src/catalog-ui.ts), [packages/notabenda/src/catalog-review-ui.ts](../../packages/notabenda/src/catalog-review-ui.ts), [packages/notabenda/src/catalog-cli.ts](../../packages/notabenda/src/catalog-cli.ts), [packages/notabenda/src/setup-catalog-cli.ts](../../packages/notabenda/src/setup-catalog-cli.ts), [packages/notabenda-cf/src/catalog-render.ts](../../packages/notabenda-cf/src/catalog-render.ts), [packages/notabenda/test/catalog-profile.test.mjs](../../packages/notabenda/test/catalog-profile.test.mjs), [packages/notabenda/test/package.test.mjs](../../packages/notabenda/test/package.test.mjs), [docs/verification/catalog-profiles.md](../../docs/verification/catalog-profiles.md)

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

**Implementation boundary:** 64 KiB sealed chunks, bounded review/files, CAS activation, intent-level consumption, fresh post-decision clock, local mutation plans, scoped private archives, safe admin rendering/downloads and resumable retirement. Existing demo receipts retain their compatibility path.

**Limits/open review:** Host authorization, commercial correctness and external operations remain host-owned. No payment, fulfillment, contract formation or durable-medium confirmation is performed. Hashes do not provide WORM storage or prove customer presentation. Production/regional legal acceptance remains separate.

**Code/test references:** [packages/notabenda-cf/src/orders.ts](../../packages/notabenda-cf/src/orders.ts), [packages/notabenda-cf/src/order-context.ts](../../packages/notabenda-cf/src/order-context.ts), [packages/notabenda-cf/src/order-blobs.ts](../../packages/notabenda-cf/src/order-blobs.ts), [packages/notabenda-cf/src/order-render.ts](../../packages/notabenda-cf/src/order-render.ts), [packages/notabenda-cf/src/order-admin-style.ts](../../packages/notabenda-cf/src/order-admin-style.ts), [packages/notabenda-cf/src/lifecycle.ts](../../packages/notabenda-cf/src/lifecycle.ts), [packages/notabenda-cf/src/worker.ts](../../packages/notabenda-cf/src/worker.ts), [packages/notabenda-cf/src/types.ts](../../packages/notabenda-cf/src/types.ts), [packages/notabenda-cf/scripts/sync-order-policy.mjs](../../packages/notabenda-cf/scripts/sync-order-policy.mjs), [site/order-demo.mjs](../../site/order-demo.mjs), [site/order-demo-admin.mjs](../../site/order-demo-admin.mjs), [packages/notabenda-cf/test/orders.test.mjs](../../packages/notabenda-cf/test/orders.test.mjs), [packages/notabenda-cf/test/orders-package.test.mjs](../../packages/notabenda-cf/test/orders-package.test.mjs), [scripts/check-order-archive-runtime.mjs](../../scripts/check-order-archive-runtime.mjs), [site/test/order-demo.test.mjs](../../site/test/order-demo.test.mjs), [site/test/demo.test.mjs](../../site/test/demo.test.mjs), [docs/verification/paid-orders.md](../../docs/verification/paid-orders.md)

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

**not-researched:** Individually research remaining state laws, thresholds/exemptions, effective amendments, sensitive/health/child rules and universal signals; no blanket state-law support claim.

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
