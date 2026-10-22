<!-- @requirements REQ-SG-COOKIE-DATA REQ-SG-BROWSER-CHOICE REQ-SG-COOKIE-TARGETING -->
<!-- @requirements REQ-SG-CONSENT-CONDITIONS REQ-SG-CONSENT-ROUTES REQ-SG-WITHDRAWAL REQ-SG-ACCOUNTABILITY -->
# Review cookie use in Singapore

Start with what a cookie does and the data associated with it. The PDPC's online-activities guidance distinguishes cookies involving personal data from those that do not. It also discusses clearly requested activities, deliberate browser choices and advertising. A cookie's name or category cannot settle those questions.

This review belongs to the existing **Cookie choices** pack. Selecting Singapore adds checks to setup; it does not install another pack or change your configuration.

## Review the use

| Check | What to establish |
| --- | --- |
| Data and linkage | Include identifiers, account associations and other information available to the collector. “Session” and “first-party” are not findings that data is non-personal. |
| Requested activity | Assess the particular activity, what the person was told and what they voluntarily supplied. Setup does not determine deemed consent or other exceptions. |
| Browser choices | Unchanged browser settings are not a grant. Notabenda does not read browser exceptions or turn `navigator.cookieEnabled` into permission. |
| Advertising and collectors | Assess personal-data advertising cookies and identify the collecting organisation, including third parties. The guidance recommends usable preferences within the site. |

These checks come from chapter 7, paragraphs 7.1–7.14, printed pages 53–55 of the [PDPC guideline revised 23 May 2024](https://www.pdpc.gov.sg/assets/d1fbaa47-1471-4208-bfad-9f4bf33453ad). Its [current landing page](https://www.pdpc.gov.sg/organisations/regulations-decisions/regulatory-guidance/advisory-guidelines-on-the-personal-data-protection-act-for-selected-topics) links that revision. The access date is 21 October 2026; the revision date is not a statutory commencement date.

## Use the review in setup

Choose **Singapore** in the coverage questions, or keep an explicitly assessed `SG` jurisdiction in an imported inventory. Setup shows the same advice in the browser, CLI and private report. Existing answers, service scopes and storage classifications are preserved.

Agents can read the source references, checks and limits under `cookieJurisdictionReviews`:

```sh
notabenda describe cookie-consent --json
```

This is review information. Keep reasons in the private setup report; they do not qualify an exception or become public policy text.

## Choose and review the consent route

The [current PDPA](https://sso.agc.gov.sg/Act/PDPA2012) separates several routes. A cookie category does not choose one for you.

| Route | What needs review | What the toolkit supplies |
| --- | --- | --- |
| Consent | The actual purposes and information given before collection or a new use/disclosure, reasonable conditions and misleading practices. See sections 13, 14, 18 and 20. | Purpose disclosures and explicit site choices. A click or receipt does not establish legal validity. |
| Deemed consent | Section 15's conduct/contract conditions differ from section 15A's notification route. The latter requires a prior adverse-effect assessment and safeguards, notification, a reasonable opt-out opportunity and prescribed conditions. Review its no-likely-adverse-effect condition. | Source-linked review only. No grant from silence, a timer or publication of a notice. |
| Without consent | Section 13(b) addresses required or authorised routes under the Act or other written law; section 17 refers to particular First/Second Schedule circumstances and conditions. | Source-linked review only. Those schedules and prescribed requirements are not assessed by this guide. |

The machine-readable `consentRoutes` under `cookieJurisdictionReviews.items` gives agents the same distinctions. It is guidance, not a configuration field or another runtime mode. An operator's conclusion about a legal route does not automatically enable a service or rewrite a legal basis.

The statutory view was retrieved on **22 October 2026 UTC**, displaying “current version as at 22 Oct 2026.” Sections 11–20 were read, including section 15A. This is a source snapshot date, not the commencement date of every provision. The May 2024 cookie guideline remains a separate source.

## Provide information and support withdrawal

Use actual purpose descriptions and reviewed notice wording. For a host form, the [collection notice](COLLECTION.md) can present declared facts beside the fields and link to a retained privacy version. The host decides placement and timing; rendering a notice does not send it to a person or obtain consent.

Section 16 addresses withdrawal and its likely consequences. Keep the controls accessible, explain those consequences for the actual service and connect every relevant loader and cleanup operation. Also review future use/disclosure by application backends, data intermediaries and agents. A stopped browser script does not establish that those systems stopped processing. Review the section's statutory qualifications separately.

Sections 11 and 12 also require operator work: a responsible person, public business contact, policies, staff communication and a complaints process. Supply the actual contact in public configuration, for example `controller.dpo`, and an actual complaints description/destination in `privacy.complaints`. These fields render disclosures; they do not appoint a person or operate a complaint-handling process.

## Connect and test the actual service

For a consent-managed service, declare its purposes and material scopes, then register its loader before any parallel script, pixel or resource hint can run. Use [cookie controls](CONSENT.md) to collect the site choice. [Declare cleanup targets](STORAGE-CLEANUP.md) separately.

Test a fresh visit, rejection, an explicit choice, withdrawal and reload. Verify actual requests and storage, beyond the displayed preference. The [Cookie choices example](https://notabenda.org/choices/) demonstrates the local control flow; it is not a Singapore compliance certification.

The selected cookie chapter and statutory provisions are researched. Full applicability, First/Second Schedule conditions, prescribed regulations, chapter 12 guidance, remaining obligations and legal review remain open. Source and implementation status are tracked under [the Singapore requirements](requirements/README.md#req-sg-cookie-data).
