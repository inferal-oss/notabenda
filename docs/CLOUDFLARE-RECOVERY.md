# Rehearse a backend recovery

A restored backup can bring back records you have already deleted. Keep it isolated until you have reconciled later retirement decisions and holds, replayed the required purges and verified the surviving records. The [lifecycle API](EVIDENCE-LIFECYCLE.md#restore-before-reopening-traffic) supplies scoped barriers and resumable purge. Your application owns the recovery process and its authorization.

The repository includes an optional maintainer rehearsal for the [Cloudflare starter](CLOUDFLARE-STARTER.md). It uses two local SQLite-backed Durable Objects and synthetic records. It does not connect to a Cloudflare account or change a deployed database. Packages remain unpublished.

For a separate, explicitly deployed provider-native exercise, see [remote SQLite recovery](CLOUDFLARE-REMOTE-RECOVERY.md). Its gate lives outside the restored object; it also tests a hold added after the bookmark. The [transaction recovery exercise](#recover-declarations-and-order-confirmations) below covers local contract declarations and order confirmations with an independent delivery provider. These are different checks; none establishes your production host's complete recovery process.

## Run the local rehearsal

From a trusted repository checkout with its development dependencies installed:

```sh
npm run build
NOTABENDA_STARTER_CHECK_PORT=4186 node scripts/check-cf-starter-runtime.mjs
```

Choose a free loopback port from 4181 through 4190; the default is 4181. The script creates a new ignored `.local/cf-starter-check-<random-id>` directory, builds the generated setup assets, performs that project's Wrangler dry run, starts its own local Worker and stops it on exit. It never stops another server. The retained directory contains the fixture, logs and private recovery files for inspection. Remove that disposable output when you no longer need it.

This command is maintainer tooling. Adopters choose their own CI and operational checks. The test's fictional role header, backup controls and recovery RPC are injected into its disposable Worker copy; they are absent from the shipped initializer and packages. Do not copy these controls into a production endpoint.

## What the rehearsal proves

The generated authorization hook first denies access unchanged. A test-only hook then separates inspection, setup, export and private-source access. The script records immutable public and authored releases and confirms they survive a Worker restart.

The recovery portion then exercises this sequence:

1. Record consent choices in three separate contexts. Put one context on hold and leave a second unrelated context retained.
2. Save the source object's complete `notabenda/` key/value subtree before erasing the third context. The fixture makes no concurrent writes during this small snapshot. Save the file and retain its expected SHA-256 in the runner.
3. Retire the third context and begin a one-key-per-batch purge. Restart the Worker before finishing, then save the completed retirement manifest outside the backup file.
4. Restore the old snapshot into a different, empty local object. Its ordinary inspection and archive RPC are denied by default before hydration, after hydration and after a restart. Premature opening and old-grant replay are refused.
5. Reject a mismatched decision ID. Apply the expected retirement manifest, restarting its scan from the beginning. Restart during purge again and finish the bounded scan before opening the fixture.
6. Verify that the erased event and head are gone, an old grant cannot recreate them, both other heads remain at revision one, the hold still blocks retirement and exactly two consent events remain.
7. Read the restored release history and compare the private MDX source response byte for byte with its original response.

The test also checks that an admin JSON download is a `notabenda-evidence-segment` with live-read metadata and explicit exclusions. That filtered inspection export excludes private authored source; use it for investigation, not as a restorable storage backup.

## Inspect the result

The script prints its disposable directory. Its three recovery files are created with owner-only `0600` permissions and checked before success:

| File | Contents |
| --- | --- |
| `recovery-backup.private.json` | Bounded local `notabenda/` KV snapshot, including public and private archives. |
| `retirement.private.json` | The later completed decision used to reapply the retirement barrier. |
| `recovery-report.private.json` | Counts, snapshot digest and verified recovery assertions, with the exercise's limits. |

Fixture gate metadata is outside `notabenda/` and is deliberately excluded from the snapshot. The destination starts closed independently of any backed-up gate value. The fixture accepts at most 1,000 distinct snapshot keys, requires an empty destination and refuses a second hydration. These bounds are tailored to the synthetic exercise.

## What your host still needs

This is a local KV restore exercise for one consent context. It is not a provider-native SQLite backup, a remote-account recovery, or a recovery test for every evidence family. It does not establish operational availability or legal compliance.

For your deployment, choose backup capture, encryption, access, retention, transport and restore tooling appropriate to your infrastructure. Preserve and authenticate a complete retirement and hold journal outside the rollback boundary. Reconcile all applicable decisions before releasing any reader, writer, scheduled job or binding caller. The library cannot discover a missing decision or authenticate a manifest for you.

The held context here was already held when the backup was taken. This exercise does not test replay of a newer hold-only decision. `restore()` accepts a retirement manifest; it is not an importer for arbitrary hold state. Your recovery process must also restore later holds before purging or reopening traffic.

Shared archives, retained lifecycle metadata, application records, downstream recipients, external logs, downloaded exports and other backup copies need their own policy and checks. Keep the [deployment feature](FEATURES.md#feat-deployment) partial until the actual host rollout and recovery process have been exercised.

Linked requirement: [REQ-PRODUCT-CF-RECOVERY-REHEARSAL](requirements/README.md#req-product-cf-recovery-rehearsal). See [verification](verification/cloudflare-recovery.md) for the tested scope.

## Recover declarations and order confirmations

An old backup can restore a pending delivery job even though the receiving provider has already accepted it. Before resuming dispatch, reconcile the provider's stable job IDs as well as later holds and deletions. A pending entry in a restored database does not prove that nothing was sent.

The optional transaction rehearsal runs three separate local SQLite objects: the source, a fresh recovery target and an independent simulated provider. It uses the existing contract declaration, paid-order, confirmation, dispatch and lifecycle APIs. No production routes, provider credentials or scheduler are installed.

```sh
npm run build
npm run cf:recovery:transactions
# Or choose another free test port:
NOTABENDA_TRANSACTION_RECOVERY_PORT=4188 npm run cf:recovery:transactions
```

The default port is 4187; only free loopback ports 4181–4190 are accepted. The command stops its own Worker on success or failure and leaves an ignored `.local/transaction-recovery-<random-id>` directory. Its backup, later-decision journal and report are owner-only files. The generated directory also contains the synthetic fixture and temporary local capability; do not publish it. Adopters decide whether to run this check in CI.

### What happens in the exercise

1. Capture four declarations and four admitted orders with complete fictional confirmation files. Save a bounded KV snapshot while all delivery jobs are pending.
2. Deliver two contexts in each family. For a third, simulate a lost response after provider acceptance. Put the fourth on hold after the snapshot. Retire and purge one of the delivered contexts, retaining its completed decision separately.
3. Hydrate a different, empty object. Keep reads, replay/admission, file access and dispatch closed. Reject another hydration, source seeding and an early attempt to reopen.
4. Replay the later hold-only decisions first through `setHold()`. Restart and verify the holds still prevent retirement. Apply the later retirement manifests through `restore()`, purge in one-key batches and restart during purge. Open only after the fixture's known decisions have been reconciled and purges completed.
5. Verify physical removal of the retired event and order payload subtree. The old declaration cannot be recreated, and the retired order is refused before its host admission callback. Neither can invoke the provider or expose retired confirmation files.
6. Retry the other restored jobs against the provider that was never rolled back. The stable IDs and exact payloads let that provider return its existing acceptance. Lost responses remain uncertain across restart until the explicit retry succeeds. Original receipts and every surviving confirmation/attachment byte match, including files split into multiple storage chunks.

The expected provider result is **nine distinct jobs, eighteen attempts and nine commits**. This proves deduplication against this simulated provider. It does not establish exactly-once email delivery, recipient receipt, refunds, cancellation or fulfillment.

### Apply the recovery pattern to your host

Keep readers, admission/capture routes, file downloads, dispatchers, scheduled jobs and binding callers fenced for the entire restore and reconciliation window. Drain or fence already admitted work before taking that boundary as closed. Keep the gate and the authenticated decision journal outside the storage being rolled back.

Reapply later holds before destructive work. `restore()` takes retirement manifests; use the revision-checked hold API for hold-only decisions. Finish the scoped purges and inspect unrelated records before opening. A legal hold preserves evidence; it is not itself a delivery cancellation.

Keep the provider's durable idempotency history long enough to cover your recovery horizon. Use the original `deliveryId`, exact sealed payload and fixed destination version when reconciling or retrying. Attempt tokens and ledger versions are local fencing values, not downstream idempotency keys. If the provider cannot establish the old job's outcome or has expired its deduplication history, keep it unresolved and investigate before retrying; this exercise's provider deliberately retains that history.

This is a synthetic KV restore into a fresh object, not a provider-native SQLite restore or an in-place rollback. Its journal is trusted test input with fixed target identities, not an authenticated journal service or proof that all real decisions were found. It covers contract declarations and order/confirmation evidence; consent has separate rehearsals, while terms, form permissions and processing restrictions are covered by the separate [provider-native rehearsal](CLOUDFLARE-REMOTE-RECOVERY.md). Provider-native contract/order restoration remains open. Payment, stock, fulfillment, external-copy deletion and actual provider behavior remain host work. See [transaction recovery verification](verification/transaction-recovery.md).
