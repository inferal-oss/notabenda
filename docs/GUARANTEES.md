# EU legal guarantee notices

The shop-level legal guarantee notice and a producer’s product-specific GARAN label are different displays. The optional notice component implements the former; the [producer label importer and renderer](GUARANTEE-LABELS.md) cover finished product files separately. It does not decide applicability or assert that a product has a commercial durability guarantee. Try the [light example](/guarantees) or [midnight example](/dark/guarantees).

The current Consumer Rights Directive distinguishes the general goods notice in Article 6(1)(l), the conditional product label in (la), and pre-order information in Article 8(2). The latter now includes (la). The separate designs and online colour rules are prescribed in [Regulation 2025/1960, Annexes I–II](https://eur-lex.europa.eu/eli/reg_impl/2025/1960/oj). Application and national implementation still need review.

## Build one selected notice

```js
import {buildLegalGuaranteeNotice} from '@notabenda/core/guarantees/content';
import {renderLegalGuaranteeNotice} from '@notabenda/core/guarantees';
import '@notabenda/core/guarantees.css';

const result = await buildLegalGuaranteeNotice({
  language: 'en',
  reviewStatus: 'draft',
  allowPreview: true,
  assetBase: '/assets/guarantees', // local directory, no trailing slash
});
const html = renderLegalGuaranteeNotice(result.notice, {
  idPrefix: 'shop-guarantee',
  allowPreview: true,
});
// Publish result.files alongside the page containing html.
```

The build reads the package’s pinned source files. It verifies the selected SVG’s hash and byte count, then emits that unchanged file at a content-addressed local path. It does not download files, refresh a source or publish anything. All 24 official EU language variants are included in the package; only the selected file is emitted into your website. Artwork and extracted text are outside the default consent runtime.

For a language other than English, supply translated surrounding labels in `wording`: `title`, `imageAlt`, `fullSizeLink` and `informationLink`. These labels do not edit the graphic. The image’s own language and the fixed information destination come from the source metadata. `guaranteeNoticeLanguages` lists the supported language codes.

The default text alternative is extracted from the corresponding official PDF, not independently translated or linguistically reviewed. Review it alongside the artwork. `textAlternative` can supply a corrected, reviewed text equivalent without altering the graphic. Set `reviewStatus:'reviewed'` only after reviewing the actual source, language, text and placement. Preview remains explicit at both build and render boundaries.

## Presentation and source integrity

The renderer uses an ordinary `<img>` to isolate the SVG’s internal styles. It preserves proportions and the complete artwork, supplies the full text equivalent, and provides a full-size link plus the language-specific destination matching the source’s QR information. On narrow screens, readable text comes first. The artwork is never recoloured to match a dark theme. Check actual prominence, graphic legibility and QR usability in your deployment; responsive sizing alone does not prove those properties.

The graphics remain subject to their prescribed use conditions. Attribution appears outside the graphic. They are not relicensed as Apache-2.0 assets or presented as Notabenda branding. Source links, archive/file hashes, PDF provenance and the reuse-policy qualification are recorded in [the asset notice](../packages/notabenda/assets/guarantees/NOTICE.md) and its manifest.

**Known source discrepancy:** the supplied official SVGs contain colour values that differ from the reference HEX values in the regulation. The package preserves the downloaded files; it does not silently repair them. Independent review of that discrepancy and of the extracted text is still required. Source-byte verification establishes provenance, not statutory conformity. Overall coverage remains partial and legally unreviewed.

`normalizeLegalGuaranteeNotice` validates a bounded structural copy against this source edition’s known asset metadata; it does not recompute identity or fetch an image. `verifyLegalGuaranteeNotice` additionally recomputes descriptor identity. Neither authenticates a reviewer, proves factual accuracy or enforces image integrity in the browser. Serve the emitted bytes unchanged and retain the descriptor and its referenced files. Future source editions must preserve earlier assets and metadata rather than silently replacing this edition.

React uses `LegalGuaranteeNotice` from `@notabenda/core/react/documents`; Astro uses `@notabenda/core/astro/LegalGuaranteeNotice.astro`. Both accept `notice`, a unique `idPrefix`, an optional `headingLevel` and explicit `allowPreview`. They render the same static markup with no hydration, consent or checkout action.

## Product labels and the order component

The [GARAN importer and renderer](GUARANTEE-LABELS.md) now require explicit producer offer, entire-good coverage, no additional cost, duration and information supplied to the trader. They preserve a finished producer file and bind it to the particular good. Missing information cannot mean “no guarantee”. Producer preparation and complete-artwork review remain host work. Continue with the [paid-order review](PAID-ORDERS.md) for checkout placement and [customer confirmations](ORDER-CONFIRMATIONS.md) for retained copies and delivery. The unfilled official template has live Inter text without embedded fonts and cannot be used as a finished label.

The [paid-order review guide](PAID-ORDERS.md) covers the final payment-obligation action and its review, including item characteristics, price details, applicable labels and commitments. A shop notice or terms acknowledgment alone does not supply that review. Payment, fulfillment and contract formation remain host work.

## Traceability

`REQ-EU-GUARANTEE-NOTICE` connects the current Directive, prescribed design and practical guidance to this mechanism. `REQ-PRODUCT-GUARANTEE-NOTICE` covers source-preserving build/render behavior. `REQ-EU-GUARANTEE-LABEL` is partial: finished-file ingestion and static display exist; producer/artwork acceptance and order integration remain open. `REQ-EU-ORDER-ACTION` remains planned. See [verification](verification/guarantees.md).
