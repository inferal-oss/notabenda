# Start a Cloudflare backend

`npx @notabenda/cloudflare init` creates a Worker project with a SQLite-backed Durable Object, the evidence admin and setup assets. Authentication comes from your application. The generated hook denies all access until you implement it.

The packages are currently unpublished developer previews. Build/pack them from this repository and install their local tarballs first. The installed CLI is then available as `npx --no-install notabenda-cf`.

```sh
npx @notabenda/cloudflare init --out-dir ./privacy-backend \
  --name example-evidence --site-id example-site --base-path /backoffice
```

The output directory must not exist; its parent must already exist. Existing files and symlinks are never replaced. Initialization reads the bundled templates and writes a new local project. It performs no network call, package installation, login, resource creation or deployment. A write failure leaves its partial new directory for inspection rather than deleting files automatically.

## Where the backend fits

<!-- notabenda:diagram storage -->

For the purpose of each legal document or control, start with the [compliance map](COMPLIANCE-MAP.md).

## What you edit

- `src/settings.mjs`: public site ID, admin path and workspace label.
- `src/authorize.mjs`: your existing authentication/session policy. Return explicit inspection, configuration, export and private-source permissions, or `null`. No login, cookie/token format, key or identity provider is supplied.
- `src/workspace.mjs`: fixed-scope store composition and trusted application integrations.
- `wrangler.json`: Worker entry, assets, private binding and SQLite class declaration. Add your own account/routing/environment decisions when ready.

The generated README explains local tarball installation while the packages remain unpublished. After installing both packages and the declared build tools:

```sh
npm run doctor  # Read-only local starter checks; manual acceptance remains.
npm run check   # Build setup assets and perform a local Wrangler dry run.
npm run dev     # Local Worker using the same host authorization policy.
npm run deploy  # Explicit remote deployment through your Cloudflare account.
```

Only the last command deploys. Initialization runs none of these commands. The [read-only doctor](CLOUDFLARE-DOCTOR.md) reports local blockers and separate manual reviews. It runs no build or deployment. There is no `notabenda-cf deploy` wrapper. Use Wrangler's existing account, routing and environment controls; adopters decide whether to connect their project to CI.

## Access and data flow

The host checks authorization before any protected assets or namespace access. Setup and its static assets need configuration permission; evidence exports need a separate export permission. Private MD/MDX source inspection requires an explicit `source: true` grant; ordinary metadata inspection excludes its source hook. Forged headers, query parameters and URL paths cannot choose a site/object or grant either permission. The configured site chooses the object's stable name. Keep its identity/class/binding stable for existing data and plan any migration deliberately.

The admin provides history, cookie choices, terms agreements, processing opt-outs, form permissions, contract declarations and guided setup. Evidence starts empty. Setup uses the same six-stage local questionnaire; answers/imports stay in the tab until downloaded. Its private report is not written into the Durable Object.

Trusted host code can call the private object's `recordRelease` method with a compiled public artifact or private MD/MDX archive for the configured site. The package validates the artifact and retains immutable history. Recording does not publish or activate a document. Other trusted recording/activation helpers can be integrated inside the object as application work. This starter exposes no public write, arbitrary-object, deletion or anonymous identity endpoint.

The private `inspect` RPC receives only the permission already resolved by the host. Protect any service/namespace binding callers with your own policy. Do not turn it into a public generic RPC dispatcher or pass a browser-supplied grant through to it.

## Deployment and removal

The generated [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) declares assets with `run_worker_first` and a private object binding. Its [Durable Object class export](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/) uses SQLite storage; it does not mix the current declarative flow with legacy migration declarations. Package adapters use the [asynchronous key/value API on SQLite-backed storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).

Remote deployment can provision a Worker and namespace. Keep staging and production explicit. Host code owns authorization, origin/session defenses for any added writes, rate limits, data retention/holds/erasure, backups, restored-data barriers, logs and downloaded copies. No universal retention or data-location guarantee is chosen by the scaffold.

Removing the mount/routes stops serving the integration; uninstalling packages or deleting the local project does not remove remote records. Preserve required archives and evidence first. Deleting a Cloudflare namespace is a separate destructive operation governed by the current provider procedure; the CLI never performs it.

For optional maintainer runtime verification, build the workspace and run `node scripts/check-cf-starter-runtime.mjs`. It uses a disposable loopback Worker, verifies default denial, substitutes fictional host permissions only in that test copy, checks private archive RPC and restarts against the same SQLite state. It stops its own server and retains the ignored fixture for inspection. This is optional project tooling, not an adopter CI requirement.

See [the CF API](../packages/notabenda-cf/README.md), [scope decisions](SCOPE.md), [deployment feature status](FEATURES.md#feat-deployment) and [verification](verification/cloudflare-starter.md).

Setup starts with the reusable pack library. Its module and both stylesheets require the host configuration permission; the questionnaire and imports stay in the operator tab. The local doctor checks all generated setup and preview assets.

The page reader is built as `assets/setup-preview.mjs` and loaded when an operator requests a preview. It requires the same configuration permission as setup; the local doctor checks its presence.
