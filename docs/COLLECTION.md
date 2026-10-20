# Inline collection notices

Put information about a form's declared purposes beside the fields, with a link to the exact privacy-policy revision. The collection notice is static HTML: it needs no JavaScript, sets no storage and attaches no submit handler. Try the [light example](/collection) or [dark example](/dark/collection).

For information obtained from another source, use the separate [indirect collection notice](INDIRECT-COLLECTION.md). The direct component below keeps its original purpose selection and form semantics.

The distinction matters for the requirements catalog. GDPR Article 13 addresses information provided when collecting directly from a person, including purpose, basis, recipients, retention and applicable rights. The NZ Privacy Commissioner's guidance highlights purpose, recipients, whether information must be provided, consequences and access/correction. These sources guide the disclosure mechanism; they do not make every example or inventory sufficient for every jurisdiction. [GDPR Article 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), [NZ privacy statements](https://www.privacy.org.nz/resources-and-learning/knowledge-base/view/312/).

## Build and render

```js
import {compileLegalDocuments, createCollectionNotice} from 'notabenda/content';
import {renderCollectionNotice, collectionNoticeIds} from 'notabenda';

const build = compileLegalDocuments(config);
const notice = createCollectionNotice(build.artifact, {
  scopeId: 'contact-form',
  purposeIds: ['enquiries'],
  reviewStatus: 'reviewed', // explicit review declaration for this notice's wording/context
  wording: {
    title: 'About your message',
    intro: 'We use the information you choose to send to respond to your enquiry.',
    // Optional: detailsLabel and privacyLinkLabel.
  },
});
const ids = collectionNoticeIds('contact-privacy');
const html = renderCollectionNotice(notice, {
  idPrefix: 'contact-privacy',
  headingLevel: 3,
});
// Place html beside your fields. The concise visible intro has id=ids.descriptionId.
// Your form can use aria-describedby=ids.descriptionId alongside its own instructions.
```

`purposeIds` selects one to eight existing inventory purposes. Unknown/duplicate/empty selections and indirect-only purposes fail. A purpose whose source is `both` remains explicitly labeled as involving other sources. Purpose data categories and required/optional status are **purpose-level facts**. They do not assert that every category is collected through this form or that every field is mandatory. The host supplies actual field labels, requirements and instructions and reviews whether the selected facts fit this collection context.

The builder verifies the release's manifest identity, public config digest, privacy metadata, content digest and exact HTML digest before deriving the notice. The output contains only selected purpose facts, intersecting declared service/recipient associations, public controller/contact details, rights/transfer/complaint information and the pinned privacy reference. Private config fields and unrelated purposes/services are excluded. A related service that serves several purposes retains only its selected purpose associations here.

Production requires both reviewed production privacy content and an explicit reviewed declaration for the new notice wording. For draft development, pass `{mode:'preview'}` to compilation/building and `{allowPreview:true}` to rendering. Preview remains marked visibly. Supplied privacy wording may disagree with the inventory: notice review must check this independently. A successful structural check or review flag is not a legal opinion.

The notice ID covers the scope, locale, selected facts, wording, review declaration, rendering-policy revision (`collection-v1`) and pinned policy reference. Instance `idPrefix` and the surrounding host layout are outside that content identity. Digests identify content; they do not authenticate authors or prove display, reading or agreement. Browser/SSR normalization validates shape and safe links and makes a detached copy; supply trusted build descriptors, not visitor-submitted notices.

## Interests pursued under a legitimate-interests basis

`purposes[].legitimateInterests` is an optional public statement of the interests pursued and by whom. Supply a complete statement in the notice's content language, for example:

```json
{
  "legalBasis": "Legitimate interests under GDPR Article 6(1)(f).",
  "legitimateInterests": "Our interest is to protect the support inbox from repeated abusive submissions."
}
```

This illustrates the fields, not a basis assessment. Keep any private balancing assessment outside this public field. [GDPR Article 13(1)(d) and Article 14(2)(b)](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679) require disclosure of the interests pursued when processing relies on Article 6(1)(f). See `REQ-EU-INTERESTS-DISCLOSURE` in the [requirements catalog](requirements/README.md).

Generated privacy pages and direct-collection details append the statement to the declared legal-basis text. Localized notices use the existing translated basis label/template; the package does not translate the statement. Supplied Markdown, MDX or structured privacy content remains author-owned and must include the applicable facts itself. The separate NZ indirect-notice profile retains complete purpose facts in its descriptor but does not become a GDPR Article 14 notice.

