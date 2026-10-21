# Producer label example

**REQ-EU-GUARANTEE-LABEL**. Juniper Works, JW-01 and its five-year offer are sample facts. There is no real producer offer or product sale in this example. The public descriptor remains a draft.

`source/garan-colour.svg` is the unchanged colour template from the European Commission's [official guarantee files](https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en), retrieved 19 October 2026. Its archive, member, byte count and SHA-256 are recorded in `manifest.json`. The template's fixed artwork is © European Union. Its design and permitted use are described by [Regulation (EU) 2025/1960, Annex II](https://eur-lex.europa.eu/eli/reg_impl/2025/1960/oj) and the Commission's April 2026 guide.

`juniper-jw-01.svg` fills only the brand, model and duration text fields. The preparation script outlines those fields with Inter Regular 400 and ExtraBold 800 at the source sizes and transforms. The duration's source family and variation setting specify ExtraBold/800 despite its additional `font-weight: 700` declaration; the example uses the static ExtraBold face. The single duration digit needs no inter-letter spacing. The remaining source class styles are resolved to equivalent presentation attributes; numeric `px` stroke widths become the same SVG user-unit values. XML serialization and nonvisual class/data-name attributes change, while the fixed geometry, order, colours, multilingual footer, QR artwork and local clip relationships are checked through a resolved presentation tree.

The source colours differ from the regulation's reference HEX values. This example preserves the source values; it does not repair them or claim statutory design conformity. The fixed-tree comparison does not evaluate the prescribed design, qualify an offer, authenticate a producer, establish correct placement or demonstrate physical QR scannability.

Inter comes from its [official 4.1 release](https://github.com/rsms/inter/releases/tag/v4.1). Archive and individual font hashes are recorded. Font files and archives are not redistributed here. `source/Inter-OFL.txt` retains the upstream copyright and SIL Open Font License 1.1 text. That license distinguishes font software from documents created with it; this example contains glyph outlines, not an embedded font.

The [Commission reuse notice](https://commission.europa.eu/legal-notice_en) generally applies CC BY 4.0 to EU-owned website content, with exclusions including some logos, names and third-party material. This repository grants no additional rights in those elements and implies no EU endorsement. The official template and adapted label are not Notabenda branding and are not relicensed under Apache-2.0 OR MIT. Keep this attribution and the recorded source/use references with redistributed files. The preparation code, verification code, product illustration and other original example code use the repository's Apache-2.0 OR MIT license choice.

## Reproduce the fixed fixture

Download the GARAN archive from the Commission page and `Inter-4.1.zip` from the Inter release. The script checks both archive hashes before reading only the named members. It does not fetch files, extract archive paths to disk or accept custom field values. This maintainer fixture script is outside the npm runtime importer.

Install the exact versions from `requirements.txt` in a local Python environment, then run:

```sh
python3 examples/guarantees/producer/prepare.py \
  --garan-archive /path/to/garan.zip \
  --inter-archive /path/to/Inter-4.1.zip \
  --check
```

Without `--check`, the script writes the fixed source copy, font license, finished label and manifest. Review changes before retaining a new fixture. Normal tests run `verify.py`, which uses only the Python standard library. They also import the real graphic through the optional authoring package and check unchanged emitted bytes. Full reproduction needs the local pinned archives and the maintainer font tools.
