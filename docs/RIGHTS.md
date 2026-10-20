# Privacy request entry points

A rights page links visitors to the operator's request workflows. Configure the actions, explanations and destinations for access, correction, erasure, portability, restriction, objection, consent withdrawal or appeals as applicable. Selecting a jurisdiction or publishing policy text does not configure these routes.

The first implementation is navigation and public information. It does not collect request contents, verify identity, submit or acknowledge a request, produce a personal-data export, delete application data or process an appeal. The [feature remains partial](FEATURES.md#feat-rights); those application workflows remain separate.

Non-English native pages require a complete `localization.rights` dictionary in the matching site locale. Keep the actual locale intact; a collection-notice dictionary does not translate this supporting page. See [request-page localization](LOCALIZATION.md#privacy-request-pages).

Use the [request-page setup editor or explicit CLI proposal](RIGHTS-AUTHORING.md) to author a local draft, or supply the declaration directly below.

## Configure the entry page

```ts
rightsCenter: {
  schemaVersion: 1,
  revision: 'rights-1',
  route: '/privacy-requests',
  title: 'Your information. Your next step.',
  intro: 'Choose a route below, or contact our privacy team.',
  reviewStatus: 'draft',
  contact: {
    label: 'Email the privacy team',
    description: 'Contact us if the account workflow does not fit your request.',
    href: 'mailto:privacy@example.test',
  },
  actions: [{
    id: 'access',
    kind: 'access',
    title: 'A copy of your information',
    description: 'Find the next step for a request about your personal information.',
    scope: 'For information relating to you. We handle appropriate identity checks.',
    link: {label: 'Continue to the request workflow', href: '/account/privacy/access'},
  }],
  nextSteps: [
    'The linked application explains how to make your request.',
    'You can use the public contact if that workflow is not suitable.',
  ],
}
```

All fields are public. Keep private assessments in private metadata or the setup report. Never embed names, account identifiers, request contents, credentials or bearer tokens in destinations. Destinations must be stable navigation routes, HTTPS URLs, plain mailto addresses or an international phone URI such as `tel:+12025550123`. Mailto query parameters are rejected. The required public contact supports email or an international phone URI, so a host account workflow cannot be the only configured contact route. This fallback does not establish that all applicable submission-method rules are met.

Kinds classify the configured action; they do not decide entitlement or authenticate a request. The operator supplies the scope explanation, next-step text and destinations. Review them together with the actual application workflow. Production output requires `reviewStatus: 'reviewed'`; this is the operator's content declaration, not legal review supplied by the package. Placeholders, duplicate IDs, unsafe links, conflicting routes, hidden success flags and unknown schema fields fail validation.

The [setup wizard](SETUP.md) recommends this optional field when reviewing personal-data practices. Practice answers alone never create actions or destinations. Its explicit request-page editor and `wizard --rights FILE` accept complete operator-supplied settings and an explicit privacy-link decision. Imported declarations keep their actions and links while returning `reviewStatus` to draft, so the resulting configuration needs an explicit content review before production.

When `privacy.rightsUrl` is omitted, public config links it to `rightsCenter.route`. If supplied, it must agree with that route. Generated privacy notices and legal-link footers then point to the same entry page. Ordinary supplied legal content remains supplied; the compiler does not rewrite it to claim additional rights.

## Render and deploy

`compileLegalDocuments` emits the supporting rights page alongside privacy, cookie and terms output. The same page survives Markdown/MDX legal authoring. Include it with the rest of the compiler's files.

```ts
import {renderRightsCenter, renderRightsPage} from '@notabenda/core';

// Fragment inside an existing layout. Prefixes must be unique within the document.
const html = renderRightsCenter(config, {mode: 'preview', idPrefix: 'privacy-help', headingLevel: 2});
const page = renderRightsPage(config, {mode: 'preview', stylesheetUrl: '/assets/notabenda.css'});
```

React: `RightsCenter` from `@notabenda/core/react/documents`. Astro: `@notabenda/core/astro/RightsCenter.astro`. Both use the same validated static renderer and need no provider, hydration or browser controller. Styles are optional, inherit the host font and use the same semantic tokens as other package surfaces.

The declaration is included in the artifact's hashed public configuration. The supporting page is **outside** the three immutable legal-document kinds and their exact pinned HTML; it is a current navigation surface, not a new archived legal document. Host deployments own the availability and behavior of its linked application routes. Keep explanatory legal text in the appropriate versioned privacy document when it must be part of that retained record.

## Connect the application

An ordinary link is the initial application bridge. It can reach an existing account workflow, a public intake form or a direct contact method. The page performs no fetch, creates no receipt and changes no cookie preference, processing restriction or terms agreement. Opening a destination is not a submission or fulfillment signal. The operator's application handles appropriate identity and authority checks, receipt/response records, deadlines, decisions, exceptions, appeals and downstream work.

Do not use a backoffice evidence download as an individual's complete data-access response. Its authorized records are a selected evidence store, not all application data. Likewise, removing consent evidence is distinct from fulfilling an erasure request. Contract withdrawal/cancellation stays separate from privacy-consent withdrawal.

[Try the fictional rights center](http://127.0.0.1:4179/rights/) or [its midnight version](http://127.0.0.1:4179/dark/rights/) or [the Portuguese page](/localization/rights/). Each action opens an explanatory, script-free fictional destination; nothing is submitted and no personal information is collected.

## Connected research and remaining work

- The [EDPB rights guide](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en) describes accessible procedures and distinguishes identity doubts from routine information collection. The center supports discoverable entry points; it does not implement GDPR request handling or decide when a right applies.
- [California's Attorney General FAQ](https://www.oag.ca.gov/privacy/ccpa) explains designated methods, circumstances requiring multiple methods, existing-account routes and differences between access/deletion verification and sale/sharing opt-outs. An email fallback alone is not a universal methods implementation; sale/sharing controls stay separate.
- [Virginia §59.1-577(C)](https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-577/) requires an applicable appeal process to be conspicuous and comparable to the initial request route. The optional appeal card is an entry point, not that complete process.

The catalog connects these observations to code and tests while retaining partial implementation and unreviewed legal statuses. [Verification](verification/rights-center.md) records the actual engineering checks. Intake, identity, case management, response deadlines, fulfillment and appeals remain application work.
