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

The restored evidence object contains consent, terms, form permissions, processing restrictions, contract declarations, paid-order confirmations and document archives. A separate object retains the gate and later-decision journal. Two independent synthetic destinations retain processing attempts and transaction-provider jobs. Both use the third namespace and stay outside rollback.

| Evidence | Later change after the bookmark | Required recovered result |
| --- | --- | --- |
| Cookie consent | Erasure and a newer hold, alongside an earlier hold | The erased event/head are removed again; both holds and unrelated heads survive. |
| Terms acceptance | Retire one subject with agreements in two scopes; hold another | Both erased agreements stay unavailable. Retrying either scope cannot recreate them. |
| Form permission | Withdraw a previously granted permission; erase and hold other streams | The old grant receipt remains historical. Current permission stays withdrawn. |
| Processing restriction | Record an opt-out; fail another recording after its pending fence; erase and hold other streams | Recorded and unresolved restrictions both keep covered work off. Unconfirmed intent creates no new receipt. |
| Contract declarations | Deliver separate acknowledgement/application jobs, then retire one declaration and hold another | Retired declarations cannot be recreated or dispatched. Surviving jobs retain their IDs, content and original receipts. |
| Paid-order confirmations | Accept or lose a delivery response; retire one checkout and hold another | Retired admission refuses host work and file access. Surviving confirmation files and recipient version remain exact. |

1. Seed the fixed contexts, complete legal archives and a SQL sentinel. Queue two processing jobs and prepare eight transaction contexts before the bookmark. Verify initial state, perform one covered processing delivery, and send the transaction jobs. The synthetic provider accepts nine jobs, including three whose accepted responses are deliberately discarded.
2. Close the external gate. Capture the fixed later negative intents outside the rollback boundary before attempting their writes. Apply the later choices, holds and retirements, complete bounded purges, and seal the full source journal outside the evidence object.
3. Schedule the provider bookmark restore, record its intent and undo bookmark in the control object, and abort the evidence session. An interrupted response is uncertain: inspect the next session instead of blindly restoring again.
4. Confirm native SQL and KV rollback. The erased records return, the form withdrawal and newer processing opt-out disappear, and the pending application fence is gone. The independent gate remains closed and the destination retains its original delivery history. Ordinary inspection, writes, admission, file access, production, enqueue and dispatch all remain unavailable. The transaction outboxes return to pending even though their independent provider already accepted the jobs.
5. Refuse an incomplete or substituted journal. Replay holds and later negative choices before retirement and purge. Interrupt replay after the form withdrawal, restart, then interrupt transaction replay after its holds and restart again. Resume without changing original receipts. Restore unresolved processing intent as a private admission fence, without inventing a recorded action.
6. Restart again during bounded purge. Reopen only after every fixed decision is reconciled, erased payloads/heads are gone, and surviving event bytes, live heads and evaluated permissions match the expected state. The check is read-only; a missing retained head or changed surviving pending job fails it. First reopening requires every restored transaction job to match its original pending state. Later reopenings compare full job states with snapshots retained by the external control; held jobs must always match their original state.
7. Retry an old form grant and both erased terms scopes. Check that the grant's current state remains withdrawn and neither agreement is recreated. New processing and restored queued jobs receive no covered admission. Compare actual destination attempt counts, then deliver an unrelated sample to confirm the destination still works.
8. Refuse retired transaction capture, dispatch and confirmation files. Retry restored pending jobs with their original IDs and complete immutable payloads. Lose an accepted response again, assert the persisted uncertain state, restart, then retry successfully. Verify all surviving file lengths and hashes, including 150 KB attachments. The independent provider must show nine jobs, eighteen attempts and nine commits.
9. With recovery closed, rotate only the disposable host’s HTTP capability. Require consecutive paired probes that accept the replacement key and reject the previous one, plus anonymous rejection. Compare the complete evidence, gate/journal and both destination histories before and after the update.
10. Verify archived private source bytes and remove all three owned namespaces and the Worker.

