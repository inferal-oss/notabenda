<!-- @requirements REQ-SG-COOKIE-DATA REQ-SG-BROWSER-CHOICE REQ-SG-COOKIE-TARGETING -->
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

## Connect and test the actual service

For a consent-managed service, declare its purposes and material scopes, then register its loader before any parallel script, pixel or resource hint can run. Use [cookie controls](CONSENT.md) to collect the site choice. [Declare cleanup targets](STORAGE-CLEANUP.md) separately.

Test a fresh visit, rejection, an explicit choice, withdrawal and reload. Verify actual requests and storage, beyond the displayed preference. The [Cookie choices example](https://notabenda.org/choices/) demonstrates the local control flow; it is not a Singapore compliance certification.

The selected chapter is researched, but the wider Singapore assessment remains open: current statutory applicability, consent exceptions, other obligations and legal review are separate. Source and implementation status are tracked under [the Singapore requirements](requirements/README.md#req-sg-cookie-data).
