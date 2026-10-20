# Optional form permissions

Use one stable permission for one declared purpose and one channel. Keep it separate from collection notices, terms agreement and cookie choices. A checkbox starts unchecked; omitting it, leaving it unchecked, submitting the surrounding form or following a privacy link sends no permission command.

The current mechanism provides a build descriptor, headless controller, optional vanilla field, trusted Cloudflare ledger, inspection/export and evidence lifecycle support. Light and midnight website examples use isolated session workspaces and connect to permission history. Framework wrappers and regional form packs remain in progress. Optional transactional browser recovery is available below. It does not send messages or verify identity/contact ownership.

## Language and retained wording

For a non-English native interface, add the complete `localization.formPermission` dictionary to the site before compiling its release. Supply the offer's statement/actions, channel label and public facts in that language too. The v2 offer and backend registration pin the selected messages to the retained release; no per-key English fallback is used. English configurations without a dictionary retain v1 support. See [the localization contract](LOCALIZATION.md#form-permissions) for all fields, placeholders, size bounds and revision rules, and the [Portuguese example](https://notabenda.org/localization/permission/).

## Build a reviewed offer

```ts
import {createFormPermissionOffer} from '@notabenda/core/content';

const offer = createFormPermissionOffer(artifact, {
  permissionId: 'product-news-email', // stable across pages and revisions
  purposeId: 'product-news',        // declared direct/mixed-source purpose
  channel: {id: 'email', label: 'Email'},
  revision: 'product-news-1',
  reviewStatus: 'reviewed',          // independent review of this wording
  wording: {
    title: 'Product news',
    statement: 'Send me product news by email.',
    grantLabel: 'Save email permission',
    withdrawLabel: 'Withdraw email permission',
    optionality: 'Optional. Your account works without this choice.',
    withdrawalExplanation: 'Withdraw here at any time without changing your account.',
  },
  withdrawalUrl: '/preferences',
});
```

The builder validates the public artifact and pins its privacy HTML/content hashes, controller, purpose, recipients, rights/transfer information, and scope assessment. The offer ID also covers exact wording, channel, revision and delivery window. A new material revision is required whenever the offer changes. A stable permission ID cannot be reassigned to another purpose or channel ID. Reuse the same active offer across forms; independently varying per-form offers are not yet supported.

`scopeGuards` must explicitly assess all four facts as absent for this purpose before ordinary grants are supported. Missing, unknown or restrictive assessments keep grants off, even when the purpose has no cookie-runtime entry. This is a support boundary, not a legal determination. The free-text legal-basis field and purpose-level `collection.required` value never create permission. Preview requires explicit opt-in on both frontend and server; it cannot bypass guards.

## Host-bound frontend

```ts
import {createFormPermission, mountFormPermission} from '@notabenda/core';
import '@notabenda/core/styles.css';

const permission = createFormPermission(offer, {
  streamRef, // supplied by your authenticated application, for this contact generation
  read: ({signal}) => hostReadCurrentPermission({signal}),
  submit: (command, {signal}) => hostRecordPermission(command, {signal}),
});
const field = mountFormPermission(container, {permission});
```

Those transport functions are application code, not endpoints supplied by this package. They must parse successful JSON and translate backend errors, including `context-retired`, into thrown errors with a matching `code`. The mount makes no automatic request, intercepts no form submission and collects no contact address. Its explicit saved-state action calls `refresh()`; the host may also call it deliberately. Checking changes only the local draft; `grant()` requires a current read and acknowledgment. `withdraw()` remains independently available after a failed read or changed offer.

Supply the public offer and host-bound stream reference independently of the initial state read. Mount first, then call the bounded `refresh()` so a failed or stalled read cannot remove withdrawal. The maintained example embeds the escaped offer and injects the host stream reference into private entry HTML. Neither value authorizes or selects a subject.

Keep the controller and binding fixed for its lifetime. If the person, account or destination changes, destroy it and obtain a fresh host context. Every command contains `expectedStreamRef` as a precondition; the server compares it to its own binding and never uses it to select the person. The controller retains monotonic event and activation bounds across errors, rejects mismatched/older replies, cancels unsent work, and ignores responses superseded by withdrawal or destruction.

