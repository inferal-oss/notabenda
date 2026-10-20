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

At most twelve fixed targets are read concurrently. `readTimeoutMs` defaults to 5,000 and accepts 1,000–30,000. Remote callbacks should propagate the supplied `{signal}`; timed-out or invalid reads stay unavailable, and late completions cannot replace the rendered result. A callback that ignores cancellation may continue its read. Each scope is observed separately, not as a single cross-scope snapshot. No automatic polling is installed.

The view supports GET/HEAD only and uses private, non-cacheable responses and nonce-bound inline styles without scripts. `?format=json` supplies the same authorized observations and explicit verification boundaries. Other selectors are rejected before the readers run.

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
