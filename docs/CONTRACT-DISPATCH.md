# Dispatch contract declarations

Use the `@notabenda/cloudflare` runners to dispatch a captured declaration to your acknowledgement provider and application. Each runner leases a job, limits the callback to the remaining lease time and records the result. Your host supplies authorization, scheduling and retry policy.

First [register the form and capture the declaration](CONTRACT-ACTIONS.md). Keep dispatch behind trusted application code or private bindings. The host resolves the site/action context; a visitor cannot select another store, job or provider destination.

## Connect the two destinations

```ts
import {dispatchContractDeclaration} from '@notabenda/cloudflare';

const result = await dispatchContractDeclaration(storage, receipt.id, context, {
  acknowledgement: {
    timeoutMs: 10_000,
    async deliver({lease, signal}) {
      const accepted = await hostMailer.send({
        idempotencyKey: lease.deliveryId,
        payloadSha256: lease.payloadSha256,
        to: lease.request.fields.email,
        text: lease.receipt.acknowledgement.text,
      }, {signal});
      return {providerRef: accepted.reference};
    },
  },
  application: {
    async deliver({lease, signal}) {
      const accepted = await hostApplication.acceptDeclaration({
        idempotencyKey: lease.deliveryId,
        payloadSha256: lease.payloadSha256,
        definition: lease.definition,
        declaration: lease.request,
        receipt: lease.receipt,
      }, {signal});
      return {providerRef: accepted.reference};
    },
  },
});
```

`hostMailer` and `hostApplication` above are host-supplied adapters. Use their structured arguments and authenticated server-side connections. Keep provider credentials outside public config and browser code. Admission must prevent abuse or turning the acknowledgement channel into an arbitrary mail relay.

Both callback configurations are checked before either job is claimed. Their attempts then start independently: application failure or an asynchronously hung application does not prevent acknowledgement settlement. The returned promise waits for both bounded attempts. Await it through the host's execution mechanism; do not discard it as an unobserved promise.

`dispatchContractDelivery(storage, id, channel, context, options)` runs one channel with the same contract, for a separately scheduled retry. Channels are `acknowledgement` and `application`. Neither helper retries automatically.

## Interpret the result precisely

Each channel returns two separate fields. An opaque `deliveryId` is included when the helper received a lease.

| Field | Value | Meaning |
| --- | --- | --- |
| `provider` | `not-invoked` | The helper did not call the configured callback. |
| `provider` | `accepted` | The callback resolved a valid provider reference before interruption. |
| `provider` | `uncertain` | The callback started, but acceptance was not confirmed within this attempt. |
| `settlement` | `not-claimed` | No lease was obtained, or the caller was already aborted. This does not establish delivery. |
| `settlement` | `settled` | The helper's outcome was committed under its current lease. Read `provider` to understand that outcome. |
| `settlement` | `lease-lost` | Its lease could no longer commit the outcome. Another attempt or host action may have changed the job. |
| `settlement` | `unknown` | Claim or settlement persistence could not be confirmed. A transaction may already have committed. |

For example, `{provider: 'accepted', settlement: 'unknown'}` means the provider accepted but saving the result could not be confirmed. Inspect the private job and reconcile with the provider by its stable delivery ID; do not infer rejection or send with a new idempotency key.

The callback must resolve **only** `{providerRef: string}` after its configured endpoint durably accepts the job. The nonempty reference is bounded to 200 UTF-8 bytes and excludes control characters. A raw `Response`, extra response fields, missing reference, throw or timeout leaves acceptance uncertain. Raw provider errors and responses are not returned, logged or stored by the helper.

Provider acceptance is neither recipient delivery nor contract fulfillment. The application still owns contract/identity matching, eligibility, cancellation, refunds, financial notifications and delivery reconciliation. The exact declaration receipt remains the original immutable capture snapshot.

## Timeouts, abort and overlapping attempts

`leaseMs` defaults to 60 seconds and accepts 1–300 seconds. `timeoutMs` defaults to the smaller of 30 seconds and the lease minus 100 milliseconds. It must be at least 100 milliseconds and leave that 100-millisecond settlement reserve. `maxAttempts` defaults to 10 and accepts 1–100; the underlying job's total claim count enforces it. Storage time consumes the lease, so the effective callback budget may be shorter.

The helper checks cancellation before and after claim, rejects regressing/invalid preflight clocks, and checks cancellation immediately before invoking the callback. An optional caller `signal` is linked to the callback's attempt signal. Timeout or abort marks a started attempt uncertain; late fulfillment/rejection cannot settle again or overwrite a replacement lease.

JavaScript timers cannot preempt synchronously blocking callback code, and storage operations remain subject to host/runtime limits. Callbacks must yield and respect their attempt signal. Even then, an aborted request can have reached a provider. **Neither timeout nor abort establishes external quiescence or authorizes retirement.** The per-declaration lifecycle still blocks pending, leased or uncertain jobs.

A callback receives a detached lease copy. Its mutation cannot change the private token or declaration used for settlement. Persisting stable `deliveryId` deduplication at the actual receiving endpoint remains essential across overlapping workers, lost responses and process restarts. A new claim changes the lease token/version, not the delivery ID or payload digest.

## Schedule and monitor through the host

These helpers do not install alarms or queues. Integrate them with the host's durable scheduler, explicit retry/backoff policy and reconciliation of pending/uncertain jobs. Capture-to-scheduling failure needs recovery too. Exhausted attempts and unknown settlement require operator attention; a successful invocation alone is not an operational delivery guarantee.

Cloudflare alarms execute at least once and their automatic failure retries are finite. Also, these helpers return uncertain/unknown outcomes as data, so an alarm handler must explicitly handle those results and arrange appropriate continuation. See [Cloudflare's alarm contract](https://developers.cloudflare.com/durable-objects/api/alarms/). No alarm is installed by the toolkit or starter.

The private admin's contract filters distinguish pending confirmation, uncertain confirmation, pending application and both providers accepting. The page reports current stored jobs; an in-memory dispatch result and a later inspection can differ. Keep external provider reconciliation, access logs, hold/retirement decisions, exports and backups in your host's reviewed workflow.

## Rehearse before treating delivery as operational

Maintainers can build the workspace and run:

```sh
node scripts/check-contract-dispatch-runtime.mjs
```

The optional check starts an owned loopback Worker with separate disposable SQLite declaration and provider-simulation Durable Objects. It checks lost application responses, independent acknowledgement, restart with a live lease, stable downstream deduplication, stale settlement and application timeout. It uses a controlled clock and sends nothing externally. The script stops its server and retains the ignored fixture for inspection. It is tooling you choose to run, not an adopter CI policy.

This is not a rehearsal of a real provider, production alarm, national legal pack, recipient delivery or contract fulfillment. Those remain explicit acceptance work. See [verification](verification/contract-dispatch.md) and the [requirements catalog](requirements/README.md#req-product-contract-actions).

For rollback to an older backup, run the separate [transaction recovery exercise](CLOUDFLARE-RECOVERY.md#recover-declarations-and-order-confirmations). It keeps the simulated provider's accepted jobs outside the restored database, replays later holds/deletions before opening and checks stable-ID retries against that retained provider history. A restored pending job is historical state, not evidence that external work never happened.
