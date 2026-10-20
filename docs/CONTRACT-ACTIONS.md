# Contract declarations

Use `@notabenda/core/contracts` to capture a cancellation or withdrawal declaration through a native form or your own interface. The backend stores the declaration and creates separate acknowledgement and application jobs. Your host must dispatch those jobs and determine which regional rules apply. Cookie choices, marketing permissions and terms agreements use separate workflows.

The host decides where the action is applicable and provides a usable entry route. Nothing infers a withdrawal deadline, contract existence, identity, cancellation date, refund, sector exception or applicable original terms. The document references below identify the form's archived disclosures, not which terms governed an earlier contract.

## Define the form

```ts
import {compileLegalDocuments, createContractActionDefinition} from '@notabenda/core/content';

const release = compileLegalDocuments(reviewedSite);
const definition = createContractActionDefinition(release.artifact, {
  actionId: 'contract-withdrawal',
  revision: 'form-1',
  profile: 'de-withdrawal',
  reviewStatus: 'reviewed',
});
```

Definitions include an immutable ID, site/action/revision, profile, locale, rendering policy, declaration and button wording, and exact terms/privacy references. Production requires reviewed wording and production documents. A caller's review flag does not establish legal approval. Use the explicit preview options for draft demonstrations.

Initial profiles are `de-cancellation`, `de-withdrawal`, `eu-withdrawal` and `br-withdrawal`. They provide limited German, English and Portuguese wording and an email acknowledgement destination. Broader languages/channels and regional eligibility are not supplied. Wording overrides create a different definition and need review.

All profiles collect a name, free-form contract/part description and confirmation email. German continuing-contract cancellation also offers ordinary/extraordinary type, an optional reason and optional requested ending. An empty ending is preserved as earliest possible; no effective date is computed. Do not require a privacy acceptance checkbox, account lookup, login or marketing choice before capturing a declaration.

## Mount an explicit action

```ts
import {createContractAction, mountContractAction} from '@notabenda/core/contracts';

const action = createContractAction(definition, {
  operationRef: hostOperationRef,
  initial: {name: '', contract: '', email: ''},
  submit: (request, {signal}) => hostTransport(request, {signal}),
});
const field = mountContractAction(container, {action});
// On host context replacement: field.destroy(); action.destroy();
```

Mount outside another form. Existing host facts can prefill fields without making the visitor re-enter them. For `de-cancellation`, include `cancellation: {kind: '', reason: '', ending: ''}` in the initial draft, or omit `initial` for empty defaults.

The native cancellation form presents its final action directly on the confirmation page. Withdrawal uses an explicit details-review state before its final action. There is no unsolicited dialog, login, cookie dependency or mount-time transport. The headless controller exposes `setFields`, `review`, `edit`, `submit`, snapshots and subscriptions for host rendering. Optional `@notabenda/core/styles.css` supplies namespaced, token-based styles.

The native form re-reads its visible values before review or submission. Invalid edits cannot send an older draft. Pinned document links announce that they open a new tab, preserving the form.

After an uncertain attempt the exact request is sealed. Retry it with the same nonce and contents; editing or starting another request silently is not allowed. `getRecoveryRequest()` lets trusted host code retain a recovery command. A new controller can take that `recovery` instead of `initial`. This object contains personal data: choose a private recovery policy deliberately. The package does not persist it automatically. Destroying or timing out a request cannot undo a server commit.

The receipt is validated against the operation, definition and exact request. Only a confirmed receipt displays the recorded declaration and a text download when browser Blob URLs are available; selectable exact text remains available otherwise. An on-screen receipt does not mean an email was sent or a contract ended.

## Persist the declaration and handoffs

```ts
import {
  recordLegalRelease, registerContractActionDefinition,
  contractActionOperationRef, recordContractDeclaration,
  createContractDeclarationStore,
} from '@notabenda/cloudflare';

await recordLegalRelease(storage, release.artifact);
await registerContractActionDefinition(storage, definition, {siteId});
const context = {siteId, actionId: definition.actionId, operationId: hostOperationId};
const hostOperationRef = await contractActionOperationRef(context);
const receipt = await recordContractDeclaration(storage, admittedRequest, context);
// Private inspection/export: mount this store through your existing host authorization.
const store = createContractDeclarationStore(storage, {siteId});
```

The host independently resolves the operation and admission policy. Opaque IDs are not authorization credentials. Anonymous receipt is allowed; do not turn intake into an identity/contract oracle or mail relay. Apply origin/session and abuse controls without adding unjustified obstacles to a statutory route. Public responses echo only visitor-supplied information; the package exposes no anonymous email/contract lookup endpoint.

One transaction records the exact declaration, untrusted browser submission time, host receipt time, immutable acknowledgement text and **both** pending jobs. Capture is append-only. Similar declarations with new nonces are separate; an exact retry returns its original receipt without resetting timestamps or delivery status. Old registered definitions remain usable after wording updates. The stored acknowledgement status in a receipt is an immutable snapshot at capture; inspect delivery separately for current provider status.

