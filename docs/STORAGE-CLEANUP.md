# Declared storage cleanup

Use `registerStorageService` when one consent-managed optional producer owns exact browser storage items. The host keeps responsibility for stopping the producer; the adapter adds storage cleanup to that lifecycle. Try [the working example](/storage-cleanup).

```js
import {createConsent, registerStorageService} from 'notabenda';
const consent = createConsent(config);
const memory = registerStorageService({
  consent,
  serviceId: 'sample-memory',
  targets: [
    {storageId: 'sample-local'},
    {storageId: 'sample-session'},
    {storageId: 'sample-cookie', cookieScopes: [{path: '/app'}]},
  ],
  start({signal}) {
    // Start only this service's producer; respect signal.aborted and stop future writes.
    return async () => { /* stop/await your producer */ };
  },
});
const unsubscribe = memory.subscribe(({state, report}) => {
  // Report contains inventory IDs and outcomes, never storage values.
});
// On host unmount: stop registration immediately and await this service's final cleanup.
await memory.destroy();
```

Each target references an existing optional inventory item belonging to this service. Register the service only through this helper. Do not also call `consent.registerService` for the same ID. The adapter obtains purpose IDs from the inventory. It rejects necessary items, ambiguous shared names, unsupported storage types and names beginning with `notabenda:`. It validates and copies the entire target batch before registering or deleting anything.

When the service is disallowed at construction, it removes declared leftovers. It also observes withdrawal before a queued producer starts. Running generations clear on synchronous abort, then again after the host's asynchronous teardown, including throwing teardown. Failed/invalid startup also clears possible partial writes. A regrant waits behind the same core generation barrier so an old cleanup cannot erase the new producer's data. These mechanics also apply when expiry, GPC or a retained processing restriction blocks the service.

`getSnapshot()` is pure and returns a detached `{serviceId, state, report}`. `subscribe` receives an immediate snapshot and subsequent reports. Destruction is idempotent, exposes `closing` until the helper's own generations finish, performs a final clear even without a started generation and ends in `closed`. Closed describes lifecycle completion, not successful deletion: inspect `report.failed`. A host producer that never finishes prevents completion. Unrelated services are not awaited.

For localStorage/sessionStorage, `absent-at-check` means `removeItem` was followed by a null `getItem` at that moment. Exceptions, unavailable storage or a remaining item produce a failure. A failed initial cleanup retries before startup; persistent failure prevents the producer. Failed startup/teardown uses the core's `reload-required` state. A report does not prove that another tab or an uncontrolled producer cannot write later.

For cookies, supply every intended path and optional domain explicitly. The adapter requests expiration for each scope and reports only `expiration-requested`. It never claims verified removal. It rejects unsafe names/attributes, foreign domains and invalid cookie-prefix scopes. `__Host-` needs secure context, path `/` and no domain; `__Secure-` needs secure context. HttpOnly cookie prefixes cannot be targeted. Browser acceptance, public-suffix rules and the real existing cookie scope remain outside this check. See [the cookie API](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie) and [Storage.removeItem](https://developer.mozilla.org/en-US/docs/Web/API/Storage/removeItem).

There is no storage enumeration, broad origin clearing, IndexedDB adapter, HttpOnly/server or third-party cookie deletion, partitioned-cookie support, vendor discovery or remote erasure. Never treat this as an erasure request workflow or proof that earlier transmission was undone. The host supplies server/vendor cleanup and any required reload guidance.

The optional environment argument supplies local/session storage getters and `{hostname, secure, expire}` cookie capability for host tests/platform adapters. Default capabilities are read only at construction, not import, so SSR imports remain inert.

Traceability: `REQ-PRODUCT-STORAGE-CLEANUP` and `REQ-PRODUCT-CONSENT-RUNTIME`. Broader legal withdrawal/erasure obligations remain partial in the catalog.
