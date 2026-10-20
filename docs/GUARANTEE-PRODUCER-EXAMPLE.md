# A complete producer label example

The [product example](/guarantees/product/) displays a complete GARAN label beside the product it identifies, in light and dark themes. The example product is a Juniper Works desk lamp, model JW-01, with a five-year producer durability guarantee. Those are sample facts, not a real offer. Its descriptor stays in draft preview.

**REQ-EU-GUARANTEE-LABEL** links the source, implementation and tests. The example uses the [Commission's official colour template](https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en). Its brand, model and duration fields are filled with outlined Inter glyphs. Fixed artwork, colours, footer, QR and source transforms are retained. The source colour discrepancy and independent legal/design review remain open.

The files live in `examples/guarantees/producer/`:

| File | Purpose |
| --- | --- |
| `config.json` | Explicit sample product, producer, duration and qualifying declarations; draft preview required. |
| `juniper-jw-01.svg` | Finished file passed to the importer. |
| `manifest.json` | Archive, source, font and output hashes; field transforms and outline identities; fixed-artwork comparison. |
| `source/garan-colour.svg` | Unchanged official source for comparison. This unfilled file is not used as the finished label. |
| `source/Inter-OFL.txt` | Inter's upstream copyright and license. No font files are shipped. |
| `prepare.py`, `requirements.txt` | Fixed maintainer fixture preparation with pinned archives and font tools. |
| `verify.py` | Standard-library checks for hashes, fixed artwork and field/config bindings. |
| `NOTICE.md` | Source, adaptation, copyright, license and review conditions. |

The importer receives the finished SVG as bytes and emits those bytes at a content-addressed local URL. Both themes use that same file; the surrounding page can change its colours and typography without recolouring the label. The full-size image route and an optional enlarged, keyboard-scrollable inspection view remain available for small print. The readable producer, model and duration fields do not replace the required complete graphic.

For a normal integration, supply your producer's finished file as described in the [label guide](GUARANTEE-LABELS.md). Do not use the example's qualifications as defaults or infer that a product lacks a qualifying guarantee when facts are missing. The fixture preparation script is not part of the npm package's runtime API.

## Where this component fits

<!-- notabenda:diagram purchase -->

This map connects the label to the surrounding [compliance responsibilities](COMPLIANCE-MAP.md). For applicable consumer distance contracts, information before purchase, the payment-obligation action and contract confirmation are distinct duties; see [Consumer Rights Directive Articles 6 and 8](https://eur-lex.europa.eu/eli/dir/2011/83/oj/eng) and the catalog's individual requirements. A product label, a terms agreement and a customer confirmation serve different purposes.

## Maintainer checks

Normal project tests need Python's standard library, with no font tools or downloads:

```sh
python3 examples/guarantees/producer/verify.py
```

For full reproduction, obtain the two archives from the recorded primary sources and install the exact maintainer requirements in a local environment:

```sh
python3 examples/guarantees/producer/prepare.py \
  --garan-archive /path/to/garan.zip \
  --inter-archive /path/to/Inter-4.1.zip \
  --check
```

Archive hashes are checked before reading fixed entries. The script replaces only its three fixed sample fields, outlines them with the pinned fonts and compares the resolved presentation of the remaining artwork before writing. It does not download inputs or expose a general producer-label editor.

Development-only SVG and QR tools also render the actual outlined graphic without system fonts and decode its QR at selected raster sizes. A 320px render did not decode; the enlarged view gives narrow screens a larger inspection surface. The payload uses the official Your Europe durability destination, while the separate readable link uses that page’s `index.htm` alias, checked on 19 October 2026.

These checks establish source preservation and reproducibility. They do not verify an actual offer, producer identity, correct legal design, physical QR use, all display environments or final order placement. The [verification record](verification/guarantees.md) separates those remaining checks from software results. The [paid-order integration](PAID-ORDERS.md) now covers the final review/action and optional Cloudflare retention of its descriptor and original file. Customer copies and delivery use the separate [confirmation integration](ORDER-CONFIRMATIONS.md).
