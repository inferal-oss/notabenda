# Check a Cloudflare starter

Run `npx notabenda-cf doctor` inside the project created by `notabenda-cf init`. It reads the local starter and explains what needs attention. It does not run your JavaScript, build, install dependencies, load credentials, contact Cloudflare or modify files.

The packages are unpublished previews. Install the explicit local tarballs first, as described in the [starter guide](CLOUDFLARE-STARTER.md). New starters include `npm run doctor`; existing starters can use the installed CLI directly.

```sh
npx notabenda-cf doctor
npx notabenda-cf doctor --directory ./privacy-backend --json
npx notabenda-cf doctor --config wrangler.jsonc --env staging
```

Paths are relative to the selected project. The default search requires exactly one `wrangler.json` or `wrangler.jsonc`; choose `--config` when both exist. JSONC comments and trailing commas are supported. The selected configuration, Worker entry, settings, authorization and asset files must stay inside that project.

## Read the results

| Result | Meaning | Next step |
| --- | --- | --- |
| `FIX` | A local requirement is missing, unsupported or could not be inspected. | Follow the correction and run the check again. |
| `REVIEW` | A host decision or acceptance check cannot be established from these local files. | Verify it with your actual application and deployment process. |
| `OK` | The stated local condition was observed. | Keep the scope of that observation in mind. |

A newly generated project needs dependency installation, a build and host authorization implementation. Its unchanged authorization stub denies everyone; the doctor reports that as a blocker. A changed file produces a manual review item, never an assertion that authentication is secure. There is no generated login or password.

The command exits `1` when local blockers exist and `0` when those checks pass. Manual reviews remain in either case. JSON output has `schemaVersion: 1`, `localChecksPassed`, requirement-linked `checks`, and `productionReadiness: "not-assessed"`. Exit zero is not deployment approval or a compliance score. Adopters decide whether or how to use these results in their own CI.

## What is inspected

- A bounded JSON/JSONC configuration, Worker entry, real compatibility date and starter site settings. Settings are parsed as an exported JSON/JSONC object literal, without importing the module. Dynamic settings need separate verification.
- One local `EVIDENCE` binding and its live SQLite class export. Competing legacy migrations are reported. The tool never renames, migrates or deletes a namespace.
- `ASSETS`, `run_worker_first: true`, the built setup module and stylesheet, and a bounded walk for known private/build-state filename patterns. Selective worker-first route patterns require separate review and do not satisfy this starter check.
- The authorization file's presence and unchanged deny-all stub, the starter private-file ignore patterns, a private package manifest and required local dependency manifests.
- Explicit logging/source-map settings, with separate review of runtime access, record lifecycle and public content.

Filename checks are conservative. They report known environment/private-report/database/archive filenames even if you intended another upload tool to exclude them. They do not implement `.assetsignore`, inspect file contents for secrets or certify the final upload manifest. Asset symlinks are reported without traversing their targets. The walk stops at 10,000 entries or 24 directory levels; an incomplete inspection is a blocker. Entry and required-asset checks use metadata rather than reading those file contents. Known private paths are rejected before reads, including resolved aliases. File reads are bounded. Diagnostics never print source, config values, environment-file contents or raw parser errors.

Dependency manifests must resolve inside the selected project; external workspace/package symlinks are reported as unavailable and need a separate workspace-level review. Dependency checks establish that a local manifest with the expected package name exists; they do not execute its code, prove the package is intact, resolve its version range or audit its dependencies. Ignore-pattern checks do not prove a file is untracked. Check the actual repository and build output before sharing them.

## Environments and custom projects

The default run checks only the top-level environment. Use `--env` for each declared target you intend to inspect. Named environments must supply their own Durable Object bindings; they cannot silently borrow the default binding. Inherited asset and class-export objects are replaced as whole objects when overridden. The command does not merge partial objects into a seemingly complete configuration.

These are checks for the generated starter contract, not a replacement for Wrangler's complete configuration validation. TOML, programmatic/Vite configuration, dynamic settings and custom binding/host layouts require their own checks. The doctor reports unsupported conditions without executing configuration. It does not follow Wrangler's generated-config redirects or read process credentials, `.env`, or `.dev.vars` values. If another tool selects or transforms configuration, inspect its final JSON/JSONC explicitly and verify the actual build/deploy selection separately.

Cloudflare documents [environment inheritance and configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [Worker-first authentication for assets](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), and [Durable Object class lifecycle](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/). The doctor checks the starter's local declarations; it does not inspect existing remote state.

## Finish the deployment checks

After reviewing the project scripts, run its build and Wrangler dry run yourself. Then exercise the actual host with denied/expired identities and separately authorized inspection, configuration, export and private-source permissions. Confirm that protected assets cannot bypass authorization.

Keep staging and production distinct. Review routing, bindings, existing namespace identity, logging, retention/holds, backups, restoration, erasure and external copies. These decisions remain application work even when every local check passes. Nothing here deploys or changes a remote resource.

See [scope decisions](SCOPE.md), [requirements](requirements/README.md#req-product-cf-doctor) and [verification](verification/cloudflare-doctor.md).
