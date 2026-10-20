# Cookie-choice evidence

The optional ledger in `@notabenda/cloudflare` stores host-received cookie-choice reports against an immutable notice and legal-document release. It provides transactional ordering and a read-only compliance view. `createConsent` remains local-only by default; configuring its third argument enables **required-receipt mode**, which blocks optional services until the exact local choice matches the server's current record. An ordinary local grant is not remotely recorded.

The [EDPB consent guidelines, §§5.1–5.2](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf) discuss evidence of the information provided and how/when a choice was made, minimization, context-dependent renewal, and easy withdrawal. The fields below are an engineering design, not a regulator-mandated schema or proof of valid consent. Legal applicability and review remain the operator's responsibility.

## An immutable notice

Build a notice alongside the legal documents:

```js
import { compileLegalDocuments, createConsentNotice } from '@notabenda/core/content';

const { artifact } = compileLegalDocuments(reviewedConfig);
const notice = createConsentNotice(artifact, {
  scopeId: 'cookie-choices',
  deliveryWindowSeconds: 300,
});
```

The notice pins the privacy/cookie HTML and structured-content hashes, version and effective date, material purpose/service scopes, grant/refusal lifetimes, delivery window, and default interface wording. Its ID hashes the entire descriptor. The material-scope digest is separate: changing CSS or a document's presentation produces a different notice/release without implying a different processing purpose.

`defaultConsentWording(publicConfig)` is shared with the default controls. A custom interface can supply a `wording` override when building its notice, but must actually display that wording. Creating or registering a descriptor does not prove it was displayed. `normalizeConsentNotice` checks structure and bounds; server registration independently verifies hashes and archived facts. Notices are limited to 32 KiB, with UTF-8 limits on individual fields. Preview requires an explicit build flag and independent backend `allowPreview: true`; default backend reads reject preview heads too.

## Register, then activate

```js
import {
  recordLegalRelease, registerConsentNotice, setActiveConsentNotice,
  recordConsentChoice, getConsentHead, createConsentEvidenceStore,
} from '@notabenda/cloudflare';

const site = { siteId: 'sample-site' }; // Trusted host configuration.
await recordLegalRelease(ctx.storage, artifact);
await registerConsentNotice(ctx.storage, notice, site);
await setActiveConsentNotice(ctx.storage, notice.noticeId, {
  ...site, scopeId: 'cookie-choices',
});

// Inside the host's authenticated, authorized handler:
const stream = {
  ...site, scopeId: 'cookie-choices',
  streamId: authorizedOpaqueStreamReference,
};
const result = await recordConsentChoice(ctx.storage, validatedBody, stream);
// Return result as JSON. It contains BOTH the event receipt and current head.

const head = await getConsentHead(ctx.storage, stream);
const store = createConsentEvidenceStore(ctx.storage, site);
// Return store only from the host-authorized admin hook.
```

The package supplies no public ingestion, login, identity recovery, capability issuance or capability verification route. The host must resolve an opaque visitor capability/session into its trusted stream reference and enforce origin/CSRF protection, quotas, request-size limits and rate limits. Site IDs are not credentials. Do not pass an email, a raw bearer capability, or a browser-selected account ID as `streamId`. Only its site/scope-scoped SHA-256 reference is stored in the ledger; hashing does not make this reference anonymous.

Registration verifies the existing immutable archive and does not activate or publish the notice. `setActiveConsentNotice(storage, null, scope)` disables new grants/snapshots; known-notice revoke-all remains available. Prefixes default to `notabenda/consent/SITE_ID/` and `notabenda/releases/`; trusted custom prefixes must be disjoint across separately authorized stores. The storage adapter must provide real atomic transactions.

## Commands, ordering and retries

A request accepts exactly:

```js
{
  schemaVersion: 1,
  noticeId: notice.noticeId,
  requestId: crypto.randomUUID(),
  expectedRevision: 0,
  action: 'accept-all', // 'revoke-all' or 'save' are also supported.
  choices: { measurement: true, suggestions: true },
  clientAt: '2026-10-18T12:00:00.000Z',
}
```

All declared purpose IDs need strict boolean values. Accept-all requires every value true; revoke-all requires every value false. Save supports a complete granular snapshot. An unknown purpose, incomplete map, extra authority field, weak nonce or coerced enum is rejected. Commands are bounded to 8 KiB; hosts must bound the HTTP body before parsing it.

Ordinary snapshots require the active notice and `expectedRevision` equal to the stream's current revision. The check, immutable event append and head advance share one transaction. A stale grant fails with `revision-conflict` or `stale-notice`; **never automatically rebase and retry a grant**. Read the current head and obtain a fresh deliberate choice.

Explicit revoke-all is restrictive: it can use a known old notice and a stale expected revision. It clears all existing grants, including purposes introduced since that notice. The record keeps the submitted revision and the actual revision superseded separately. A delayed first delivery can therefore revoke a newer grant. Missing purposes never imply permission. An all-false `save` does not receive this special ordering exemption.

An identical nonce/body retry returns the original receipt plus the **current head** in one transaction. It does not apply the historical command again. Retrying a grant after withdrawal returns a historical grant receipt and the newer declined head; retrying an old recorded denial after a fresh grant returns that denial receipt and the newer granted head. Any changed body under the same nonce fails with `idempotency-conflict`.

