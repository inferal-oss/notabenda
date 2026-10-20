# @notabenda/cloudflare

Optional, dependency-free Cloudflare integration for **read-only evidence inspection** and **immutable legal-document archives**. The host supplies authentication and authorization. Recording helpers run through host-owned calls, separately from public document rendering.

## Start a project

After installing the local preview package, run `npx @notabenda/cloudflare init --out-dir ./privacy-backend --site-id your-site`. It creates a new standalone Worker project with SQLite storage, the responsive admin, local setup assets and a host authorization stub that denies access until implemented. Existing directories are never replaced, and initialization performs no install, login or deployment.

The generated project supplies `build`, `doctor` (read-only local checks), `check` (Wrangler dry run), `dev` and explicit `deploy` scripts. The packages remain unpublished; its README explains installing local tarballs. See [the starter guide](../../docs/CLOUDFLARE-STARTER.md) for project files, permission separation, private archive RPC, deployment and removal.

`npx @notabenda/cloudflare doctor [--directory PATH] [--config wrangler.jsonc] [--env staging] [--json]` reports bounded local starter issues and separate manual reviews. It never executes project code, loads credentials, installs, builds or deploys. A successful check still needs to be followed by host authorization and lifecycle testing. See [doctor scope and report format](../../docs/CLOUDFLARE-DOCTOR.md).

## Host-owned authorization

Every worker request calls a mandatory `authorize` hook. The host verifies the caller and returns an already scoped `RecordStore`, or `null` to deny access. Missing hooks throw at construction; denied, malformed, or failed grants return a generic 403. No URL accepts a Durable Object ID, namespace, or authorization scope. The host selects those before returning the store.

```ts
import { createAdminWorker, createDurableObjectStore } from '@notabenda/cloudflare';
import type { DurableStorage } from '@notabenda/cloudflare';

// Inside an existing Durable Object, use its ctx.storage.
export function mountEvidence(
  storage: DurableStorage,
  authorizeHostRequest: (request: Request) => Promise<{ storagePrefix: string; label: string } | null>,
) {
  return createAdminWorker({
    basePath: '/backoffice/evidence',
    workspaceLabel: 'Evidence studio',
    navigation: [
      {label: 'Evidence', href: '/backoffice/evidence'},
      {label: 'Document revisions', href: '/backoffice/history'},
      {label: 'Guided setup', href: '/backoffice/setup'},
    ],
    async authorize(request) {
      const permission = await authorizeHostRequest(request);
      if (!permission) return null;
      return {
        store: createDurableObjectStore(storage, { prefix: permission.storagePrefix }),
        scopeLabel: permission.label,
      };
    },
  });
}
```

`storagePrefix` must come from trusted host permission resolution, never from a URL or an unverified forwarded identity header. Prefixes are nonempty, end in `/`, and use letters, digits, `_`, `:`, `/`, or `-`. Use disjoint prefixes for independently authorized stores. The Worker has a standard `fetch(request, env, context?)` method suitable for mounting in a host Worker/DO or a local preview server. The host remains responsible for its session security, authorization policy, access logging, rate limits, and Cloudflare routing.

## Evidence and search

`RecordStore` has two operations:

```ts
interface RecordStore {
  list(query: RecordQuery): Promise<RecordPage>;
  get(id: string): Promise<EvidenceRecord | undefined>;
}
// EvidenceRecord: { id: string, data: JsonValue }
// RecordQuery: { query, kind, from, to, keyPrefix, limit, after? }
// RecordPage: { records, nextAfter?, scanned? }
```

