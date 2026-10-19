# Guarantee notice verification

Requirements: **REQ-EU-GUARANTEE-NOTICE**, **REQ-PRODUCT-GUARANTEE-NOTICE**.

Automated tests inspect all 24 colour SVGs against recorded hashes and byte counts, bind selected-language PDF provenance and information destinations, and verify that each build emits only its selected unchanged file. Rendering preserves the complete image, dimensions, text alternative, source attribution and QR information link. Source artwork is not inserted inline. No script, checkout, consent or acceptance control is generated.

Tests cover deterministic descriptor identity, explicit preview and language-label review, changed text/wording/path identity, safe local asset paths, strict shapes/enums, bounded data, accessors, exotic arrays, and tampered descriptor rejection. React SSR and isolated packed Astro/TypeScript consumers exercise the public APIs. The packed runtime reads the shipped source asset successfully. Optional browser graph checks exclude artwork bytes, extracted text, Node, framework and catalog datasets.

Source provenance is not proof of statutory design conformity. The documented colour discrepancy, independent linguistic/legal review, applicability, production prominence, QR scannability, physical devices and assistive technology remain open. Neither a successful build nor a `reviewed` flag supplies those decisions. Product GARAN label preparation and the final order interface are not covered by this milestone.

Chrome inspection on 19 October 2026 covered the 1728px desktop viewport, 390 × 844 light layout and 320 × 740 light/dark layouts. Document widths stayed within the viewport; the text equivalent used the example’s 15px base font and preceded artwork in both DOM and visual order. The SVG loaded completely, retained its aspect ratio and had no CSS filter. The reduced mobile artwork needs its full-size route for detailed inspection; the text equivalent remains readable without shrinking to fit the image. This is not a QR-scanning, screen-reader, physical-device or legal acceptance result.
