<!-- @requirements REQ-PRODUCT-TERMS-CONNECTION REQ-PRODUCT-PACK-CONNECTION -->
# Inspect a terms connection

An agreement control can show an old offer or belong to a different host operation. Compare the controller used by your actual page with the offer and operation you intended before testing the flow.

```ts
import {inspectTermsConnection} from '@notabenda/core/terms/inspect';

const report = inspectTermsConnection(acceptance, {
  expectedOffer: intendedOffer,
  expectedOperationId: currentOperationId,
});
```

Use the host-owned controller supplied to the native control, React provider or Astro bridge. The optional entry works in the browser and SSR. It reads the controller synchronously, without subscribing, changing the checkbox, creating a request key, submitting, retrying, refreshing or destroying it. Built-in read methods have no storage or network effects; custom controller methods remain trusted host code.

## What the report tells you

| Question | Observation |
| --- | --- |
| Is the intended offer connected? | `offer.comparison` compares the complete normalized offer: IDs, site, scope, mode, document metadata and digests, statement, action label and selected localization dictionary. Changed wording under an unchanged offer ID still differs. `differingFields` names top-level fields without copying their content. |
| Is it the intended host operation? | `operation.comparison` uses the controller’s optional `isForOperation(expected)` method. Built-in controllers compare their immutable operation reference without returning it. Custom controllers without this method report `unavailable`; their supplied comparison remains a host assertion. |
| What has this controller observed? | `controller` reports its status, checkbox state, whether a recovery key exists and any bounded error code. `receipt.status` says whether this controller previously confirmed a matching receipt. |
| Are files published and current terms activated? | `publication` and `backendSelection` remain `not-checked`. Check [pinned publication](PUBLICATION-CHECK.md), authorized backend selection and archived bytes separately. |
| Does the real flow work? | `behavior` remains `not-tested`. Test initial unchecked state, the pinned document, failure, uncertain retries, operation replacement, acknowledgement and the host action that follows agreement. |

Omit either expectation to report that comparison as `not-requested`. Offer shape validation does not authenticate an offer ID, document digest or archive. A local operation match does not authenticate a user or establish server authorization. An Astro view `contextKey` is a remount guard, not the host `operationId` to compare here.

## Read the states carefully

A recovery request key can exist while the controller is still idle. Even `submitting` does not prove that the transport has started. A failed response leaves the server outcome uncertain: the record may have been saved before the acknowledgement was lost. Inspection never retries that attempt.

`controller-confirmed` means this supplied controller previously admitted a matching receipt. It does not prove that the backend still selects that offer, authorize a purchase or grant current permission. Destroyed controllers can retain historical receipts; stale and retired states remain observations of the local attempt. They are not fresh server checks.

The private report includes public offer/artifact/site/scope references, document digests, bounded states and a local observation time. It excludes operation, request and receipt identifiers, subjects, document titles/URLs/versions, statements, action text and translated messages. It has no overall installed, ready or compliant verdict. Keep exported reports private and repeat inspection when the controller changes.

## Try it

Open the [terms example](https://notabenda.org/agreement/) or its [midnight appearance](https://notabenda.org/dark/agreement/), then expand **Inspect this connection** and press **Inspect runtime**. The separate inspector module loads only on that request. Checking the agreement box invalidates the displayed result and its download. Inspection itself submits nothing.

See [verification](verification/terms-connection.md) and the separate [consent inspector](CONNECTION-INSPECTION.md).
