# Exporting scoped evidence

Requirements: `REQ-PRODUCT-EVIDENCE-EXPORT`, `REQ-PRODUCT-CF-ADMIN`.

The Cloudflare backoffice exports one filtered JSON segment from the authorized store. Export uses the current search terms, record kind, key prefix, UTC dates, page limit and cursor. Follow the continuation link to export more records.

## Enable export in the host

Viewing and bulk downloading have separate permission. Return `allowExport: true` from the mandatory per-request authorization hook only when the caller may download everything the selected store returns.

```ts
const admin = createAdminWorker({
  basePath: '/backoffice/evidence',
  async authorize(request) {
    const grant = await hostAuthorize(request);
    if (!grant?.canInspectEvidence) return null;
    return {
      store: hostScopedStore(grant),
      scopeLabel: grant.displayLabel,
      allowExport: grant.canExportEvidence === true,
    };
  },
});
```

`allowExport` defaults to false. Both `/export` (review) and `/export.json` (attachment) call authorization again; a review link does not carry export permission. URLs select filters within the already scoped store, never a site, subject authority, namespace or Durable Object. Hosts own session/CSRF security, access auditing, rate limits and authorization policy. Do not log full search URLs or exported record payloads as routine access logs.

The script-free review screen shows the selected filters, preview counts, read time, what the file includes, and a download action. The download is a fresh read; it may differ from the preview. Counts refer to the current segment, never the entire store.

## What the file contains

The attachment uses `application/json`, a fixed `notabenda-evidence.json` filename and private/no-store headers. The version-1 envelope includes:

- `kind: 'notabenda-evidence-segment'` and `schemaVersion: 1`.
- `scopeLabel`, for display only; this label establishes no authority.
- `selection`: exact normalized filters, maximum returned records and optional incoming `after` cursor.
- `read.startedAt`, `read.completedAt`, and `read.consistency: 'live-segment'`. These are server read times, distinct from each record’s own event times.
- `records`: exact normalized `{id, data}` values returned by the scoped adapter, including all its fields without redaction.
- `segment.returned`, optional `examined`, `continuationRequired` and optional `nextAfter`.
- HTTP downloads also include relative `links.review` and, when continuation exists, `links.nextReview` and `links.nextDownload` preserving the selection.

No source-archive hook or external artifact link is followed. A history store exports its inspection projection, rather than automatically including its archived HTML, private authoring source or public configuration. A custom store can still return sensitive fields or source text in ordinary record data: this feature does not redact them. Shape the store’s projection to the intended permission and disclosure boundary.

## Continue without losing the selection

Each read returns at most 50 records and examines a bounded segment; the built-in adapter defaults to 200 examined keys, configurable up to 500. An empty segment can still have continuation. A continuation means more keys can be examined, not that additional matching records are guaranteed.

Save each file separately. Follow the **downloaded file’s** `nextReview` or `nextDownload` link, and repeat until it reports no continuation. Do not use an earlier preview’s cursor to assemble a download sequence. There is no automatic traversal or background download. The preview also offers a next-segment link for exploring the current live search.

Records follow UTF-8 key order. Every returned page is normalized and checked against the filters, strictly increasing keys, incoming cursor, forward continuation, record count and scan limits. Invalid, oversized or out-of-filter adapter output fails with a generic error; it is never silently omitted from an apparently successful export. A compact HTTP attachment is capped at 4 MiB.

These reads do not supply snapshot isolation. Inserts behind a prior cursor, modifications, deletions and changing read-time projections can change the combined result. A host requiring a frozen export must supply a separately authorized snapshot store and preserve its identity and lifetime. These files are unsigned; they do not establish authenticity, completeness, valid consent or that a person saw a notice. They are evidence from one store, not an automatic response to an access request or a backup of the entire application.

## Application API

A trusted host can use the same bounded reader without mounting the UI:

```ts
import {createEvidenceExportSegment} from '@notabenda/cloudflare';

// Authorize first and resolve a fixed store independently of untrusted input.
const segment = await createEvidenceExportSegment(authorizedStore, {
  query: 'opaque-subject-reference', kind: '', keyPrefix: '',
  from: '', to: '', limit: 25,
}, {scopeLabel: 'Authorized evidence'});
```

The helper reads one segment and returns the envelope without HTTP links. It neither authorizes a caller nor writes anything. Do not expose it with a browser-supplied store selector. Hosts decide how to audit export preparation, secure downloaded copies, apply retention/deletion, and provide other records needed for a subject request.
