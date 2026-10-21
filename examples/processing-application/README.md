<!-- @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN -->
# Processing opt-outs, through to delivery

This application connects privacy choices to work performed on the server. An anonymous page request, a browser-reported signal and a deliberate opt-out can stop a classified producer. An independent sample destination records the calls it actually received, so you can compare delivery observations with restriction records.

Cookie choices stay separate. Accepting cookies cannot remove a saved processing restriction. The unrelated local feature and sample operational producer have their own behavior.

## Run a copy

The packages are unpublished previews. Build and pack the matching packages in a Notabenda checkout, then install the actual local tarballs in your copy of this directory:

```sh
npm run build
mkdir -p .local/processing-packages
npm pack --workspace @notabenda/core --workspace @notabenda/cloudflare \
  --pack-destination .local/processing-packages

# In your copied application:
npm install /path/to/notabenda-core-0.1.0.tgz /path/to/notabenda-cloudflare-0.1.0.tgz
npm install --include=dev
npm run check
npm run dev
```

Use a free local port. The example's `dev` script uses 4188 and passes its matching loopback `APP_ORIGIN`. The draft YAML requires explicit preview mode; ordinary `build` and `deploy` require reviewed production configuration. Only `deploy` deploys anything.

Initially, the context and operator hooks return `null`. Legal pages work; covered work stays off. A request with `Sec-GPC: 1` is restricted immediately even without an account, cookie, Origin header or existing receipt. Without host continuity, the page reports that persistence is unconfirmed.

## Connect anonymous continuity

In `authorize.mjs`, implement `resolveVisitor(request, env)` using your application's existing anonymous context. Return `{streamId, headers?}` or `null`. An account is not required. Use an opaque stable reference, never an email, raw credential or caller-selected identity. Optional response headers let your host maintain its own session cookie; this example creates no credentials or cookie issuer.

The browser receives a derived digest and sends it back only as a precondition. Each request independently resolves the host context. A digest cannot select another visitor or Durable Object. Before changing the host context, notify the page:

```js
window.dispatchEvent(new Event('application-session-changed'));
```

That stops the old controllers and client services. Reload to reconnect. A later server mismatch also disconnects the old page. The host owns session expiry, rate limits, quotas and abuse prevention.

`authorizeOperator` separately grants `{inspect:true}`, optionally `manageNotices:true` and `dispatch:true`. At `/backoffice`, register the fixed build's notice explicitly. Visitor requests never register it. Processing restrictions are one-way; this flow has no permission-grant activation or re-opt-in operation.

## Follow the flow

1. Ordinary page navigation checks the actual HTTP GPC header before covered server work. No Origin header or login is needed for this observation.
2. The browser connects native opt-out controls and cookie controls to separate controllers. A browser-only GPC signal immediately gates the client and reports its restriction after existing pending requests settle.
3. Browser submissions always have `browser-report` provenance. This includes manual actions: the server cannot prove which interface action produced a request. Only an actual observed HTTP header produces `gpc-header` provenance.
4. A queued job is checked again at dispatch. A job queued before an opt-out receives no new admission after that restriction commits.
5. The operator sees restriction records with their original wording, delivery jobs with their certainty, and independent sink observations with actual received attempts.

The checkbox labeled **Simulate a browser GPC signal** exercises browser reporting. It does not fabricate a request header. The destination receives fixed synthetic payloads only, through a separate SQLite Durable Object. It is not a real advertising provider.

## Handle uncertainty honestly

Before recording a valid restriction, the application writes a pending fence. If the ledger write then fails, that fence survives object recreation and keeps covered admissions off. It clears only when the retained head covers its activities. A partial confirmed restriction does not clear a different unresolved activity. Malformed requests create no fence.

If storage cannot save even the fence, the current object remains restrictive in memory and persistence is reported as unconfirmed. This cannot establish continuity through total storage loss, restart or a new host context. The browser's local restriction journal helps recover original requests; it is not durable server evidence. Supply a stronger host recovery policy where needed.

An admitted send may finish after an opt-out. Neither a timeout nor abort recalls a payload. A producer timeout is shown as uncertain; an affirmative refusal alone establishes blocked. The job retains its delivery ID and digest, and concurrent dispatch shares one in-flight attempt. A later retry rereads restrictions and consumes a new admission, up to three total attempts. A newly saved opt-out prevents retransmission even when an earlier delivery remains uncertain.

“Unrestricted” means that this gate found no applicable restriction; it is not permission or a legal-basis decision. The fixed synthetic producer runs solely for this demonstration. Real processing must meet the host’s independent admission conditions as well as this restriction gate.

The sink deduplicates committed payloads by delivery ID and counts received attempts separately. This is a sample provider contract, not an exactly-once delivery guarantee. There is no background sender or scheduler.

## Adapt the application

| File | Supply or replace |
| --- | --- |
| `notabenda.config.yaml` | Real inventory, processing classifications, wording, storage and reviewed documents. |
| `authorize.mjs` | Anonymous continuity and separately checked operator permissions. |
| `workspace.mjs` | Your producer admission, payload, destination/idempotency contract and reconciliation. |
| `client.mjs` | Actual cooperative service start/stop behavior and host context changes. |
| `wrangler.json` | Worker name, routes, environment and stable storage bindings. |
| `style.css` | Page styling; native controls retain the package's CSS tokens. |

The HTTP boundary fixes site/scope/notice, checks mutation Origin/custom header/JSON, bounds input to 4 KiB, and uses private/no-store responses. Operator HTML is outside public assets; `/operator` aliases return 404. Private RPC errors expose only bounded codes. Context resolution and RPC waits are bounded, but timeout does not cancel admitted external work.

Builds emit current and hash-pinned processing notice JSON, the legal artifact and pinned privacy HTML. Retain old release artifacts explicitly with `--retain-artifact saved-release.json` when rebuilding in a clean environment. Preserve earlier pinned notice JSON separately as well: the build emits its current notice, not every historical notice. Keep the database's original notice/release records. Do not rename scopes or streams to reset restrictions.

A trusted host restoring a known unresolved intent can call the workspace factory’s private `fence(streamId, activities)` before reopening processing. It records no receipt and exposes no public HTTP or Worker RPC operation. Authenticate the original intent and target in a journal outside the restored database; a backed-up pending fence can itself roll back. The [provider-native recovery exercise](../../docs/CLOUDFLARE-REMOTE-RECOVERY.md) demonstrates this boundary with synthetic data.

If pending-fence capacity is exhausted, a persistent global overflow fence blocks admissions across contexts until the host explicitly reconciles it. Restart does not clear that fence. It is an operational stop, not a recorded opt-out for every visitor.

The example's bounded queues (32 jobs, 256 pending fences and 256 sink payloads) are for demonstration. It includes no record expiry scheduler, production retention policy, cross-device identity, legal applicability decision or re-opt-in flow. Use the existing lifecycle APIs with a reviewed policy, and ensure pending fences and producer jobs cannot bypass retirement, erasure or holds in your integration.

The optional maintainer command `node scripts/check-processing-application.mjs` runs this application against disposable local SQLite. Synthetic context hooks and fault endpoints are injected only into that private copy. It deploys nothing and leaves adopter CI decisions to the adopter.

Code is Apache-2.0. Replace the fictional legal content with reviewed wording for your actual service.
