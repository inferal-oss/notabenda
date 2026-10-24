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

Activate the Node/npm pair you intend to check before starting. The workflow uses that Node process and finds npm through `PATH`; each report records both versions. Use a new output directory for each pair. A passing run on a newer toolchain does not establish support for the declared minimum: the [npm 10 override regression](verification/toolchain-dependencies.md#npm-10-installation-correction) was found by repeating the workflow on Node 22.22.0 with its bundled npm 10.9.4.

Inside this repository, output must be under ignored `.local/` or `dist/`. An external output directory also works. Existing directories, including symlinks, are never replaced. The workflow reads committed objects, so unfinished workspace changes and existing `dist` files do not enter the candidate. Commit the source you intend to test first; `--revision HEAD` means the resolved commit at the start of the run.

## What the workflow does

1. Resolves the commit and tree with Git replacement objects disabled and inherited Git overrides removed. Reads bounded regular blobs directly, verifies their object hashes and records their paths, modes and SHA-256 digests. It performs no checkout or reset. Symlinks, submodules, unsafe paths and project `.npmrc` files are rejected by this recipe.
2. Copies those source bytes into two fresh temporary directories outside the repository. Each gets an offline, locked `npm ci` with dependency lifecycle scripts disabled, then the revision's normal package build and [package-content checker](RELEASE-CANDIDATE.md). Child processes receive essential platform paths and the workflow's explicit npm settings, without inherited credentials or Node execution overrides.
3. Compares all three archive digests, complete file manifests and actual compressed bytes. Only identical archives continue. This establishes repeatability on the recorded toolchain and platform; it does not establish cross-platform reproducibility or signed provenance.
4. Creates a separate application with the three exact archives. Its lockfile retains the selected revision's dependency closure and replaces the workspace siblings with local archive references. Installation stays offline. Every installed candidate file is hashed again, and workspace links, nested sibling copies or registry substitution are rejected.
5. Exercises YAML configuration through the shipped CLI, rejects draft production input, then builds a synthetic reviewed release and compiled cookie runtime. Installed MDX authoring supplies the final terms document. Pinned policy and notice files, a separate collection flow and its editor must keep that exact artifact identity. The fixture's review declarations exercise validation; they are not legal review.
6. Bundles the consent entry for the browser, checks its dependency boundary and exercises the real controls/controller with temporary storage and simulated services in a DOM environment. Its dialog shim is explicit; this is not a native-browser accessibility check. Selected consumer usage and shipped declarations are typechecked without skipping library checks.
7. Generates the Cloudflare starter through its shipped CLI, moves it outside the consumer tree and installs it independently. The original manifest must declare the expected sibling versions and pinned build tools. Local archive references replace only those unpublished sibling dependencies. Its advertised `npm run check` must build assets and pass Wrangler's deployment dry run. The default host hook must deny access before reading storage or assets. The generated scoped Miniflare client override must match the reviewed source manifest, explicitly select the installed parent version and retain the patched client. The separately installed starter records both actual versions.

The starter check creates no cloud resources and supplies no authentication system. Actual Durable Object execution, host authorization, production routing, migrations and recovery need their own operational checks.

## Review the result

`source-candidate.json` records the commit/tree, input-manifest and lockfile digests, Node/npm/platform versions, verifier hashes, stage outcomes, package identities and consumer results. Successful status is **`source-built-consumer-checked`**. `source-inputs.json` lists the exact committed inputs. Stage logs replace the workflow's temporary, repository and cache paths with labels.

`packages/` contains the checked archives. `consumer/` contains the independent package manifest, lockfile, verifier, fixture inputs and copies of those archives. `evidence/` retains the exercised YAML, collection settings, authored public release and browser bundle. `starter/` records the generated and locally adapted manifests, lockfile and result. These are local review artifacts; do not upload the directory as website assets.

## Try the installed controls in a browser

Successful new runs also prepare `evidence/browser-review/` from the isolated consumer's installed bundle, stylesheet, compiled configuration and exact pinned documents. Start its loopback server separately:

```sh
npm run release:review -- \
  --candidate .local/source-candidate-1 \
  --port 62546
```

Open the printed `http://127.0.0.1:62546/` URL in the browser you want to check. Use a new unused port for a fresh browser origin. An occupied port is an error; the command never stops another server. Stop your review server when finished.

The page walks through the actual native controls, saved-choice reload, rejection and a second tab. It shows service starts, cleanup calls and presence of one disposable localStorage marker. Each allowed service start makes one real `POST /probe` request to that server. **Read local counter** shows how many probes the server received, across every tab since that server started. Page counters reset on reload. Rejecting a choice cannot remove a request already counted, and an aborted response does not prove that a request never arrived.

The separate choice-storage failure route supplies an adapter whose methods throw. It does not change browser settings. A grant that cannot be saved must keep optional work blocked, before and after reload; inaccessible saved choices must not become restored permission. The sample service's marker still uses ordinary localStorage, so this route is not a simulation of every browser storage restriction. Only that exact disposable marker is removed; the tool never clears a storage area. Native keyboard behavior, focus, narrow layouts and the pinned MDX reader can be inspected directly.

Before listening, the server checks every declared file against the manifest digest retained in the candidate report and snapshots those bytes. It serves only that small allowlist, not the consumer directory, package archives, reports or private authoring inputs. Probes require a fixed same-origin header and an empty body; cross-origin requests and alternate Host values are refused. The server keeps only a bounded in-memory count, with no browser identifiers, request bodies or access log. No external provider is contacted by this sample. Its Content Security Policy permits local scripts, styles and connections only.

Preparing or serving the page records no browser pass. Keep native observations separately with the source commit, candidate digest, browser/version, origin, scenarios and actual results. A synthetic loopback request does not verify an adopter's loaders, provider cleanup, recorded-evidence transport or production integration. No real visitor consent is collected. The candidate report's native/physical-browser acceptance boundary stays false.

Failed or blocked runs keep their report, logs and any completed candidate archives. The workflow removes only its own temporary directories. If temporary cleanup fails, the overall result is failed. An existing output remains untouched; correct the problem and select a new output directory.

Publication still requires a separate decision. This workflow does not audit dependency vulnerabilities, prove secret absence, conduct legal review, verify external providers or certify an adopter's production integration. Adopters decide which checks to use and how to integrate them into CI. See the [verification record](verification/source-candidate.md).
