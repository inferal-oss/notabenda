# Your evidence workspace

A small Cloudflare Worker with one SQLite-backed Durable Object per configured site, static setup assets and Notabenda's read-only admin. The project is yours to edit. It contains no accounts, credentials or sample personal records.

1. Review `src/settings.mjs`: the public site ID, admin path and workspace label.
2. Implement `src/authorize.mjs` using your application's existing authentication and permissions. It denies everything initially. Return `{inspect:true, configure:false, export:false, source:false}` for inspection only; grant configuration, export and private-source inspection separately when appropriate. Verify any session or upstream identity assertion instead of trusting arbitrary request headers.
3. Install dependencies and run `npm run doctor` for read-only local diagnostics. The unchanged auth stub, missing dependencies or unbuilt assets are reported as local blockers. A changed authorization file still requires actual access tests; exit zero does not establish production readiness. Then run `npm run check`. This builds local setup assets and bundles a Worker dry run. It performs no remote deployment or resource creation.
4. Run `npm run dev`. Open the configured admin path on the loopback URL Wrangler prints. The same host hook applies in development; bring your own local host session or access adapter.
5. After reviewing your own routing, authorization and data lifecycle, run `npm run deploy` explicitly with your own Cloudflare account. Wrangler owns account selection and deployment. This command can provision a Worker and Durable Object namespace. There is no auto-deploy or prescribed CI integration.

The packages are currently unpublished developer previews. From a Notabenda checkout, build them and pack `@notabenda/core` and `@notabenda/cloudflare` with `npm pack --workspace @notabenda/core --workspace @notabenda/cloudflare --pack-destination /your/output/directory`. In this project, install both explicit local tarballs with `npm install /path/to/notabenda-core-0.1.0.tgz /path/to/notabenda-cloudflare-0.1.0.tgz`. Install the declared Wrangler/esbuild development tools using your normal package workflow. When published, ordinary `npm install` can resolve the declared package versions.

## What is available

The configured admin base contains `/history`, `/choices`, `/agreements`, `/processing`, `/permissions` and `/setup`. History includes exact document references and readable differences. The other evidence views begin empty. They inspect only the store already selected by host configuration. Setup answers and file imports stay in the operator's tab until explicitly downloaded; they are not stored in the Durable Object.

The Worker authorizes before assets or namespace access. It permits GET/HEAD only and exposes no public recording, activation, deletion or arbitrary-object route. Its private binding calls `inspect` with an export permission resolved by the host. Protect any additional Worker/service bindings or RPC callers with your own access policy. Never forward an unverified browser permission or expose these RPC methods through a generic public dispatcher.

Trusted application/build code may call `env.EVIDENCE.getByName('notabenda:' + siteId).recordRelease(artifact, metadata)`. The artifact must match the configured site. This archives content; it does not publish or activate it. Source archives are private and remain bounded by the package's archive limits. Existing application code can integrate the package's cookie, agreement, processing and form-permission recording helpers inside this DO; this starter supplies no anonymous identity or public ingestion policy.

The binding name, class export and configured site ID determine where data lives. Keep them stable for an existing deployment; changes need a deliberate migration. SQLite class lifecycle is declared in `wrangler.json` using `exports`; do not add a competing legacy `migrations` block. No custom domains or account IDs are generated. Add your own routes and separate staging/production configuration deliberately.

## Local diagnostics

`npx @notabenda/cloudflare doctor --json` emits a versioned report with requirement IDs, local blockers and manual review items. Use `--config wrangler.jsonc --env staging` to explicitly select a JSON/JSONC config and named environment. Named environments must declare their own evidence binding. The command never imports host/settings code, reads environment-file values, installs, builds, contacts Cloudflare or changes files. It checks the generated starter contract; custom dynamic/Vite/TOML setups need separate Wrangler validation. Filename and manifest checks cannot prove private-content absence, authorization behavior, package integrity or record lifecycle safety.

## Operations and removal

Keep `.dev.vars`, environment files and private setup reports out of public assets and version control. The generated build copies only the bundled setup module and questionnaire/cartridge stylesheets. Host code owns rate limits, monitoring, access logging, storage budgets, recording identity, retention, holds, erasure, restored-data handling and external copies. No universal retention period is chosen here.

To stop serving the integration, remove its routes or host mount and preserve any required records/exports. Uninstalling packages or deleting this local directory does not delete Cloudflare storage. Namespace/class deletion is a separate destructive operation; follow Cloudflare's current procedure after deciding what must be retained. This scaffold never performs deletion or cleanup of remote resources.

Code uses Apache-2.0 OR MIT, at your option. Supplied legal content retains its own authorship and licensing. The setup recommendations, stored records and successful build do not establish legal compliance.

Setup starts with the reusable cartridge library. Its module and both stylesheets require the host configuration permission; the questionnaire and imports stay in the operator tab. The local doctor checks all generated setup and preview assets.

The page reader is built as `assets/setup-preview.mjs` and loaded when an operator requests a preview. It requires the same configuration permission as setup; the local doctor checks its presence.

## Agreement wording history

Grant `termsSettings: true` from your existing host authorization hook only for callers allowed to inspect archived agreement wording. It is independent of inspection, source, catalog-review and export permissions. In Document revisions, select two releases and choose Agreement settings. The view compares named workflow declarations, interface messages and document references separately; it does not read or activate current offers. The starter otherwise denies this view.
