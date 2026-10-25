# Cookie-choice evidence

The optional ledger in `@notabenda/cloudflare` stores host-received cookie-choice reports against an immutable notice and legal-document release. It provides transactional ordering and a read-only compliance view. `createConsent` requires an explicit evidence mode in its build-time descriptor. A `local` descriptor uses browser-local choices. A `required` descriptor and its `requiredConsentEvidence` adapter enable **required-receipt mode**, which blocks optional services until the exact local choice matches the server's current record. An ordinary local grant is not remotely recorded.

For complete application wiring, start with the [recorded-cookie example](RECORDED-COOKIE-APPLICATION.md): generated YAML inputs, host session hooks, separate operator activation, native controls and ledger inspection. The API reference below explains each boundary.

The [EDPB consent guidelines, §§5.1–5.2](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf) discuss evidence of the information provided and how/when a choice was made, minimization, context-dependent renewal, and easy withdrawal. The fields below are an engineering design, not a regulator-mandated schema or proof of valid consent. Legal applicability and review remain the operator's responsibility.

## An immutable notice

For the native controls, build the runtime and notice from the same configuration file:

```sh
notabenda build --config notabenda.config.yaml --consent-runtime required \
  --consent-scope cookie-choices --out-dir legal-dist
```

JSON and Markdown-frontmatter configurations work too. Choose a stable scope slug for the host's cookie-choice workflow. The command writes `consent-runtime.json`, `consent-notice.json`, consent-only CSS, and an immutable notice file at `artifacts/{artifactId}/consent/{noticeId}.json`. The current alias is for bootstrapping; the hash URL identifies an exact notice. Both contain the same canonical JSON. Production is the default; use `--preview` deliberately for a draft.

The notice uses the native controls' wording, including the configured consent localization and public rights/browser information. The CLI uses the existing five-minute delivery window. For custom UI wording or a different window, use the build API below and display that exact copy. A scope name creates no backend registration, active selection, visitor identity or permission. Required mode without `--consent-scope` still supports hosts that build their own notice.

To use the generated output, record `artifacts/{artifactId}.json` in the host archive, register the notice, then activate it for the trusted site and scope. Pass the same notice and runtime descriptor to the browser adapter. The host still supplies the authorized stream and receipt endpoints.

### Custom build pipelines

Create the notice and files together when using your own build script:

```js
import {compileLegalDocuments, createConsentNoticeFiles} from '@notabenda/core/content';

const build = compileLegalDocuments(reviewedConfig);
const {notice, files} = createConsentNoticeFiles(build.artifact, {
  scopeId: 'cookie-choices',
  deliveryWindowSeconds: 300,
});
// Write {...build.files, ...files} to the site's public output.
```

`createConsentNoticeFiles` verifies the full public release before deriving the notice. Its settings are bounded plain data with only `scopeId`, optional `wording` and optional `deliveryWindowSeconds`. The returned notice matches `createConsentNotice`; the files add a current alias and a hash-pinned copy. The release must fit the supported 128 KiB public archive and the notice must fit 32 KiB. The API does not sanitize untrusted rendered HTML or decide whether an old notice should be published.

If your build owns its file layout, `createConsentNotice(artifact, settings)` returns just the descriptor.

The notice pins the privacy/cookie HTML and structured-content hashes, version and effective date, material purpose/service scopes, grant/refusal lifetimes, delivery window, and default interface wording. Its ID hashes the entire descriptor. The material-scope digest is separate: changing CSS or a document's presentation produces a different notice/release without implying a different processing purpose.

`defaultConsentWording(publicConfig)` is shared with the default controls. A custom interface can supply a `wording` override when building its notice, but must actually display that wording. Creating or registering a descriptor does not prove it was displayed. `normalizeConsentNotice` checks structure and bounds; server registration independently verifies hashes and archived facts. Notices are limited to 32 KiB, with UTF-8 limits on individual fields. Preview requires an explicit build flag and independent backend `allowPreview: true`; default backend reads reject preview heads too.

## Keep earlier notices available

A notice hash can change when wording changes even if the underlying legal release stays the same. Keep the notice JSON alongside the policy release it names. An old notice's pinned URL must continue to return its exact bytes when that notice is selected for public retention.

```sh
notabenda build --config notabenda.config.yaml --consent-runtime required \
  --consent-scope cookie-choices --out-dir next-legal-dist \
  --retain-artifact saved-release.json --retain-consent-notice saved-notice.json
```

`--retain-consent-notice` accepts an explicit ordinary JSON file up to 32 KiB and can repeat up to 256 times. Its intact public release must be current or supplied through `--retain-artifact`. Wrong sites, unsupported modes, changed hashes/scopes/policy references and missing releases fail before output. An existing `consent-notice.json` requires an explicit current scope on rebuild, so an old alias cannot silently remain beside a new runtime.

In a custom build, `createRetainedConsentNoticeFiles(artifacts, notices, {siteId, mode})` verifies each complete descriptor against its release and returns only pinned notice files. Add `createRetainedReleaseFiles` for the corresponding artifact JSON and document HTML. It accepts up to 257 release inputs (current plus 256 retained), with the existing 128 KiB per-release and 16 MiB combined bounds. Retained notices never replace the current alias, activate old notices or re-authorize old grants. Retention and publication remain operator decisions.

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