Client-reported action time and host receipt time remain distinct. A new command containing any grant must arrive within the notice's delivery window, default five minutes; browser time more than 30 seconds ahead of the server is rejected. Expiry uses the original action time, capped at server time, and the declared lifetime. Already-recorded retries preserve original times and expiry even after that window. An old refusal can be recorded late without authorizing processing. These limits are operator settings, not legal duration defaults.

## Review and retention

`createConsentEvidenceStore` exposes events only, joined to their pinned wording, purpose names and document references. Search spans that context, event/stream digests and JSON fields within the existing bounded scan. Notice registries and head pointers are not enumerable through this store. The no-JavaScript backoffice shows purpose choices, action wording, client/receipt timestamps, causal revisions and collapsible version references. It labels each event as historical; it does not infer the current state from key order.

The website’s `/demo/admin/choices` contains realistic fictional journeys. Public `/choices` remains local-only. `/recorded-choices` sends actual sandbox choices to a generation-bound fictional stream, with review under `/demo/admin/recorded`. Each browser session gets its own DO database, without a password, and a one-day idle cleanup deadline. The local development commands use that same Worker host. This demo capability is website integration code, not production visitor authentication supplied by the npm packages.

## Browser delivery and required permission

```js
import {createConsent, mountControls, ConsentEvidenceError} from '@notabenda/core';

const consent = createConsent(config, undefined, {
  evidence: {
    notice,
    streamRef: authorizedBootstrap.streamRef,
    read: ({signal}) => hostTransport.readCurrentHead({signal}),
    write: (command, {signal}) => hostTransport.recordChoice(command, {signal}),
  },
});
mountControls(container, {consent});
// Register cooperative optional service lifecycles as usual.
```

`read` returns `ConsentHead`; `write` returns `{receipt, head}`. The transport must use the host's existing authorization/CSRF controls and map server `revision-conflict`, `stale-notice`, and `expired-command` responses to `ConsentEvidenceError` with that code. Other errors remain uncertain failures. A matching ID alone is insufficient: the controller checks the site, scope, stream digest, nonce, original action/time, notice/artifact/material-scope references, choices, revisions and expiry. These checks validate a response contract, not human identity.

Required mode is fixed at construction, before any service registers. There is no late attachment or best-effort permission path. Saved local-only grants cannot inherit a server grant. The host supplies the opaque stream digest; a changed stream does not replay the previous stream's action. The package does not mint or recover visitor identities or store raw capability secrets.

Each local choice atomically stores one bounded original command with its scoped choices. Acknowledgments never rewrite that shared storage key. The controller rechecks it before a queued loader runs, so another tab's newer refusal prevents startup even before its storage event arrives. Local refusal and the failed-write barrier remain authoritative in memory.

The gate starts closed after construction, refresh and browser resume. An authenticated head read can confirm an already committed, unexpired local action even after its delivery window has elapsed. It never replays an uncommitted grant on reload/resume: a fresh choice is required. Old committed releases survive cosmetic notice changes when their actual material scopes still match; material changes invalidate the grant.

Uncertain delivery retries the same nonce/body, with at most three automatic retry delays (1, 5 and 15 seconds), each attempt timed out after 10 seconds by default (`timeoutMs`: 1–30 seconds). A grant stops sending after its original notice delivery deadline; a pending refusal has a separate 24-hour recovery window. Only the latest action is retained. Superseding choices and destruction abort the old generation and retire its acknowledgments even if the transport ignores abort. `retryEvidence()` retries an eligible uncertain attempt; `refreshEvidence()` closes the gate and rechecks the authenticated head. `settled()` waits for current transport and service work, not future backoff timers.

A revision conflict refreshes the head and asks for a fresh choice; it never rebases the grant. An explicit rejection can be sent while the head is unavailable and stops local services immediately, including when local persistence fails. Failed local grant persistence prevents grant delivery. Missing secure randomness prevents a remote command but cannot prevent local rejection. Permission expires at the earlier applicable local/server expiry, and the service timer observes server expiry too. UI messages distinguish checking, saving, failed delivery, stale notice and fresh-choice requirements; rejection stays available.

Permission expiry and evidence retention are different. The host owns retention/erasure, access auditing, backup/restore and replay policy. No cleanup/export/erasure service is implemented yet. Do not delete individual events/heads/notices arbitrarily: they carry ordering and idempotence, and deletion can permit replay or break reads. Plan coordinated deletion and stream/capability retirement before production. Do not put raw requests, IP addresses, user agents, form bodies, or capability secrets into the ledger.

## Verification and remaining work

Traceability: [REQ-PRODUCT-CONSENT-EVIDENCE](requirements/README.md#req-product-consent-evidence), [REQ-EU-CONSENT](requirements/README.md#req-eu-consent), [the ledger tests](../packages/notabenda/test/consent-evidence.test.mjs).

Tests cover exact notice/archive binding, canonical serialization, duplicate concurrent delivery, competing snapshots, old-tab revoke-all, retries after withdrawal and regrant, bounded time/UTF-8/schema checks, scope separation, preview guards, failed-transaction rollback, escaped context and filtered store reads. The synthetic adapter is a transactional test double; [browser and real local Worker checks](verification/consent-evidence-browser.md) are recorded separately.

The [delivery tests](../packages/notabenda/test/consent-delivery.test.mjs) exercise required-mode outages, identical retries, late acknowledgments/reads, reload recovery, pre-start shared-storage races, failed persistence, stream changes, malformed responses, server expiry, unavailable storage and maximum-size revoke-all responses. Production capability lifecycle, retention/erasure, full cross-browser/assistive-technology review and cloud deployment validation remain work ahead.
