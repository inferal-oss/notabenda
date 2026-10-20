# Product durability guarantee labels

**REQ-EU-GUARANTEE-LABEL** connects the qualifying offer, producer-prepared file and product-specific display to the [source catalog](requirements/README.md#req-eu-guarantee-label). The separate [shop notice](GUARANTEES.md) describes legal guarantee rights; it does not establish a commercial guarantee for a product.

The producer prepares the complete GARAN label. Notabenda imports that finished file and keeps its bytes unchanged. It does not fill the official template, inspect the guarantee contract, authenticate the producer, or certify the graphic. The [Commission guide](https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en) describes the permitted edits and display; [Regulation 2025/1960, Annex II](https://eur-lex.europa.eu/eli/reg_impl/2025/1960/oj) prescribes the design.

A [complete sourced product example](GUARANTEE-PRODUCER-EXAMPLE.md) shows the original-file importer in light and dark themes, with pinned source/font provenance and fixed-artwork checks. It remains a draft example.

## Supply a finished file

The optional `@notabenda/authoring/guarantees` build entry contains the image parsers. The frontend entry `@notabenda/core/guarantees/label` remains dependency-free. Install the preview packages from your checkout; they have not been published to npm.

```ts
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {buildDurabilityGuaranteeLabel} from '@notabenda/authoring/guarantees';
import {renderDurabilityGuaranteeLabel} from '@notabenda/core/guarantees/label';

const file = await readFile('./producer-assets/kettle-100-garan.png');
const result = buildDurabilityGuaranteeLabel({
  product: {id: 'kettle-100', name: 'Kettle 100'},
  producer: {brand: 'Example Maker', model: 'K-100'},
  durationYears: 5,
  qualification: {
    offeredByProducer: true,
    noAdditionalCost: true,
    coversEntireGood: true,
    informationProvidedToTrader: true,
  },
  locale: 'en',
  reviewStatus: 'draft',
  allowPreview: true,
  // Optional separate link; it does not replace the prescribed label.
  statementUrl: 'https://producer.example/guarantee',
}, file);

for (const [path, bytes] of Object.entries(result.files)) {
  const output = join('./public', path);
  await mkdir(dirname(output), {recursive: true});
  await writeFile(output, bytes); // Binary Uint8Array, never UTF-8 conversion.
}
const html = renderDurabilityGuaranteeLabel(result.label, {
  idPrefix: 'kettle-guarantee', allowPreview: true,
});
```

These example declarations are facts the host must establish, not recommended defaults. All four must be the boolean `true`. Missing, false or unknown information stops the build; a failed build is **not** a finding that the product has no qualifying guarantee. Duration must exceed two years in whole or half years. The importer supports up to 100 years as an engineering limit, not a statutory maximum, and never rounds a duration to fit.

Before changing `reviewStatus` to `reviewed`, check the actual offer, product and model, full-colour prescribed graphic, duration, Inter typography, all-language footer and working QR destination. The unfilled official SVG contains live text and is not a finished file. A hash cannot do this review. Outside `en`, supply all surrounding `wording` labels, including the readable duration and image alternative; review their agreement with the product and image. The graphic retains its prescribed multilingual wording regardless of the surrounding UI locale.

## Supported files and limits

The build detects the format from content. It does not use filenames or fetch a remote URL. Unsupported files fail; the importer never strips metadata, substitutes fonts, recolours or re-encodes artwork.

| File | Supported export |
| --- | --- |
| PNG | Non-interlaced colour RGB, RGBA or palette; valid chunks/checksums and complete bounded image data. No animation or text/EXIF metadata. |
| JPEG | One 8-bit three-component frame, fully decoded. Optional JFIF header without thumbnail or supported Adobe colour marker. No EXIF, XMP, IPTC, comments or other application payloads. |
| SVG | UTF-8 static outlined geometry with a `0 0 width height` viewBox, simple class styles, presentation attributes, local clips and inline PNG images. No live text/fonts, scripts, links, animation, external resources, metadata or comments. Local clip references may form an acyclic graph up to eight definitions deep; cyclic, unresolved or excessively expanded graphs fail. |

Files are limited to 2 MiB, dimensions to 4096 on either axis and 8 million pixels. SVG dimensions are viewBox units. SVG budgets additionally limit tree depth, nodes, path text, styles, rules and transforms. CSS is limited to 2,048 selectors, 2,048 declarations, 2,048 distinct class-to-clip associations and 8,192 association attempts, including unused rules. Clip references are capped at 2,048, with at most 100,000 expanded geometry-cost units. These conservative limits also count potential class-style references before the browser cascade. Inline PNGs are limited to 16 files, 512 KiB combined compressed bytes and 8 million combined decoded pixels. These are supported-input limits, not prescribed legal image dimensions or a universal SVG sanitization service.

ICC profiles are outside this version’s supported export subset. Ask the producer for a suitable colour export using the supported colour representation; do not silently drop a profile or change colours. Passing file validation establishes structural compatibility with this importer. A valid image can still be incomplete, unreadable, visually wrong or unrelated to the stated product.

## Render and retain

Load `@notabenda/core/guarantees.css`, or supply reviewed styles for the same markup. The full-label view keeps readable product, brand, model and duration text beside the complete image, a full-size link and the prescribed [durability guarantee information destination](https://europa.eu/youreurope/commercial-guarantee-durability/index.htm). React exports `DurabilityGuaranteeLabel` from `@notabenda/core/react/documents`; Astro supplies `@notabenda/core/astro/DurabilityGuaranteeLabel.astro`. Both accept `label`, `idPrefix`, an optional heading level and explicit `allowPreview`.

The image is an ordinary `<img>`, never inline SVG. Preserve its ratio, colours, complete bounds and visibility. Check actual delivery and readability on the target page and devices. The readable facts and alternative text do not turn a broken or missing image into a successful prescribed-label display. This renderer supplies the product label only. The [paid-order integration](PAID-ORDERS.md) places it beside its item in the expanded final review and checks required image readiness before the action. Customer copies and delivery use the separate [confirmation integration](ORDER-CONFIRMATIONS.md).

The descriptor identity binds the product, producer facts, duration, review state, wording, statement link, asset path and original file hash. `normalizeDurabilityGuaranteeLabel` only validates and clones its structure. At build time, `verifyDurabilityGuaranteeLabel(label, originalBytes)` recomputes the descriptor identity, original file hash and decoded metadata. Neither authenticates a producer or reviewer. Browser metadata does not enforce image integrity.

Retain the descriptor **and original bytes** when changing an offer or label. The emitted asset uses a same-origin content-addressed URL; keep old URLs available while retained records need them. These files are not automatically included in the legal-document DO archive or its size budget. The optional `@notabenda/cloudflare/orders` backend retains original files separately with an order review, explicit host authorization and intent-level retirement; see [paid orders](PAID-ORDERS.md). The host owns publication, access policy and retention decisions. Do not put customer/order data, private qualification notes, upload filenames or source paths into the public descriptor.

See [verification and remaining acceptance work](verification/guarantees.md).
