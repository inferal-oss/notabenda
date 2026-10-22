<!-- @requirements REQ-PRODUCT-CF-ROLLOUT -->
# Rehearse a starter deployment

The generated starter denies access until its host supplies authorization. Its Worker version, setup assets and stored evidence also have different recovery boundaries. This optional maintainer exercise checks those boundaries against Cloudflare using a new disposable starter.

It creates resources in an explicitly selected, existing account. It never selects a production Worker, custom domain or another application's binding. Cloudflare usage can incur charges. This is maintainer tooling; each adopter chooses their own CI and deployment checks.

## Run deliberately

Build the workspace first. Supply an existing credential through `CLOUDFLARE_API_TOKEN`, then select the account explicitly:

```sh
npm run cf:starter:remote -- --run --account-id YOUR_ACCOUNT_ID
```

The command does not log in, grant permissions or publish packages. It uses the account's existing `workers.dev` subdomain. The private run directory is created beneath ignored `.local/`, with a random resource identity, a separate random fixture capability, source fingerprints and checkpoints. Keep that directory until cleanup is verified. Its reports and credentials must stay out of Git and public assets.

## What happens

1. Initialize the actual starter and build its five setup assets. Deploy its unchanged denying authorization hook and verify that pages and assets refuse access.
2. Add a maintainer-only wrapper and separate control object. The generated Worker class, host, workspace, settings and asset builder stay unchanged. A disposable host adapter grants distinct inspection and editor capabilities; this adapter is never scaffolded or shipped in a package.
3. Install the fixture secret, then pin the baseline version. Verify empty inspection, setup/export/source permissions and an initial legal archive.
4. Remove just the lazy preview asset. Confirm that local doctor detects it, then deliberately deploy this known broken fixture. Verify its exact 404 while the other assets, history and permission checks still work. Archive a later MDX release through the actual private starter RPC.
5. Roll back to the pinned baseline with Wrangler. Check the provider's current version at 100 percent and its pinned script-content fingerprint; mutation is not repeated while probing deployment state. Compare all five asset bytes, the complete newer exported record projections and original private MDX source separately.
6. Add one disposable Durable Object class and seed a sentinel. Attempt rollback across that lifecycle boundary. Require a specific provider lifecycle rejection and unchanged active deployment. Repair forward while retaining the current class layout, namespace IDs, archives and read-only sentinel.
7. Delete only the attested disposable namespaces, then the Worker. Verify their absence.

The script download endpoint can still expose the latest uploaded code after rollback. Uploaded-source ownership, the active version's fingerprint and HTTP behavior are checked separately. Code rollback does not restore stored evidence. Cloudflare also restricts rollback across Durable Object class lifecycle changes; use a reviewed forward repair when that boundary prevents rollback. See [Cloudflare's rollback documentation](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

## If interrupted

An interrupted deployment or archive RPC has an uncertain outcome. The tool records possible source fingerprints and unresolved archive work; it does not blindly repeat archive writes or reopen that gate. Inspect the original private report. For cleanup, use the original directory:

```sh
npm run cf:starter:remote -- --cleanup .local/cf-starter-rollout-ORIGINAL_RUN_ID
```

Cleanup checks the full uploaded-source fingerprint, settled deployment identity, run identity, Worker tag and recorded namespace ownership. A changed or transferred resource is refused. A failed tombstone deployment retains the exact previously attested source so cleanup can resume against the same resources.

## Limits

The exercise covers a fresh environment in an existing account, fixed synthetic legal archives and HTTP setup/asset responses. It does not exercise interactive preview controls, provision a fresh account, certify arbitrary schema migrations or establish production authentication. Fixtures supply no login system. Actual host permission policies, identities, application integrations and regional review remain separate acceptance work.

Provider-native evidence restoration has a separate [recovery exercise](CLOUDFLARE-REMOTE-RECOVERY.md). Its bookmark restores stored state; this exercise rolls back deployed code and assets.
