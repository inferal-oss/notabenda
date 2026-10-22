<!-- @requirements REQ-PRODUCT-TERMS-RECOVERY REQ-PRODUCT-TERMS-ACCEPTANCE -->
# Retry an agreement after reload

A server can store an agreement before the browser receives its receipt. The ordinary controller retries with the same request ID while it remains alive. The optional recovery helper keeps that ID in a private browser journal so a fresh controller can retry the same host operation after reload.

Reload starts unchecked, with no receipt and no confirmed agreement. The person must check the statement again and deliberately submit. The server independently authorizes the operation and returns the original receipt if that request was already recorded. This is retry assistance, not an exactly-once guarantee or proof of a human action.

## Connect the helper

```ts
import {mountTermsAcceptance} from '@notabenda/core/terms';
import {
  createIndexedDBTermsRecoveryJournal,
  createRecoverableTermsAcceptance,
} from '@notabenda/core/terms/recovery';

const journal = createIndexedDBTermsRecoveryJournal();
const agreement = await createRecoverableTermsAcceptance(offer, {
  operationId: hostOperation.id,
  contextId: hostOperation.recoveryContextId,
  journal,
  submit: submitToAuthorizedHost,
});
const view = mountTermsAcceptance(container, {acceptance: agreement});

// View/controller ownership stays with the application.
view.destroy();
agreement.destroy();
journal.close();
```

The host supplies a stable opaque `contextId` for one subject and workflow. It must contain 16–200 ASCII letters, digits, underscores or hyphens. Keep it unchanged across reloads for that context; give another account, subject, operation or offer a new one. Do not use an email address, name, credential or access token. The ID is not authorization. The server must derive and authorize the subject and operation itself, rather than trusting browser fields.

The helper reserves a key before returning the controller. This writes browser storage but sends no agreement. It hashes the complete normalized offer and operation into a binding, and stores only `{schemaVersion, binding, requestId}`. The IndexedDB adapter commits the reservation atomically so participating tabs share one key. A reserved key is not evidence that anyone checked or submitted the statement.

The ordinary `createTermsAcceptance` API remains available for hosts that manage recovery themselves. The helper returns the same controller interface, so native, React and Astro views can use it without a new provider. Creating it is asynchronous: handle initialization failure explicitly and destroy/close a result that finishes after its owning page has gone away. No browser globals are read merely by importing the optional entry.

## Handle failures and cleanup

Initialization rejects malformed records, context mismatches and unavailable storage. It does not repair a corrupt row or silently switch to memory. Before each transmission it rereads the reservation; a missing or changed row stops that controller's submission. Ordinary receipt validation, stale-offer and closed-context handling still apply. No local receipt or checkbox state is restored.

The reread is a point-in-time check, not a lock against another tab changing storage afterward. If storage is cleared or evicted before a new controller opens, the helper cannot distinguish that loss from first use and reserves a new key. A private browser journal cannot guarantee server deduplication across that loss. Where the operation must be deduplicated independently, keep its identity/retry policy on the host.

There is no automatic expiry: replacing an uncertain key after a timer could create a second record. `close()` releases this adapter's connection; it retains its rows. The host chooses retention and cleanup. After settling or retiring an operation on the server and destroying all of its live controllers, explicitly remove its row:

```ts
await journal.remove(hostOperation.recoveryContextId);
journal.close();
```

Do not remove an unresolved attempt merely because its receipt failed. Do not reuse a removed context for the same unresolved operation. Removal does not revoke an agreement or stop an already transmitted request. Custom journals implement atomic `read`/`update` through `TermsRecoveryJournal` and supply their own cleanup; a separate read followed by an unrelated write is insufficient. The IndexedDB adapter limits individual rows to 64 KiB but does not silently evict old contexts or impose a total-record retention policy.

## Try the failure path

The [vanilla terms example](/agreement/) uses recovery for its session-bound operation; the [midnight version](/dark/agreement/) has its own operation. Reload leaves the control unchecked. An explicit retry can retrieve the earlier receipt while the same demo session and browser journal remain available. A new demo session is a new host context.

For a controlled lost receipt, run the local [HTTP rehearsal](TERMS.md#maintainer-http-recovery-check). Its first response is interrupted after recording. Reload, check the statement again and submit. The independent server observations should show two attempts, one stored agreement, the same command and the original receipt. This fixture has in-memory server storage and is not a Durable Object restart or production acceptance test.
