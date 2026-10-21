# Recorded processing opt-outs

Cookie permission and permission to sell, share or use data for targeted advertising are separate questions. `createProcessingChoices` supplies an explicit opt-out, local pending recovery and a host-confirmed restriction state. It has no grant, reset, automatic expiry or re-opt-in method. `@notabenda/cloudflare` provides the corresponding transactional ledger and authorized search view.

This mechanism implements `REQ-PRODUCT-PROCESSING-CHOICES`. It contributes to, and does not complete, `REQ-US-CA-CHOICES`. Reviewed applicability, alternative request methods, identity continuity, downstream handling, sensitive-information rights and retention remain operator work. A cookie banner alone does not supply the California sale/sharing opt-out method. See the [catalog entry](requirements/README.md#req-us-ca-choices) and its primary regulation source.

For return navigation, use an explicit [privacy-choice link](PRIVACY-CHOICE-LINKS.md). A generic text link can lead to your processing page; the California alternative-link presentation has a broader destination requirement.

## Build a pinned notice

Explicitly classify **every** configured service with `processingActivities`: any of `sale`, `sharing`, `targeted-advertising`, or `[]`. This records a technical classification supplied by the operator; the library does not determine the legal meaning of a vendor's activity.

```ts
import {compileLegalDocuments, createProcessingNotice} from '@notabenda/core/content';

const release = compileLegalDocuments(reviewedConfig);
const notice = createProcessingNotice(release.artifact, {
  scopeId: 'privacy-choices',
  activities: ['sale', 'sharing', 'targeted-advertising'],
  wording: {
    title: 'Your privacy choices',
    description: 'Opt out of sale, sharing and targeted advertising.',
    actionLabel: 'Opt out',
  },
});
```

The notice pins its wording, workflow scope, classified service set and exact privacy document release. Production requires a reviewed privacy document. Fictional previews require explicit preview mode in the builder and explicit `allowPreview: true` at each runtime/backend boundary. Publication and legal review are separate from recording this descriptor. Supply the applicable rights text and route; the generated privacy page can link through `privacy.rightsUrl`, and supplied Markdown/MDX can link directly to the opt-out surface. Keep previously referenced public artifact paths available across deployments.

## Host-owned context and storage

```ts
import {
  recordLegalRelease, registerProcessingNotice,
  getProcessingHead, recordProcessingRestriction,
  createProcessingRestrictionStore,
} from '@notabenda/cloudflare';

await recordLegalRelease(storage, release.artifact);
await registerProcessingNotice(storage, notice, {siteId: notice.siteId});

// Resolve this from the application's trusted context, never the request JSON.
const context = {
  siteId: notice.siteId,
  scopeId: notice.scopeId,
  streamId: resolvedOpaqueContext,
};
const head = await getProcessingHead(storage, context);
const result = await recordProcessingRestriction(storage, boundedRequestBody, {
  ...context,
  provenance: 'explicit-opt-out',
});
const store = createProcessingRestrictionStore(storage, {siteId: notice.siteId});
```

`streamId` is a stable opaque reference assigned by the host. A SHA-256 digest of site, scope and stream becomes the public `streamRef`; hashing does not make a guessable identifier secret. The packages do not create identities, sessions or accounts. Do not require sign-in merely to use an applicable opt-out: hosts can resolve an appropriate anonymous context and must decide how restrictions follow any associated profile, device or account. Prevent another visitor from selecting or reading someone else's context.

Requests contain only schema version, notice ID, request UUID and activities. The backend rejects injected identity, provenance and timestamps. The host supplies authorization, exact-origin/CSRF protection, size/rate limits, context resolution and source attribution. Supported provenance labels are `explicit-opt-out`, `gpc-header`, `browser-report` and `trusted-application`; the label is an assertion made by the host. Read a real header before assigning `gpc-header`. Browser-reported signals are distinct from observed headers.

Each transaction appends an immutable event and replaces the context's head with the union of previous and newly requested restrictions. Parallel requests cannot discard another activity. Retrying the same immutable request returns its original receipt and the **current** head; reusing its UUID with different content or provenance fails. A new notice listing fewer activities cannot shrink the retained union. Registration does not activate a permission or invalidate older opt-out requests.

## Connect the browser

```ts
import {createProcessingChoices, mountProcessingChoices, createConsent} from '@notabenda/core';
import '@notabenda/core/styles.css';

const processing = createProcessingChoices(notice, {
  streamRef: trustedContext.streamRef,
  read: ({signal}) => readCurrentHead({signal}),
  submit: (request, {signal}) => submitOptOut(request, {signal}),
});
const consent = createConsent(publicConfig, undefined, {processingChoices: processing});
mountProcessingChoices(document.querySelector('#privacy-choices')!, processing);
// Register optional services with this consent controller before doing any work.
```

Transports resolve decoded response JSON and reject unsuccessful HTTP responses. Propagate `AbortSignal`. A bounded timeout defaults to 10 seconds; `timeoutMs` accepts 1–30 seconds. Responses are validated for context, request, notice, artifact, activities and causal revision. Missing, pending, malformed, backward or failed reads block all three covered activities. A valid zero head establishes no retained restriction for that context; it never grants cookie permission or processing rights.

`getSnapshot()` is a pure detached read. `restrictedActivities` is known intent; `blockedActivities` also includes conservative failure/read restrictions. `pending` counts queued requests, `revision` is the known host revision, and `status` distinguishes checking, ready, saving, recorded, error and destroyed. `needsConfirmation` means local intent survived without a recoverable original request; the UI asks for a new deliberate action under the current notice rather than inventing a historical click. Activities absent from that notice require host review. `subscribe`, `refresh`, `refreshLocal`, `retry`, `settled` and `destroy` support custom rendering and lifecycle ownership.

The consent controller validates matching site, privacy version/date and classified service scope. Its effective `servicePermissions`, registered loaders and embeds combine cookie/evidence eligibility, GPC and retained processing restrictions. Cookie-purpose `permissions` remain separate. Effectful service checks and queued starts synchronously resample local restriction intent; snapshots remain pure. Processing updates do not restart cookie-evidence reads. The host owns both controllers; destroying cookie controls does not destroy the processing controller. A destroyed processing controller keeps covered work blocked.

## Recovery and retention

Local keys use `notabenda:processing:v1:SITE:SCOPE:STREAMREF`. The base key retains pending immutable requests with their artifact binding and a minimum known revision. Separate `:sale`, `:sharing` and `:targeted-advertising` keys store true-only intent, so tabs cannot overwrite another activity with false. Browser storage is untrusted and never an authorization credential. Changing context must create appropriately bound controllers; changing the identity mapping can lose continuity and is the host's responsibility.

Intent is persisted before delivery. Lost acknowledgment retries use the original UUID and artifact reference, including after reload or notice replacement. Cross-tab/page visibility updates refresh the head and retry recoverable pending requests. If an outbox write is lost while activity keys survive, restrictions stay in place and confirmation needs a fresh action. Storage failure preserves in-memory restrictions and blocks uncertain work; it cannot promise recovery after reload. Malformed local data blocks covered activities and needs review. Clearing browser storage cannot erase a retained backend restriction when the host resolves the same context.

Delivery timeout, cookie-choice expiry and policy changes do not expire a processing restriction. This package intentionally provides no deletion/reset or re-opt-in flow. The host must implement a reviewed retention/erasure policy, preserve the referenced notices and document archives while records need them, and separately enforce any lawful re-opt-in process. Do not delete a head or change context as a shortcut to a grant.

The backoffice store exposes validated events, exact notice wording and policy references, historical cumulative restrictions, and the current head at read time. It excludes internal head/notice keys from result lists. Search can use activity names, provenance, scope, opaque stream digest or policy version; date filters use host-received UTC time. Plug the store into a host-authorized `createAdminWorker` as with the other evidence stores. Counts remain bounded search-segment counts.

The ledger confirms receipt of an instruction. The application still has to stop server jobs, exports and relevant vendor processing, propagate requests and complete required notices. The toolkit's confirmation wording does not assert that those operations happened. Keep their outcomes in appropriate application records and test them separately.

The [local example](../examples/processing-choices/build.mjs) uses fictional first-party services and a context isolated to the browser’s demo session. Both development commands use the SQLite-backed Worker host, with password-free `/demo/admin` review and one-day idle cleanup. It is a demonstration of session isolation, not an identity or production-retention design. See the [verification record](verification/processing-choices-browser.md).

<!-- @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION -->
## Language and interface copy

For a non-English recorded opt-out, supply the complete `localization.processingChoices` message set in the site inventory before compiling. [The Portuguese messages](../examples/localization/processing-messages.json) cover every status, retry, preview notice and local-recovery problem. Keep the notice's title, explanation and action label in `settings.wording`, in the same intended language; translate the privacy document and inventory separately. These are host-supplied drafts, not a reviewed translation catalog or a jurisdiction selection.

The optional dictionary shares the site's canonical locale, direction, localization revision and review declaration. Each message is plain text without placeholders or markup. `retryLabel` allows 120 UTF-8 bytes, other messages 2,000, and the complete selected interface is bounded to 8 KiB including metadata. Missing or extra keys, invalid metadata, accessors and oversized sets fail. A non-English notice without this dictionary cannot be built. Unrelated signals-only use needs no dictionary.

Localized notices use schema version 2 and retain the selected messages. Existing schema-1 English notices and request/receipt formats remain supported. The Cloudflare recorder verifies the selected message set against its exact retained release, so a rehashed substitute translation is rejected. Native controls set explicit `lang` and `dir` and use no per-message English fallback.

Revise `localization.revision` and retain the new release when copy changes. A new notice does not clear restrictions or abandon pending requests: recovery sends the original notice ID and request UUID, and that older notice/archive must remain available. Copy-only edits leave cookie-consent scope unchanged. The dictionary is excluded from consent-only runtime and notice projections. Never rename a stream or scope merely to reset an opt-out.

Try [the Portuguese opt-out example](/localization/processing/). Record an opt-out, then allow cookies: the separately classified counter can run while the covered suggestion service stays blocked. Reload in the same session to recover the restriction. Inspect its exact wording through the demo backoffice. Real account mapping and downstream effects still need host integration. See [verification](verification/processing-localization.md).
