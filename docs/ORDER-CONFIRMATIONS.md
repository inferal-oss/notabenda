# Customer confirmation archives and delivery

Use `@notabenda/cloudflare/order-confirmations` after your host decides that a contract has concluded. It retains a complete customer copy and optional attachments, then queues one stable delivery job. It does not turn an order admission into a contract, send email itself or install a scheduler.

## Supply the customer copy

```ts
import {preparePaidOrderConfirmation} from '@notabenda/cloudflare/order-confirmations';

const archive = await preparePaidOrderConfirmation(storage, {
  request: admittedRequest,
  contract: {reference: hostContract.reference, concludedAt: hostContract.concludedAt},
  addressee: {
    name: customer.displayName,
    recipientRef: customer.id,
    destinationRef: savedDestination.id,
    destinationVersion: savedDestination.version,
  },
  issuedAt: hostContract.confirmationIssuedAt,
  locale: 'en', reviewStatus: 'reviewed',
  coverage: {
    selfContained: true,
    preContractInformation: 'included-in-files',
    digitalContent: {
      status: 'not-applicable', reason: 'Goods only; no digital-content supply.',
    },
  },
  files: [
    {id: 'customer-copy', filename: 'confirmation.txt', mediaType: 'text/plain',
      role: 'confirmation', bytes: completeCustomerCopy},
    {id: 'terms', filename: 'terms.pdf', mediaType: 'application/pdf',
      role: 'attachment', bytes: retainedTermsPdf},
  ],
}, hostCheckoutContext);
```

The host supplies **complete reviewed content**, including the personally addressed contract details. The primary file must be UTF-8 plain text containing the contract reference and addressee name. This is a binding check, not a test of legal completeness. Attachments can be plain text, HTML, PDF, PNG, JPEG or SVG. The toolkit stores their bytes without executing them or following links. The host reviews whether the supplied files are self-contained, readable and sufficient; it must not supply a receipt or a list of live policy links as the complete customer copy.

For applicable digital-content consent and acknowledgment, use `{status: 'included', evidenceRef, confirmationText}`. The exact `confirmationText` must occur in the primary file. The evidence reference identifies the host's separate record; it cannot replace consumer-facing wording. Collection of that permission remains a separate integration. Preview contexts explicitly permit draft files; production defaults require `reviewStatus: 'reviewed'`.

`destinationRef` and `destinationVersion` must resolve to a **fixed recipient destination**. A later email-address change must not change the destination of an existing job. The manifest hash and stable delivery ID bind the name, recipient reference, destination reference/version, contract facts, issue time and every file descriptor. The package never resolves these references or chooses a recipient.

Files are limited to 16 per confirmation, 2 MiB each and 8 MiB in aggregate. Exactly one is the primary plain-text confirmation. Names are unique ignoring case and use a bounded ASCII filename without paths. Files use the order archive's verified 64 KiB chunks. Sealing every file, the manifest and the pending job is one transaction. A failed write leaves no partial published confirmation.

## Recover and dispatch

```ts
import {
  readPaidOrderConfirmation, dispatchPaidOrderConfirmation,
} from '@notabenda/cloudflare/order-confirmations';

const result = await dispatchPaidOrderConfirmation(storage, hostCheckoutContext, {
  async deliver({lease, signal}) {
    const destination = await hostDestinations.resolveExact(
      lease.archive.manifest.addressee.destinationRef,
      lease.archive.manifest.addressee.destinationVersion,
    );
    return hostMailer.sendConfirmation({
      idempotencyKey: lease.deliveryId,
      manifest: lease.archive.manifest,
      files: lease.files,
      destination,
    }, {signal}); // resolves only {providerRef} after durable endpoint acceptance
  },
});
const current = await readPaidOrderConfirmation(storage, hostCheckoutContext);
```

