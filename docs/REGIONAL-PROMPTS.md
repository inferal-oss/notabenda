# Consent expiry and repeat prompts

Grant expiry determines when a service must stop. Repeat-prompt rules determine when a site may ask again. Configure and review them separately.

## Cap remembered grants at six calendar months

```ts
config.consent.grantExpiryPolicy = {
  profile: 'ie-dpc-six-month-default',
  version: 1,
};
```

This opt-in mechanism follows the default timeframe described in the [Irish DPC April 2020 note, p. 8 and footnote 2](https://www.dataprotection.ie/sites/default/files/uploads/2020-04/Guidance%20note%20on%20cookies%20and%20other%20tracking%20technologies.pdf). The guidance allows an objectively justified longer period on a case-specific basis. The package does not assess those justifications or provide an extension switch. This is not a statutory 180-day limit or a complete Irish profile. Declaring Ireland, setting `en-IE` or selecting a setup market does not enable it.

A grant ends at the earlier of `grantLifetimeDays` and six UTC calendar months after its original action. Month-end dates clamp to the destination month's final day while retaining UTC time: 31 August 2026 at noon becomes 28 February 2027 at noon; 1 March becomes 1 September. A configured 30-day lifetime stays 30 days. Active service lifecycles stop at expiry, and a reload cannot renew them. A deliberate new choice is required.

Refusal/withdrawal lifetimes, dismissal, Italian solicitation suppression and server evidence retention remain independent. A suppressed prompt never keeps an expired service running. Preferences can still be opened manually. Disclose the actual local preference storage, purpose and lifetimes in reviewed cookie wording; setting this option does not rewrite supplied legal text or vendor cookies.

The selected policy is bound to positive purpose scopes, notices and saved evidence commands. Adding or removing it requires a new choice for positive permissions; still-current refusals survive. On observing a policy transition, the local controller removes prior positive authority and persists that invalidation before it can later be restored by a configuration rollback. This local migration creates no server event and does not rewrite historical receipts. Browser storage is untrusted and nontransactional; a failed write keeps the current instance blocked but cannot promise durable invalidation after that instance closes. Keep the policy consistent across routes and avoid concurrent deployments with conflicting configurations.

Cloudflare independently verifies the policy against the retained release and caps receipt expiry from both the client action and server-recorded time, choosing the earlier result. Comparing both calculations matters because month-end clamping is not monotonic across times of day. Pending acknowledgements cannot extend the grant; immutable retries retain their original expiry even after a different notice is activated. The browser separately checks the receipt formula and its own local deadline. See the [regional verification record](verification/regional-consent.md) for scenarios and limits.

Setup revision 4 offers an Irish duration recommendation and the exact configuration field, without modifying imported settings. A private supporting note is an operator assessment, never approval to extend a grant. Reviewed extension workflows remain open.

## Suppress repeated Italian solicitation

The optional Italian repeat-prompt guard is an initial regional mechanism, not an Italy compliance profile. The host explicitly selects it; `jurisdictions`, IP addresses and browser language never activate it. Other complete regional profiles remain unimplemented.

The Garante's [2021 guidelines, §§6.2–7.1](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876) address repeated solicitation after refusal, partial consent and closing the initial banner. They identify significant processing changes, unavailable prior state and six months since the previous banner presentation as exceptions. This implementation conservatively starts six UTC calendar months at the recorded withholding/dismissal action, which may occur later than presentation. Month-end dates clamp to the destination month's last day. This calculation and applicability still need legal review.

```ts
config.consent.promptPolicy = {
  profile: 'it-garante-2021',
  processingRevision: 'processing-v1',
};
```

The floor suppresses unsolicited notices. It never extends a grant, changes a refusal into permission, acknowledges a backend receipt, or prevents opening preferences manually. Expired permissions remain blocked. A shorter `refusalLifetimeDays`, a new purpose or removal of an old purpose does not discard valid withholding metadata. Grant, refusal, dismissal, solicitation and evidence-retention clocks remain distinct. No forced prompt appears merely because six months elapse if no choice is otherwise needed.

`rejectAll()` and any partial `choose()` record withholding alongside the local choice. `dismiss()` writes only the separate solicitation key; choices and evidence commands remain untouched. Failed persistence can suppress within the current controller, but cannot promise memory after reload. Missing/cleared/unreadable state does not grant permission. Legacy valid withholding timestamps receive a conservative floor without inventing a historical processing revision. Keep the policy configured consistently on every participating route.

For a significant processing change the host has actually assessed, explicitly declare one exact transition:

```ts
config.consent.promptPolicy = {
  profile: 'it-garante-2021',
  processingRevision: 'processing-v2',
  materialChange: {
    fromRevision: 'processing-v1',
    summary: 'Our measurement provider changed. Review its updated purpose and recipients.',
  },
};
```

A revision mismatch alone cannot unlock solicitation. The bounded public explanation appears in the initial and preferences copy, including after custom wording overrides when creating evidence notices. The notice binds the exact policy and disclosure to its archived release. Runtime and CF checks reject mismatches; policy revisions stay separate from permission scopes. Closing or making a new choice acknowledges the current revision; old refusals remain off until the visitor deliberately changes them. The toolkit cannot verify that a declared change is significant, truthful, necessary or legally sufficient. Do not use cosmetic releases as processing revisions.

`getSnapshot().promptDecision` reports profile/version, reason, `allowsPrompt`, `requiresChoice`, optional `nextEligibleAt`, requirement IDs and source IDs. `shouldPrompt` additionally considers dismissal, pending choices, evidence and independent processing restrictions. The decision is a software explanation, not an applicability or compliance verdict. Local metadata is untrusted browser state, not controller-held evidence.

Declare and review the additional preference-storage purpose, notice and retention. The package does not erase metadata or archived evidence at six months; hosts own that lifecycle and any accessibility/platform review. Headless interfaces must display the declared change information and preserve equally usable refusal and manual reopening.

Try the [interactive laboratory](/repeat-prompts) with simulated time and in-memory state, or inspect `examples/repeat-prompts`. Traceability: `REQ-IT-REPROMPT`, `REQ-PRODUCT-REGIONAL-PROMPTS`, `FEAT-REGIONS`, `VERIFY-IT-REPROMPT`. See [verification](verification/regional-prompts.md).
