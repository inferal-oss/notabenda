# Guarantee notice verification

Requirements: **REQ-EU-GUARANTEE-NOTICE**, **REQ-PRODUCT-GUARANTEE-NOTICE**.

Automated tests inspect all 24 colour SVGs against recorded hashes and byte counts, bind selected-language PDF provenance and information destinations, and verify that each build emits only its selected unchanged file. Rendering preserves the complete image, dimensions, text alternative, source attribution and QR information link. Source artwork is not inserted inline. No script, checkout, consent or acceptance control is generated.

Tests cover deterministic descriptor identity, explicit preview and language-label review, changed text/wording/path identity, safe local asset paths, strict shapes/enums, bounded data, accessors, exotic arrays, and tampered descriptor rejection. React SSR and isolated packed Astro/TypeScript consumers exercise the public APIs. The packed runtime reads the shipped source asset successfully. Optional browser graph checks exclude artwork bytes, extracted text, Node, framework and catalog datasets.

Source provenance is not proof of statutory design conformity. The documented colour discrepancy, independent linguistic/legal review, applicability, production prominence, QR scannability, physical devices and assistive technology remain open. Neither a successful build nor a `reviewed` flag supplies those decisions. Producer preparation and the final order interface are not supplied by the notice module.

Chrome inspection on 19 October 2026 covered the 1728px desktop viewport, 390 × 844 light layout and 320 × 740 light/dark layouts. Document widths stayed within the viewport; the text equivalent used the example’s 15px base font and preceded artwork in both DOM and visual order. The SVG loaded completely, retained its aspect ratio and had no CSS filter. The reduced mobile artwork needs its full-size route for detailed inspection; the text equivalent remains readable without shrinking to fit the image. This is not a QR-scanning, screen-reader, physical-device or legal acceptance result.

## Product labels

**REQ-EU-GUARANTEE-LABEL** is partial. Automated mechanism tests cover explicit qualifying booleans, whole/half-year duration without rounding, product/producer association, review and preview gates, locale/wording, descriptor and original-byte identity, unchanged binary output, content-detected formats and safe local asset paths. Structural fixtures deliberately do not stand in for a complete prescribed label.

Adversarial image tests reject truncated, trailing, oversized and animated PNGs; check every chunk checksum and bounded decompression; reject unsupported raster metadata and non-colour images; and exercise actual JPEG decoding. SVG tests cover XML declarations/entities, external resources, live text, unsafe styles, forbidden descendants inside style elements, recursion, class resolution, tree limits, aggregate embedded-image decoding, and aggregate CSS limits. A timeout-bounded subprocess checks long malformed stylesheet suffixes. Optional browser graphs exclude Node/image parsers and the authoring package. Packed consumers exercise the optional importer with its declared dependencies, public TypeScript signatures and the dependency-free core renderer; React SSR and packed Astro exercise static wrappers.

Still open: a producer-prepared complete example and its provenance/design review, actual browser delivery/QR/legibility acceptance for that file, producer-identity and offer verification, independent legal/linguistic review, final order placement and durable confirmation. The host must retain original files and descriptors; no backend archive integration is claimed. File validators are a supported subset, not visual-conformity verification.

The product-label guide was inspected in Chrome at desktop and 390 × 844. Its syntax-highlighted command example stays keyboard-focusable and scrolls within its own box; document width matched the viewport. This checks documentation presentation, not a completed producer label or checkout.
