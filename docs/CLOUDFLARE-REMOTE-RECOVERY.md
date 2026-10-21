<!-- @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY -->
# Rehearse Cloudflare's SQLite recovery

A provider restore can recover SQL tables and key/value records together, including erased records and an old access gate. This optional maintainer command exercises Cloudflare Time Travel against a new, disposable Worker. It keeps the gate and later decisions in a separate Durable Object that is never restored.

The [local starter rehearsal](CLOUDFLARE-RECOVERY.md) tests a different path: copying a bounded KV snapshot into another local object. This remote exercise runs the package's storage APIs against a deployed SQLite object and restores that same object through a provider bookmark. It does not test the generated starter's complete production recovery process.

## Run it deliberately

Use a trusted checkout, install its development dependencies and build the packages. Supply an existing account credential through your usual environment or secret manager, with access to deploy Workers and inspect their scripts and Durable Object namespaces. The command does not create credentials or change account permissions.

```sh
npm run build
# Set CLOUDFLARE_API_TOKEN through your existing credential mechanism.
npm run cf:recovery:remote -- --run --account-id ACCOUNT_ID
```

This command creates a randomly named Worker on the account's existing `workers.dev` subdomain and three new SQLite namespaces. It has no custom domain, route, production binding or connection to another application. The endpoint starts inaccessible without a fresh random bearer key. Synthetic records are compiled locally; no customer records are read or copied. Cloudflare may charge for these resources under your plan.

The command permanently deletes only its own disposable namespaces and Worker on exit. It verifies the Worker tag, bundled source and recorded namespace identities before cleanup, deletes the namespaces through explicit class tombstones, and checks that all three namespaces and Worker are absent. It refuses cleanup if those identities or the deployed executable source have changed. The executable module must match the prepared local bundle byte for byte. Wrangler's adjacent non-executable source map is allowed only under its expected name and v3 shape; its paths can change during upload. Additional modules or assets are rejected.

Adopters decide whether and where to run this check. It is outside the shipped npm packages and initializer, and is not a required CI workflow.

## What happens

The restored evidence object contains consent, terms, form permissions, processing restrictions and document archives. A second object retains the gate and later-decision journal. A third acts as an independent synthetic destination; it is never rolled back.

| Evidence | Later change after the bookmark | Required recovered result |
| --- | --- | --- |
| Cookie consent | Erasure and a newer hold, alongside an earlier hold | The erased event/head are removed again; both holds and unrelated heads survive. |
| Terms acceptance | Retire one subject with agreements in two scopes; hold another | Both erased agreements stay unavailable. Retrying either scope cannot recreate them. |
| Form permission | Withdraw a previously granted permission; erase and hold other streams | The old grant receipt remains historical. Current permission stays withdrawn. |
| Processing restriction | Record an opt-out; fail another recording after its pending fence; erase and hold other streams | Recorded and unresolved restrictions both keep covered work off. Unconfirmed intent creates no new receipt. |

1. Seed the fixed contexts, complete legal archives and a SQL sentinel. Queue two processing jobs before the bookmark. Verify initial state and perform one covered sample delivery as a positive control.
2. Close the external gate. Capture the fixed later negative intents outside the rollback boundary before attempting their writes. Apply the later choices, holds and retirements, complete bounded purges, and seal the full source journal outside the evidence object.
3. Schedule the provider bookmark restore, record its intent and undo bookmark in the control object, and abort the evidence session. An interrupted response is uncertain: inspect the next session instead of blindly restoring again.
4. Confirm native SQL and KV rollback. The erased records return, the form withdrawal and newer processing opt-out disappear, and the pending application fence is gone. The independent gate remains closed and the destination retains its original delivery history. Ordinary inspection, writes, production, enqueue and dispatch all remain unavailable.
5. Refuse an incomplete or substituted journal. Replay holds and later negative choices before retirement and purge. Interrupt replay after the form withdrawal, restart, and resume without changing original receipts. Restore unresolved processing intent as a private admission fence, without inventing a recorded action.
6. Restart again during bounded purge. Reopen only after every fixed decision is reconciled, erased payloads/heads are gone, and surviving event bytes, live heads and evaluated permissions match the expected state. The check is read-only; a missing retained head fails it.
7. Retry an old form grant and both erased terms scopes. Check that the grant's current state remains withdrawn and neither agreement is recreated. New processing and restored queued jobs receive no covered admission. Compare actual destination attempt counts, then deliver an unrelated sample to confirm the destination still works.
8. Verify archived private source bytes, close the fixture and remove all three owned namespaces and the Worker.

Every target operation is serialized across its gate check and storage effects. Closing the gate and then queuing maintenance drains an already admitted operation before maintenance starts. The fixture has no alarms, WebSockets, timers or background jobs; these need additional fencing in a real application. A real network call already admitted before closure cannot be recalled.

## Inspect or finish a run

The command prints its ignored `.local/cf-remote-recovery-<run-id>` directory. The directory has mode `0700`; checkpoint, key and report files have mode `0600`. Treat the entire directory as private: it contains the fixture key, synthetic source, bookmarks, journal, account identity and deployment logs. Do not commit it or upload it as a public artifact.

`run.private.json` records ownership, the current stage, assertions and cleanup status. Successful recovery assertions and successful cleanup are separate fields. A failed assertion still triggers ownership-checked cleanup; a failed cleanup keeps the original identities for a later attempt.

If cleanup was interrupted, inspect that same run and retry cleanup using the original checkout and existing credential:

```sh
npm run cf:recovery:remote -- --cleanup .local/cf-remote-recovery-RUN_ID
```

Do not create another run to conceal an unresolved resource. If the command refuses because ownership changed, investigate the recorded Worker and namespace identities before doing anything destructive. Retain the private run until cleanup is verified.

The expanded remote sequence passed on 21 October 2026, including provider-confirmed cleanup. See the [verification report](verification/cloudflare-remote-recovery.md) for its exact scope.

## Limits

A Time Travel bookmark refers to the existing provider object. It is not a portable backup, an off-provider copy, a cross-account restore or a retention policy. Cloudflare documents a 30-day recovery window and excludes local development from this feature; check the current [SQLite storage documentation](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) for your deployment.

This exercise covers four fixed synthetic evidence families, later choices and holds, document archives, processing admission and one SQL table. It keeps active notices/offers fixed. Contract declarations and order confirmations have a separate local recovery exercise; their provider-native restore remains open. This is not a production journal service, proof of journal completeness/authentication, real provider delivery, cross-device continuity, downstream deletion, backup-copy deletion, availability or legal readiness. Your host must fence every actual access path and preserve a complete, trusted decision journal outside its rollback boundary. The [deployment feature](FEATURES.md#feat-deployment) remains partial.

[Requirement and implementation links](requirements/README.md#req-product-cf-remote-recovery) · [Verification scope](verification/cloudflare-remote-recovery.md)