Deliver the sealed files; do not rebuild their content from current templates or current policy URLs. `lease.files` supplies detached original bytes identified by manifest file IDs. `lease.deliveryId` stays unchanged across lease replacement, uncertain outcomes and process restarts. The receiving endpoint must persist deduplication for that ID and refuse a different payload or destination under it. The host authenticates both the caller and its provider connection and prevents arbitrary destination injection.

The runner uses the same result vocabulary as [contract dispatch](CONTRACT-DISPATCH.md): `provider` is `not-invoked`, `accepted` or `uncertain`; `settlement` is `not-claimed`, `settled`, `lease-lost` or `unknown`. A provider can accept while ledger settlement is unknown. Reconcile that stable job before retrying. Provider acceptance does not establish recipient delivery. Neither abort nor timeout proves external work stopped. No automatic retries, alarms or queues are installed.

`leaseMs` defaults to 60 seconds (1–300 seconds allowed). `timeoutMs` defaults to the smaller of 30 seconds and the lease minus a 100ms settlement reserve; it must be at least 100ms. `maxAttempts` defaults to 10 (1–100 allowed). Archive verification precedes issuance of the claim; response/storage time after issuance consumes its remaining lease. The callback gets a linked abort signal and cannot settle a later lease. Synchronously blocking host code cannot be preempted by a JavaScript timer.

Hosts with their own runner can use `claimPaidOrderConfirmation` and `settlePaidOrderConfirmation`. `readPaidOrderConfirmationFile(storage, fileId, context)` returns an exact retained file behind the same host-selected context. These APIs install no public route or authentication system.

Preparation retries with the same content return the retained archive before a fresh clock check. Changed content or destination returns `idempotency-conflict`. **This version supports one initial confirmation per intent.** It cannot overwrite, correct or redirect it, including after cancellation. A corrective confirmation or delivery to a changed address needs a separate reviewed host workflow; do not create another checkout to bypass that limit.

## Inspect and retire

`createPaidOrderStore` provides small current delivery summaries for search/detail alongside the unchanged original admission. The complete customer copy, addressee and destination metadata are excluded from ordinary record/export projections. Use `createAdminWorker` with an explicit `allowOrderConfirmation: true` grant for each request; it is independent of `allowOrderArchive` and `allowExport`. The store supplies `getOrderConfirmation` and `getOrderConfirmationFile` hooks. The admin escapes the text preview and serves all original files as sandboxed, attachment-only octet-stream downloads, including HTML and SVG. HEAD and failure paths still require authorization.

The orders lifecycle checks the separate manifest and job. Pending, leased and uncertain jobs block retirement. A partial restore with an orphaned job fails closed. `cancelPaidOrderConfirmation(storage, {expectedVersion, externalWorkStopped: true}, context)` requires the host to actually stop/fence external work first. Accepted/cancelled jobs may then retire under the existing eligibility, legal-hold and `externalWorkStopped` decision. Batched purge removes confirmation files, manifest and job with the rest of that intent. Restore barriers continue to prevent replay.

## Legal and operational review

[Article 8(7)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011L0083-20260927) requires applicable distance-contract confirmation, including broader information than the final order review, and ties timing to contract conclusion and goods delivery/service commencement. This profile requires the information in the supplied files; it does not implement the prior-durable-provision exception. The host supplies actual formation and performance facts and coordinates timely provision.

[*Content Services*, C-49/11](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:62011CJ0049), concerned the earlier distance-selling directive and rejected the ordinary hyperlink arrangement before the Court. It discussed personally addressed storage, adequate future access and unchanged reproduction, while leaving the advanced-website question open. A server archive or downloadable link alone does not prove that the consumer was provided the confirmation.

Track [REQ-EU-ORDER-CONFIRMATION](requirements/README.md#req-eu-order-confirmation) separately from the engineering mechanics in [REQ-PRODUCT-ORDER-CONFIRMATION](requirements/README.md#req-product-order-confirmation). Actual channel behavior, content, accessibility, recipient delivery, timing and national/linguistic acceptance need review. See [verification](verification/order-confirmations.md).
