# Terms agreement, with a version you can trace

The optional terms controller presents an unchecked agreement statement and a link to an exact released document. It reports agreement recorded only after a matching backend receipt. Cookie choices and marketing permissions are independent; this flow never changes them.

Try [the agreement example](https://notabenda.org/agreement/) and [its Portuguese version](https://notabenda.org/localization/agreement/). Each uses draft documents and the browser’s isolated demo workspace. Demo actions create no real contract or purchase. Local website development uses `npm run site:dev`; its Durable Object storage persists in the configured local directory.

## Build and retain the offer

```ts
import { compileLegalDocuments, createTermsOffer } from '@notabenda/core/content';

const build = compileLegalDocuments(reviewedConfig);
const offer = createTermsOffer(build.artifact, {
  scopeId: 'account-terms',
  statement: 'I agree to the account terms linked above.',
  actionLabel: 'Record agreement',
});
```

Both APIs default to production validation. Production acceptance requires a reviewed production artifact. Preview construction requires `{mode:'preview'}`; preview controllers and server helpers independently require `allowPreview:true`. These flags support fictional demos, not a shortcut for a live agreement.

The offer ID hashes the site, workflow scope, document metadata/digests, statement, and action label. Changing any of those creates a different offer. The compiler emits exact HTML at `/artifacts/ARTIFACT_ID/terms.html`, as well as ordinary document routes and the portable artifact JSON. Section navigation stays within that pinned document.

**The host must serve and retain pinned HTML for every retained offer.** A build output contains the current release only; replacing a deployment directory can remove older files. Merge releases into retained hosting or provide a host route serving verified archived bytes. The package's admin Worker deliberately does not serve archived HTML. Keep referenced styles/assets available as needed; CSS bytes are not included in document hashes or the release archive. Author-supplied external links may change independently.

Before testing the flow, [inspect the actual terms connection](TERMS-CONNECTION.md) to compare its offer and local operation. Publication, active backend terms and real behavior need separate checks.

## Supply the interface language

Legal pages and acceptance can share the selected site language. Add the complete optional `localization.terms` message dictionary to your site configuration, then build the offer normally. The statement and action label remain explicit offer fields. Version 2 retains all widget text, language, direction and copy revision, with independent backend checks against the retained release. Version 1 English offers remain supported. See the [localization guide](LOCALIZATION.md#terms-acceptance) for the complete contract and limits.

## Register, then explicitly activate

```ts
import {
  recordLegalRelease, registerTermsOffer, setActiveTermsOffer,
  recordTermsAcceptance, createTermsAcceptanceStore,
} from '@notabenda/cloudflare';

// Trusted deployment/application code, using transactional DO storage.
const scope = { siteId: reviewedConfig.site.id, scopeId: 'account-terms' };
await recordLegalRelease(ctx.storage, build.artifact);
await registerTermsOffer(ctx.storage, offer, scope);
await setActiveTermsOffer(ctx.storage, offer.offerId, scope);
// setActiveTermsOffer(ctx.storage, null, scope) stops new agreements.
```

Registration checks the full archived artifact and exact terms metadata. It is immutable and idempotent. Registration does not publish a document or activate an offer. Each site/workflow scope has an explicit active pointer. Activation, deactivation, and acceptance use the same transactional storage boundary. Use disjoint host-selected prefixes for separately authorized sites/stores.

In a host endpoint, authenticate and authorize the subject **and operation**, choose the expected scope on the server, validate the endpoint's CSRF/origin policy, apply quotas/rate limits, then call:

```ts
const receipt = await recordTermsAcceptance(ctx.storage, browserBody, {
  ...scope,
  subjectId: authorizedSubject.id,
  operationId: authorizedOperation.id,
});
// Return this receipt only after the helper resolves.
```

`browserBody` accepts exactly `{schemaVersion:1, offerId, requestId, accepted:true}`. Browser-selected subjects, operation IDs, timestamps, or extra fields are rejected. The trusted host chooses identity, intended workflow, clock, prefixes, and preview policy. No authentication, public write endpoint, signup, payment, or account system is provided by the package. The local demo's fixed synthetic grant is not production authentication.

For a new request, the current-offer check and event write happen in one transaction. An old page receives `TermsRecordError('stale-offer')` after the active offer changes. The event ID hashes `[siteId, subjectId, requestId]`; the same request returns its original receipt even after activation changes. Reusing that request ID for another operation, scope, or offer is a conflict. A different subject has a separate idempotency namespace.

Offer payloads are bounded to 16 KiB, acceptance requests to 2 KiB, inspectable events to 64 KiB, and release archives to 128 KiB. The implementation uses one event as both evidence and idempotency record. Host retention/erasure must consider replay and operation expiry together: deleting an event removes its duplicate protection. Use the separate [lifecycle](EVIDENCE-LIFECYCLE.md) and [export](EVIDENCE-EXPORT.md) APIs for authorized record management; the terms controller does not schedule those operations. The host controls direct storage access; these are application-level immutability checks, not tamper-proof/WORM guarantees.

## Mount the control

```ts
import { createTermsAcceptance, mountTermsAcceptance, TermsAcceptanceError } from '@notabenda/core';
import '@notabenda/core/styles.css'; // optional

const acceptance = createTermsAcceptance(offer, {
  operationId: operation.id,
  async submit(body, { signal }) {
    const response = await hostAuthenticatedRequest('/api/account-terms', body, signal);
    if (response.status === 409) throw new TermsAcceptanceError('stale-offer');
    if (!response.ok) throw new Error('Recording failed');
    return response.json();
  },
});
const ui = mountTermsAcceptance(document.querySelector('#account-terms')!, { acceptance });
```

The request helper above belongs to the host and must implement its own authenticated transport and CSRF policy. Map only a known stale-offer response to `TermsAcceptanceError('stale-offer')`; do not expose raw backend failures.

The built-in control is inline, uses an associated native checkbox, and keeps its action disabled until checked. A successful receipt must match the offer, request, operation, artifact, document version/hash, and canonical server timestamp. The status is deliberately **recorded**, not “account created” or “purchase complete.” Completing the associated business operation remains a separate host responsibility.

The headless API exposes `getOffer`, `getSnapshot`, `subscribe`, `setChecked`, `submit`, and `destroy`. Snapshots/offers are detached. Concurrent submits share one attempt. A secure UUID is created on the first checked submission, and retries after uncertain failures reuse it. No acceptance is stored in localStorage. The optional `requestId` constructor option lets a host recover an uncertain attempt across controller/page lifetimes; it is an idempotency key, not a credential. Recovery must preserve the same host-authorized operation, scope, subject and offer. A new offer needs a new controller and a fresh explicit check.

`ui.destroy()` removes the interface only. Destroy the controller when its lifecycle ends; it aborts the transport and ignores late acknowledgments. An aborted request may already have committed. Closing a page or destroying a controller does not rescind a contract or erase a record.

## Review the evidence

Return `createTermsAcceptanceStore(ctx.storage, {siteId})` from the existing admin Worker's mandatory authorization hook. The store exposes only matching site agreement events, with bounded search over operation, subject, version, statement and other stored context. It does not enumerate offer registrations or active pointers. See the [CF package guide](../packages/notabenda-cf/README.md).

The detail view presents the exact statement/action label, effective date, workflow/operation, release and content digests, server record time, and provenance. A host-received assertion does not prove a human click, identity, enforceability, delivery, or completion of the associated operation. Combine it with appropriate host evidence and retention policy. Stored terms are inspectable through document history and its existing comparisons; an acceptance is never automatically rewritten to reference a later version.

## Requirements and remaining work

`REQ-PRODUCT-TERMS-ACCEPTANCE` connects the implemented mechanics to source and automated tests. `REQ-EU-TERMS` remains partial: supplied content and a checkbox do not establish consumer fairness or enforceability. `REQ-EU-ORDER-ACTION` remains partial; [paid-order review](PAID-ORDERS.md) and [customer confirmations](ORDER-CONFIRMATIONS.md) have separate APIs and verification. Their pre-order cross-references include the conditional producer durability label; the separate [shop-level guarantee notice](GUARANTEES.md) is implemented as a prerequisite and does not replace that label or the final order interface. The applicable EU paid-order information/action and durable-medium confirmation requirements are separate from a generic terms agreement ([Consumer Rights Directive, Article 8(2) and (7)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011L0083-20260927)). National, sector, withdrawal/cancellation, accessibility and delivery obligations need their own applicable flows and review.

The acceptance interface uses the selected terms message set. React and Astro adapters below reuse that native control and the same host-owned controller. Broader platform, screen-reader and zoom review remain open. Contract delivery, withdrawal and cancellation use the separate [contract-action modules](CONTRACT-ACTIONS.md); application fulfillment and provider operation remain host responsibilities.

## React

Create the controller once in the host bootstrap for the exact operation and offer. Pass it to a provider; components can use the native view or the read-only snapshot hook.

```jsx
import {
  TermsAcceptanceProvider, TermsAcceptanceControl,
  useTermsAcceptanceSnapshot,
} from '@notabenda/core/react/terms';
import '@notabenda/core/styles.css';

function ReceiptLink() {
  const state = useTermsAcceptanceSnapshot();
  return state.status === 'recorded' && state.receipt
    ? <a href={hostRecordUrl(state.receipt.id)}>Inspect agreement</a>
    : null;
}

function Agreement({controller}) {
  return <TermsAcceptanceProvider controller={controller}>
    <TermsAcceptanceControl fallback={<p>Read the terms or contact support.</p>} />
    <ReceiptLink />
  </TermsAcceptanceProvider>;
}
```

`hostRecordUrl` is your authorized inspection route. A receipt still means an agreement was recorded; it does not mean the related application operation completed.

`useTermsAcceptanceController()` returns the host controller. `useTermsAcceptanceSnapshot()` returns a cached, deeply immutable UI snapshot. Server rendering always exposes unchecked/idle state with no receipt or request ID, even when the supplied controller has a recorded result. Hydration then subscribes to the actual controller. The provider and view never create a controller, submit, retry or destroy it. React StrictMode can mount and clean up the view without recording another agreement.

Use one native framework view per controller. Unmounting removes its handlers and subscription; retained references to old controls become inert. A remounted view of the same controller preserves an uncertain request or recorded result. A different operation or authenticated subject needs a fresh controller, not a reused provider with a renamed operation. The host owns eventual `controller.destroy()` and any recovery across full page reloads. Keep uncertain request IDs private and resume only the same authorized operation, subject and offer.

The focused `@notabenda/core/react/terms` and vanilla `@notabenda/core/terms` entries avoid importing the consent integration. The React exports are also available from `@notabenda/core/react`.

Try the [React example](/agreement/react/) or its [midnight appearance](/dark/agreement/react/).

## Astro

Render a named static shell with the exact public offer ID and a non-secret host context key. It contains no checkbox or enabled agreement action before the client bridge mounts.

```astro
---
import TermsAcceptance from '@notabenda/core/astro/TermsAcceptance.astro';
// Resolved by your host for this operation; never use a credential as contextKey.
const {offerId, contextKey} = Astro.props;
---
<TermsAcceptance id="account-terms" offerId={offerId} contextKey={contextKey}>
  <p>Read the terms or contact support if agreement controls are unavailable.</p>
</TermsAcceptance>
```

In your processed client bootstrap, after the host has selected the corresponding controller:

```js
import {mountAstroTermsAcceptance} from '@notabenda/core/astro/client';

const view = mountAstroTermsAcceptance({
  acceptance: hostAgreementController,
  id: 'account-terms',
  contextKey: hostPublicContextKey,
});

// When this host workflow ends:
view.destroy();
hostAgreementController.destroy();
```

The two host values are application code. `contextKey` is a public UI binding label of 1–120 ASCII letters, digits, `_` or `-`. Generate a new key and controller when the operation or authenticated subject changes. The server must independently authorize and bind the operation, subject and exact offer; matching a public key grants no access.

The bridge remembers a controller's first Astro context key, including after bridge destruction. It rejects rebinding that controller under another key. On `astro:before-swap` it detaches the view; on `astro:page-load` it attaches only one matching shell with the same offer and key. A mismatch removes the old controls and leaves the static fallback visible. Call `refresh()` after deliberate host DOM replacement; `destroy()` removes listeners and UI without destroying the controller or aborting an uncertain request. Mounting, navigation and refresh never submit or retry.

Framework ownership is shared: the same controller cannot own simultaneous React and Astro native views. Supply translated fallback content through the slot. The mounted native view retains the exact offer statement, action label and supported language/direction messages.

Try the [two-page Astro example](/agreement/astro/). Moving to its review page preserves the same draft; it makes no acceptance write.

Linked requirement: [REQ-PRODUCT-TERMS-ADAPTERS](requirements/README.md#req-product-terms-adapters). See [adapter verification](verification/terms-adapters.md).
