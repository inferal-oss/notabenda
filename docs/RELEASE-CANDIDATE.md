<!-- @requirements REQ-PRODUCT-RELEASE-CANDIDATE -->
# Check a package release candidate

The packages remain unpublished previews. This repository command prepares local tarballs for review; it never runs `npm publish`, installs a consumer package, logs in or changes a registry account. Adopters decide their own CI and release gates.

Build the maintained workspace first, then choose a **new** output directory whose parent exists:

```sh
npm run build
mkdir -p .local
npm run release:check -- --out-dir .local/candidate-review-1
```

The command uses `npm pack --offline --ignore-scripts` for exactly `@notabenda/core`, `@notabenda/cloudflare` and `@notabenda/authoring`. It does not run their prepack hooks; the explicit build above is separate. It reads the actual generated gzip/tar bytes without extracting or executing them. A bounded strict npm ustar reader rejects links, traversal, duplicate entries, unsupported archive metadata and malformed checksums or trailers. A new archive format requires an explicit tool change rather than a permissive fallback.

## What is checked

- Package identities, matching versions, Apache license bytes, expected readmes and required content-license files.
- Files allowed by maintained source/build inputs, including explicit extra assets and starter files. An obsolete compiled file with no current source is rejected.
- Every export and CLI target exists; exported Astro wildcards match packaged components.
- Core and Cloudflare have no runtime dependencies; authoring's direct dependencies are exact versions and use the matching core version. Optional dependency/bundle additions and consumer install/prepare hooks are rejected. React and Astro remain optional core peers.
- Executable files are declared CLI entry points; group/world-writable files are rejected.
- Source maps refer only to their expected relative public source, without absolute host paths, external roots or inline source payloads.
- Each archive's SHA-256 and npm-compatible SHA-512 integrity, and every included file's byte count and SHA-256. The actual file count, total size and integrity must also match npm's pack report.

These are package-content checks. An allowed file can still contain an implementation flaw or an accidentally embedded secret; the tool does not prove their absence. Review code, content licenses, dependency advisories and package contents separately. Direct dependency pinning does not audit transitive dependencies.

## Read the report

The new directory contains three `.tgz` files and `candidate.json`. Standard output gives a compact result. The complete manifest records relative file names and hashes, Git commit, whether tracked changes or untracked files were present, and the lockfile hash. It includes no environment values or absolute source paths.

A successful status is **`package-contents-checked`**. The report explicitly says that this command did not build, install, run tests, publish, check registry ownership, audit vulnerabilities or conduct legal review. It does not establish that the compiled bytes match the named source commit. A commit plus a package digest is a review reference, not a signed provenance attestation. Use the repository's build and packed-consumer tests as separate evidence.

If a check fails, the command exits nonzero and leaves a `failed` report and any tarballs already created for inspection. The error code and, where relevant, relative file path identify the failed check. Do not use a failed or partial candidate. Correct the input and choose a new directory. An existing directory is never overwritten. Inside this repository, output must be under ignored `.local/` or `dist/`, outside package/source/public input trees. A separate local directory outside the repository also works.

## Before a public release

Run the applicable tests, inspect the actual tarballs and clean source state, review dependency and content licenses, and complete the release checklist in [the plan](PLAN.md#11-public-release-checklist-and-deferred-work). Confirm documentation and supported scope, security reporting, installation and migration behavior. Keep private fixtures, operator reports, keys and source archives outside package assets. Publishing requires a separate explicit decision; a successful candidate check grants no permission to publish.

Read [migration and removal](MIGRATION.md) before replacing an existing deployment, and use the [security policy](../SECURITY.md) for suspected vulnerabilities. The [verification record](verification/release-candidate.md) describes the checked boundary.
