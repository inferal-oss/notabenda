<!-- @requirements REQ-PRODUCT-CF-ROLLOUT -->
# Starter rollout verification

Requirement: `REQ-PRODUCT-CF-ROLLOUT`. Run instructions and limits are in the [operator guide](../CLOUDFLARE-ROLLOUT.md).

Direct tests cover distinct fixture capabilities, maintenance authentication before object selection, bounded fixed operations, default closure, closed-only archive writes, restart-persistent unresolved writes, read-only sentinel checks, strict resource profiles, pending-source stage limits and resumable cleanup after an uncertain deployment. Deployment parsing requires one version at 100 percent. Generic network errors and unrelated class diagnostics cannot count as lifecycle rollback rejection. Read-only probes distinguish latest uploaded bytes from the active version and its pinned content fingerprint; unrelated uploads, deployments or fingerprints are refused.

Verified against Cloudflare on 21 October 2026:

- The fresh generated starter denied pages and assets before host authorization was supplied.
- Reader access remained separate from setup, export and private-source permissions. Local doctor detected the deliberately omitted preview module; its deployed request returned 404 while the other four asset fingerprints matched.
- A real Wrangler rollback selected the pinned baseline version at 100 percent with its original script-content fingerprint. All five HTTP asset bytes and content types returned to baseline. Both complete exported record projections and the later private MDX source remained exact.
- Cloudflare rejected rollback across the added canary class with `orphaned_provisioned_namespace`, code `100402`. The exercise requires that exact class-specific provider diagnostic, unchanged deployment and a read-only surviving sentinel. Forward repair restored the asset while retaining all three namespace IDs, archives and source.
- All three owned namespaces and the Worker were removed and their absence verified.

The script download endpoint continued to return latest uploaded code after rollback. This is why uploaded-byte ownership, immutable version fingerprints and active deployment/HTTP behavior are separate checks. A code rollback is not a stored-evidence restore.

Final local checks: 1,226 package tests and 194 site tests, catalog/service-catalog validation and the website Worker dry run. Native reports, version identities, source bytes and capabilities remain private ignored run artifacts.

The generated host/workspace/settings/asset-builder bytes are pinned. The fixture changes only its private wrapper and host authorization adapter. No fixture credentials, maintenance endpoint, control class or canary class enters the initializer or npm archives.

The deployment feature remains partial: fresh-account setup, real host access policies, arbitrary schema/data migrations, interactive browser behavior and production operations require separate acceptance.
