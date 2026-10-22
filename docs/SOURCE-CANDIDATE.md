<!-- @requirements REQ-PRODUCT-SOURCE-CANDIDATE -->
# Build and exercise a source candidate

Use this maintainer workflow when you want to know which source produced the package archives and whether those archives work in a separate application. It builds an explicit Git revision twice, compares the archives, installs those exact bytes and exercises an adopter workflow. It never publishes packages or deploys a Worker.

```sh
npm run release:source -- \
  --revision YOUR_REVIEWED_COMMIT \
  --cache /path/to/populated/npm-cache \
  --out-dir .local/source-candidate-1
```

Choose a trusted source revision and a new output directory whose parent exists. Build scripts from that revision run as local code. Offline npm installation and a reduced child environment do not sandbox those scripts or establish network isolation.

The cache must already contain the revision's locked dependencies, including packages for the current operating system and architecture. This command does not populate it from the network. Prepare it through your normal dependency-review process. Missing cached dependencies produce a **blocked** stage and a nonzero exit; there is no online fallback. A nonexistent cache is reported as `offline-cache-unavailable` before output is created.

Inside this repository, output must be under ignored `.local/` or `dist/`. An external output directory also works. Existing directories, including symlinks, are never replaced. The workflow reads committed objects, so unfinished workspace changes and existing `dist` files do not enter the candidate. Commit the source you intend to test first; `--revision HEAD` means the resolved commit at the start of the run.

## What the workflow does

1. Resolves the commit and tree with Git replacement objects disabled and inherited Git overrides removed. Reads bounded regular blobs directly, verifies their object hashes and records their paths, modes and SHA-256 digests. It performs no checkout or reset. Symlinks, submodules, unsafe paths and project `.npmrc` files are rejected by this recipe.
2. Copies those source bytes into two fresh temporary directories outside the repository. Each gets an offline, locked `npm ci` with dependency lifecycle scripts disabled, then the revision's normal package build and [package-content checker](RELEASE-CANDIDATE.md). Child processes receive essential platform paths and the workflow's explicit npm settings, without inherited credentials or Node execution overrides.
3. Compares all three archive digests, complete file manifests and actual compressed bytes. Only identical archives continue. This establishes repeatability on the recorded toolchain and platform; it does not establish cross-platform reproducibility or signed provenance.
4. Creates a separate application with the three exact archives. Its lockfile retains the selected revision's dependency closure and replaces the workspace siblings with local archive references. Installation stays offline. Every installed candidate file is hashed again, and workspace links, nested sibling copies or registry substitution are rejected.
5. Exercises YAML configuration through the shipped CLI, rejects draft production input, then builds a synthetic reviewed release and compiled cookie runtime. Installed MDX authoring supplies the final terms document. Pinned policy and notice files, a separate collection flow and its editor must keep that exact artifact identity. The fixture's review declarations exercise validation; they are not legal review.
6. Bundles the consent entry for the browser, checks its dependency boundary and exercises the real controls/controller with temporary storage and simulated services in a DOM environment. Its dialog shim is explicit; this is not a native-browser accessibility check. Selected consumer usage and shipped declarations are typechecked without skipping library checks.
7. Generates the Cloudflare starter through its shipped CLI, moves it outside the consumer tree and installs it independently. The original manifest must declare the expected sibling versions and pinned build tools. Local archive references replace only those unpublished sibling dependencies. Its advertised `npm run check` must build assets and pass Wrangler's deployment dry run. The default host hook must deny access before reading storage or assets.

The starter check creates no cloud resources and supplies no authentication system. Actual Durable Object execution, host authorization, production routing, migrations and recovery need their own operational checks.

## Review the result

`source-candidate.json` records the commit/tree, input-manifest and lockfile digests, Node/npm/platform versions, verifier hashes, stage outcomes, package identities and consumer results. Successful status is **`source-built-consumer-checked`**. `source-inputs.json` lists the exact committed inputs. Stage logs replace the workflow's temporary, repository and cache paths with labels.

`packages/` contains the checked archives. `consumer/` contains the independent package manifest, lockfile, verifier, fixture inputs and copies of those archives. `evidence/` retains the exercised YAML, collection settings, authored public release and browser bundle. `starter/` records the generated and locally adapted manifests, lockfile and result. These are local review artifacts; do not upload the directory as website assets.

Failed or blocked runs keep their report, logs and any completed candidate archives. The workflow removes only its own temporary directories. If temporary cleanup fails, the overall result is failed. An existing output remains untouched; correct the problem and select a new output directory.

Publication still requires a separate decision. This workflow does not audit dependency vulnerabilities, prove secret absence, conduct legal review, verify external providers or certify an adopter's production integration. Adopters decide which checks to use and how to integrate them into CI. See the [verification record](verification/source-candidate.md).
