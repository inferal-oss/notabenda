# Regulatory requirements and scope

Research baseline: **18 October 2026**. This document translates selected primary sources into proposed engineering requirements. It is not an exhaustive jurisdiction survey or a legal certification. Distinguish laws, regulator guidance, platform policies, and voluntary product defaults in implementation and documentation.

The expanded [requirements catalog](requirements/README.md) records individual obligations, applicability conditions, sources/locators, caveats, review status, features, actual code/test references, and verification scenarios. Its [source index](requirements/SOURCES.md) includes discovery articles and official sources across multiple jurisdictions, labeling search-only findings and blocked access. Documents/configuration, local consent state and service gating, and optional backoffice/history have implementation tests; broader legal obligations remain partial/planned, with no supported jurisdiction-pack claim.

The [France, Germany and Ireland baseline report](verification/regional-consent.md) records the 19 October source check, exercised shared-engine behavior and remaining qualification gaps. [Irish grant duration](REGIONAL-PROMPTS.md#cap-remembered-grants-at-six-calendar-months) has an explicit calendar-month cap and setup recommendation; extension assessment and a complete regional profile remain open.

## Separate the obligations

Privacy notices explain processing. Cookie/device-access rules govern access to a visitor's device. A legal basis governs subsequent personal-data processing. Terms describe a contractual relationship. Marketing permissions are purpose-specific. Acknowledging a notice is not consent to every use described in it; accepting terms is not cookie consent.

For the EU, device storage/access falls under national implementations of ePrivacy rules, while subsequent personal-data processing can also engage GDPR. These cannot be collapsed into one generic “GDPR cookie” switch. The EDPB specifically distinguishes these layers. [EDPB cookie banner taskforce report](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf)

## Initial runtime priorities

Research already extends beyond these initial runtime priorities. The catalog includes selected additional national and regional obligations; research presence does not mean a complete or production-supported jurisdiction pack.

| Area | Relevant obligation or distinction | Proposed product behavior |
| --- | --- | --- |
| EU/EEA | Prior permission for device access where required; valid, informed, specific choices; local exceptions differ | Conservative opt-in profile; no optional services initially; explain purposes and vendors; document national scope |
| UK | PECR and UK GDPR overlap, with updated conditional storage/access exceptions | Same conservative default; reviewed UK exception options separately |
| California | Covered businesses must support applicable notices, rights, and sale/sharing opt-outs, including preference signals | Privacy choices, GPC handling, relevant processing controls and deployment checklist; no universal “CCPA certified” claim |
| Other US states | Applicability, targeted-advertising rules, and recognized universal signals vary | Extensible rules, but no blanket US-law coverage claim |
| Privacy notices | Accurate disclosure depends on real processing facts | Build-time completeness checks; controller, purposes, recipients, retention, rights, transfer information |
| Terms | Fairness and required contractual disclosures depend on jurisdiction and service | Explicit profile and reviewed document packs; reject missing facts and incompatible clause combinations |
| Accessibility | Controls must remain usable across input methods and assistive technologies | WCAG 2.2 AA engineering target with manual verification |

### EU consent and transparency

Where GDPR processing relies on consent, Article 7 requires the controller to demonstrate it and to allow withdrawal as easily as giving it. Articles 12–14 address transparency; other duties include minimization, security, rights handling, and applicable transfer safeguards. Software should preserve the relevant notice versions and choices, but cannot establish that a stated purpose or transfer arrangement is lawful. [GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)

The default interface should offer accept, reject, and customization on the first layer, leave optional choices unticked, and make withdrawal persistently accessible. Treat this as a conservative product standard: regulator positions and national rules are more nuanced than a universal mandated button design. Never interpret scrolling, silence, closing a dialog, or continued browsing as an opt-in. [EDPB cookie banner taskforce report](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf)

CNIL emphasizes prior consent, specific purposes, and the need to collect consent for newly added purposes. Its guidance also recognizes limited exemptions, including some audience measurement configurations. A vendor's name or “cookieless” setting alone is insufficient to classify it as exempt. Terms acceptance cannot substitute for tracker consent. [CNIL tracker requirements](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi)

### UK changes need a separate profile

ICO finalized updated guidance on 29 April 2026 following changes to PECR. There are five storage/access exceptions, with conditions; statistical and appearance exceptions include information and an easy, free objection mechanism. This does not authorize all analytics, and advertising purposes remain subject to consent. [ICO guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/), [exception conditions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)

Implementation consequence: an exception is a reviewed rule with prerequisites and objection behavior, not a boolean that silently labels a vendor “necessary.” Exceptions remain off unless the host explicitly configures them. The [storage-exception module](STORAGE-EXCEPTIONS.md) provides separate objection mechanics for selected declared UK profiles; qualification, actual processing and regional routing remain host assessments. Enabling one does not establish an exemption for other audiences.

### California and opt-out signals

California's framework includes sale/sharing opt-outs, user-enabled preference signals, and restrictions on misleading interfaces. Applicability matters; the law does not impose an identical cookie opt-in banner on every site. Regulatory updates took effect on 1 January 2026, and further rulemaking must be tracked independently. [CPPA FAQ](https://www.cppa.ca.gov/faq.html), [law and regulation status](https://www.cppa.ca.gov/regulations/index.html), [dark-pattern advisory](https://www.cppa.ca.gov/announcements/2024/20240904.html)

Recognize browser GPC and the `Sec-GPC` request signal where available, then apply the relevant sale/sharing and targeted-advertising restrictions. Do not treat GPC as proof that a visitor consented to anything else, or as an instruction to erase an account. Surface the honored signal in settings. A generic “accept all” must not silently reverse an applicable signal. Supporting additional states requires a source-backed applicability and precedence table.

Browser controls must connect to the site's actual processing. If a backend sells/shares information or exports audiences, a browser toggle alone does not stop it. Provide server-readable decisions and authenticated integration hooks, with fixtures demonstrating that restricted downstream processing stops.

## Advertising compatibility is separate

Google documents Basic Consent Mode as blocking tags until consent; advanced mode loads tags and can transmit cookieless pings while consent is denied. The first adapter should use Basic mode, map all relevant signals explicitly (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`), and initialize defaults before any tag runs. Do not market “denied” advanced mode as “no requests.” [Google Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)

Google's publisher requirements for personalized ads in the EEA, UK, and Switzerland call for a Google-certified CMP integrated with IAB TCF. Implementing Consent Mode does not satisfy that certification requirement; Google also says certification does not check full legal compliance. [Google publisher requirements](https://support.google.com/adsense/answer/13554116?hl=en)

TCF 2.3 is the current researched baseline; the published transition date was 28 February 2026. If advertising CMP work is pursued, recheck the then-current specification, registration, policies, certification, and maintenance obligations. Do not emit invented CMP identifiers or claim certification through an integration library. [IAB Europe TCF](https://iabeurope.eu/transparency-consent-framework/)

## Evidence without unnecessary surveillance

Proposed record categories must remain distinct:

| Record | What it establishes | What it does not establish |
| --- | --- | --- |
| Local preference | What this browser should permit now | A durable controller-held consent history |
| Anonymous browser receipt | A submitted choice, artifact reference, and server receipt time | Verified identity or proof that a human saw and understood the interface |
| Authenticated form event | A trusted application's record linked to a subject and exact form/notice version | Automatic validity of the form's wording or every processing purpose |
| Terms acceptance | A recorded action against an exact terms version | Cookie consent, marketing permission, or guaranteed enforceability |
| Archived artifact | The released text, config, and translations referenced by an event | Proof that unmodified content was actually rendered in a particular browser |

The system should record the event type, purpose-level decisions, scoped subject reference where needed, applicable rules, content versions/digests, language, collection surface, client-reported action time, and trusted server receipt time. Preserve the exact released artifact, including choice wording. Avoid full form submissions, raw email addresses, URLs containing query strings, IP addresses, and full user agents by default.

A receipt signature can establish who issued the receipt and detect later modification. It cannot prove a genuine human interaction. Public browser endpoints can be forged; CORS and origin checks do not authenticate the submitter. Give authenticated application events a distinct provenance level.

Preference lifetime, evidence retention, and actual processing-data retention are separate settings. Require an operator retention policy and an explanation for overrides; do not hard-code a universal legal duration or keep evidence forever. Removal must cover derived records, exported copies under operator control, and backup expiry. An append-only application history still needs authorized deletion paths.

## Documents and contractual content

The inventory should capture controller/contact details, collection contexts, data categories, purposes and legal bases, services/recipients, retention, transfers, rights/contact routes, and conditional disclosures. Only collect representative/DPO details and other fields when applicable. Build checks can detect absent or inconsistent facts; they cannot verify that the facts match operations.

Terms need separate profiles for service type and audience: for example, informational site versus subscription service, and business versus consumer customers. Liability, termination, payments, renewal, refunds, mandatory rights, and jurisdiction clauses need appropriate review. EU unfair-contract rules are one reason a universal terms template is unsafe. [European Commission: unfair contract terms](https://commission.europa.eu/law/law-topic/consumer-protection-law/consumer-contract-law/unfair-contract-terms-directive_en)

Some contract requirements need operational widgets. The catalog links the EU online withdrawal function and Germany's distinct cancellation/withdrawal functions to `FEAT-CONTRACT-ACTIONS`, with separate verification scenarios and application handoff. Brazil's qualifying distance-contract right uses a different legal trigger/window. These are not privacy-consent actions, and rendering a terms clause alone does not implement them. See [contract requirements](requirements/README.md#req-eu-withdrawal) for primary sources, conditions, and timing.

Accept existing reviewed content as a first-class input. For generated content, write original clauses or incorporate clearly licensed material; retain authorship and licensing provenance. Do not copy proprietary vendor clause libraries. Ship draft templates as drafts until reviewed for a declared scope. Localized UI strings and legally reviewed document translations have separate review statuses.

## Maintenance and release evidence

Each regional or content pack should declare its scope, sources, effective date, last review date, reviewer role, version, known exclusions, and linked behavior tests. Show stale-review warnings and unsupported combinations in tooling. A meaningful scope change should identify affected consents; typography fixes should not trigger a blanket new consent request.

Maintain this chain in the repository: source and locator → `REQ-*` item → `FEAT-*` deliverables → `VERIFY-*` scenario → actual implementation/test references. The [research workflow](../regulatory/README.md) explains adding and reviewing items; `python3 scripts/regulatory.py --check` verifies local links and generated indexes. The catalog is design evidence, not a machine-executable legal decision engine. A later rule pack should explicitly project reviewed requirements into runtime behavior.

Before calling a profile supported, retain a review checklist, automated test results, and a manual deployment inspection. Revisit sources at release and periodically thereafter. Operational duties such as responding to rights requests, vendor agreements, impact assessments, processing registers, breaches, and international transfers extend beyond the initial toolkit.

Accessibility is also ongoing: use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) as the design/testing reference, with keyboard, screen-reader, zoom, contrast, and mobile checks. Passing an automated scan is not proof of conformance, and an overlay is not a substitute for an accessible implementation.
