# Localized legal pages and privacy choices

Supply your own wording for one language per site release. The same selected text is used by the native controls, React and Astro bridges, generated legal pages, and archived consent notices. Notabenda does not translate text, detect a visitor’s language, or choose legal rules from a locale.

The [Portuguese example](/localization/) includes a [complete message file](../examples/localization/messages.json) and [site configuration](../examples/localization/config.mjs). They are draft integration examples. They have not received legal or linguistic review.

## Configure one language

Set `site.locale` to a canonical BCP 47 locale such as `pt-BR` and add `localization`:

```ts
import type { SiteLocalization } from '@notabenda/core';
import messages from './messages.json';

const localization: SiteLocalization = {
  ...messages,
  schemaVersion: 1,
  locale: 'pt-BR',
  direction: 'ltr',
  revision: 'copy-1',
  disclosureRevision: 'disclosures-1',
  reviewStatus: 'draft',
};

// Add this to your existing site configuration.
const localizedSite = {
  ...site,
  site: { ...site.site, locale: localization.locale },
  localization,
};
```

Keep both revisions explicit:

| Field | Change it when |
| --- | --- |
| `revision` | Any selected message changes, including accessibility, status or retry text. The new release and notice retain that exact copy. |
| `disclosureRevision` | The meaning of a consent disclosure changes. This revision and the locale are part of each optional-purpose scope; existing grants need review when either changes. |

A presentation-only revision preserves an otherwise matching grant. Material purpose/service facts still participate in the scope. Refusals survive material scope changes under the existing refusal lifetime. A change of locale conservatively changes scope; Notabenda does not assert that two translations are legally equivalent. The host decides whether an edit changes meaning and must bump `disclosureRevision` when it does.

`reviewStatus: 'reviewed'` is required for production output. It is the host’s declaration of review, not a certification supplied by the package. Locale, direction and jurisdiction are independent declarations. No profile is enabled by choosing `pt-BR`, `ar` or any other locale.

## Complete plain-text messages

`consent` must include every key in the example, including storage failures, receipt states, Global Privacy Control, processing restrictions, restricted scopes, and accessible names. Missing or unknown keys are errors. There is no per-key English fallback.

Only the documented named placeholders are accepted:

| Message | Required placeholders |
| --- | --- |
| `consent.services` | `{services}` |
| `consent.materialChange` | `{summary}` |
| `documents.legalEyebrow` | `{siteName}` |
| `documents.storageItem`, `documents.storageItems` | `{count}` |

Other consent/document-chrome messages have no placeholders. Messages are plain strings, reject markup and control characters, and are bounded by UTF-8 bytes. Action labels allow 120 bytes; other messages allow 2,000 bytes; each complete set allows 20,000 bytes. The complete notice retains its existing 32 KiB bound. There are no callbacks, HTML messages, remote translation loads, or ICU expressions.

The host must also translate its declared purpose names, descriptions, service facts, retention descriptions, document titles and supplied wording. Those fields are rendered as declared, without translation or English-specific case conversion.

## Supply documents or generated templates

`documents` supplies the page chrome: metadata labels, contents navigation, draft warning, storage counts, footer links and the skip link. Embedded documents and controls carry their own `lang` and `dir`; full pages also set those attributes on the document root.

For privacy and cookie pages with `source: 'generated'`, supply the complete `generatedDocuments` dictionary. Its templates cover every generated heading, sentence, collection-source label, storage type and classification. Refer to the example for the exact required placeholders. A missing template rejects the configuration rather than producing mixed-language prose.

For `source: 'supplied'`, `generatedDocuments` can be omitted. Supply structured sections or Markdown/MDX through `@notabenda/authoring`, with the usual YAML frontmatter. Authored components still run only at build time under the existing static-content policy. Generated and supplied content share the selected document chrome.

English configurations without a `localization` property keep the original rendering and consent-scope encoding. Existing retained releases remain available at their original addresses.

## Consent and retained records

Compile a localized configuration normally:

