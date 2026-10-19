# Paid order reviews

Show the goods or services, total price, payment schedule and commitments immediately before an explicit payment action. Use this separately from a terms agreement or contract withdrawal form.

The preview includes three [working examples](/orders/mixed/): a lamp with a monthly service, a deposit with a later balance, and a conditional fee calculated from hours worked. Actions are recorded in the browser’s isolated demo database. No payment is taken and no contract is formed there.

## Define the information, then issue a quote

`notabenda-authoring/orders` supplies `createPaidOrderDefinition`, `createPaidOrderReview` and `verifyPaidOrderReview`. The authoring package runs in a trusted build or server process. `notabenda/orders` supplies the static renderer, a headless action controller and a small vanilla view; it has no runtime dependencies.

A definition contains:

- An explicit `eu-paid-distance-order-v1` profile, site, locale, direction and review status.
- Each item’s product ID, main characteristics, duration, termination conditions and minimum commitment. Goods, services and digital content can share a cart without sharing contract conditions.
- A product-specific guarantee assessment for every good. `label-provided` contains a finished producer label; `no-label-required` requires an explicit reviewed explanation. `unresolved` works only in draft previews. Missing information never establishes that a qualifying guarantee does not exist.
- All reviewed UI wording, including the payment button. English defaults use “Order with obligation to pay”. Other locales require a complete wording object. The package does not certify a translation or determine national applicability.
- Optional pinned document references: kind, title, version, artifact ID, page hash and exact immutable URL. Link broader pre-contract information where appropriate; these links do not replace facts required beside the final action.

The definition hash covers its exact facts and wording. Live quotes bind to that hash and add a host-owned checkout reference, quote ID/revision, issue/expiry timestamps, selected quantities and prices. The builder rejects a quote bound to another definition rather than silently rebinding it.

Money uses unsigned integer minor-unit **strings**, with an explicit currency and fraction scale. For EUR, `"12900"` at scale `2` means €129.00. The renderer uses integer arithmetic and localized digits; do not convert money through floating-point arithmetic.

Every payment component has a label, associated item IDs, amount, timing and recurrence. Use empty item IDs for order-wide charges. Amounts are either `fixed` or `calculated` with both a calculation method and the reason a fixed price cannot reasonably be given. Timing can be `now`, `later` with a date/event explanation, or `conditional` with the payment condition. Recurring charges include the billing period, fixed monthly cost or calculation method, price changes and a cycle count; `null` means no fixed end. Represent introductory and subsequent charges as separate components when their amounts differ. Component amounts are final net prices; include taxes and explain all mandatory charges and applicable discounts.

`totalPrice` and `dueNow` are separate fields. Fixed finite totals must equal their components, including every declared recurring cycle. An indefinite or calculated total must contain a calculation method and explanation. Fixed due-now amounts must equal the sum of due-now components. A zero initial payment with a later or conditional fee still uses the payment-obligation action. A wholly free order is outside this profile. The package checks these relationships; your pricing system remains responsible for currency scale, tax rules, discounts, quantities, coverage and truthful calculation methods.

Quotes are limited to seven days by this implementation. This is an engineering bound, not a legal deadline.

## Render and mount

```js
// Trusted build/server process
import {
  createPaidOrderDefinition,
  createPaidOrderReview,
  verifyPaidOrderReview,
} from 'notabenda-authoring/orders';

const definition = createPaidOrderDefinition(reviewedDefinitionInput);
const quote = await pricingSystem.issueQuote({
  definitionId: definition.definitionId,
  checkout,
});
const review = createPaidOrderReview(definition, quote, originalLabelFiles);
verifyPaidOrderReview(review, originalLabelFiles);
```

`originalLabelFiles` maps each label’s exact public URL to its original `Uint8Array`. Verification checks the original bytes and product association. Publish and retain those files yourself. Label preparation and production review are described in [the label guide](GUARANTEE-LABELS.md).

```js
import 'notabenda/orders.css';
import 'notabenda/guarantees.css'; // when goods have labels
import {createPaidOrderAction, mountPaidOrderAction} from 'notabenda/orders';

const action = createPaidOrderAction(review, {
  submit: (request, {signal}) => checkoutApi.admit(request, {signal}),
  recoverAttempt: (request, {signal}) => checkoutApi.reconcile(request, {signal}),
});
const view = mountPaidOrderAction(container, {
  action,
  idPrefix: 'checkout',
});
```

