<!-- @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY -->
# Remote SQLite recovery verification

Requirement: `REQ-PRODUCT-CF-REMOTE-RECOVERY`. The [operator guide](../CLOUDFLARE-REMOTE-RECOVERY.md) describes explicit invocation, resource creation, ownership checks, private reports and cleanup recovery.

The runner is `scripts/check-cf-remote-recovery.mjs`; deployed controls are isolated under `scripts/fixtures/remote-recovery*.mjs`. They are maintainer fixtures, outside package exports and the starter initializer.

Direct regressions cover default-closed epochs, journal target substitution and immutability, restore-intent binding, the whole-operation gate boundary, queued maintenance after an admitted read, HTTP authentication before object selection, fixed routing, request byte limits, explicit account invocation, single-module source attestation, private ownership checkpoints, outside modifications and transferred namespace refusal.

The optional remote command additionally asserts native SQL and KV rollback through a Cloudflare bookmark, a non-restored control gate, later hold-before-retirement replay, refusal to open before purge, restart persistence, physical erased-head deletion, old-grant refusal, surviving held and unrelated heads, archived private source byte identity, and provider-confirmed removal of both disposable namespaces and Worker.

Focused direct regressions passed on 20 October 2026. Remote execution has not yet been verified. No provider-recovery success is claimed from the direct tests or static review.

This is a same-object provider recovery exercise using deployed package APIs, not a generated-starter recovery test or a portable backup importer. All-family recovery, production access fencing, host journal completeness/authentication, downstream and other backup copies, and legal readiness remain open. Adopters choose their own CI and operational acceptance.
