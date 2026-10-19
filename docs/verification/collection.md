# Collection notice verification

Requirements: `REQ-PRODUCT-COLLECTION-NOTICE`, `REQ-EU-NOTICE`, `REQ-NZ-NOTICE`.

Automated checks cover deterministic scope/locale/rendering-policy/wording identity, selected inventory and pinned privacy references, independent notice/document review gates, malformed purpose selections, preserved mixed-source and required/optional semantics, unrelated-service exclusion and filtered associations, corrupted artifact/config/model/HTML metadata, bounded descriptor normalization, escaped text and safe URLs, unique instance/description IDs, native details markup and the absence of consent or submission behavior. Real packed React/Astro consumers exercise static wrappers; core npm consumer types exercise the new builder/render API.

Commands: `npm run build`, then `node --test packages/notabenda/test/collection.test.mjs packages/notabenda/test/react.test.mjs packages/notabenda/test/astro-package.test.mjs packages/notabenda/test/react-package.test.mjs packages/notabenda/test/package.test.mjs`.

In the actual local Worker browser example at 390 × 844, the form and inline notice had no horizontal overflow. Enter opened and closed the native details disclosure, exposing controller, purpose, recipients, transfer, rights and contact facts. The notice stayed beside the relevant field with an archived privacy link. The host test and actual Worker runtime check verified the linked exact privacy HTML digest and script-free response. See [mobile screenshot](../assets/screenshots/collection-mobile.jpg) and [design verification](design-pass.md). No test proves legal sufficiency, actual notice delivery, human reading or blanket regional compliance.
