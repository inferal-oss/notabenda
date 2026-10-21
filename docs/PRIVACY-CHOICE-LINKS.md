<!-- @requirements REQ-PRODUCT-PRIVACY-CHOICE-LINK REQ-US-CA-ALTERNATIVE-LINK -->
# Privacy-choice links

Give visitors a clear route back to privacy choices. A footer link should lead to the page where they can act. Keep it separate from cookie preferences and from access, deletion or correction requests.

Notabenda provides a script-free link, an optional California presentation and a `privacy.choicesLink` configuration field. Rendering the link submits nothing and writes no browser or server state. It does not create a destination page or determine which rights apply to your site.

## Add it to your site configuration

```ts
config.privacy.choicesLink = {
  schemaVersion: 1,
  revision: 'choices-link-1',
  href: '/privacy-options/',
  label: 'Privacy choices',
  presentation: 'text',
  reviewStatus: 'draft',
};
```

`renderLegalLinks(config, {mode: 'preview'})` includes this link after the legal documents and any privacy request page. `renderLegalPage` and `renderRightsPage` forward their selected mode. React's `LegalLinks` and Astro's `LegalLinks.astro` accept the same `mode` prop. Draft links require explicit preview mode; review the wording, destination and placement before setting `reviewStatus: 'reviewed'` for production.

Use an HTTPS URL or a root-relative path. The label is plain text. Revision IDs are short ASCII identifiers; change the revision when you change the public link. Query strings and fragments are retained. Public configuration is archived, so keep private tokens and request contents out of the URL and label.

The field is optional. It is never inferred from a jurisdiction, `privacy.rightsUrl`, a rights-page route or a cookie preference button. Request-page authoring preserves an existing choice link. Adding or changing it changes the release configuration and rendered footer hashes, while the structured document text and material cookie scope stay the same. Retain the earlier artifacts for existing records.

## Render a standalone link

```ts
import {renderPrivacyChoicesLink} from '@notabenda/core/privacy-choices';

const html = renderPrivacyChoicesLink(config.privacy.choicesLink, {
  allowPreview: true, // Local draft only. Production requires reviewed settings.
});
```

The optional `@notabenda/core/styles.css` styles the anchor, keyboard focus and icon. The consent-only stylesheet includes these rules too. Native links remain usable without styles or JavaScript. Hosts can adapt typography, spacing and colors. The California icon's width uses `--nb-privacy-choices-icon-width` (30px by default); its aspect ratio stays fixed. `--nb-privacy-choices-ink` changes its blue ink for visibility.

## California alternative-link presentation

<!-- notabenda:privacy-choice-links -->

For a business that chooses the alternative link under **§7015 of the CCPA regulations effective 1 January 2026**, select `presentation: 'california-alternative-2026'` and exactly one of these titles: **Your Privacy Choices** or **Your California Privacy Choices**. The renderer places the supplied official opt-out icon beside the title in one anchor. The prescribed English text carries `lang="en"` and `dir="ltr"` even within a page in another language. Translation and any additional-language obligations require separate review.

```ts
config.privacy.choicesLink = {
  schemaVersion: 1,
  revision: 'california-link-1',
  href: '/privacy-options/',
  label: 'Your Privacy Choices',
  presentation: 'california-alternative-2026',
  reviewStatus: 'draft',
};
```

### California destination checklist

The link presentation is only one part of the rule. Before using it on a real homepage, verify all of these against the actual site:

- Put a conspicuous link in the homepage header or footer. Check its visibility at narrow widths, under zoom, with keyboard navigation and against the page background. Size the icon approximately like neighboring header/footer icons. The current rule permits color adjustment for visibility.
- Make the destination explain **both** sale/sharing opt-out and the right to limit sensitive-personal-information use/disclosure. Provide the interactive form or mechanism for exercising both rights with minimal steps and the applicable §7004 protections. A processing-only page or an access-request directory does not meet this destination specification by itself.
- Assess applicability and exceptions, identity needs, supported request methods, the actual browser/account scope and downstream processing. A saved receipt is evidence of a request, not proof that every system applied it.
- Continue processing applicable opt-out preference signals. §7025(e) does not let a business choose between posting a link and honoring those signals.

The [recorded opt-out example](../examples/processing-choices/build.mjs) uses the generic text link. It demonstrates sale, sharing and targeted-advertising restrictions; it does not implement the sensitive-information limit destination required by this California alternative-link specification. See [recorded processing opt-outs](PROCESSING-CHOICES.md) and [browser signals](PRIVACY-SIGNALS.md) for the separate mechanisms.

## Sources and verification

[Current CCPA regulations, §7015, p. 32; §7025(e), p. 48](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf) supply the selected legal requirements. The [DOJ icon download page](https://www.oag.ca.gov/privacy/ccpa/icons-download) supplies the artwork; its older regulatory citation is not the source for the current rule. The [DOJ ownership conditions](https://www.oag.ca.gov/conditions) treat Department-created content as public domain. The package retains the original SVG, source hashes and a separate provenance notice; the inline representation removes XML, styles and IDs while preserving path geometry and default colors. No agency endorsement is implied.

[REQ-US-CA-ALTERNATIVE-LINK](requirements/README.md#req-us-ca-alternative-link) remains partial and legally unreviewed. [REQ-PRODUCT-PRIVACY-CHOICE-LINK](requirements/README.md#req-product-privacy-choice-link) covers the reusable component. [Verification details](verification/privacy-choice-links.md) distinguish renderer checks from the host's placement, destination and processing checks.
