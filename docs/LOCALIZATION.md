# Localized legal pages and privacy choices

Supply your own wording for one language per site release. The same selected text is used by the native controls, React and Astro bridges, generated legal pages, and archived consent notices. Notabenda does not translate text, detect a visitor’s language, or choose legal rules from a locale.

The [Portuguese example](/localization/) includes a [complete message file](../examples/localization/messages.json) and [site configuration](../examples/localization/config.mjs). They are draft integration examples. They have not received legal or linguistic review.

## Configure one language

Set `site.locale` to a canonical BCP 47 locale such as `pt-BR` and add `localization`:

```ts
import type { SiteLocalization } from 'notabenda';
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

For `source: 'supplied'`, `generatedDocuments` can be omitted. Supply structured sections or Markdown/MDX through `notabenda-authoring`, with the usual YAML frontmatter. Authored components still run only at build time under the existing static-content policy. Generated and supplied content share the selected document chrome.

English configurations without a `localization` property keep the original rendering and consent-scope encoding. Existing retained releases remain available at their original addresses.

## Consent and retained records

Compile a localized configuration normally:

```ts
import {
  compileLegalDocuments,
  compileConsentRuntimeConfig,
  createConsentNotice,
} from 'notabenda/content';

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

## Supported interfaces

This contract covers legal document pages/links, native consent controls and their React/Astro bridges, and the native terms-acceptance widget. Custom React/Astro preference buttons may supply their own content; the default button uses the selected `triggerLabel`.

Service-directory UI, collection/form-permission UI, processing-choice UI, rights-center UI, storage-exception switches and backoffice chrome do not yet share this localization contract. Builders/renderers tied to the new site locale reject those unsupported combinations. Headless service inventories and storage-exception controllers remain available for a host-owned interface. Consumer-contract profiles with their own explicit locale and wording contracts are separate APIs.

See [verification](verification/localization.md) and `REQ-PRODUCT-LOCALIZATION` for the checked scope and remaining work. A broad reviewed locale catalog, plural rules beyond the storage count, language negotiation, routing between releases and localization of the remaining interfaces are still open.
