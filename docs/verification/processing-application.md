<!-- @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN -->
# Processing application verification

The application connects first-navigation signals, browser-reported restrictions, host-bound recording, dispatch admission and a separate synthetic destination. Its source context/operator hooks deny by default. No production account, cookie issuer or public package ingestion API is added.

## Automated application checks

`packages/notabenda-cf/test/processing-application.test.mjs` runs the actual host/workspace and bundled client. Fifteen tests cover anonymous GPC before rendering; zero covered destination calls alongside unrelated work; read-only registered notice/archive verification; manual/header provenance; unioned restrictions; context preconditions; queued dispatch rechecks; read/write faults; exact retries; restart of application state; stable delivery IDs/attempt bounds; concurrent dispatch; corrupted payload refusal; persistent overflow stop at fence capacity; producer timeout uncertainty; bounded host resolution; malformed/cross-origin/oversized input; browser journal recovery; cookie acceptance independence; session disconnection; and refusal to automatically confirm a missing outbox.

The synthetic storage fixture is transactional memory. Browser checks use JSDOM with realm-correct JSON, structured cloning, request-abort bridging and dialog stubs. These tests do not establish persistent SQLite behavior or broad browser/platform acceptance.

## Local SQLite exercise

`node scripts/check-processing-application.mjs` copies the application into a private ignored directory and runs its actual Worker, private RPC bindings and independent SQLite Durable Objects. It first checks the unchanged denying hooks and anonymous header behavior. It then injects synthetic context/permission hooks and fault controls only into that disposable copy.

The command verifies that an initial header request reaches only the unrelated destination; a saved pending fence survives a failed event write and restart; a queued job is suppressed without sending; lost recording acknowledgments retry exactly; header observations add only missing activities with separate provenance; a second context is isolated; a real sink commit with a lost acknowledgment stays uncertain; and an opt-out prevents retransmission after another restart. Private admin inspection contains the original wording and source. Current and pinned notice/runtime/artifact/document bytes match the build.

The exercise passed on 21 October 2026. Its report stays in the ignored owner-only run directory. It deploys nothing. `--serve` optionally retains that owned loopback fixture for manual browser checks until interrupted. This HTTP/RPC/persistence command is not a browser test suite and does not prescribe adopter CI.

## Browser observations

In the in-app Chromium browser, a retained restriction kept the covered client off while an explicit cookie acceptance enabled the unrelated local feature. The server observation showed a blocked covered producer and a delivered unrelated event. Retrying an uncertain job with the retained restriction left its admitted-attempt count at one and did not add a received attempt at the independent sink.

The final operator view places queue decisions and received calls side by side on desktop and stacks them on mobile. At a 390×844 viewport, both visitor and operator pages had matching client/scroll widths of 375 CSS pixels. The preferences drawer occupied 0–375 pixels, focused its heading when opened, and returned focus to Cookie preferences on close. Temporary viewport settings were reset. These observations do not establish full accessibility or independent multi-tab/platform behavior.

## Limits

A send admitted before a restriction can complete afterward. A timeout reports uncertainty and cannot cancel an admitted payload. Total failure to persist a pending fence cannot promise continuity after restart or host-context loss. Destination idempotency prevents duplicate committed sample payloads, not duplicate network transmissions across all possible failures. Three admitted attempts are a demonstration policy.

Real anonymous continuity, authentication, quotas, provider behavior, queue scheduling, retention/holds/erasure, remote recovery, production acceptance and reviewed jurisdiction coverage remain host or separate verification work. All sink payloads are fixed synthetic data.
