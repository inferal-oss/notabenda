<!-- @requirements REQ-PRODUCT-RECORDING-INSPECTION -->
# Inspect recording setup

An archived policy is not necessarily the one selected by a recording endpoint. Use **Recording setup** to check the backend's current cookie notice, terms offer or form-permission offer. Historical records remain in their own search views.

The optional Cloudflare readers verify the selected descriptor and its retained legal release in one storage transaction. They require a fixed host-owned site and scope. They read no visitor heads, enumerate no records and change no activation, permission or lifecycle state.

```js
import {getConsentRecordingSelection} from '@notabenda/cloudflare';

const selection = await getConsentRecordingSelection(storage, {
  siteId: 'your-site',
  scopeId: 'cookie-choices',
});
```

The companion readers are `getTermsRecordingSelection(storage, {siteId, scopeId})` and `getFormPermissionRecordingSelection(storage, {siteId, permissionId})`. Their existing trusted `prefix`, `releasePrefix` and explicit `allowPreview` options remain available. Do not take those values from browser input.

## Read the result

- **Not configured** means this host scope has no activation record. Registering a descriptor or archiving a release does not select it.
- **Inactive** means no descriptor is selected by the activation record.
- **Selected** gives the descriptor ID, artifact ID, release mode and exact privacy or terms document reference. A form permission also has its monotonic activation revision.
- **Check unavailable** means the view could not obtain a valid, matching result. A corrupt pointer, missing descriptor/archive, denied preview or failed transport is not treated as an empty scope.

The readers throw on invalid stored state. The operator view retains a failed card without exposing the exception. It never substitutes another site's descriptor or the newest archived policy.

A selected descriptor does not establish browser publication, loader behavior, legal eligibility or an individual's permission. Scope guards and current visitor state can still block work. Confirming those things requires their separate application checks. Processing opt-outs do not have the same active-grant selector; this view does not invent one for that ledger.

## Mount a host-authorized view

```js
import {
  createRecordingInspectionWorker,
  getConsentRecordingSelection,
} from '@notabenda/cloudflare';

const worker = createRecordingInspectionWorker({
  basePath: '/admin/notabenda/recording',
  historyPath: '/admin/notabenda/history',
  async authorize(request, env) {
    if (!await hostCanInspect(request, env)) return null;
    return {
      scopeLabel: 'Website recording',
      targets: [{
        id: 'cookies', title: 'Cookie choices', family: 'consent',
        siteId: 'your-site', scopeId: 'cookie-choices',
        read: () => getConsentRecordingSelection(hostStorage, {
          siteId: 'your-site', scopeId: 'cookie-choices',
        }),
      }],
    };
  },
});
```

Supply existing validated host authorization and storage. The package provides no login or credential. Each request receives only its granted readers; query parameters cannot choose another site, scope, namespace, object or person. The optional history link searches the configured host-authorized history route by artifact ID. Showing a pinned path does not fetch it or establish that it is published.

Targets have a stable display ID, title, family, site, scope and a read callback. Use `form-permission` with the permission ID as `scopeId`, or `terms` with its agreement scope. The callback's result must match that declared identity. The view validates a bounded projection and escapes text; it cannot establish the truth of arbitrary host callback code. Use the supplied readers to verify retained descriptors and archives.

## Compare the expected version

A valid backend selection can still be the wrong version for your application. Add an optional fixed `expected` reference to a target when you want that comparison:

```js
const target = {
  id: 'account-terms', title: 'Account terms', family: 'terms',
  siteId: intendedOffer.siteId, scopeId: intendedOffer.scopeId,
  expected: {
    id: intendedOffer.offerId,
    artifactId: intendedOffer.artifactId,
    mode: intendedOffer.mode,
  },
  read: () => getTermsRecordingSelection(hostStorage, {
    siteId: intendedOffer.siteId, scopeId: intendedOffer.scopeId,
  }),
};
```

Use the reviewed descriptor your application intends to record against. For a cookie notice, `id` is its `noticeId`; for terms and form permissions it is the `offerId`. The artifact ID and release mode are required too. Keep these values in trusted host configuration. Request parameters cannot select or override them. The view copies and validates the reference before invoking readers.

| Observation | What to do |
| --- | --- |
| Uses the expected version | The descriptor, artifact and mode match. Check the served copies and actual running interface separately. |
| Another version is selected | Review the expected release, current selection and recording endpoint. The comparison names differing fields; it changes neither version. |
| Expected version is not selected | No activation record exists in this scope. Review archive registration and explicit host activation. |
| This scope is inactive | Confirm whether that is intentional before changing activation. The view never reactivates anything. |
| Expected version could not be compared | The current read failed validation, timed out or was unavailable. Check the reader/archive and retry. |

**Expected selection references** is collapsed by default. With a configured history route it links to the expected release; the current selection keeps its separate history link. A comparison is also available as `observations[].comparison` in JSON, with `matches`, `different`, `unconfigured`, `inactive` or `unavailable`. Targets without an expectation retain the ordinary selection view and report `not-specified` in JSON.

Expected references express host intent. This comparison does not look up or verify the expected archive, choose the newest release, authenticate the application's configuration or prove which offer its browser uses. An obsolete expectation can match an obsolete backend. An expected preview matching a selected preview stays a preview. Check the actual application and review the expected release independently; `boundaries.verifiesExpectedArchive` remains false.

