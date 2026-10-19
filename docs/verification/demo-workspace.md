# Public demo workspace verification

Requirement: `REQ-PRODUCT-DEMO-WORKSPACE`.

Public example navigation opens `/demo/admin`, backed by a separate `DEMO_WORKSPACES` binding and `DemoWorkspace` class. The operational `/backoffice` remains host-authorized and uses `WORKSPACE` exclusively.

Each newly provisioned demo uses a random browser capability held in an HttpOnly, SameSite cookie (Secure and host-prefixed on HTTPS, with no persistent-cookie expiry). The host authenticates its HMAC signature before any namespace lookup; only the random capability’s digest enters the object name. The demo-specific session errors close controllers terminally and offer reloading the example. Ordinary missing/expired objects cannot initialize themselves. A separate nonsecret generation binds rendered example pages and their mutations, and enters consent/processing stream and terms operation identity. Another tab's replacement cookie cannot silently redirect an earlier action.

Fixtures model full grant followed by withdrawal, partial choices, refusal, membership terms acceptance, processing opt-outs, document revisions and evidence lifecycle states. They are generated through the actual record APIs, with stable request IDs and a captured fictional-seed time for resumable initialization. They contain only fictional pseudonyms and sample documents. Demo interactions use fixed server-owned contexts; no arbitrary personal data or record upload endpoint is exposed.

Provisioning is limited before DO allocation; a workspace accepts at most 200 new successful recording commands, while existing idempotent retries remain recoverable. The capability is a browser-session cookie, with no Max-Age or Expires. The database expires after one day without demo activity; each valid navigation or API action refreshes that idle deadline. A DO alarm schedules deletion of the inactive demo data; an older queued alarm rechecks the refreshed deadline before deletion. An expired tombstone prevents recreation of an old capability after cleanup. Cleanup timing is subject to the Workers alarm service; the access deadline is checked independently.

Verified on 2026-10-18: 261 package tests and 36 website tests pass, with package builds, catalog traceability, website output and Worker dry run. Dedicated tests cover independent browser jars, recorded-choice isolation, realistic seed counts, missing/expired replay, refreshed idle deadlines, stale alarm handling, HMAC forgery, interrupted seeding, generation conflicts, quota, origin checks and terminal browser recovery.

The local Workers HTTP check passes on both development ports (4178 and 4179) and exercises two independent persisted SQLite demo databases, generation-bound recording, seed projections and session-cookie attributes. In Chrome, a public example choice was recorded and followed into this browser's own demo ledger, without a password prompt. Fictional withdrawal search and the new desktop/mobile workspace presentation were visually checked.

Public example entry points share one ink/lavender visual foundation across vanilla, React, Astro and tooling pages, with a matching midnight theme. A site test discovers every interactive example and requires that shared stylesheet. This complements manual visual checks; it is not a comprehensive assistive-technology or device review.

[Demo overview](../assets/screenshots/demo-workspace-desktop.jpg) · [Mobile overview](../assets/screenshots/demo-workspace-mobile.jpg) · [Fictional history search](../assets/screenshots/demo-workspace-search.jpg) · [Updated cookie example](../assets/screenshots/examples-unified-choices.jpg)

The project website adds a single, noninteractive top-right Demo ribbon to example HTML and session-admin screens, including guided setup. The homepage, gallery and documentation remain unmarked; artifact downloads retain their original bytes. Automated coverage checks both themes, framework examples, cookie pages, admin rendering and duplicate prevention. Desktop and 390px mobile browser checks confirm the marker remains visible without page overflow or covering the setup navigation.

Deployment regression coverage loads an earlier set of published document pins into the actual Worker, provisions its demo database, then runs the new Worker over that same storage. Agreement, contract, history and choice views must remain available; the session identity, old definitions and every earlier ledger event remain unchanged. Contract example revisions include their artifact pin so a new document release does not reuse an immutable form revision.
