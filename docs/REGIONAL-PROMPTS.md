# Give a recorded choice some quiet

The optional Italian repeat-prompt guard is an initial regional mechanism, not an Italy compliance profile. The host explicitly selects it; `jurisdictions`, IP addresses and browser language never activate it. Other regional profiles remain unimplemented.

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