## Run independent deliveries

`claimContractDelivery(storage, id, channel, context, {leaseMs, maxAttempts})` claims either `application` or `acknowledgement` separately. The returned lease includes the immutable definition/request/receipt, a stable `deliveryId` and payload digest, a fresh token/version and expiry. The optional [dispatch runners](CONTRACT-DISPATCH.md) now orchestrate these independent claims and bounded host callbacks, with provider/settlement uncertainty kept separate. No scheduler, alarm, email provider or network transport is installed.

Your runner must send confirmation independently of contract matching or application failure. Use structured provider arguments with the captured email and exact acknowledgement text; validate/admit destinations and never interpolate them into headers or a shell. The provider/application must deduplicate on `deliveryId`. Call `settleContractDelivery` with `{status: 'accepted', providerRef}` only when that configured endpoint durably accepts the job. Use `{status: 'uncertain'}` when the outcome is uncertain; do not store raw provider responses or credentials.

Leases last 1–300 seconds; claims default to 60 seconds and at most 10 attempts (configurable 1–100). Exhausted jobs require operator attention. Expired tokens cannot settle a newer claim. An old worker may nevertheless have performed an external effect, so downstream idempotency and reconciliation remain mandatory. Provider acceptance does not prove recipient delivery. An outbox alone does not fulfill an immediate acknowledgement obligation: configure, monitor and rehearse an actual runner before treating the integration as operational.

## Retire one declaration

Use the existing evidence lifecycle with `{family: 'contracts', siteId, scopeId: actionId, streamId: requestId}`. The target is one declaration, not a person. Retirement does not block future declarations with new request IDs.

Pending, uncertain or leased jobs block ordinary retirement. Drain them, or use the trusted `cancelContractDelivery` with an exact `expectedVersion` and `externalWorkStopped: true` **after** actually stopping/fencing downstream work. This assertion does not recall payloads already handed to a provider. Hosts requiring strict suppression must enforce external quiescence. Holds, exports, backups and external copies remain separate responsibilities.

Retirement immediately withholds the payload in private inspection; bounded purge deletes the event and its embedded outbox together. Reapply retirement manifests before restarting runners or reopening restored storage. Do not expose lifecycle or delivery mutations through a public generic dispatcher.

## Explore and inspect

Try [withdrawal](/contract-actions/withdrawal/) or [German cancellation](/contract-actions/cancellation/), including their midnight variants. Each uses the visitor’s isolated demo workspace. The example accepts only `.test` email destinations and sends no email or application instruction.

This example host deliberately retains its exact definition and request in tab-scoped `sessionStorage`, keyed to the signed demo generation and action. Reload offers **Retry the same request**, without automatically sending anything. The original receipt and nonce survive an explicit retry. Stored recovery contains personal fields; this example’s choice is not package-wide persistence or a production recovery policy. This deliberate demonstration requires a successful recovery read before showing the form and persistence before a POST; a storage failure sends nothing and retry retains the in-memory command. Real statutory intake must choose a recovery design that does not make browser storage an unjustified obstacle, such as appropriately scoped private host-side recovery. Do not copy it into a real integration without choosing the scope, access and retention deliberately.

In the authorized contract view, exact state shortcuts cover pending confirmation, uncertain confirmation, pending application and both providers accepting. A pending confirmation includes unclaimed and currently leased jobs. Search terms and advanced filters remain selected; counts describe a bounded segment. Record detail separates the declaration, final action, host/browser times, exact acknowledgement and two delivery states. Neither a list card nor provider acceptance establishes contract fulfillment.

The Cloudflare starter includes the empty private contract store; the host still supplies intake admission, definition registration and actual independent runners. Maintainers can run `node scripts/check-contract-actions-runtime.mjs` after building to verify capture and restart in disposable local SQLite storage. It invokes no external delivery.

## Source boundaries

German [BGB section 312k](https://www.gesetze-im-internet.de/bgb/BJNR001950896.html#BJNR001950896BJNE030201160) specifies a direct cancellation confirmation page, required information/action opportunities, a savable declaration and prompt electronic confirmation. [Section 356a](https://www.gesetze-im-internet.de/bgb/BJNR001950896.html#BJNR001950896BJNE028702123) covers electronic withdrawal information, confirmation and a durable acknowledgement. Applicability, exclusions and current case law still need review.

[EU Directive 2023/2673](https://eur-lex.europa.eu/eli/dir/2023/2673/oj/eng) introduces the withdrawal function through Article 11a; national implementation and the contract's actual right remain relevant. Brazilian [Consumer Code article 49](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm) and [Decree 7,962 article 5](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm) add their own eligibility, acknowledgement and financial/application obligations. This module performs no financial notifications or refunds.

See [feature status](FEATURES.md#feat-contract-actions), [the requirements catalog](requirements/README.md#req-product-contract-actions), and [verification](verification/contract-actions.md).
