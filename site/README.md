# The project website and Cloudflare host example

This directory keeps the website separate from the reusable packages. It builds a static landing page, readable documentation and fictional examples, then mounts `notabenda-cf` inside a host Worker with a SQLite-backed Durable Object. All example operators, documents, subjects and records are synthetic.

From the repository root:

```sh
npm install
npm run site:dev
```

Open `http://127.0.0.1:4179`. `site:dev` builds the site and runs Wrangler locally. The development login is **`admin` / `admin`**. The wrapper enables it only for local `dev` runs, and the host accepts it only on loopback URLs. No secret setup is needed for local development. The public site and cookie examples need no login. Only `/backoffice/*` requires the operational login. Public `/agreement`, `/recorded-choices`, `/processing-choices` and `/demo/admin` use a password-free, isolated demo session.

## Boundaries

- Authentication is website code in `host.mjs`, never part of either npm package. Outside explicitly enabled loopback development, missing or malformed `ADMIN_KEY` values fail closed and `admin` / `admin` is rejected. Use HTTPS; HTTP is accepted only on loopback for development. There is no session/account/role-management system or in-product password storage. Browser Basic credentials may remain cached; close the authenticated browser session to finish using it. Production rotation belongs to the host and must invalidate the old server secret.
- The Worker runs before **every** static asset. It canonicalizes paths before applying a closed protected-prefix rule, authenticates before DO access or body parsing, and marks all protected responses—including assets, redirects and errors—private/no-store. The DO independently rechecks authorization.
- Operational admin and public demos use separate Durable Object bindings/classes. A signed HttpOnly browser-session cookie selects only its own demo database; no tenant or object selector is accepted in URLs or record payloads. Missing or expired sessions cannot resurrect old objects. Demo activity refreshes a one-day idle deadline, and an alarm schedules cleanup. The reusable storage APIs still require explicit host-selected scopes.
- Demo writes require POST, exact same origin, JSON content type, a custom header, and an actual body limit of 2 KiB. Subject and operation are synthetic host-owned values bound to the demo generation. Old tabs cannot write through a replacement session. These are not real visitor consent records, accounts or purchases.
- The public homepage and guide have no JavaScript, external fonts, analytics or automatic cookie prompt. The public cookie example deliberately demonstrates browser-local storage and synthetic same-origin requests. Sample disclosure pages describe fictional examples; they are **not** the host operator's production privacy/terms documents.

## Build and verify

```sh
npm run site:check
# With site:dev running, verify the real local Worker/SQLite boundary:
node scripts/check-site-runtime.mjs
```

`site:check` builds both packages and the website, runs host integration tests, then bundles the Worker with a Wrangler deployment dry run. It creates no cloud resources. Runtime checks use only loopback, keep a synthetic recovery fixture under ignored `.local/`, and never print credentials. Each runtime run creates independent public demo sessions and verifies their isolation against the local SQLite runtime. Operational fixture history is checked separately. Filesystem and platform simulations do not replace a real-runtime or deployment check.

`site/build.mjs` reads allowlisted project documentation/assets and directly reuses the example generators. It never scans secret or local-state directories. The uploadable tree is `site/dist/public`; backend seed data and the output manifest live outside it. Unexpected leftover files cause the build to fail for inspection rather than being uploaded or deleted. Inspect an obsolete build output before removing it and rebuilding.

The site build renders Markdown from this repository's trusted sources; it is not a sanitizer for arbitrary user Markdown. Internal documentation links map to local guide/source pages. Code/configuration referenced by the catalog is served as plain `.txt` source for inspection. No private environment, domain, account or notification configuration is included.

The public `/demo/admin/choices` section contains realistic fictional cookie-choice journeys, including full grants, withdrawal, partial choices and refusal. `/choices` remains local-only. `/recorded-choices` exercises required acknowledgments through generation-bound demo endpoints, with reports under `/demo/admin/recorded`. Every visitor gets a separate database. See the [evidence guide](../docs/CONSENT-EVIDENCE.md).

The public `/processing-choices` flow supplies a separate opt-out through `/demo/processing/head` and `/demo/processing/record`. Its generation-bound fictional context belongs only to this browser’s demo database. `/demo/admin/processing` shows seeded and sandbox restrictions, wording and pinned references. Cookie acceptance cannot remove a retained opt-out. Production identity and downstream execution remain host responsibilities.

## Deploy in a host account

The checked-in Wrangler configuration has no account IDs, custom domains or production secrets. Supply those through the host's private deployment configuration and secret store. Set `ADMIN_KEY` with the host's secret-management workflow before allowing admin access. Keep development and production state/secrets separate. A CI runner can use `npm ci`, `npm run site:build`, and Wrangler with an explicitly selected configuration; adopters choose their own CI and repository integration.