Transports default to a 15-second timeout (`timeoutMs`, 100–60,000). Uncertain retries reuse the exact request and nonce. Without a journal, uncertain requests remain in memory and can be lost on reload. An optional transactional journal retains them for explicit recovery; see below. A mounted field's `destroy()` removes its DOM subscription; call the controller's `destroy()` as well when discarding the context.

The host decides how optional recording failures interact with its primary form. Never require a permission grant to complete an unrelated signup or enquiry. `snapshot.allowed` describes an acknowledged browser view; downstream work must use a fresh trusted server evaluation.

## Recover an unconfirmed action

```ts
import {createFormPermission, createIndexedDBFormPermissionJournal} from '@notabenda/core';

const journal = createIndexedDBFormPermissionJournal();
const permission = createFormPermission(offer, {
  streamRef, journal,
  read: ({signal}) => hostReadCurrentPermission({signal}),
  submit: (command, {signal}) => hostRecordPermission(command, {signal}),
});
await permission.reconcile(); // local storage only; no request or positive permission
// Mount, then deliberately refresh as appropriate to your application.
// The user can retry the exact saved action:
await permission.retryPending();
```

The IndexedDB adapter has no runtime dependency. It serializes updates to one context record, requests strict write durability and publishes local change notifications. The controller binds journal identity to site, stable permission and host-derived contact-generation reference; changing the offer does not hide a pending withdrawal. [IndexedDB's transaction model](https://w3c.github.io/IndexedDB/#transaction-concept) underlies the adapter; a custom `FormPermissionJournal` must provide the same atomic update contract, rather than a separate read/write pair.

The bounded record retains one unresolved action, its exact request and artifact binding, the withdrawal epoch, terminal retirement and monotonic head/activation fences. A withdrawal atomically supersedes prior grant recovery. Settled requests are compacted while fences remain. Unacknowledged withdrawals are never removed by a timer. A grant's delivery deadline does not prove that an uncertain earlier attempt never committed; the host checks the original nonce before deciding the outcome.

`reconcile()` and storage/visibility notifications make no network request and never restore a stored positive state as authority. `retryPending()` is an explicit delivery action. It preserves the nonce, timestamp and compare-and-swap revisions; it does not rebase a grant. An old-offer grant cannot be recovered under replacement wording. A known older offer can still withdraw, with its original artifact checked. A changed person or contact generation must receive a new controller and binding.

A new grant must follow a current read and deliberate check under the same journal epoch. A stale tab cannot adopt a newer withdrawal epoch silently. Settlement persists the acknowledgment/high-water changes and any barrier clearance atomically. A late or historical grant cannot clear newer local withdrawal intent.

If a new grant cannot be journaled, it is not sent. If withdrawal persistence fails, the controller remains locally restrictive and still attempts the host withdrawal; recovery is reported unavailable. While that volatile restriction survives, explicit retry first records withdrawal rather than replaying an older saved grant. Unconfirmed intent can be lost if the browser cannot retain it and the page is closed. Browser clearing/eviction, private browsing, unavailable storage, lost devices and deliberate journal deletion remain recovery limits. The journal contains opaque references and request metadata, not addresses or credentials; the host must assess local storage use and retention for its deployment.

Call both `permission.destroy()` and `journal.close()` when discarding an owned controller/adapter. Destroying a field does not delete pending intent. The toolkit does not install a service worker, background replay, cross-device identity recovery or sending workflow.

## Trusted Cloudflare operations

```ts
import {
  registerFormPermissionOffer, setActiveFormPermissionOffer,
  formPermissionStreamRef, getFormPermissionState,
  recordFormPermission, createFormPermissionStore,
} from '@notabenda/cloudflare';

const scope = {siteId: 'example-site', permissionId: 'product-news-email'};
// First archive the matching release with recordLegalRelease.
await registerFormPermissionOffer(storage, offer, scope);
await setActiveFormPermissionOffer(storage, offer.offerId, scope);

const context = {...scope, streamId: trustedPersonAndContactGeneration};
const streamRef = await formPermissionStreamRef(context);
const state = await getFormPermissionState(storage, context);
const result = await recordFormPermission(storage, command, context);
const store = createFormPermissionStore(storage, {siteId: scope.siteId});
```

Resolve `streamId` from trusted application state. It must distinguish the person and current destination generation; a changed email/phone/account destination cannot inherit its predecessor's grant. Do not use a raw address, account input, bearer capability or browser-selected tenant. Default namespace: `notabenda/permissions/<siteId>/`. Custom namespaces and archive prefixes are host decisions and must be disjoint where scopes differ. Host authentication, authorization, CSRF protection, abuse limits, contact verification and fulfillment remain mandatory application responsibilities. No public recording route or package-owned login is installed.

Registration verifies the offer digest and independently reconstructs its facts from the archived release. It does not activate the offer. Activation changes increment a monotonic revision: deactivating and reactivating even the same offer cannot revive an older grant. Activation is conservative: any different active offer requires a new deliberate grant.

Grant commands include `expectedRevision` and `expectedActivation` from the current read. Both must match, along with the host-derived stream precondition and active offer. The browser timestamp has a bounded delivery window (default 600 seconds, configurable 30–3,600); this is neither permission expiry nor evidence retention. No universal lifetime is invented. Hosts must assess contextual refresh/expiry requirements separately.

Withdrawal accepts a registered older offer for the same stable permission and ignores head/activation compare-and-swap. A first late withdrawal conservatively withdraws the current grant. Retrying an already committed withdrawal returns its historical receipt plus current state and does not undo a subsequent deliberate grant. Reusing a nonce with changed content fails. No conflict is silently rebased into a new grant.

Use `result.state` or `getFormPermissionState` at downstream use. A historical `receipt.action === 'grant'`, an event row or a raw head is insufficient. The evaluated state checks current activation, exact offer and guards. This still does not decide whether a message may legally be sent, or atomically couple the ledger to a delivery provider.

## Inspection and retention

The scoped store supports existing authorized admin search and export. Detail panels distinguish the historical action from evaluated current state at read time, display purpose/channel and exact wording, and distinguish host-received and browser-reported times. Store scope and export permission remain host-owned.

For `createEvidenceLifecycle`, use `{family: 'permissions', siteId, scopeId: permissionId, streamId}`. Stored holds, retirement, bounded payload purge and restore barriers apply. Retirement blocks reads and retries before empty-head handling. Purge retains shared offers, definitions and privacy archives, plus minimal lifecycle metadata; external copies and backups require their own handling. It affects only the selected purpose/channel/person/contact generation.

## Connected requirements and limits

`REQ-PRODUCT-FORM-PERMISSIONS` connects the implementation and race/isolation/lifecycle tests. `FEAT-FORMS` remains partial. The catalog also connects selected EU consent/marketing and Canadian meaningful-consent/CASL items, with unreviewed legal status and explicit gaps for national rules, prescribed information, message-level unsubscribe handling, customer exceptions, specialized authorizations and downstream actions.

The EDPB discusses purpose granularity, evidence and easy withdrawal; the CRTC distinguishes affirmative express opt-in from default opt-out and separates it from general terms. These inform the mechanism, not a regional compliance certificate. See the catalog's primary-source locators and [verification record](verification/form-permissions.md).

## React integration

`@notabenda/core/react` provides `FormPermissionProvider`, `FormPermissionField`, `useFormPermissionController`, `useFormPermissionSnapshot` and `useFormPermissionAllowed`. They reuse this controller without mount-time reads, writes or retries. The host creates and destroys the controller, deliberately reads saved state and owns its optional journal. Server snapshots remain unchecked and off; ordinary form submission stays independent. See [React form permissions](REACT.md#ordinary-form-permissions). `@notabenda/core/astro/FormPermissionField.astro` and `mountAstroFormPermission` in `@notabenda/core/astro/client` provide the matching named Astro field and page-lifecycle bridge. See [Astro form permissions](ASTRO.md#ordinary-form-permissions). Background delivery remains separate work.
