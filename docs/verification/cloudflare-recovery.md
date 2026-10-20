<!-- @requirements REQ-PRODUCT-CF-RECOVERY-REHEARSAL -->
# Cloudflare recovery rehearsal verification

Requirement: `REQ-PRODUCT-CF-RECOVERY-REHEARSAL`. Related lifecycle and starter requirements retain their own checks.

`node scripts/check-cf-starter-runtime.mjs` generates and runs a disposable starter against local Wrangler SQLite storage. Test-only recovery controls live under `scripts/fixtures`, outside the shipped package and initializer. The original host hook denies access first; the disposable replacement grants fixed fictional roles and fixed source/restored object targets.

The recovery check captures a complete, bounded `notabenda/` KV subtree before retirement, writes it to an owner-only private file, checks its SHA-256 on disk and hydrates a different empty local object. A duplicate hydration fails. Default-closed ordinary inspection and archive-write RPC remain denied before hydration and across a restart; early opening and grant replay fail. Fixture metadata is excluded from the snapshot.

A later retirement manifest is saved separately. A mismatched decision is rejected before mutation; applying the expected manifest restarts the purge at the beginning. One-key batches and forced process restarts exercise persisted progress on both source and destination. After replay, the targeted event and physical head are absent and the exact old grant stays retired. Both surviving heads retain revision one, two events remain, and the backed-up hold still rejects retirement. Restored immutable history is readable and private MDX source response bytes match exactly.

The admin download is separately checked as a live `notabenda-evidence-segment` with explicit exclusions, no private source attachment and no complete authored input. Its public document text may contain the same prose as the source. The backup, manifest and report files must have mode `0600`.

The local SQLite rehearsal and direct seed-isolation regression passed on 20 October 2026. Astra reviewed the fixture boundary and recovery guide; the seeding bypass it found is covered by both HTTP denial checks and the direct regression. This review did not substitute for the real Wrangler run.

These assertions cover synthetic local KV data and one consent retirement. They do not prove remote provisioning, provider backup restore, all-family recovery, authentication or completeness of an external decision journal, post-backup hold-only replay, external-copy deletion or legal readiness. Fixture isolation covers the tested inspection/archive calls and synthetic replay operation; a production host must fence every access path itself. The deployment feature remains partial. Adopters decide whether and how to run this optional tooling in CI.
