# Recorded cookie choices, connected to an application

This example connects YAML configuration, generated legal pages, native cookie controls, a Cloudflare recorder and its read-only admin. It is an application you can adapt. The package starter still supplies no public ingestion or visitor identity system.

Both authorization hooks initially deny access. The public page and legal documents work, optional services stay off, and the page explains that its host connection is unavailable. No test identity, password, cookie issuer or admin bypass is included.

## Run it locally

Copy this directory to your own project directory. The packages are unpublished previews: build and pack `@notabenda/core` and `@notabenda/cloudflare` from the repository, then install both explicit local tarballs in your copy. Install the development tools declared in `package.json` through your usual package workflow.

```sh
# In a Notabenda checkout:
npm run build
mkdir -p .local/cookie-packages
npm pack --workspace @notabenda/core --workspace @notabenda/cloudflare \
  --pack-destination .local/cookie-packages

# In your copied application, using the actual tarball paths:
npm install /path/to/notabenda-core-0.1.0.tgz /path/to/notabenda-cloudflare-0.1.0.tgz
npm install --include=dev
npm run check
npm run dev
```

The local command owns port 4188 and passes its loopback origin only to `wrangler dev`. Use a free port and matching `APP_ORIGIN` together if you change it. The example's content is a draft, so `dev` and `check` explicitly build in preview mode. The ordinary `build` and `deploy` commands require reviewed production configuration. No command runs a deployment except the explicit `deploy` script.

## Connect your host sessions

Edit `authorize.mjs`. `authorizeVisitor(request, env)` must verify your existing session and return `{streamId}` or `null`. Use a stable, opaque application reference for this site's preference stream. Do not pass an email, raw bearer token or browser-selected identity. The hook runs again for bootstrap, head reads and writes. It must not consume the request body.

`authorizeOperator(request, env)` separately returns `{inspect:true}` for the operator workspace, optionally with `manageNotices:true` for notice registration and activation. Your host owns real authentication, permissions, quotas, rate limits, session expiry and abuse prevention. Do not replace these hooks with a trusted-looking unverified header in production.

The application compares mutation `Origin` with the configured origin, requires JSON plus a custom header, and bounds the streamed body to 8 KiB before parsing. It supplies no permissive CORS response. `APP_ORIGIN` is trusted host configuration; production must match the configuration's site origin and use HTTPS. Only preview mode accepts a configured loopback HTTP origin.

Bootstrap returns the library-derived stream digest. Subsequent browser requests send that digest as a precondition. The host resolves the session independently and refuses a mismatch; the header never chooses the stream. On logout or account switch, notify this example **before** replacing the application identity:

```js
window.dispatchEvent(new Event('application-session-changed'));
```

That destroys the controller and stops its services. Reload to bootstrap the new identity. Connect this event to your host's actual authentication lifecycle; the example cannot discover every logout or account change itself. Server-side mismatch/denial also disconnects a controller when its next request fails.

## Register, then activate

Open `/backoffice` with your operator session. First **Register release and notice** to retain the exact fixed build. Then deliberately **Activate this notice**. Registration is idempotent and does not enable new grants. Read-only inspection does not authorize either operation. Visitor traffic never registers or activates anything.

The operator template is served directly after authorization, outside the public asset directory. Its `/operator` aliases return 404. The mutation routes accept only an empty object: no caller can upload an artifact or choose a site, scope, notice or Durable Object.

Open `/` with your visitor session. The two service indicators stand in for real service loaders and make no tracking requests. Replace their lifecycle callbacks in `client.mjs` with your integrations; register them before optional requests can start. `/backoffice/choices` reviews the actual recorded actions and their pinned notice wording. It has no export, activation or deletion operation.

## Files to change

| File | Your application supplies |
| --- | --- |
| `notabenda.config.yaml` | Actual operator, inventory, purposes, storage, reviewed documents and lifetimes. |
| `authorize.mjs` | Verified visitor and operator sessions, permissions and host admission policy. |
| `client.mjs` | Actual optional service start/stop/cleanup and your authentication lifecycle event. |
| `wrangler.json` | Your Worker name, routes, environments and deployment controls. Keep existing storage identities stable. |
| `workspace.mjs` | Fixed-scope private recording and inspection composition. |
| `style.css` | Page styling. Native controls also accept the package's normal CSS tokens. |

`build.mjs` calls the installed file-build CLI with required evidence mode and a fixed `cookie-choices` scope. It publishes only compiled legal/runtime files and frontend assets. `.generated/release.mjs` contains public compiled inputs and the server-served operator template; it is ignored and never uses the private configuration section. Do not put secrets in your inventory, public assets or generated module.

Keep retained legal/notice files available when updating the build:

```sh
npm run build -- --retain-artifact saved-release.json \
  --retain-consent-notice saved-notice.json
```

Use the explicit retention inputs in clean deployment builds too; a previous local output directory is not a backup or deployment retention policy. A new build does not activate its notice. Preserve the private database archives and earlier public pinned files, then register and activate the new reviewed version through your host workflow.

## Before deployment

Review the actual authentication/origin boundary, rate limits, service network behavior and retained data. Add your application's retention, holds, erasure, backup and recovery policy using the existing APIs. This example installs no expiry scheduler, identity recovery, legal classifier, remote provisioning or automatic deployment. A successful preview is not production or jurisdiction acceptance.

The optional maintainer check is `node scripts/check-recorded-cookie-runtime.mjs` from the repository. It copies this application into an ignored private directory, tests the unchanged denying hooks first, then injects synthetic authorization and faults only into that disposable copy. The HTTP/SQLite check is separate from the client DOM tests and browser observations recorded in the guide. Adopters choose their own CI.

Code is Apache-2.0 OR MIT, at your option. Replace the fictional sample legal content with your own reviewed wording.
