# Evidence lifecycle

Use `@notabenda/cloudflare` to retire an evidence context, apply a legal hold or purge its matching payloads in resumable batches. The backoffice displays progress and supports search and export. Run lifecycle commands through your authorized backend; the admin UI is read-only.

Start from [REQ-PRODUCT-EVIDENCE-LIFECYCLE](requirements/README.md#req-product-evidence-lifecycle). The related [REQ-EU-RETENTION-ERASURE](requirements/README.md#req-eu-retention-erasure) remains partial and legally unreviewed. The research locators are [GDPR Articles 5, 17 and 19](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng). Engineering tests do not decide legal necessity, retention periods, applicable exceptions or recipient duties.

## Choose the exact context

Consent and processing targets select one `siteId`, `scopeId`, and host-resolved `streamId`. Terms targets select a whole `subjectId` across all terms scopes within one site. The prefix must match the ledger's configuration. Identity and tenant selection belong to the trusted host; never accept an arbitrary browser-supplied target or prefix.

```ts
import {createEvidenceLifecycle} from '@notabenda/cloudflare';

// After host authorization, identity resolution and eligibility/hold review:
const lifecycle = await createEvidenceLifecycle(ctx.storage, {
  family: 'consent',
  siteId: 'site-one',
  scopeId: 'cookie-choices',
  streamId: resolvedStreamId,
});
const decision = {
  requestId: crypto.randomUUID(),
  reason: 'retention-expired' as const, // Or 'operator-erasure'.
  eligibleAt: reviewedEligibilityTime, // Canonical UTC ISO timestamp.
  legalHold: false as const,
};
const manifest = await lifecycle.retire(decision);
// Persist this trusted manifest outside the storage/backup rollback boundary
// before scheduling purge. It is sensitive operational metadata.
await saveAuthoritativeRetirementManifest(manifest);

// One bounded host job step. Reassess eligibility and holds each time.
const progress = await lifecycle.purge({
  requestId: decision.requestId, legalHold: false, limit: 50,
});
// Schedule another step unless progress.phase === 'complete'.
```

`saveAuthoritativeRetirementManifest` and the resolved values above are application code. There is no bundled manifest service or scheduler. A lifecycle state is not a signed receipt, independently authenticated decision, or proof of legal review.

Retirement is irreversible for this context. It is stored transactionally before deletion begins and blocks both new commands and old idempotent retries. Retired head reads throw `EvidenceLifecycleError('context-retired')`; they never return an empty live stream. A genuinely new workflow needs a separately authorized context and fresh controller. Do not rotate identifiers merely to bypass a restriction.

## Holds and progress

Use `setHold({active:true, reviewAt, expectedRevision})` to protect retained payloads. Read the current hold revision through `getState()`; the initial revision is zero. Releasing a hold requires `active:false`, `reviewAt:null` and the current revision. A review date never releases a hold automatically. A new hold also pauses a purge already in progress. The host's fresh `legalHold:false` assertion cannot override a stored hold.

Each purge transaction examines at most `limit` event keys (1–100), including foreign records. It deletes only the matching family, site and context; event IDs are recomputed before deletion. Shared notices, offers, active pointers and policy archives remain. A head is removed only with its matching event. Deletes, counters and the internally stored continuation commit together. Callers cannot choose or skip a cursor. A failure rolls the batch back; retry resumes from the last committed state. A final empty batch may be needed.

Paid orders use `{family:'orders', siteId, scopeId, streamId:checkoutId}` with the same order prefix. Their originals and reviews are private to the intent: purge removes those chunks/manifests, activation and consumed markers, attempts and the admission event. Retirement is kept outside that payload subtree and fences archive access as well as new writes and retries. Orders also require `externalWorkStopped:true` at retirement, after the host actually stops or fences payment, reservation and fulfillment jobs. A pending/uncertain confirmation state blocks retirement. Package erasure does not delete host reservation state or shared legal releases; those require separate eligibility and replay controls. See [paid orders](PAID-ORDERS.md).

The adapter must provide transactional `get`, `put`, `list` and `delete`; unsupported adapters fail before mutation. Use the transaction object inside each callback, with no external side effects: [Cloudflare's storage transaction contract](https://developers.cloudflare.com/durable-objects/api/legacy-kv-storage-api/#transaction). Custom adapters must supply the same atomicity and ordered-list semantics. Direct writes around the ledger guards are outside this contract.

Counters describe this scan. “Purge recorded complete” does not mean every personal datum was erased. Context digests, decision IDs, timestamps and hold/scan metadata remain and may still be personal data. The host must justify and govern those records too, alongside shared documents, copies, downloads, logs and backups. There is no automatic tombstone expiry or promise of cryptographic anonymization.

## Keep the browser closed

Map only a trusted, authenticated host retirement response to the corresponding frontend error:

| Controller | Error to throw from its host transport |
| --- | --- |
| Required cookie evidence | `ConsentEvidenceError('context-retired')` |
| Recorded processing opt-out | `ProcessingChoicesError('context-retired')` |
| Terms acceptance | `TermsAcceptanceError('context-retired')` |

The example website maps the backend error to HTTP 410 with `{code:'context-retired'}`. These error classes are exported by `@notabenda/core`. A random object with a `code` property is not treated as authoritative terminal status.

The current controller then remains `retired`: cookie grants and retries stop, terms resubmission/editing stops, and processing keeps every covered activity blocked. Local restrictions and uncertain outbox data are preserved; server retirement does not silently erase browser intent. Cookie rejection still works locally. Hosts must provide a contact or new authorized workflow when appropriate, and govern local data separately.

## Restore before reopening traffic

A database backup can contain both old payloads and old lifecycle metadata. Before restored storage serves any requests:

1. Keep the restored object isolated from readers and writers.
2. Reconcile **every** authoritative retirement manifest from outside that backup boundary with the appropriate fixed target.
3. Call `restore(manifest)`. It reinstates the retirement barrier and resets scanning to the beginning, including previously completed scans. An active current or imported hold stays active. Conflicting retirement decisions fail closed.
4. Run bounded purge steps under fresh eligibility/hold assessment, handle copies and remaining metadata, then verify the result before reopening traffic.

The library cannot detect a missing manifest or discover deleted subjects from an old backup. Manifest authenticity, completeness, safe retention, target resolution and restore orchestration belong to the host. The synthetic demo restores old payload/head records, proves retries remain blocked, reapplies its manifest and purges again; that is a local engineering drill, not a full infrastructure disaster-recovery exercise.

## Review in the backoffice

```ts
import {createAdminWorker, createEvidenceLifecycleStore} from '@notabenda/cloudflare';

const admin = createAdminWorker({
  basePath: '/admin/lifecycle',
  authorize: request => authorizeAndResolveSite(request).then(scope => scope ? {
    store: createEvidenceLifecycleStore(ctx.storage, {
      family: 'consent', siteId: scope.siteId,
    }),
    scopeLabel: scope.label,
    allowExport: scope.canExport,
  } : null),
});
```

`authorizeAndResolveSite` is host code. Each grant binds one fixed family/site/prefix. The synthetic website intentionally combines its own five fictional lifecycle records under a separate host-owned prefix at `/backoffice/lifecycle`.

Search for a family, phase, decision reference, context digest or timestamp. Displayed labels also match: `held`, `pending`, `restored`, `cookie-choice`, `processing opt-out` or `terms agreement`. The same matching applies to export filters. State shortcuts use precise `lifecycle:held`, `lifecycle:pending`, `lifecycle:complete` and `lifecycle:restored` filters instead of matching words in unrelated JSON fields; `lifecycle:retained` is also available. A held purge can match both held and pending states. These shortcuts preserve date, kind and key-prefix filters and start a new bounded scan. Cards distinguish a live retained context, active hold, retired/pending purge and recorded completion. Details show lifecycle stages, hold review, scan counts and restore/completion dates. Original event payloads are withheld from normal ledger inspection as soon as retirement begins, using a minimized projection so pagination remains bounded and truthful. The JSON disclosure and authorized export still contain sensitive operational metadata.

[Verification and remaining limits](verification/evidence-lifecycle.md) connect the tests and browser/runtime checks.
