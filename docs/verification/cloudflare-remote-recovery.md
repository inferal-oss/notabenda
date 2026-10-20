<!-- @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY -->
# Remote SQLite recovery verification

Requirement: `REQ-PRODUCT-CF-REMOTE-RECOVERY`. The [operator guide](../CLOUDFLARE-REMOTE-RECOVERY.md) describes explicit invocation, resource creation, ownership checks, private reports and cleanup recovery.

The runner is `scripts/check-cf-remote-recovery.mjs`; deployed controls are isolated under `scripts/fixtures/remote-recovery*.mjs`. They are maintainer fixtures, outside package exports and the starter initializer.

Direct regressions also normalize retained null-prototype records and native SQL rows for the RPC boundary. They cover default-closed epochs, journal target substitution and immutability, restore-intent binding, the whole-operation gate boundary, queued maintenance after an admitted read, HTTP authentication before object selection, fixed routing, request byte limits, explicit account invocation, single-module executable attestation with an adjacent source map, private ownership checkpoints, outside modifications and transferred namespace refusal.

The optional remote command additionally asserts native SQL and KV rollback through a Cloudflare bookmark, a non-restored control gate, later hold-before-retirement replay, refusal to open before purge, restart persistence, physical erased-head deletion, old-grant refusal, surviving held and unrelated heads, archived private source byte identity, and provider-confirmed removal of both disposable namespaces and Worker.

Twelve focused direct regressions and the real remote command passed on 20 October 2026. The deployed fixture was built from commit `9825862`. Cloudflare restored the SQL baseline from two to one, removed the later SQL row and restored the erased event/head. The separate control object retained its closed gate and journal. Replaying the later hold before retirement, restarting during purge and reopening only after verification all passed. The final state contained three consent events, three surviving revision-one heads, both enforced holds and two archived releases with matching private source bytes. The old grant remained retired.

The same run verified removal of its two recorded SQLite namespaces before deleting the Worker, then confirmed their absence again. Earlier failed attempts were also cleaned; they do not count as successful recovery evidence. Bookmarks, keys, resource identities, journals and logs remain in private ignored run directories, not in this report.

This is a same-object provider recovery exercise using deployed package APIs, not a generated-starter recovery test or a portable backup importer. All-family recovery, production access fencing, host journal completeness/authentication, downstream and other backup copies, and legal readiness remain open. Adopters choose their own CI and operational acceptance.
