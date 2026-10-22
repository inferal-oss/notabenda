<!-- @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY -->
# Remote SQLite recovery verification

Requirement: `REQ-PRODUCT-CF-REMOTE-RECOVERY`. The [operator guide](../CLOUDFLARE-REMOTE-RECOVERY.md) describes explicit invocation, resource creation, ownership checks, private reports and cleanup recovery.

The runner is `scripts/check-cf-remote-recovery.mjs`; deployed controls are isolated under `scripts/fixtures/remote-recovery*.mjs`. They are maintainer fixtures, outside package exports and the starter initializer.

Direct regressions also normalize retained null-prototype records and native SQL rows for the RPC boundary. They cover default-closed epochs, journal target substitution and immutability, restore-intent binding, the whole-operation gate boundary, queued maintenance after an admitted read, HTTP authentication before object selection, fixed routing, request byte limits, explicit account invocation, single-module executable attestation with an adjacent source map, private ownership checkpoints, outside modifications and transferred namespace refusal.

The optional remote command asserts native SQL and KV rollback through a Cloudflare bookmark; an independently retained gate and decision journal; later holds, withdrawals and recorded/unconfirmed processing restrictions; interruption during replay; bounded purge restart; physical erased-event/head removal; unchanged surviving event bytes and live state; and provider-confirmed removal of three disposable namespaces and the Worker.

## Direct checks

Seventeen remote-tool regressions cover gate ordering, authenticated readiness before anonymous refusal, journal identity, outgoing/incoming plain-JSON RPC normalization, HTTP authority, executable source attestation and cleanup ownership. Every exposed ordinary family operation checks the closed gate before touching evidence storage.

Three family regressions use the actual terms/permission/processing APIs and processing application workspace with an independent destination. They cover replay interruption and purge restart; a historical grant alongside current withdrawal; both erased terms scopes; missing, duplicated or substituted journal entries; and an unresolved restriction restored without a fabricated receipt. Deleting each of the held/retained permission and processing head pointers prevents reopening. A before/after storage comparison verifies that readiness inspection writes nothing.

The processing application tests separately cover its private recovery fence and denying HTTP boundary. `fence()` is an application-factory maintenance method, absent from its public routes and exported Worker RPC. Trusted hosts must authenticate the original pending intent before using it.

## Provider-native observations

The initial consent-only run passed on 20 October 2026 from commit `9825862`. The expanded four-family run passed on 21 October 2026. Cloudflare restored the SQL baseline, removed its later row, returned erased events/heads, restored an old form grant, and removed both a newer processing restriction and its separate pending fence. The non-restored control retained its closed gate and required negative intents.

The fixture refused ordinary readers, writes, new production, enqueue and dispatch before reconciliation. Interrupted replay resumed after an object restart; bounded purge resumed after another. Both erased terms scopes remained retired, the old form grant returned its original receipt with current `permitted:false`, and unconfirmed processing intent retained a zero head with an active admission fence. Surviving held/retained heads and event bytes were checked directly without replay writes.

Final family counts were four terms acceptances, four permission events and three processing restrictions, alongside the existing three consent events and two complete archives. Retirement physically deleted two terms events and one permission/processing event each. Actual retirement attempts against all later-held family contexts were refused.

The destination stayed outside rollback. Its original one-attempt delivery remained intact; blocked new production and restored queued dispatch added no received attempts. A later unrelated sample delivered successfully. These fixed synthetic observations establish neither real-provider behavior nor exactly-once delivery.

The successful run verified removal of its three recorded SQLite namespaces before deleting the Worker, then confirmed their absence. Failed attempts were also cleaned and do not count as recovery evidence. Keys, bookmarks, resource identities, journals and logs remain private and ignored.

## Contract and order observations

The six-family run passed on 21 October 2026, including native rollback of four declarations and four paid-order/confirmation contexts. Compact file recipes expand into actual archived bytes; they do not reduce the 150 KB attachment or multi-chunk storage checks. The complete combined HTTP journal fits the existing 16 KiB limit, and executable/source-map bounds remain unchanged.

An independent provider object in the existing destination namespace receives and hashes each complete immutable payload, including confirmation file bytes and destination version. Before rollback it holds nine accepted jobs, with response loss simulated only after acceptance. Rollback restores pending outboxes without rewinding that provider.

The fixture restores transaction holds before retirements, interrupts after the holds, and resumes after restart. One-key purge also resumes after restart. Retired declarations cannot be captured or dispatched; retired order admission never invokes its host callback, and its confirmation files remain inaccessible. All surviving receipts, immutable content and exact file bytes are preserved. The first recovered opening requires complete original pending jobs. Later openings compare full outbox snapshots outside rollback, while held pending jobs must still match the original baseline.

Accepted-job retries preserve stable IDs and content digests. Another accepted response is deliberately lost; explicit status, lease, provider reference, attempts and version assertions establish persisted uncertainty before restart. The next retry settles accepted. Final provider totals are nine stable jobs, eighteen received attempts and nine commits; this tests the synthetic provider’s behavior, not real exactly-once delivery.

Seven direct transaction regressions cover the complete replay/retry path, malformed or substituted journals, gate-before-storage ordering, changed provider content, delayed sends, aborted work and rejected provider RPCs. A dispatch timeout does not end actual work: fulfilled sends drain before releasing the gate. A rejected send leaves an external in-flight marker and blocks decisions, purge, restore and reopening. Valid cancelled delivery metadata fails the initial pending-state check; corrupted stored file chunks fail readiness.

Four attempts were made for this extension. The first three ended on non-JSON route responses before restore; the later two explicitly recorded HTML 404 pages. Every attempt was cleaned and none counts as recovery proof. The successful run waits for consecutive authenticated read-only readiness responses; it never blindly retries mutation. All three owned namespaces and the Worker were confirmed removed afterward.

## Disposable access-key rotation

A further native run passed on 21 October 2026 with the recovered gate closed. A real secret update installed a new random fixture capability. Consecutive paired endpoint probes accepted the replacement and rejected the previous key; anonymous access remained denied. The complete summary before and after matched, including SQL/KV evidence, external journal/gate, stored outbox snapshots and independent provider histories. Ordinary evidence access remained closed. Namespace and Worker cleanup was verified.

Three added direct regressions cover paired propagation probes, old-key refusal before object selection, and pre/post-update ownership ordering. A changed, missing or cleaning-up Worker receives no secret update; uncertain update responses still trigger re-attestation. The ownership-order tightening was checked directly after the native observation. This check rotates only a disposable fixture capability. It does not certify global revocation, production host keys, account-token rotation, signing-key continuity or identity-provider sessions.

This is a same-object provider recovery exercise using deployed package APIs and a fixed application producer, not a generated-starter or production-host recovery certification. Active selections stay fixed. Complete authenticated journals, access fencing for real jobs/callers, downstream and backup copies, key rotation and legal readiness remain open. Adopters choose CI and operational acceptance.