```ts
import {
  compileLegalDocuments,
  compileConsentRuntimeConfig,
  createConsentNotice,
} from '@notabenda/core/content';

const build = compileLegalDocuments(localizedSite, { mode: 'preview' });
const runtime = compileConsentRuntimeConfig(localizedSite, {
  mode: 'preview', evidence: 'local',
});
const notice = createConsentNotice(
  build.artifact,
  { scopeId: 'cookie-choices' },
  { mode: 'preview' },
);
```

Localized notices use consent-notice schema version 2 and include the selected consent messages, locale, direction and revisions. Schema version 1 remains supported unchanged. The standalone Cloudflare validator checks those messages against the retained release and verifies its material scope. Operator records include the selected copy. This records declared wording; it does not prove that a visitor saw it or that a consent was legally valid.

The compiled browser inventory includes only the selected consent text. Document templates, document bodies and operator contacts remain outside that runtime projection. Localized releases reject `createConsentNotice(..., {wording: ...})` and built-in `preferencesLabel` overrides; change the versioned dictionary instead.

## Terms acceptance

Add the optional complete `localization.terms` dictionary before building an acceptance interface. The [message file](../examples/localization/messages.json) supplies all ten fields: the region label, heading, document metadata, draft note, recording/recorded states and every failure state. `metadata` requires `{version}` and `{effectiveDate}`; `recorded` requires `{version}`. The complete selected terms-localization descriptor is limited to 8 KiB and its offer to 16 KiB.

Build an offer with `createTermsOffer` as usual, supplying the statement and action label in the selected language. Localized offers use schema version 2 and pin the complete widget messages, locale, direction and copy revision. The controller and backend independently validate them; backend registration compares them with the retained release. An unchecked statement and a matching receipt are still required. Language does not select a jurisdiction or make an agreement enforceable.

Terms messages stay out of the compiled cookie-consent inventory and its material scope. Updating terms copy creates a new offer and release. A retry of an already-recorded request returns its original receipt; it does not apply the new offer. Existing v1 English offers, including English-localized releases without a terms dictionary, keep their previous behavior. Non-English acceptance requires the terms dictionary.

The operator detail shows the recorded language, copy revision and resolved declared interface messages. It retains the original templates in the complete JSON. This records the offered wording, not proof of which states were displayed.

