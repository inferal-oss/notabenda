# Terms agreement, with a version you can trace

The optional terms controller presents an unchecked agreement statement and a link to an exact released document. It reports agreement recorded only after a matching backend receipt. Cookie choices and marketing permissions are independent; this flow never changes them.

Try [the agreement example](https://notabenda.org/agreement/) and [its Portuguese version](https://notabenda.org/localization/agreement/). Each uses draft documents and the browser’s isolated demo workspace. Demo actions create no real contract or purchase. Local website development uses `npm run site:dev`; its Durable Object storage persists in the configured local directory.

## Configure the agreement wording

The setup UI has a **Terms agreements** editor. Add one named workflow at a time: its statement, button label and wording revision. A name such as `account-terms` identifies the workflow, not the person or order. Saving produces a draft; it neither accepts terms nor changes a backend's active offer.

The same settings can live in your site configuration:

```json
{
  "terms": {
    "audience": "consumer",
    "serviceType": "service",
    "agreements": [
      {
        "scopeId": "account-terms",
        "revision": "account-wording-1",
        "statement": "I agree to the account terms linked above.",
        "actionLabel": "Create account",
        "reviewStatus": "draft"
      }
    ]
  }
}
```

Supply wording suited to the actual action and language. Review it alongside the terms document; set `reviewStatus: "reviewed"` only after that review. Every configured entry must be complete. Production generation rejects draft or unresolved wording, including an unselected entry. The editor cannot declare its own work reviewed.

Use a fresh, never-reused `revision` when editing. The editor compares only the current revision; keep historical uniqueness in your release process. Wording and revision changes produce a new public artifact and offer identity. They do not change cookie permission scopes or enroll a service.

## Generate an offer from the final release

```ts
import {
  compileLegalDocuments,
  createConfiguredTermsOffer,
  createConfiguredTermsOfferFiles,
} from '@notabenda/core/content';

const release = compileLegalDocuments(reviewedConfig);
// If using MD/MDX, compile with @notabenda/authoring instead.
// Attach any catalog review before selecting the offer.
const offer = createConfiguredTermsOffer(release.artifact, 'account-terms');
const publicOffers = createConfiguredTermsOfferFiles(release.artifact);
```

Select the exact scope; neither the helper nor setup picks the first entry. Retain the final public artifact and its pinned document files. The JSON CLI `build` writes an offer for every configured scope at `artifacts/<artifactId>/agreements/terms-<scopeId>.json`. `createRetainedReleaseFiles` re-emits historical configured offers alongside their pinned documents. Its `includeTermsOffers: false` option is for compilation/finalization steps that must precede offer generation.

Publish the offer files with the final release, then register and activate the intended offer through your authorized application. Publication alone changes no backend selection. Removing or renaming an agreement setting also leaves the old backend offer active until your application explicitly retires it. Retain acknowledged retries and historical records.

## Prepare settings with the wizard

Save a complete batch as `agreements.json`:

```json
{
  "schemaVersion": 1,
  "changes": [
    {
      "action": "add",
      "settings": {
        "scopeId": "account-terms",
        "revision": "account-wording-1",
        "statement": "I agree to the account terms linked above.",
        "actionLabel": "Create account"
      }
    }
  ]
}
```

```sh
npx @notabenda/core wizard --packs terms-agreement --terms agreements.json
```

Use `update` with complete settings and a fresh revision for edits. Removal uses `{ "action": "remove", "scopeId": "account-terms", "confirmed": true }`. Each scope may appear once per batch. Agent workflows can also supply `--answers FILE --config FILE --out-dir NEW_DIRECTORY`; the wizard preserves the originals and writes a separate draft. The shared headless API is `createTermsDraftPlan` from `@notabenda/core/setup/terms`; the browser editor is `mountTermsEditor` from `@notabenda/core/setup/terms/ui`. Both compare the current public baseline before adopting a change. Unfinished UI fields can resume with the expiring tab draft; removal confirmation must be given again.

## Build a host-authored offer

If your application already supplies offer wording, keep using `createTermsOffer`. Settings are optional; omitting `terms.agreements` preserves the previous public configuration and offer format. A configured scope must use its exact archived statement and button label even through the host-authored factory. Other explicitly named host workflows remain supported.

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

## Review archived agreement wording

In **Document revisions**, choose two releases and select **Agreement settings** under **Review area**. The comparison matches exact workflow scopes and shows additions, removals, statement changes, action labels, wording revisions and declared review status. Reordering the config array does not count as a declaration change. A renamed scope appears as a removal and an addition.

The terms document and versioned interface dictionary are reviewed separately. An unchanged declaration can belong to a different offer when its document, language, interface or release changes. Historical built-in messages are not reconstructed for releases without a versioned dictionary. A release without `terms.agreements` says no configured declarations were retained; host-authored offers may still exist.

Try the [seeded wording revisions](https://notabenda.org/demo/admin/history?q=Account+agreement+wording&kind=document-release): compare the two entries using **Agreement settings**. Their terms document stays unchanged while the account statement and action label change and a workspace workflow is added. This reads archived configuration; it neither accepts terms nor changes an active offer.

The host must grant this view independently:

```ts
import {createAdminWorker, createDocumentHistory} from '@notabenda/cloudflare';

const admin = createAdminWorker({
  basePath: '/admin/history',
  authorize: async request => {
    const access = await authorizeInYourApplication(request);
    return access ? {
      store: createDocumentHistory(storage, {prefix: access.releasePrefix}),
      allowTermsSettings: access.inspectAgreementSettings === true,
    } : null;
  },
});
```

`authorizeInYourApplication`, `storage` and the scoped prefix are host-owned values. The generated Cloudflare starter accepts `termsSettings: true` from its host authorization hook and denies this view by default. Source, export and catalog-review permissions do not imply agreement-settings access.

`createDocumentHistory().getTermsSettings(releaseId)` validates the retained archive and returns a bounded projection with declarations, selected interface messages and document references. It returns a `not-declared` projection for releases without settings; `undefined` means the release was not found. Ordinary history records and exports omit these fields. Custom stores can use `normalizeTermsSettingsRelease` and the exported `TermsSettingsRelease` type. Inspection is limited to 64 KiB and never executes archived HTML or MDX.

Release detail uses `/terms-settings?id=RELEASE_ID`; comparison uses `/diff?before=RELEASE_ID&after=RELEASE_ID&kind=terms-settings`. Both are read-only, authorized on every request, and require the optional store hook. To inspect what is currently selected for recording, use [recording setup inspection](RECORDING-INSPECTION.md) separately. Neither view proves publication, presentation, a person's acceptance or legal validity.

## Maintainer HTTP recovery check

Run `npm run build` and `npm run terms:transport -- --port 4208` from this repository to exercise a committed agreement whose first HTTP receipt is deliberately truncated. The actual demo transport and native field must remain unconfirmed until an explicit retry recovers the original receipt. The server observations should show two accepted attempts and one record, with the same command and receipt. It is a disposable loopback check, absent from package entries and public routes. Keep the tab open: cross-reload request retention remains host work. See [the verification boundary](verification/terms-browser.md#http-receipt-loss-rehearsal).