If supplied, the statement must be nonempty plain text of at most 4,000 UTF-8 bytes. An unresolved `{{...}}` placeholder blocks production. Omission preserves existing output; it does not establish that the field is inapplicable. The validator does not parse free-form `legalBasis` text or decide whether legitimate interests is lawful. Review necessity, balancing, rights and all applicable notice particulars separately. This field cannot enable storage or replace a required device-access permission.

The public statement is retained in the released configuration, selected collection/permission facts and applicable consent scopes. Changes reopen setup document review and invalidate an affected purpose's old grant through normal scope comparison. Release verification rejects altered or omitted facts, including a descriptor whose digest has been recomputed. [Verification details](verification/legitimate-interests.md).

## Language and release verification

Add a complete optional `localization.collection` dictionary to the site before building a non-English notice. The [Portuguese messages](../examples/localization/collection-messages.json) cover all 33 fixed labels, headings, source/optionality descriptions, link labels, version/date templates and list separator. The host still supplies translated purpose/recipient facts and context-specific `wording.title` and `wording.intro`.

The v2 notice uses `collection-v2` and retains the selected messages, locale, explicit direction and copy revision. Set details/privacy-link labels in the dictionary; per-notice overrides are rejected for this version. The selected descriptor is bounded to 16 KiB, and the complete notice keeps its 64 KiB limit. English configurations without the dictionary retain v1 output and their existing context-label options.

`verifyCollectionNotice(notice, artifact, options)` from `notabenda/content` reconstructs the selected notice against its intact retained release and checks content identity, facts and copy. Use it when loading a trusted descriptor for deployment or review. Structural normalization alone validates shape and safe links; it does not authenticate an author or compare an archive. Neither check proves presentation or legal sufficiency. Advancing wording requires a new copy revision and notice/release; it does not change cookie permission scopes.

Try the [static Portuguese example](/localization/collection/). Its details and pinned policy remain readable without scripts. The surrounding form illustration has no submission route or evidence store. The same core markup is used by React and Astro; review language, layout and applicability independently.

## Layout and accessibility

The first layer shows the notice title, intro, responsible controller, selected purposes, declared categories, purpose-level optionality and consequences, plus the pinned policy link. Native `<details>` contains longer source/basis/retention, provider, contact, rights and transfer information. It remains usable through ordinary keyboard interaction without scripts. No acceptance checkbox, hidden permission, mandatory privacy acknowledgment, submit button or record delivery is created.

Give each instance a unique lowercase prefix. `collectionNoticeIds(prefix)` returns `rootId`, `titleId` and `descriptionId`. Use the concise `descriptionId` as an optional form description, rather than making assistive technology read the entire expanded notice. Preserve field-specific descriptions too; avoid adding the same long notice to every field. Pick heading level 2–6 to fit the surrounding page.

Optional package CSS uses the existing namespaced tokens, light/dark surfaces, logical spacing and native controls. Render inside your own layout or override the tokens. The readonly fictional example sends nothing and demonstrates a field-specific reply-address instruction separately from the purpose-level optionality declaration.

## React and Astro

```jsx
import {CollectionNotice} from 'notabenda/react/documents';
// This server-safe wrapper requires no provider, hooks or client hydration.
<CollectionNotice notice={notice} idPrefix="contact-privacy" headingLevel={3} />
```

```astro
---
import CollectionNotice from 'notabenda/astro/CollectionNotice.astro';
---
<CollectionNotice notice={notice} idPrefix="contact-privacy" headingLevel={3} />
```

Both wrappers accept explicit `allowPreview`; the default enforces the same production gate. React supports `className`, Astro supports `class`. Their markup comes from the same validated core renderer.

## Integration responsibilities

The host places the notice at the actual collection surface, supplies the real processing inventory and reviewed wording, retains the pinned privacy page and linked assets, and handles the actual form submission. Use [retained releases](RELEASES.md) when a clean deployment must keep older pinned links available.

This notice does not implement an indirect-collection notification workflow, marketing/channel permission, parental authorization, legal-basis determination or complete regional profile. A marketing opt-in and a [terms agreement](TERMS.md) require their own deliberate action and appropriate records; notice display never creates either. There is no automatic “notice viewed” record. For an ordinary purpose/channel opt-in, use the separate [form-permission controller and CF records](FORM-PERMISSIONS.md). General application-event ingestion remains outside this static notice API.

Traceability: `REQ-PRODUCT-COLLECTION-NOTICE`, with partial support for `REQ-EU-NOTICE` and `REQ-NZ-NOTICE`. The [setup wizard](SETUP.md) recommends collection-surface integration when personal-data processing is declared or unresolved.

For a separate ordinary opt-in, see [form permissions](FORM-PERMISSIONS.md). Its explicit permission controller does not change this static notice into a consent checkbox or submission listener.
