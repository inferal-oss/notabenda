<!-- @requirements REQ-PRODUCT-DOCS-SEARCH -->
# Documentation search verification

Requirement: `REQ-PRODUCT-DOCS-SEARCH`.

The website builds its index from the same explicit source-guide map as its public documentation. Search indexes titles, heading labels and bounded overlapping text chunks, including code identifiers. It does not inspect running applications, operator records, private archives, source downloads or arbitrary project files. Generated result addresses are checked against the actual emitted HTML, including section IDs. Index generation fails above its 3 MiB delivery limit rather than silently dropping guides.

`site/test/guide-search.test.mjs` checks exact-title ranking, all-term matching, API and requirement identifiers, diacritics, unique guide results, late-section content, actual section targets and the complete no-script directory. DOM tests cover local input/submit, pagination and its focus target, clearing, generic load errors, explicit retry, disposed asynchronous loads, text-only result rendering and rejected index destinations. The fixed same-origin fetch omits credentials and referrers. Input and submission do not send a query or update its URL. Structural accessibility checks cover the initial and populated states.

The lexical results are navigation aids, not legal advice or an applicability decision. They can miss synonyms or related concepts; grouped navigation and the full guide list remain available. Native layout and keyboard checks supplement the DOM tests; broader browser and assistive-technology acceptance remains part of the release review.