The built-in adapter reads JSON-compatible values with `ctx.storage.list/get`. Values may be objects, arrays, strings, numbers, booleans, or null. Cycles, accessors, dates, Maps, buffers, and other structured-clone types need a host adapter projecting them to JSON. The adapter never writes evidence records. [Cloudflare documents its asynchronous KV storage API, key ordering and prefix/cursor options here](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/#asynchronous-kv-api).

Search uses AND matching of whitespace-separated words across record keys and serialized JSON. Additional filters select record kind, key prefix, and UTC event-date range. Useful optional fields are:

| Field | Presentation |
| --- | --- |
| `kind` or `type` | Record classification |
| `occurredAt`, `timestamp`, or `createdAt` | Recorded event time; use an ISO timestamp with a timezone |
| `subjectId`, `siteId` | Stored identity and site references; never authorization inputs |
| `documentVersion` or `document.version` | Document version |
| `purposeChoices` or `purposes` | Readable stored choices |
| `provenance` | Origin/context declared in the record |
| `retention` or `expiresAt` | Declared retention information |

No field is required, and absent facts are not invented. Results are cards with context and a detail view; raw JSON sits under a disclosure. A stored record does not establish lawful processing, valid consent, successful delivery, or completeness.

The responsive workspace uses a navigation rail on desktop and an explicit menu on smaller screens. Search begins with one field; advanced filters expand when needed and remain open when populated. Agreement cards lead with the stored subject reference. `workspaceLabel`, `workspaceNote` and up to twelve unique same-origin `navigation` links are optional presentation settings, shared with `createSetupWorker`. They neither authorize a destination nor select its store; every destination still needs its own host permission check. No external fonts, scripts or UI service are needed for inspection pages.

The default adapter scans at most 200 records per request (`scanLimit` accepts 1–500), returning at most 50 matches. A bounded segment can contain zero matches and still have a continuation. Results follow UTF-8 key order, **not event-time order**, and are not a snapshot across requests. A continuation can lead to a final empty page. Counts describe only the current segment. For large stores, implement `RecordStore` using an appropriate host-owned index; preserve its authorization scope and pagination contract.

Records are limited to 64 KiB, 20 nesting levels, and 10,000 JSON nodes; keys to 512 UTF-8 bytes. Oversized or unsupported records cause a generic inspection error. A custom adapter can instead return a bounded descriptive projection. Page size, filters, query length, and returned adapter data are also bounded.

## Filtered evidence export

Return `allowExport: true` in the host's authorization grant to enable the export review and JSON attachment routes. It defaults to false and is checked on every request, separately from ordinary inspection. The review screen preserves the current filters, explains the disclosure boundary and shows a live preview; the download reads the store again. Each versioned JSON segment contains exact normalized records, filters, read times, counts and continuation links. Empty segments can still have continuation.

All fields returned by the scoped store are included without redaction. Source hooks and external artifact links are not followed. Downloads are bounded, unsigned live reads, without snapshot or completeness guarantees, and do not export the application's other data. Use the downloaded file's continuation links and save each segment separately. Hosts own export auditing, access policy, secure handling and retention of copies. The trusted application API `createEvidenceExportSegment(store, query, {scopeLabel})` supplies the same one-segment envelope without HTTP links. See [the export guide](../../docs/EVIDENCE-EXPORT.md) for the schema, limits and operational contract.

## Immutable release history and readable differences

```ts
import { recordLegalRelease, createDocumentHistory, createAdminWorker } from '@notabenda/cloudflare';

// artifact is the JSON artifact produced by notabenda/content, including
// manifest, publicConfig, pages, and structured documents.
await recordLegalRelease(ctx.storage, artifact, {
  recordedAt: '2026-10-18T12:00:00Z',
  changeNote: 'Explain the processing-purpose clarification.',
  actor: 'host-provided-operator-reference',
}, { prefix: 'history/site-one/' });

const historyWorker = createAdminWorker({
  basePath: '/backoffice/history',
  title: 'Document history',
  async authorize(request) {
    if (!await hostCanReadHistory(request)) return null;
    return { store: createDocumentHistory(ctx.storage, { prefix: 'history/site-one/' }) };
  },
});
```

The default archive prefix is `notabenda/releases/`; use a separate host-selected prefix for each separately authorized site. Recording is an explicit host operation. It does not publish, notify, accept terms, or change consent.

`recordLegalRelease` requires the DO's transactional storage API. It checks artifact identity, public-config hash, rendered-page hashes, and structured-content hashes, then atomically inserts by artifact ID. Repeating the same artifact and metadata returns `{ id, created: false }`. A conflicting artifact or metadata is rejected, never overwritten. Metadata has no automatic defaults: pass a stable timestamp for retryable writes. Direct writes outside this API can still alter the underlying storage; this is not WORM storage or a cryptographic audit service.

Each archive preserves exact HTML, structured documents, and public configuration. The JSON archive limit is 128 KiB; storage-backend serialization limits can be stricter. Larger archives need a future/custom blob-storage adapter. The backoffice projects metadata and structured documents only; it never executes or embeds archived HTML. Projected records must also fit the 64 KiB inspection limit.

When a results page contains at least two document releases, a comparison form offers readable version/date/change-note choices. Defaults use the two latest distinct stored timestamps on that page; absent or tied timestamps leave the choice to the reviewer. These selectors do not change key ordering or search beyond the current page. The release detail also provides a manual-ID comparison form.

`/diff?before=ID&after=ID&kind=privacy` compares two records within the same authorized store/site (`kind` also accepts `cookies` and `terms`). Side-by-side section blocks identify removed/replaced and added content. Title and section-order changes are identified. The view distinguishes:

- `contentSha256`: SHA-256 of canonical JSON `{title, sections}`, including supplied link destinations and structured inventory.
- `sha256`: SHA-256 of exact rendered HTML, including presentation and document metadata.

Version, effective date, review declarations, and full structured documents remain inspectable. Differences do not determine legal materiality, require new acceptance, or invalidate consent. Release history preserves document versions. Cookie-consent evidence capture remains the host's job; the optional terms helpers below bind agreement records to an exact release.

## Version-bound terms agreement

The host can opt into `registerTermsOffer`, `setActiveTermsOffer`, `recordTermsAcceptance`, and `createTermsAcceptanceStore`. These require transactional DO storage and supply no public ingestion or authentication endpoint.

```ts
import { registerTermsOffer, setActiveTermsOffer, recordTermsAcceptance,
  createTermsAcceptanceStore } from '@notabenda/cloudflare';

// build-time offer from notabenda/content; release already archived.
const scope = {siteId: 'site-one', scopeId: 'account-terms'};
await registerTermsOffer(ctx.storage, offer, scope);
await setActiveTermsOffer(ctx.storage, offer.offerId, scope);

// In the host's authenticated, CSRF-protected, operation-authorized handler:
const receipt = await recordTermsAcceptance(ctx.storage, body, {
  ...scope, subjectId: authorizedSubject.id, operationId: authorizedOperation.id,
});

// Return this store only from an admin authorization hook:
const agreements = createTermsAcceptanceStore(ctx.storage, {siteId: 'site-one'});
```

`TermsStoreOptions` accepts trusted `siteId`, optional `prefix` (default `notabenda/terms/SITE_ID/`), `releasePrefix` (default `notabenda/releases/`), and `allowPreview` (default false). Use disjoint prefixes for separately authorized sites/stores. Registration verifies the archive, exact terms metadata, and offer hash; it never activates or publishes. Activation/deactivation and recording share a transaction boundary. `setActiveTermsOffer(storage, null, scope)` disables new agreements for that scope.

A request accepts exactly `{schemaVersion:1, offerId, requestId, accepted:true}`. The host independently supplies subject, intended scope, operation and optional server `now: () => Date`. Do not copy those authority fields from browser JSON. New attempts require the currently active offer; already committed retries return their original receipt after activation changes. The event ID hashes `[siteId, subjectId, requestId]`, with operation/scope/offer conflicts rejected. Preview needs independent explicit server opt-in, regardless of frontend flags.

Registration payloads are limited to 16 KiB, requests to 2 KiB and events to 64 KiB. Each event stores exact offer wording, document references/digests, host subject/operation, server time and host-received provenance. The event is also its idempotency record; host deletion/retention must coordinate replay protection and operation expiry. No cleanup/deletion service is supplied. Receipt storage is separate from actual signup, purchase or fulfillment.

`createTermsAcceptanceStore` exposes only matching site events to the existing bounded search/detail UI. Agreement cards and detail context support review by subject, operation, document version and statement. The UI does not infer a human click, identity, contract validity, delivery or operation completion. The host must retain and serve pinned document bytes; the admin Worker does not execute or serve archive HTML. See the repository's [terms integration guide](../../docs/TERMS.md) for frontend/retry/retention details and legal boundaries.

## Cookie-choice evidence

Optional host-callable helpers include `registerConsentNotice`, `setActiveConsentNotice`, `recordConsentChoice`, `getConsentHead` and `createConsentEvidenceStore`. They bind browser reports to exact notice wording and archived documents, use transactional revisions for grants, accept restrictive old-notice revoke-all, and return historical receipts together with the current head on retries. Host authorization and stream resolution remain mandatory. The frontend can opt into a required-receipt gate at construction. The package provides no public ingestion/authentication endpoint or retention service.

See the [cookie evidence guide](../../docs/CONSENT-EVIDENCE.md) for the complete contract, limits, deployment obligations and remaining work. Run the local example and open [the fictional history](http://127.0.0.1:4178/backoffice/choices) to inspect fixed reports with purpose cards, notice wording and version references.

## Paid orders

The optional `@notabenda/cloudflare/orders` entry retains complete reviews and original producer files, activates quotes with compare-and-swap revisions, and records one admission per host-selected checkout intent. A mandatory local decision returns host reservation writes; those commit atomically with the receipt and replay guard. Exact outcomes remain recoverable after quote expiry or replacement. External payments, fulfillment, contract formation and confirmation need separate host workflows.

`createPaidOrderStore` supplies small searchable summaries. Return `allowOrderArchive:true` from your admin authorization hook to allow the full retained-review page and original-file inspection; `allowExport` remains independent and never follows these large archives. Downloads are attachments, image views are sandboxed, and every request is authorized again. Retirement can fence and purge one intent’s private reviews, files, attempts and event after host eligibility/hold review and external-job fencing. See [the paid-order guide](../../docs/PAID-ORDERS.md) for API examples, bounds and recovery requirements.

## Routes, security and previews

The optional `@notabenda/authoring` build package accepts Markdown and MDX with YAML frontmatter. Register its **private `release.archive` envelope**, rather than the public `release.artifact`, to retain original source atomically with the rendered release. Source attachments must match declared hashes and byte counts. Ordinary history search does not return raw source. See the [authoring guide](../../docs/AUTHORING.md) for integration and size limits.

`createDocumentHistory` also supplies `getSource(releaseId, kind)`. Authenticated `/source?id=RELEASE_ID&kind=terms` and `/source-diff?before=RELEASE_ID&after=RELEASE_ID&kind=terms` routes display escaped original text. They never evaluate stored MDX. Expose this hook only when the caller is authorized to inspect private source. A custom authorized store may omit `getSource`; source routes then return 404 and their entry links are omitted. Release comparison distinguishes source changes from rendered-body changes, so a component update or source-only edit is visible to reviewers.

The default mount is `/admin/notabenda`. Routes are the base list, `/record?id=...`, `/diff?before=...&after=...&kind=...`, source inspection/comparison routes, and explicitly permitted `/export` and `/export.json` routes. Paid-order stores add separately permitted `/order-review?id=...`, `/order-review.json?id=...`, `/order-asset?id=...&sha256=...` and `/order-image?id=...&sha256=...`. Only GET/HEAD are accepted. Every route is authorized first; errors expose no backend exception or record payload. Responses use no-store/private caching, no-referrer, noindex, framing restrictions, and a restrictive CSP. The UI has no JavaScript or external assets; CSS uses a fresh nonce. All stored text is escaped. Archived record HTML is never executed; original order images are served only through their authorized sandboxed file route.

`renderRecordList`, `renderRecordDetail`, and `renderRecordDiff` are pure presentation exports. They do not authorize requests. Prefer mounting `createAdminWorker`; direct renderer callers must validate record data with `normalizeRecord`, supply a clean base path and a 32-character hexadecimal nonce, and set corresponding response security headers.

`examples/synthetic.mjs` exports `syntheticRecords` and `createSyntheticStorage(records?, prefix?)` for a local preview or tests. The fake supports `get`, `put`, `list`, and serialized test transactions. It is not persistent storage and is not an authentication provider. Never replace production authorization with an unconditional demo grant.

```sh
npm run build --workspace @notabenda/cloudflare
npm run test --workspace @notabenda/cloudflare
```

Tests simulate Worker requests and DO storage, including denied/failed authorization, scope isolation, search pagination, XSS, sanitized failures, atomic history, idempotence, hash validation, and escaped differences. No Cloudflare deployment is performed by these tests.

[Recorded processing opt-outs](../../docs/PROCESSING-CHOICES.md) expose `registerProcessingNotice`, `recordProcessingRestriction`, `getProcessingHead` and `createProcessingRestrictionStore`. Events add restrictions transactionally and retries return the current head. The host supplies stable context, provenance, authorization, retention and downstream enforcement. The admin view shows requested activities, historical cumulative restrictions, current retained state and pinned notice wording.

For guided operator setup, `createSetupWorker` serves the host-authorized local questionnaire with your same-origin entry module and stylesheet. It accepts GET/HEAD, adds no account system or server answer storage, and exports private notes separately. See [guided setup](../../docs/SETUP.md).


## Evidence lifecycle

Use `createEvidenceLifecycle` from trusted host code to retire a fixed consent/processing stream or whole terms subject, apply revisioned holds, and purge matching event payloads in bounded transactional steps. Retirement blocks new commands and historical retries before deletion begins. `createEvidenceLifecycleStore` plugs hold, purge and restore progress into the read-only admin and export UI.

The host owns authorization, eligibility, scheduling and authoritative retirement manifests outside the backup rollback boundary. Reapply those manifests before restored storage receives traffic. Shared archives and minimal pseudonymous metadata remain; downloaded copies and external data need separate handling. No full-erasure or legal sufficiency claim is implied. Map trusted terminal responses to the frontend `context-retired` error classes so browser workflows close without retry loops. See [the lifecycle guide](../../docs/EVIDENCE-LIFECYCLE.md) for target scope, API examples and restore requirements.


Cookie-choice recording also enforces the archived [scope guard policy](../../docs/SCOPE-GUARDS.md). A new grant for an unavailable purpose fails with `scope-restricted`; historical receipts remain historical and known older notices can still withdraw. Inspection distinguishes a purpose held off by a guard from a reported decline. Scope declarations and receipts do not establish specialized authorization or legal validity.

## Form permissions

Register and activate exact purpose/channel offers with `registerFormPermissionOffer` and `setActiveFormPermissionOffer`. Trusted application code records grant/withdrawal commands with `recordFormPermission`; downstream use reads `getFormPermissionState`. `createFormPermissionStore` provides scoped history, search and export with historical action separated from current evaluation. The existing evidence lifecycle supports the `permissions` family. See [the integration guide](../../docs/FORM-PERMISSIONS.md) for host contact-generation binding and remaining limits.

## Contract declarations and delivery jobs

`registerContractActionDefinition`, `recordContractDeclaration` and `createContractDeclarationStore` provide a separate archive-bound declaration ledger. Capture commits an exact savable receipt and independent application/acknowledgement jobs atomically. `claimContractDelivery` / `settleContractDelivery` expose bounded leased delivery to a host runner; they send nothing themselves. Provider acceptance, recipient delivery and contract fulfillment remain distinct. Declaration-scoped lifecycle waits for draining or explicit host quiescence. See [the initial contract-action API and limits](../../docs/CONTRACT-ACTIONS.md).

`dispatchContractDeclaration` starts both host-configured delivery callbacks independently; `dispatchContractDelivery` runs one channel for an explicit retry. They bound asynchronous attempts, preserve stable downstream IDs, and separate provider acceptance from settlement uncertainty. They add no provider, auth, scheduler or automatic retry. See [delivery runners](../../docs/CONTRACT-DISPATCH.md) for the API, result meanings and rehearsal boundaries.


## Retained catalog review

An explicitly finalized release can include a digest-bound selected-reference attachment alongside optional Markdown/MDX sources. Pass its `archive` to `recordLegalRelease`; public artifacts alone cannot satisfy declared private attachments. `createDocumentHistory` keeps these snapshots out of ordinary records and exports and exposes `getCatalogReview` separately. Grant `allowCatalogReview: true` only after your host authorizes this inspection; source/export permissions do not imply it. The generated starter accepts the independent host grant `catalogReview: true`. See [the release workflow](../../docs/SERVICE-CATALOG.md#retain-selections-with-policy-releases).

## Customer confirmations

The optional `@notabenda/cloudflare/order-confirmations` subpath retains complete personally addressed host files and queues a recoverable delivery job. Hosts supply contract facts, reviewed content, a fixed destination version, authentication, provider and scheduling. Admin inspection uses a separate `allowOrderConfirmation` permission; original files download as inert attachments. Provider acceptance remains distinct from recipient delivery. See the [confirmation guide](../../docs/ORDER-CONFIRMATIONS.md).

## Workspace overview and record finder

New generated starters open a workspace overview before individual evidence views. Its three starting jobs are privacy pages, cookie choices and terms agreements. Other record areas stay in a foldout. A native search form finds records across the areas your host authorizes; it needs no browser script.

For an existing host, mount `createWorkspaceOverviewWorker` at your admin root:

```js
import {createWorkspaceOverviewWorker} from '@notabenda/cloudflare';

const overview = createWorkspaceOverviewWorker({
  basePath: '/admin/privacy',
  setupPath: '/admin/privacy/setup',
  authorize: async (request, env) => {
    const access = await authorizeOperator(request, env);
    if (!access.inspect) return null;
    return {
      scopeLabel: access.siteLabel,
      allowSetup: access.configure === true,
      areas: [{
        id: 'choices', title: 'Cookie choices', primary: true,
        description: 'Inspect choices and the notices they refer to.',
        href: '/admin/privacy/choices',
        store: access.cookieChoiceStore,
      }],
    };
  },
});
```

The host must return already-scoped stores. A displayed ID, label, search word or URL never selects a Durable Object or tenant. Each destination also authorizes its own requests. Supply up to ten distinct areas, with at most three primary jobs. Titles/descriptions are bounded plain text and destinations are clean local paths. Existing per-area views, source inspection and export permissions remain separate.

Opening the overview reads no records. A nonempty search reads one validated segment of at most three records per area, one area at a time. A continuation link retains the query and cursor for that area's existing search view. Complete empty results, unfinished scans and read failures have different messages. A malformed store response is treated as unavailable. Counts and samples never establish a total, newest event, consistent snapshot, current permission, installed cartridge or legal conclusion.

Search uses `?q=` and the same bounded word matching as the record stores. Reference IDs, recorded subject labels, versions and purposes are useful starting points. Original MDX, retained file contents and separately authorized source attachments are not traversed. The worker accepts only GET/HEAD, sets private/no-store and no-referrer headers, installs no scripts and performs no writes or source/file reads. Hosts remain responsible for bounded adapters and protecting external access logs.

For suspected vulnerabilities, use the [private security contact](https://notabenda.org/guide/security/). Read [migration and removal](https://notabenda.org/guide/migration/) before replacing an existing integration or retiring its records.
