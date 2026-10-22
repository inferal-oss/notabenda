<!-- @requirements REQ-SG-COOKIE-DATA REQ-SG-BROWSER-CHOICE REQ-SG-COOKIE-TARGETING -->
<!-- @requirements REQ-SG-CONSENT-CONDITIONS REQ-SG-CONSENT-ROUTES REQ-SG-WITHDRAWAL REQ-SG-ACCOUNTABILITY -->
# Singapore cookie review verification

Updated 22 October 2026 UTC. The seven Singapore requirements remain partial and legally unreviewed.

The old guideline URL returned 404 in the browser. PDPC's current search led to its relocated regulatory-guidance page and the exact May 2024 PDF it links. The PDF cover identifies revision 23 May 2024. Full text on printed pages 53–55 was read; pages 54 and 55 were also rendered and visually inspected. Catalog metadata retains the downloaded PDF's SHA-256. Website migration/upload timestamps were not used as guideline or legal commencement dates.

`packages/notabenda/test/singapore-cookies.test.mjs` covers:

- Exact current source, revision, paragraph and catalog links; detached agent metadata and explicit advisory boundaries.
- Selected coverage or imported jurisdiction without changing consent, storage classification, reviewed configuration or a conflicting answer.
- Existing saved answers and historical recommendations; public/private separation and installed CLI reference/wizard parity.
- Browser setup's Singapore option and matching recommendations.
- Both public consent factories with native controls: permissive browser cookie settings and unrelated preferences grant nothing; a deliberate action starts the declared service, withdrawal stops it and reload preserves rejection.
- An unresolved child-related scope guard remaining restricted after Singapore review.

Native Chromium observations on 21 October 2026 also exercised both public APIs with real browser storage and native controls. Browser cookies were enabled and an unrelated cookie/preference was present. Fresh, dismissed and checkbox-draft states stayed blocked; Save started the local test service once; rejection stopped it once; reload retained withdrawal with no new start. Twelve run-bound DOM observations were checked across the two APIs. No production or third-party provider was involved.

The unit runtime checks use synthetic services/storage and JSDOM; the native check uses the same local service counter in Chromium. They prove those mechanics, not third-party network behavior, actual identifiability, consent validity, statutory scope, qualification for an exception or full PDPA compliance. Production integrations need their own network/storage and legal checks.

Local validation: 1,234 package tests and 194 site tests passed, with catalog/service-catalog checks and the website Worker deployment dry run. The site import-graph check verifies that the standalone setup example includes the shared review module.

## Statutory follow-up

Singapore Statutes Online's browser view displayed the current version as at 22 October 2026. Its selected-provision views were read for sections 11–12, 13–17 (including 15A) and 18–20; extracted text and access evidence remain in ignored local research files. The source snapshot date is kept distinct from commencement and the 2020 revised-edition statement. The First/Second Schedules, prescribed regulations, chapter 12 guidance and complete applicability remain open.

`packages/notabenda/test/singapore-consent.test.mjs` connects the selected provisions to the existing mechanisms:

- Three distinct legal-route explanations remain advisory and create no runtime mode, permission or inferred legal basis, including when a private answer alleges an exception.
- A static collection disclosure includes declared purpose, responsible public contact, complaint route and retained privacy link without obtaining permission or storing a choice.
- Both public factories reject an earlier grant after the actual declared purpose changes.
- Withdrawal aborts and stops registered work despite a failed local write. When deletion is still available, the stale grant is removed and cannot return on reload. If both writes and deletion fail, cross-reload durability cannot be established by that local mechanism.

These are synthetic integration checks. They do not demonstrate that a real operator gave timely notice, explained actual withdrawal consequences, appointed its responsible person, notified intermediaries, handled a complaint or qualified for an exception.