Before public production use, supply appropriate operator disclosures, review applicable legal content and platform behavior, verify production routing/auth, and define retention/erasure, backup/restore and operational access procedures. Seed release metadata is immutable: preserve the existing `recordedAt` and `changeNote` for the same artifact across deployments. Changing metadata alone intentionally fails archive validation. The current persistent workspace contains only synthetic demonstration records. This repository does not claim a deployed service or durable visitor consent collection.

Cloudflare's [static-asset routing documentation](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) explains why `run_worker_first` is necessary for host authorization. The [Wrangler configuration reference](https://developers.cloudflare.com/workers/wrangler/configuration/) documents the assets and Durable Object bindings/storage declaration. These choices were checked against the installed pinned Wrangler version.

Traceability: `REQ-PRODUCT-CF-HOST`; host tests in `site/test/host.test.mjs`. The package's auth-neutral APIs remain documented separately in `packages/notabenda-cf/README.md`.

The `/releases` example explicitly compiles and retains two public versions and adds both to protected history. The build-time [retention helper](../docs/RELEASES.md) keeps pinned old HTML in a clean deployment; it does not discover historical files or make publication decisions. Preserve all historical pinned resources needed by your own records and choose which release inputs belong in the deployment.

The synthetic admin grants explicitly enable filtered evidence export. `/backoffice/history/export` reviews a bounded live selection; `/export.json` under each admin section downloads a fresh authorized segment with continuation links. History exports use the inspection projection and do not follow private authoring-source hooks. See [evidence export](../docs/EVIDENCE-EXPORT.md).


The protected `/backoffice/lifecycle` example shows five fictional contexts: a stored hold, a pending purge, and completed consent/processing/terms scans. Its bootstrap includes an old-payload restore/reapply drill and resumes after interrupted initialization. This is read-only; no purge or hold mutation endpoint is exposed. The regular demo streams use separate prefixes and remain independent. See [evidence lifecycle](../docs/EVIDENCE-LIFECYCLE.md).

## Public demo lifecycle

`/demo/admin` provisions a separate, realistically seeded workspace on demand, without a password. The signed capability stays in a browser-session cookie, with no persistent expiry. It is never put in a URL, rendered page or exported record. Only a nonsecret generation enters the interactive pages and their transport headers.

A day without use expires access and schedules deletion of the demo data. Valid demo navigation and API actions refresh that idle deadline. An older queued alarm checks the refreshed deadline. Closing the browser session drops its cookie; database cleanup follows the idle schedule. Browser session restoration follows the browser's own cookie behavior.

The public provisioning limiter runs before allocation. Forged signatures are rejected before a namespace lookup. Recording is bounded, and retries of existing commands remain recoverable. Fixtures use actual ledger APIs with stable request IDs, so interrupted seeding resumes without duplicating journeys. [Verification](../docs/verification/demo-workspace.md) covers these boundaries.

`npm run dev` uses the same local Worker host on port 4178; `npm run site:dev` uses port 4179. Both exercise the same session protocol, rather than a separate shared-memory admin implementation.

## Public website disclosure

`/website-privacy` describes the host website’s actual demo session, entered data, browser storage, Cloudflare hosting and scheduled one-day idle cleanup. It is separate from the fictional `/privacy`, `/cookies` and `/terms` documents. Recorded example pages show a short storage notice before their form; the demo admin links the website notice. Canonical sample documents and archived bytes are unchanged.

Before public deployment, provide the **public** build variables `NOTABENDA_WEBSITE_OPERATOR` and `NOTABENDA_WEBSITE_PRIVACY_CONTACT` (email or HTTPS URL), then use `npm run site:build:production`. This build fails before writing output when either fact is missing or invalid. It does not establish legal completeness or review. The ordinary local build renders a clearly marked preview without inventing contact details. Do not put credentials or private operating notes in these public fields.

The production build command runs from the repository root; the deployment command is `node scripts/site-wrangler.mjs deploy --config site/wrangler.jsonc`. Runtime `ADMIN_KEY` is a separate host secret and must stay out of build output, source and public assets. A browser-connected build uses the project’s pinned Wrangler package. Cloudflare supports overriding its build Node version through `NODE_VERSION` or a version file; see the [build image documentation](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/).


## Preserve the delivered pages

Public assets append `no-transform` to their existing `Cache-Control` directives. Protected and session responses use `private, no-store, no-transform`, retaining their authorization/cookie variation. This asks intermediate caches to preserve the generated representation, including archived legal HTML. Cloudflare documents that this directive prevents its automatic Web Analytics beacon injection. The self-only/script-free CSP remains in force; no external script origin is added. This header does not delete historical provider analytics, disable hosting request/security processing, or replace live deployment checks.

When deploying your own toolkit integration, serve exact retained HTML without proxy rewrites or injected tooling. Inspect the actual browser DOM and response policy as well as the build output; a static-file check cannot detect every edge modification. See [Cloudflare’s setup documentation](https://developers.cloudflare.com/web-analytics/get-started/) and [host verification](../docs/verification/website-browser.md).