The generated `runtime` and `notice` below are parsed JSON from the same build. Load them before optional integrations and handle configuration-load failures by keeping those integrations blocked. The host provides the authorized bootstrap context and receipt transport.

```js
import {createConsentRuntime, mountControls} from '@notabenda/core/consent';
import {requiredConsentEvidence, ConsentEvidenceError} from '@notabenda/core/consent/evidence';
import '@notabenda/core/consent.css';

const consent = createConsentRuntime(runtime, undefined, {
  evidence: requiredConsentEvidence({
    notice,
    streamRef: authorizedBootstrap.streamRef,
    read: ({signal}) => hostTransport.readCurrentHead({signal}),
    write: (command, {signal}) => hostTransport.recordChoice(command, {signal}),
  }),
});
mountControls(container, {consent});
// Register each optional service lifecycle before its requests can start.
```

Root/headless `createConsent` has the same descriptor and adapter contract as `createConsentRuntime`. For a temporary complete-config integration, explicitly import `createCompatibilityConsent` from `@notabenda/core/consent/compat`; only that factory accepts full site configuration and plain receipt options without the wrapper. Both paths use the same receipt protocol. See [browser configuration](BROWSER-CONFIG.md) and [migration limits](MIGRATION.md#unreleased-browser-api-migration).


`read` returns `ConsentHead`; `write` returns `{receipt, head}`. The transport must use the host's existing authorization/CSRF controls and map server `revision-conflict`, `stale-notice`, and `expired-command` responses to `ConsentEvidenceError` with that code. Other errors remain uncertain failures. A matching ID alone is insufficient: the controller checks the site, scope, stream digest, nonce, original action/time, notice/artifact/material-scope references, choices, revisions and expiry. These checks validate a response contract, not human identity.

Required mode is fixed at construction, before any service registers. There is no late attachment or best-effort permission path. Saved local-only grants cannot inherit a server grant. The host supplies the opaque stream digest; a changed stream does not replay the previous stream's action. The package does not mint or recover visitor identities or store raw capability secrets.

Each local choice atomically stores one bounded original command with its scoped choices. Acknowledgments never rewrite that shared storage key. The controller rechecks it before a queued loader runs, so another tab's newer refusal prevents startup even before its storage event arrives. Local refusal and the failed-write barrier remain authoritative in memory.

The gate starts closed after construction, refresh and browser resume. An authenticated head read can confirm an already committed, unexpired local action even after its delivery window has elapsed. It never replays an uncommitted grant on reload/resume: a fresh choice is required. Old committed releases survive cosmetic notice changes when their actual material scopes still match; material changes invalidate the grant.

Uncertain delivery retries the same nonce/body, with at most three automatic retry delays (1, 5 and 15 seconds), each attempt timed out after 10 seconds by default (`timeoutMs`: 1–30 seconds). A grant stops sending after its original notice delivery deadline; a pending refusal has a separate 24-hour recovery window. Only the latest action is retained. Superseding choices and destruction abort the old generation and retire its acknowledgments even if the transport ignores abort. `retryEvidence()` retries an eligible uncertain attempt; `refreshEvidence()` closes the gate and rechecks the authenticated head. `settled()` waits for current transport and service work, not future backoff timers.

A revision conflict refreshes the head and asks for a fresh choice; it never rebases the grant. An explicit rejection can be sent while the head is unavailable and stops local services immediately, including when local persistence fails. Failed local grant persistence prevents grant delivery. Missing secure randomness prevents a remote command but cannot prevent local rejection. Permission expires at the earlier applicable local/server expiry, and the service timer observes server expiry too. UI messages distinguish checking, saving, failed delivery, stale notice and fresh-choice requirements; rejection stays available.

Permission expiry and evidence retention are different. The host chooses schedules, authorization, backup/restore and replay policy. The optional [evidence export](EVIDENCE-EXPORT.md) and [lifecycle tools](EVIDENCE-LIFECYCLE.md) operate on explicitly authorized contexts; they do not fulfill privacy requests or retire host identities automatically. Use the coordinated lifecycle instead of deleting individual events, heads or notices: those records carry ordering and idempotence. Keep raw requests, IP addresses, user agents, form bodies and capability secrets out of the ledger.

## Verification and remaining work

Traceability: [REQ-PRODUCT-CONSENT-EVIDENCE](requirements/README.md#req-product-consent-evidence), [REQ-EU-CONSENT](requirements/README.md#req-eu-consent), [the ledger tests](../packages/notabenda/test/consent-evidence.test.mjs).

Tests cover exact notice/archive binding, canonical serialization, duplicate concurrent delivery, competing snapshots, old-tab revoke-all, retries after withdrawal and regrant, bounded time/UTF-8/schema checks, scope separation, preview guards, failed-transaction rollback, escaped context and filtered store reads. The synthetic adapter is a transactional test double; [browser and real local Worker checks](verification/consent-evidence-browser.md) are recorded separately.

The [delivery tests](../packages/notabenda/test/consent-delivery.test.mjs) exercise required-mode outages, identical retries, late acknowledgments/reads, reload recovery, pre-start shared-storage races, failed persistence, stream changes, malformed responses, server expiry, unavailable storage and maximum-size revoke-all responses. Adopter acceptance under the actual host identity, quotas, retention policy and deployment remains separate. Full cross-browser and assistive-technology review is still open. [Notice file verification](verification/consent-notice-files.md) covers the CLI-to-ledger-to-runtime integration and explicit retained notice output.
