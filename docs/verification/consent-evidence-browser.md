# Cookie evidence: browser and local Worker checks

18 October 2026. Linked to `REQ-PRODUCT-CONSENT-EVIDENCE`, `REQ-PRODUCT-MOBILE` and `REQ-PRODUCT-A11Y`. Initial observations cover fixed fictional server-generated reports. A separate live required-receipt example is verified below; public `/choices` remains local-only.

- The local backoffice lists three fixed reports with allowed/declined counts, historical-report labels and revisions. Key order is explicitly distinguished from chronology.
- A granular report shows Measurement allowed and Suggestions declined, with per-purpose expiry, the archived purpose description/provider facts under native disclosures, exact notice/preferences/action wording, client-reported versus host-received times, submitted/superseded revisions, and document references. The page labels reports historical and makes no current-permission claim.
- At 390×844 and 320×700, the detail page's client and scroll widths match (375 and 305 CSS pixels available, respectively). Expanded purpose and document disclosures remain horizontally contained at 320px, including long pinned paths and hashes. The temporary viewport override was reset after inspection.
- The actual local Wrangler/Workers runtime initialized the protected SQLite-backed synthetic ledger. Unauthorized reads return 401. After stopping and restarting the process with the same persistence directory, `scripts/check-site-runtime.mjs` recovered the same three event IDs and inspected their pinned wording and causal revisions. This is distinct from the storage-fake tests.
- Package tests additionally cover duplicate and concurrent delivery, stale grants, retries returning current heads, old-notice revoke-all clearing newer purposes, preview and strict-schema guards, clock/expiry/UTF-8 bounds, archive tampering, rollback and escaped scoped search. Site tests exercise protected access and repeated object initialization.

Screenshots: [desktop report](../assets/screenshots/consent-evidence-desktop.jpg), [mobile report](../assets/screenshots/consent-evidence-mobile.jpg).

## Live browser delivery

- `/recorded-choices` loads a separate site configuration, immutable notice and host-issued stream digest. Initial view shows both optional services blocked and zero optional requests, with a compact nonmodal notice.
- At 390×844, deliberately opening preferences focuses the heading. Saving only Measurement results in an acknowledged `recorded · revision 1` state, Measurement on, Suggestions off, and one initiated optional request. Reload recovers that committed choice and starts only the allowed service.
- Rejecting through the persistent preferences control leaves both services off and records revision 2. Focus returns to the preferences trigger. The linked backoffice shows two historical reports, matching the granular action and later refusal.
- The mobile page client and scroll widths match (375 CSS pixels available). The viewport override was reset after verification. Screenshots: [recorded mobile state](../assets/screenshots/recorded-consent-mobile.jpg), [browser-produced history](../assets/screenshots/recorded-consent-history.jpg).
- A static module-import-graph test verifies every emitted browser import resolves to an allowlisted asset. This caught a missing shared runtime module before the live check. Delivery unit tests independently inject outages, malformed acknowledgments, stale reads, unavailable storage, clock expiry and shared-storage races.
- The real local Workers runtime also accepted a fixed-stream refusal through `/demo/choices/record`. After stopping/restarting Wrangler with the same SQLite state, `scripts/check-site-runtime.mjs` recovered its exact original receipt together with the current head and inspected its backoffice record. The admin key stays in ignored local configuration and is not printed by the check.

Cloud deployment, production visitor endpoints/capabilities, full real-browser multi-tab/outage exercises, retention/erasure/restore drills and assistive-technology/platform review remain incomplete. Opening a native disclosure or checking focus in this session is not a complete keyboard or screen-reader audit.
