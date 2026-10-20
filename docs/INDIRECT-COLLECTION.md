# Information collected from another source

Use a separate notice when someone’s information comes from a partner, referring organisation or another source. The optional `@notabenda/core/collection/indirect` entry renders static HTML or a plain-text body from reviewed public facts and an exact privacy release. Try the [light example](/indirect-collection) or [midnight example](/dark/indirect-collection).

The first profile addresses New Zealand IPP3A notification particulars: collection, purpose, recipients, collecting/holding agency, any particular statutory authority, and access/correction rights. The rule took effect on 1 May 2026. Timing is as soon as reasonably practicable, unless notified sooner; the component sets no universal deadline. [OPC principle text, IPP3A(1)–(2)](https://www.privacy.org.nz/privacy-principles/3a/), [OPC guidance](https://www.privacy.org.nz/resources-and-learning/a-z-topics/ipp3a/).

Applicability, lawful collection, prior awareness, exceptions, delivery and actual awareness require host assessment. Merely placing this fragment on a website does not establish notification. This profile is an implementation preview with unreviewed legal coverage, not a production-supported jurisdiction pack.

## Build from your inventory

Declare the purpose’s collection source as `indirect` or `both` in site configuration. Then select the categories actually involved in this indirect collection. Each selection must be a nonempty, exact subset of the purpose’s categories; the component never assumes a mixed purpose collects everything indirectly.

```js
import {
  compileLegalDocuments,
  createIndirectCollectionNotice,
  verifyIndirectCollectionNotice,
} from '@notabenda/core/content';
import {
  renderIndirectCollectionNotice,
  formatIndirectCollectionNotice,
} from '@notabenda/core/collection/indirect';

const release = compileLegalDocuments(config);
const notice = createIndirectCollectionNotice(release.artifact, {
  profile: 'nz-ipp3a', // explicit choice after applicability review
  scopeId: 'partner-referrals',
  phase: 'collected', // or 'advance', before collection
  reviewStatus: 'reviewed', // review the wording and actual context separately
  wording: {
    title: 'About your referral',
    intro: 'The studio you contacted has referred your enquiry to us.',
  },
  collections: [{
    purposeId: 'enquiries',
    dataCategories: ['Reply address', 'Enquiry topic'],
    sourceDescription: 'The partner studio you contacted about writing work.',
    authority: {kind: 'not-relied-on'},
  }],
  recipientStatement: 'Our enquiries team and contracted inbox provider handle the referral.',
  accessCorrection: {
    statement: 'You can ask for access to your personal information or ask us to correct it.',
    url: 'mailto:privacy@example.test',
  },
});

const html = renderIndirectCollectionNotice(notice, {
  idPrefix: 'partner-referral', // unique on the page
  headingLevel: 2,
});
const body = formatIndirectCollectionNotice(notice);
verifyIndirectCollectionNotice(notice, release.artifact);
// Host chooses how to present or deliver html/body, and keeps any necessary records.
```

Supply one to eight unique purposes. Explicit recipient wording is required even if the service inventory is empty. Do not infer that no services means no recipients. Supply a usable access/correction route and statement; a generic policy link is not a substitute for that route.

`authority` requires an explicit decision for every selected purpose. `not-relied-on` means the notice does not assert a particular law authorises or requires this collection. It does not establish that collection is lawful or optional. For a particular law, supply `{kind:'specified', laws:[{title, provision, relationship:'authorises'|'requires', url?}]}` using reviewed law names and provisions. A purpose’s general `legalBasis` never supplies this decision automatically.

The collecting and holding agency is the release’s public controller name, address and email. The first profile uses that same agency for both roles. A source organisation or storage provider is not substituted for the indirect collector. Separate agencies need their own correctly scoped releases/notices. [OPC guidance: collecting and holding agency; third-party providers](https://www.privacy.org.nz/resources-and-learning/a-z-topics/ipp3a/).

## Presentation and identity

Both renderers expose the core particulars directly. `advance` renders future collection wording; `collected` renders past collection wording. Review your custom intro to match. Neither phase asserts that notification has been delivered. Direct-form mandatory/consequence wording is retained in the bound purpose facts but is not rendered as an indirect disclosure.

HTML is a web fragment with semantic headings and ordinary links, no scripts, form controls or storage. Root-relative links stay relative to the deployment serving the notice and its pinned artifacts. Use `@notabenda/core/styles.css` and override `.nb-indirect-notice`, `.nb-collection-purpose` and the shared CSS variables. The plain-text formatter resolves privacy, rights and law links against the pinned site origin. It creates a body, not an email MIME message or an email-client-tested HTML template. The example text uses example destinations; replace them with actual public routes in your configuration.

The build checks manifest/config/privacy metadata, content and HTML integrity. Identity covers the full selected purpose facts, indirect categories, phase, public collector, reviewed wording, recipient/rights/law decisions and pinned privacy reference. IDs used for layout are outside identity. Keep the release’s pinned files available after later policy changes. Both production privacy and notice wording must be reviewed; previews need `{mode:'preview'}` at build/verification and `{allowPreview:true}` at rendering/formatting.

`normalizeIndirectCollectionNotice` makes a bounded structural copy; it does not recompute a digest. `verifyIndirectCollectionNotice` rebuilds the descriptor against a supplied trusted release and compares its facts and identity. Neither authenticates the author or establishes factual accuracy. Do not place personal recipients, case records, delivery timestamps, private exception reasons or source code in the public descriptor.

## React and Astro

```jsx
import {IndirectCollectionNotice} from '@notabenda/core/react/documents';

<IndirectCollectionNotice notice={notice} idPrefix="referral" headingLevel={2} />
```

```astro
---
import IndirectCollectionNotice from '@notabenda/core/astro/IndirectCollectionNotice.astro';
import notice from '../referral-notice.json';
---
<IndirectCollectionNotice notice={notice} idPrefix="referral" />
```

Both wrappers use the same server-safe renderer. No hydration is required. Current fixed labels are English; other language locales are rejected. The earlier [direct collection notice](COLLECTION.md) remains separate and still rejects indirect-only purposes.

## Traceability

`REQ-NZ-INDIRECT` links the two OPC sources to implementation and [verification](verification/indirect-collection.md). `REQ-PRODUCT-INDIRECT-NOTICE` covers the reusable mechanism. NZ remains partial: this module does not perform individual notification, manage deadlines, determine exceptions or implement sector-specific notices.

<!-- @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION -->
## Language and retained copy

Add the complete optional `localization.indirectCollection` dictionary for the site's selected language. [The example message file](../examples/localization/indirect-messages.json) has all 16 fields for HTML and plain-text output; `effectiveDate` requires `{effectiveDate}`. The [localization contract](LOCALIZATION.md#indirect-collection-notices) documents validation and byte limits. Direct collection messages are separate.

Localized notices use schema v2, pin their language, direction, copy revision and review status, and verify against the exact retained release. Supply the substantive facts, title and introduction separately in that language. No translation or jurisdiction is inferred. A copy update needs a new localization revision and release; cookie scopes stay unchanged. Existing English v1 notices retain their previous identity and exact rendered bytes.

Try [the Portuguese example](/localization/indirect/). It shows both collection phases with the existing explicitly assessed NZ profile, not another jurisdiction's coverage. Rendering or formatting remains display-only; the host arranges actual notification and reviews the meaning of every translated message.
