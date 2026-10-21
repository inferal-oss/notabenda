<!-- @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY -->
# Remote SQLite recovery verification

Requirement: `REQ-PRODUCT-CF-REMOTE-RECOVERY`. The [operator guide](../CLOUDFLARE-REMOTE-RECOVERY.md) describes explicit invocation, resource creation, ownership checks, private reports and cleanup recovery.

The runner is `scripts/check-cf-remote-recovery.mjs`; deployed controls are isolated under `scripts/fixtures/remote-recovery*.mjs`. They are maintainer fixtures, outside package exports and the starter initializer.

Direct regressions also normalize retained null-prototype records and native SQL rows for the RPC boundary. They cover default-closed epochs, journal target substitution and immutability, restore-intent binding, the whole-operation gate boundary, queued maintenance after an admitted read, HTTP authentication before object selection, fixed routing, request byte limits, explicit account invocation, single-module executable attestation with an adjacent source map, private ownership checkpoints, outside modifications and transferred namespace refusal.

The optional remote command asserts native SQL and KV rollback through a Cloudflare bookmark; an independently retained gate and decision journal; later holds, withdrawals and recorded/unconfirmed processing restrictions; interruption during replay; bounded purge restart; physical erased-event/head removal; unchanged surviving event bytes and live state; and provider-confirmed removal of three disposable namespaces and the Worker.

## Direct checks

Thirteen remote-tool regressions cover gate ordering, authenticated readiness before anonymous refusal, journal identity, outgoing/incoming plain-JSON RPC normalization, HTTP authority, executable source attestation and cleanup ownership. Every exposed ordinary family operation checks the closed gate before touching evidence storage.

Three family regressions use the actual terms/permission/processing APIs and processing application workspace with an independent destination. They cover replay interruption and purge restart; a historical grant alongside current withdrawal; both erased terms scopes; missing, duplicated or substituted journal entries; and an unresolved restriction restored without a fabricated receipt. Deleting each of the held/retained permission and processing head pointers prevents reopening. A before/after storage comparison verifies that readiness inspection writes nothing.

The processing application tests separately cover its private recovery fence and denying HTTP boundary. `fence()` is an application-factory maintenance method, absent from its public routes and exported Worker RPC. Trusted hosts must authenticate the original pending intent before using it.

## Provider-native observations

The initial consent-only run passed on 20 October 2026 from commit `9825862`. The expanded four-family run passed on 21 October 2026. Cloudflare restored the SQL baseline, removed its later row, returned erased events/heads, restored an old form grant, and removed both a newer processing restriction and its separate pending fence. The non-restored control retained its closed gate and required negative intents.

The fixture refused ordinary readers, writes, new production, enqueue and dispatch before reconciliation. Interrupted replay resumed after an object restart; bounded purge resumed after another. Both erased terms scopes remained retired, the old form grant returned its original receipt with current `permitted:false`, and unconfirmed processing intent retained a zero head with an active admission fence. Surviving held/retained heads and event bytes were checked directly without replay writes.

Final family counts were four terms acceptances, four permission events and three processing restrictions, alongside the existing three consent events and two complete archives. Retirement physically deleted two terms events and one permission/processing event each. Actual retirement attempts against all later-held family contexts were refused.

The destination stayed outside rollback. Its original one-attempt delivery remained intact; blocked new production and restored queued dispatch added no received attempts. A later unrelated sample delivered successfully. These fixed synthetic observations establish neither real-provider behavior nor exactly-once delivery.

The successful run verified removal of its three recorded SQLite namespaces before deleting the Worker, then confirmed their absence. Failed attempts were also cleaned and do not count as recovery evidence. Keys, bookmarks, resource identities, journals and logs remain private and ignored.

This is a same-object provider recovery exercise using deployed package APIs and a fixed application producer, not a generated-starter or production-host recovery certification. Active selections stay fixed. Provider-native contract/order recovery, complete authenticated journals, access fencing for real jobs/callers, downstream and backup copies, key rotation and legal readiness remain open. Adopters choose CI and operational acceptance.
