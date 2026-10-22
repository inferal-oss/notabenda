<!-- @requirements REQ-SG-COOKIE-DATA REQ-SG-BROWSER-CHOICE REQ-SG-COOKIE-TARGETING -->
# Singapore cookie review verification

Checked 21 October 2026. The three Singapore requirements remain partial and legally unreviewed.

The old guideline URL returned 404 in the browser. PDPC's current search led to its relocated regulatory-guidance page and the exact May 2024 PDF it links. The PDF cover identifies revision 23 May 2024. Full text on printed pages 53–55 was read; pages 54 and 55 were also rendered and visually inspected. Catalog metadata retains the downloaded PDF's SHA-256. Website migration/upload timestamps were not used as guideline or legal commencement dates.

`packages/notabenda/test/singapore-cookies.test.mjs` covers:

- Exact current source, revision, paragraph and catalog links; detached agent metadata and explicit advisory boundaries.
- Selected coverage or imported jurisdiction without changing consent, storage classification, reviewed configuration or a conflicting answer.
- Existing saved answers and historical recommendations; public/private separation and installed CLI reference/wizard parity.
- Browser setup's Singapore option and matching recommendations.
- Both public consent factories with native controls: permissive browser cookie settings and unrelated preferences grant nothing; a deliberate action starts the declared service, withdrawal stops it and reload preserves rejection.
- An unresolved child-related scope guard remaining restricted after Singapore review.

Native Chromium observations on 21 October 2026 also exercised both public APIs with real browser storage and native controls. Browser cookies were enabled and an unrelated cookie/preference was present. Fresh, dismissed and checkbox-draft states stayed blocked; Save started the local test service once; rejection stopped it once; reload retained withdrawal with no new start. Twelve run-bound DOM observations were checked across the two APIs. No production or third-party provider was involved.

The unit runtime checks use synthetic services/storage and JSDOM; the native check uses the same local service counter in Chromium. They prove those mechanics, not third-party network behavior, actual identifiability, consent validity, statutory scope, qualification for an exception or full PDPA compliance. Current statutory text and chapter 12 exception analysis remain research work. Production integrations need their own network/storage and legal checks.

Local validation: 1,234 package tests and 194 site tests passed, with catalog/service-catalog checks and the website Worker deployment dry run. The site import-graph check verifies that the standalone setup example includes the shared review module.