Try the [Portuguese agreement](https://notabenda.org/localization/agreement/). Its recorded assertion is kept in that browser’s isolated demo workspace and can be inspected from its agreement records.

## Form permissions

Add the optional complete `localization.formPermission` dictionary before building an ordinary purpose/channel permission interface. The [Portuguese message file](../examples/localization/form-messages.json) supplies all 27 fields, including status, recovery, details, links and accessible action labels. The required placeholders are `policy: {version}`, `information: {information}`, `retention: {retention}` and `providers: {providers}`. Other fields accept no placeholders. Each text field keeps the plain-text limits above; action/link labels allow 120 bytes. The complete selected form-localization descriptor allows 16 KiB and its offer allows 32 KiB.

Supply the statement, grant/withdraw labels, optionality, withdrawal explanation and channel label in the same language through `createFormPermissionOffer`. Purpose facts, recipients and retention text must also be translated by the host. The v2 offer pins the complete selected dictionary, locale, direction and copy revision. Cloudflare registration compares it against the retained release, so changing the hash alone cannot replace the declared text or downgrade a localized offer to v1.

A change to these messages needs a new copy revision, release and material offer revision. Existing English offers without a dictionary retain v1 behavior. Exact pending v1 actions remain retryable after a v2 activation; they retain their original request and archive references. New grants still need the current offer, head and activation, while withdrawal stays independent. Form text is excluded from compiled cookie inventories and cookie purpose scopes.

Try the [Portuguese form permission](https://notabenda.org/localization/permission/). It stores choices in that browser's demo workspace, separate from the English permission example, and sends no email. Operator inspection shows the retained language, revision and complete declared message templates. A template records offered wording, not which interface states a person saw. This remains one selected language per release; routing across equivalent multilingual permissions is host work.

## Direct-collection notices

`localization.collection` supplies the complete static collection-notice interface. The [33-field message file](../examples/localization/collection-messages.json) includes `purposeDetails: {purpose}`, `recipientPurposes: {purposes}`, `privacyVersion: {version}` and `effectiveDate: {effectiveDate}`; all other fields have no placeholders. There is no per-key fallback. Native details remain collapsed by default and work without JavaScript. Version/date substitutions use bidirectional isolation.

The selected descriptor allows 16 KiB; the complete notice allows 64 KiB. General message limits still apply. Supply the title, introduction and declared processing facts in the selected language. Link/details labels belong in the versioned dictionary. A v2 notice uses `collection-v2`; `verifyCollectionNotice` compares it with the intact archive and rejects changed selected copy, facts or a downgrade. Legacy English v1 output is preserved. The dictionary is excluded from cookie runtime inventory and permission scopes.

See the [collection guide](COLLECTION.md#language-and-release-verification) and [Portuguese example](/localization/collection/). This display-only component records no choice, presentation receipt or form submission. Indirect-collection notices use their own separate dictionary; see below.

## Supported interfaces

Gated-media placeholders accept `localization.embeds` with complete `preferencesLabel`, `waiting`, `allowed` and `error` messages. The full controller selects the dictionary automatically. Select it separately with `selectEmbedLocalization(config)` before compiling a cookie-only runtime, then pass it to the media group and SSR renderer. `lang` and `dir` follow its explicit metadata; titles, descriptions and image alternatives still need their own wording. Draft dictionaries need `allowPreview: true`. [Integration and example](EMBEDS.md#language-and-fixed-interface-messages).

This contract covers legal document pages/links, native consent controls and their React/Astro bridges, the native terms-acceptance widget, ordinary form-permission controls, static direct- and indirect-collection notices and the declared service directory. Custom React/Astro preference buttons may supply their own content; the default button uses the selected `triggerLabel`.

Backoffice chrome does not yet share this localization contract. Builders/renderers tied to the new site locale reject those unsupported combinations. Headless service inventories and storage-exception controllers remain available for a host-owned interface. Consumer-contract profiles with their own explicit locale and wording contracts are separate APIs.

See [verification](verification/localization.md) and `REQ-PRODUCT-LOCALIZATION` for the checked scope and remaining work. A broad reviewed locale catalog, plural rules beyond the storage count, language negotiation, routing between releases and localization of the remaining interfaces are still open.

<!-- @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION -->
## Privacy request pages

A native request page uses the operator's `rightsCenter` wording and a complete `localization.rights` dictionary for its fixed visitor labels:

```json
{
  "yourInformation": "Suas informações",
  "requestOption": "OPÇÃO DE SOLICITAÇÃO",
  "draft": "Informações sobre solicitações — rascunho para revisão.",
  "contactHeading": "Fale com o responsável",
  "nextStepsHeading": "Próximos passos"
}
```

Add this object to the existing complete site localization declaration. It shares that declaration's canonical locale, direction, revision and review status. Page skip navigation and the header/footer request label reuse `localization.documents.skipToContent` and `privacyRequests`. Every selected message must be nonempty plain text without markup, control characters or placeholders. Unknown fields, incomplete sets and messages over 2,000 UTF-8 bytes are rejected.

Supply the page title, introduction, action names/descriptions/scope/link labels, fallback explanation and next steps separately in `rightsCenter`, in the intended language. The dictionary translates no operator facts or request workflow. The Portuguese example is demonstration wording for operator review, not a reviewed legal-language pack or a decision about applicable rights. [Try the example](/localization/rights/).

Non-English native rendering, setup authoring and supporting-page preview require this complete dictionary. Missing messages leave the page unresolved; other legal-document previews remain available. The setup interface itself remains English. Do not change the site's language to bypass a missing translation.

The full page and fragment set `lang` and `dir`; action ordinals use isolated text and next-step lists use logical spacing. The vanilla renderer, React wrapper, Astro component and JSON/Markdown/MDX builds share the same page rendering. Preview links remain inactive.

The complete public dictionary is included in the hashed release configuration. Revise `localization.revision` when changing its wording and retain releases under the normal review process. The request page remains outside the three pinned legal-document HTML kinds. Its message set is excluded from the compiled cookie-consent runtime and consent-only notices; adding page copy does not grant permission or configure a request process. See [request-page authoring](RIGHTS-AUTHORING.md) and [verification](verification/rights-localization.md).

<!-- @requirements REQ-PRODUCT-STORAGE-LOCALIZATION -->
## Storage exception controls

Supply the complete `localization.storageExceptions` dictionary for native storage settings outside English. It shares the site localization's locale, direction, revision and review status. [The Portuguese message file](../examples/localization/storage-messages.json) contains all 17 fields: heading and introduction, action labels, entry states, loading, persistence failure, retry and terminal messages. Fields accept plain text without placeholders; action labels allow 120 UTF-8 bytes, other fields 2,000 bytes, with 20,000 bytes across the message set. Unknown or missing keys are rejected. A missing dictionary cannot attach native presentation on a non-English site; no English labels are substituted. English sites can keep the built-in defaults or supply a complete dictionary.

Translate the entry titles and descriptions, `preferenceNotice`, information-link label, inventory and legal documents separately. Those are facts and legal content rather than interface chrome. Explicit mount `title`/`description` overrides remain host-owned. Changing these dictionary messages needs a new localization revision and legal release. The complete dictionary is retained in the legal artifact, but excluded from cookie notices/runtime inventory and exception entry scopes. Copy-only edits preserve saved objections. Material entry facts still require their own increased entry revision; never rename IDs to discard an objection.

The native root uses explicit `lang` and `dir`. Removing it closes its presentation gate and leaves retained controls inert; it does not destroy the host controller. Test long translations, direction, pending actions and unavailable persistence in the actual layout.

Try [storage settings in Portuguese](/localization/storage/). This demonstrates host-supplied language over the existing declared UK profiles. Language does not select a jurisdiction, establish eligibility or provide a reviewed regional translation. See [the verification record](verification/storage-localization.md).

<!-- @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION -->
## Recorded processing opt-outs

Native processing opt-outs now support a complete `localization.processingChoices` message set. It translates status, retry, preview and recovery copy; substantive notice wording, inventory facts and privacy documents remain separately authored. [The Portuguese file](../examples/localization/processing-messages.json) lists all twelve fields. The selected interface shares the site's locale, direction, revision and review declaration, with no per-key English fallback. See [processing choices](PROCESSING-CHOICES.md#language-and-interface-copy) for byte limits and schema compatibility.

The recorder binds these messages to the retained legal release. Updating copy does not clear restrictions or change cookie scopes, and pending requests keep their original notice identity. The [Portuguese example](/localization/processing/) demonstrates separate cookie permission and a retained opt-out using a California-oriented scenario; language does not determine applicability. Translation review and actual downstream enforcement remain host work.

<!-- @requirements REQ-PRODUCT-SERVICE-LOCALIZATION -->
## Service directory

Add the complete optional `localization.serviceDirectory` dictionary to render a directory in the site's selected language. [The Portuguese message file](../examples/localization/service-messages.json) contains all 37 fields, including the standalone page, provider details, storage types/classifications, search controls, count messages and empty states. A non-English directory requires the dictionary; the headless inventory remains usable without it. English sites can retain the existing defaults or supply a complete dictionary.

The selected set shares `localization.locale`, `direction`, `revision` and `reviewStatus`. Production requires reviewed copy and the normal reviewed-document declarations. Each message accepts plain text: no HTML, executable callbacks or partial English fallback. Label fields allow 120 UTF-8 bytes; other fields allow 2,000 bytes; the selected descriptor allows 16 KiB. Required placeholders are `eyebrow: {siteName}`, `privacyLinkLabel: {serviceName}`, `totalOne` and `totalMany: {total}`, and `filteredCount: {shown}` plus `{total}`. All other fields have no placeholders. The count contract has separate one/other totals and a general filtered count; hosts needing further plural forms should use a neutral count phrase or their own headless interface.

Translate provider-purpose descriptions, locations, legal bases, retention, necessity reasons and policy titles separately in the declared inventory. The directory never translates those facts or infers provider use from the reference catalog. Machine storage names remain literal; provider names and template substitutions are escaped and bidirectionally isolated. Search uses the selected locale's case mapping and counts use its number formatting. Search stays in the page and changes no permission, preference storage or records.

Revise `localization.revision` when directory copy changes and retain the legal release. Its exact public configuration contains the selected dictionary and declared inventory, so a historical directory can be rendered from `artifact.publicConfig`. The directory remains an additional view, not a fourth archived legal-document page. Its messages stay out of cookie runtime/notice copy and material scopes. Changing directory text does not clear grants or restrictions.

Try the [Portuguese directory](/localization/services/). Native HTML, the local search enhancement, React and Astro use the same renderer and dictionary. [Verification](verification/service-localization.md) covers exact English compatibility, native rendering, local search, framework output, stored releases and permission independence. These messages are a host-authored demonstration, not a reviewed locale or jurisdiction pack.

<!-- @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION -->
## Indirect-collection notices

Supply complete `localization.indirectCollection` messages for notices about information received from other sources. [The 16-field example](../examples/localization/indirect-messages.json) covers both collection phases, HTML/plain-text draft notes, information/source labels, statutory authority, recipients, the collecting/holding agency, access/correction and the effective date. It shares the site's canonical locale, direction, revision and review declaration. The only placeholder is `effectiveDate: {effectiveDate}`; other fields accept no placeholders. Label fields allow 120 UTF-8 bytes, other fields 2,000 bytes, and the selected descriptor allows 16 KiB. Unknown keys, partial dictionaries, markup and executable values are rejected.

The builder uses v2 notices with `indirect-collection-v2` when this dictionary is supplied, including for custom English copy. Non-English output requires it. Existing English v1 notices keep their exact output. Direct-form `localization.collection` messages cannot translate the separate indirect notice. Setup and agent guidance show the precise missing dictionary without changing the site's actual language.

Author the title, introduction, purpose/category/source facts, recipient statement, actual collector contact, access/correction route and any particular law in the selected language separately. HTML exposes the notice particulars directly, uses explicit `lang`/`dir` and isolates factual text. Plain text resolves links to the pinned site origin. Both formats retain the selected phase: changing messages cannot replace the explicit `advance` or `collected` decision.

Copy is part of notice identity and the retained release configuration. Change `localization.revision` and compile a new release when wording changes. `verifyIndirectCollectionNotice` compares the selected copy and bound purpose/privacy facts with that release; structural normalization alone authenticates neither author nor facts. Cookie runtime, scope and permission state do not include this dictionary.

Try [the Portuguese referral example](/localization/indirect/), including the advance version and both plain-text bodies. Its explicitly selected profile remains New Zealand IPP3A. Portuguese does not choose Brazilian law or establish legal review; all displayed wording is a draft. Applicability, timing, lawful collection, delivery, awareness and any notification evidence remain separate host work. See [verification](verification/indirect-localization.md).

<!-- @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION -->
## Contract declarations

Optional `localization.contractActions` supplies all 29 native form and acknowledgement labels. It shares the site's canonical locale, direction, revision and review declaration. [Contract authoring](CONTRACT-ACTIONS.md#supply-your-own-interface-copy) explains the complete dictionary, explicit substantive wording and v2 definition/archive binding. Existing v1 German, English and Portuguese labels remain unchanged. Selecting a language does not determine cancellation/withdrawal applicability or alter delivery jobs.