The mounted view keeps required facts expanded, puts the full producer label beside its good, and places the native payment button after the information. It waits for required label images and rechecks the rendered facts, action wording and image readiness immediately before dispatch. Keep this whole surface visible in the final checkout step. Do not add a sticky duplicate action that bypasses the information. Assess actual image legibility, placement and accessibility in your layout; successful image loading alone does not prove these.

For static information, use `renderPaidOrderReview`, `PaidOrderReview` from `notabenda/react/documents`, or `notabenda/astro/PaidOrderReview.astro`. These render no payment action. A React app can mount the vanilla view in an effect and call `view.destroy()` during cleanup. The host owns the controller: keep it while an attempt is pending and reconcile before replacing its quote or creating another order. Each view needs a unique lowercase ID prefix of at most 90 characters. Heading levels 2 and 3 are supported.

Headless clients must call `setPresentationReady(true, optionalGuard)` only after displaying all required information and label images. The optional synchronous guard is checked again just before first dispatch. Structural normalization and client hashes are integrity checks, not authentication or proof of what a person read.

## Admit the exact attempt on the host

The controller sends only references: schema version, random request ID, definition ID, review ID, quote ID/revision and checkout context reference. It does not send client-authoritative prices or a claim that payment succeeded. A public context reference is not a credential.

Your host must authenticate the checkout, apply CSRF protection and authorize the operation. In a single admission transaction:

1. Find an existing result for the request ID within the authorized checkout. Reject reuse with different bindings. Return an identical existing result **before** rejecting an expired or superseded quote.
2. For a new attempt, load the retained quote and exact definition. Check their identities, current revision, expiry, context, stock and final prices as part of the same admission operation. Enforce one admission for the authorized checkout intent across different nonces and quote revisions; a new nonce must not create another order for the same intent. Only an explicit new checkout starts another intent. A prior check followed by unchecked execution leaves a race.
3. Retain the admitted review and original assets, store one admission outcome and queue the host’s idempotent payment/fulfillment work. Return `checkout-used` for a different attempt against an already admitted checkout instead of accepting a duplicate. Retain enough context to recover after a lost response.

Return the exact request fields plus either `{status: 'received', id, receivedAt}` or `{status: 'rejected', reason}`. Receipt IDs are 64-character lowercase hex strings. `receivedAt` is the original admission timestamp, within the quote’s validity window. Supported rejection reasons are `stale-quote`, `expired-quote`, `checkout-used` and `unavailable`. A retry after expiry returns the original admission time. No receipt means no confirmed outcome.

Concurrent client calls share one attempt. A timeout, failed transport or mismatched response leaves the controller `uncertain`. `submit()` then refuses a fresh request; `reconcile()` calls the separate host recovery hook with the **same** request. The hook can look up or atomically replay that attempt. An abort does not establish cancellation. An unknown recovery outcome stays uncertain.

Persist `getRecoveryRequest()` together with the exact review before transmission if your flow must survive navigation. Supply it as `recovery` to resume. The mounted view offers a recovery button only when a recovery hook exists. Destroying a view revokes its permission to start an order; it does not cancel an admitted order. Destroying the controller retains a recovery copy but ignores late callbacks.

The website’s [demo host](../site/order-demo.mjs) shows a transaction, one admission per issued quote and retained request in its session DO. It is website-specific and does not implement a reusable payment processor, production admission service, stock reservation or confirmation service in `notabenda-cf` yet.

## What still needs separate work

This implements selected frontend mechanics for [REQ-EU-ORDER-ACTION](requirements/README.md#req-eu-order-action). It does not establish that a transaction falls within the Directive or satisfy all consumer-law requirements. Digital-content or early-service-performance permissions, withdrawal information and acknowledgments need their own reviewed flows. A generic terms checkbox cannot substitute for them.

Contract confirmation on a durable medium is separate under Article 8(7). It includes broader required information; a received-request message or mutable page link is insufficient. Your host must supply and retain the complete confirmation, applicable permissions and original assets, and track delivery separately from payment and fulfillment. Production legal/linguistic review, national implementation, physical-device label legibility and a reusable Cloudflare order/confirmation archive remain open.

The [verification record](verification/paid-orders.md) links tests and remaining checks. The examples use explicit draft previews; do not mark their product facts or documents reviewed for a real shop.
