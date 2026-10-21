<!-- @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CONSENT-NOTICE-FILES -->
# Recorded-cookie application verification

The maintained example connects the generated required runtime/notice, existing CF ledger and native controls through application-owned authorization. Neither it nor the package starter provides a production identity issuer. All example hooks initially deny access.

## HTTP and client checks

`packages/notabenda-cf/test/recorded-cookie-application.test.mjs` exercises the actual application host/workspace and bundled client. Eight tests cover default denial before object lookup, fixed origin, JSON and streamed UTF-8 body bounds, explicit registration/activation, read-only permission separation, exact retry, archived wording, cross-session digest checks, rejected authority fields and allowlisted RPC error envelopes.

JSDOM client scenarios run the bundled application with its native controls and real host handler against transactional in-memory storage. They cover pre-commit outage with no grant replay on reload, committed-response loss with head recovery, offline withdrawal, late grant acknowledgment after refusal, host session disconnection and another visitor sharing the same saved local storage. JSDOM supplies JSON cloning/dialog stubs; this is not a real-browser or persistent-storage check.

## Local SQLite runtime

`node scripts/check-recorded-cookie-runtime.mjs` creates a disposable copy and runs Wrangler against local SQLite. It checks the unchanged denying hooks and public legal pages before injecting test-only authorization. It then verifies register-only refusal, explicit activation, preservation of conflict codes across the real private RPC boundary, pre-commit and post-commit faults, exact nonce retry, cross-session rejection, persisted active selection/head across restart and a later refusal.

Original HTTP bytes are compared for the runtime, current and hash-pinned notice JSON, public artifact and pinned privacy/cookie HTML. The private admin detail contains the archived wording. `/backoffice` returns the authorized template without a redirect; `/operator`, `/operator/`, `/operator.html` and `/operator/index.html` remain unavailable. This catches static-asset HTML canonicalization that a synthetic asset stub cannot establish.

The command passed on 20 October 2026. Its ignored owner-only run directory holds a compact report; it deploys nothing. `--serve` optionally keeps only that owned loopback fixture running for manual browser checks, then stops it on Ctrl-C. Its injected authorization/fault endpoints never appear in the application source.

## Browser observations

In the in-app browser, a real write was forwarded and committed before its response was deliberately discarded. Both service indicators remained off with an unconfirmed-record message. After normal transport was restored, reload recovered the recorded grant through the head and both indicators turned on. With the recorder made unavailable before commit, a deliberate rejection stopped both indicators. Restoring transport and explicitly retrying recorded the refusal with both services still off.

At a 390×844 viewport, the drawer focused its heading and kept its content and actions contained. Client and scroll widths both measured 375 CSS pixels; the temporary viewport override was reset. These observations do not establish full accessibility, independent browser-context/multi-tab behavior or broad platform acceptance.

Actual host authentication, quotas/rate limits, logout signaling, service integrations, retention/erasure/recovery policy and production/regional acceptance remain separate. The runtime command is an HTTP/RPC/persistence check, not an automated browser suite. Adopters decide their own CI.