Every target operation is serialized across its gate check and storage effects. Closing the gate and then queuing maintenance drains an already admitted operation before maintenance starts. The fixture has no alarms, WebSockets or scheduled/background dispatch. Transaction dispatch uses bounded timeout timers but drains the actual provider promises before releasing its operation. An external in-flight marker prevents maintenance if the object aborts or an actual provider RPC rejects; local transport failure does not prove that remote work ended. Real applications need fencing for their own jobs and callers. A real network call already admitted before closure cannot be recalled.

### Fixture access-key rotation

The runner re-attests the existing Worker’s source, tag, modification metadata and namespace IDs before updating its secret, while outside changes are still rejected. A missing or cleaning-up Worker cannot receive the update. It records the mutation window privately and re-attests afterward, including when the update response is uncertain. It does not retry that mutation automatically.

Cloudflare’s [secret documentation](https://developers.cloudflare.com/workers/configuration/secrets/) explains that this command deploys a Worker version. [Worker versions](https://developers.cloudflare.com/workers/versions-and-deployments/) do not version the associated storage state. The rehearsal checks this separation directly rather than treating deployment success as evidence preservation.

The old and replacement fixture keys remain in owner-only ignored files. Paired probes establish the observed endpoint behavior, not global edge revocation. No account token, production credential, host identity provider or receipt-signing key is rotated. Adopters must exercise their own credential lifecycle and authorization paths.

## Inspect or finish a run

The command prints its ignored `.local/cf-remote-recovery-<run-id>` directory. The directory has mode `0700`; checkpoint, key and report files have mode `0600`. Treat the entire directory as private: it contains the fixture key, synthetic source, bookmarks, journal, account identity and deployment logs. Do not commit it or upload it as a public artifact.

`run.private.json` records ownership, the current stage, assertions and cleanup status. Successful recovery assertions and successful cleanup are separate fields. A failed assertion still triggers ownership-checked cleanup; a failed cleanup keeps the original identities for a later attempt.

If cleanup was interrupted, inspect that same run and retry cleanup using the original checkout and existing credential:

```sh
npm run cf:recovery:remote -- --cleanup .local/cf-remote-recovery-RUN_ID
```

Do not create another run to conceal an unresolved resource. If the command refuses because ownership changed, investigate the recorded Worker and namespace identities before doing anything destructive. Retain the private run until cleanup is verified.

The six-family remote sequence passed on 21 October 2026, including provider-confirmed cleanup. Readiness requires consecutive authenticated, read-only successes while a new `workers.dev` route propagates. Mutating operations are not automatically retried. See the [verification report](verification/cloudflare-remote-recovery.md) for its exact scope.

## Limits

A Time Travel bookmark refers to the existing provider object. It is not a portable backup, an off-provider copy, a cross-account restore or a retention policy. Cloudflare documents a 30-day recovery window and excludes local development from this feature; check the current [SQLite storage documentation](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) for your deployment.

This exercise covers six fixed synthetic evidence families, later choices and holds, document archives, processing and transaction admission, outbox recovery and one SQL table. It keeps active notices/offers fixed. Transaction delivery uses a bounded idempotent synthetic provider; its deduplication does not establish exactly-once delivery or a real provider’s idempotency retention. The separate local transaction exercise tests a fresh-object KV copy rather than native rollback. This is not a production journal service, proof of journal completeness/authentication, real provider delivery, cross-device continuity, downstream deletion, backup-copy deletion, availability or legal readiness. Your host must fence every actual access path and preserve a complete, trusted decision journal outside its rollback boundary. The [deployment feature](FEATURES.md#feat-deployment) remains partial.

[Requirement and implementation links](requirements/README.md#req-product-cf-remote-recovery) · [Verification scope](verification/cloudflare-remote-recovery.md)
