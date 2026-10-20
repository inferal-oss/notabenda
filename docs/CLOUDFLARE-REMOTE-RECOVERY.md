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

This command creates a randomly named Worker on the account's existing `workers.dev` subdomain and two new SQLite namespaces. It has no custom domain, route, production binding or connection to another application. The endpoint starts inaccessible without a fresh random bearer key. Synthetic records are compiled locally; no customer records are read or copied. Cloudflare may charge for these resources under your plan.

The command permanently deletes only its own disposable namespaces and Worker on exit. It verifies the Worker tag, bundled source and recorded namespace identities before cleanup, deletes the namespaces through explicit class tombstones, and checks that both namespaces and Worker are absent. It refuses cleanup if those identities or the deployed executable source have changed. The executable module must match the prepared local bundle byte for byte. Wrangler's adjacent non-executable source map is allowed only under its expected name and v3 shape; its paths can change during upload. Additional modules or assets are rejected.

Adopters decide whether and where to run this check. It is outside the shipped npm packages and initializer, and is not a required CI workflow.

## What happens

1. Create four consent contexts: one to erase, one held before the bookmark, one held later, and an unrelated retained context. Archive two releases, including private MDX source. Add a SQL sentinel row.
2. Record a provider bookmark. Exercise ordinary access, then close the external gate. Erase the first context, place the later hold and change SQL rows. Save the completed retirement and hold journal separately from the object being restored.
3. Schedule the bookmark restore, record the restore intent and undo bookmark in the control object, and abort the evidence object's session. An interrupted response is uncertain: the runner inspects the next session instead of blindly repeating the restore.
4. Confirm that SQL rows rolled back, the erased event and physical head returned, and the later hold disappeared. The independent gate remains closed. Ordinary reads, archive writes and grant replay stay blocked.
5. Apply the later hold before replaying the retirement. Refuse opening until a bounded purge completes. Restart partway through that purge and resume from persisted progress.
6. Verify that the erased event and physical head are gone, its old grant remains retired, both holds still reject erasure, three surviving heads retain their revisions, both archives remain readable and the private source hash matches its original bytes. Open the fixture only after those checks, then close and remove it.

Every target operation is serialized across its gate check and storage effects. Closing the gate and then queuing maintenance drains an already admitted operation before maintenance starts. The fixture has no alarms, WebSockets, timers or background work; these require additional fencing in a real application.

## Inspect or finish a run

The command prints its ignored `.local/cf-remote-recovery-<run-id>` directory. The directory has mode `0700`; checkpoint, key and report files have mode `0600`. Treat the entire directory as private: it contains the fixture key, synthetic source, bookmarks, journal, account identity and deployment logs. Do not commit it or upload it as a public artifact.

`run.private.json` records ownership, the current stage, assertions and cleanup status. Successful recovery assertions and successful cleanup are separate fields. A failed assertion still triggers ownership-checked cleanup; a failed cleanup keeps the original identities for a later attempt.

If cleanup was interrupted, inspect that same run and retry cleanup using the original checkout and existing credential:

```sh
npm run cf:recovery:remote -- --cleanup .local/cf-remote-recovery-RUN_ID
```

Do not create another run to conceal an unresolved resource. If the command refuses because ownership changed, investigate the recorded Worker and namespace identities before doing anything destructive. Retain the private run until cleanup is verified.

## Limits

A Time Travel bookmark refers to the existing provider object. It is not a portable backup, an off-provider copy, a cross-account restore or a retention policy. Cloudflare documents a 30-day recovery window and excludes local development from this feature; check the current [SQLite storage documentation](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) for your deployment.

This exercise covers fixed synthetic consent records, two holds, document archives and one SQL table. It does not prove all-family recovery, completeness or authentication of an application's decision journal, downstream deletion, backup-copy deletion, availability, production authorization or legal readiness. Your host must fence every actual access path and preserve a complete, trusted decision journal outside its rollback boundary. The [deployment feature](FEATURES.md#feat-deployment) remains partial.

[Requirement and implementation links](requirements/README.md#req-product-cf-remote-recovery) · [Verification scope](verification/cloudflare-remote-recovery.md)