The served-copy check below still fetches the **currently selected** pinned document. Matching its HTML does not resolve an expected-version mismatch: two different offer statements can refer to the same policy HTML. These observations remain separate.

At most twelve fixed targets are read concurrently. `readTimeoutMs` defaults to 5,000 and accepts 1,000–30,000. Remote callbacks should propagate the supplied `{signal}`; timed-out or invalid reads stay unavailable, and late completions cannot replace the rendered result. A callback that ignores cancellation may continue its read. Each scope is observed separately, not as a single cross-scope snapshot. No automatic polling is installed.

The view supports GET/HEAD only and uses private, non-cacheable responses and nonce-bound inline styles without scripts. `?format=json` supplies the same authorized observations and explicit verification boundaries. Other selectors are rejected before the readers run. The optional served-copy check below adds the explicit `publication=check` action.

## Connect the workspace overview and starter

An overview can expose a separate link without reading these selections on every overview request:

```js
createWorkspaceOverviewWorker({
  basePath: '/admin/notabenda',
  recordingPath: '/admin/notabenda/recording',
  authorize: () => ({areas, allowRecordingInspection: true}),
});
```

The inspection route must authorize independently. Existing callers without the option or grant receive no new link.

New Cloudflare starters include the read-only route behind existing host inspection authorization. Its default target list is empty. In the generated `src/worker.mjs` constructor, build fixed readers from `ctx.storage` and trusted settings, then pass them through `createWorkspace(ctx.storage, {recordingTargets})`; keep their site/scope resolution in trusted code. An empty view is not proof that the backend contains no notices. The default starter still denies access until the host hook is implemented.

Try the [isolated demo workspace](/demo/admin), then choose **Inspect selections**. Its view reads that session's configured sample scopes; it never reads the operational workspace. See [verification](verification/recording-inspection.md).

## Compare served document copies

Archiving and selecting a document do not put it on your website. Connect an optional fixed reader, then use **Check document copies** in Recording setup to compare each selected document with the HTML returned by that reader. Opening the ordinary view performs no publication fetch.

```js
const target = {
  id: 'terms', title: 'Account terms', family: 'terms',
  siteId: 'your-site', scopeId: 'account-terms',
  read: () => getTermsRecordingSelection(hostStorage, {
    siteId: 'your-site', scopeId: 'account-terms',
  }),
  publication: {
    origin: 'https://your-site.example',
    label: 'Public website',
    fetch: request => fetch(request),
  },
};
```

Keep the origin and reader in trusted host code. No query parameter can choose a hostname, path, credential, object or scope. The check constructs a GET for the selected immutable `/artifacts/<id>/<kind>.html` path, with no cookies or authorization, omitted credentials and manual redirects. It never follows a redirect. The ordinary selection is verified against its retained archive first; an unavailable or inactive selection triggers no fetch.

| Result | Meaning |
| --- | --- |
| HTML bytes match | A complete HTTP 200 HTML response has the retained SHA-256. |
| Different HTML copy | The returned HTML has another digest. Inspect deployment output and response transformations. |
| Document not found | The reader returned HTTP 404 or 410. |
| Check unavailable | Transport, time, size, media type or another response check failed. This is not an empty or matching document. |
| Not checked / No check connected | No request was made, or the host has not supplied a reader for this scope. |

Each result names its reader, origin and check time. Expand **Copy check references** for the requested URL, digests, HTTP status and any bounded failure code. Response bodies, response headers and transport exception messages never enter the report. A result changes no recording selection or visitor record.

The response limit is 256 KiB, applied to streamed bytes even if Content-Length says less. At most 16,384 body reads are permitted, including empty chunks; the loop yields every 64 reads so immediately available chunks cannot starve deadline and cancellation timers. Empty chunks are not retained. Exceeding the read bound returns `work-limit`, without a partial digest. Each copy check uses the view’s `readTimeoutMs` (5 seconds by default) separately from the selection read; cancellation reaches the supplied Request. A callback that ignores cancellation may finish later, but its body is discarded and cannot replace the result. The twelve-target view bound remains. These observations are not one cross-scope transaction; selection can change after it is read.

Use `?publication=check&format=json` for the same explicit authorized check. The existing verification boundaries remain: a byte match does not establish public routing, browser use, actual permission, enforcement or legal approval. An asset binding can bypass middleware, authentication and the externally served route. Label that reader accurately and check the public HTTP route separately when needed. The project demo uses **Website asset binding** and makes no external HTTP call.

The helper is also available independently:

```js
import {checkDocumentPublication} from '@notabenda/cloudflare';

const result = await checkDocumentPublication({
  path: selection.selected.document.url,
  sha256: selection.selected.document.sha256,
}, {
  origin: 'https://your-site.example',
  label: 'Public website',
  fetch: request => fetch(request),
  timeoutMs: 5000,
  maxBytes: 256 * 1024,
});
```

Use an already verified selected reference; the helper itself does not read a backend selection. It accepts only retained privacy, cookie or terms paths and SHA-256 references, never a free-form URL. Limits are at most 30 seconds and 1 MiB; an optional `signal` cancels the check. HTTPS is required, except for an explicit `allowHttpLoopback: true` local fixture on literal localhost, 127.0.0.1 or ::1 hosts. No network reader is installed by default in Cloudflare starters. The adopter chooses manual checks or CI. See [verification](verification/publication-inspection.md).
