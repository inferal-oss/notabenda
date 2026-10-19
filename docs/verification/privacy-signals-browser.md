# Privacy signal verification

18 October 2026. Linked to `REQ-PRODUCT-PRIVACY-SIGNALS`, `REQ-US-CA-GPC`, `REQ-US-CO-GPC`, `REQ-US-CT-GPC`, `REQ-PRODUCT-CONSENT-EVIDENCE` and `REQ-PRODUCT-REACT`.

Final `npm run check` passed 140 package tests, 15 site tests, catalog validation, the website build and a Worker dry run. Work remains uncommitted and unpublished.

## Automated checks

- Configuration tests require explicit activity classification for every service when the policy is enabled. They reject unknown/duplicate activities, empty policies and missing explanations. Public projection preserves the declared policy; changed service classification invalidates affected cookie grants. Generated privacy HTML includes escaped operator-supplied policy text.
- Request parsing covers absent/invalid fields, exact `1`, combined duplicate fields and a DNT-only request. Server restriction output matches declared activity intersections and never supplies consent or identity.
- Default browser-reader tests provide a real jsdom navigator boolean and confirm a host false cannot cancel browser true. Other tests cover host true with browser absent/false, unsupported readers and throwing readers. Observed true remains latched within the controller despite subsequent false/missing/error observations.
- Real controller/lifecycle tests cover signal-before-registration, accept-all precedence, immediate queued-start sampling, abort while asynchronous initialization is pending, cleanup completion and resume. A prototype-shaped service ID does not inherit a false restriction or lose its prompt. Snapshot reads do not read the signal provider.
- The embed adapter removes its image on a newly observed restriction while preserving cookie permission. A later mount cannot use that cookie purpose to bypass service restrictions.
- Actual synthetic evidence-ledger tests hold cookie delivery pending, then observe GPC before releasing acknowledgment. Only the unrestricted local service starts. The single stored cookie event still contains the actual granted choice; no rejection or signal event is fabricated.
- React tests distinguish purpose/service permissions, use conservative server state and verify immutable signal arrays/maps. Rendering does not call the effectful service check. Packed consumers import the helper APIs and compile the optional React service hook.
- Site checks verify conservative SSR, local runtime/module resolution, explicit policy inventory and script-free legal pages.

## Real Chromium fixture

The actual locally served Worker example began with no observed GPC signal, both services blocked and zero initiated optional requests. Accepting the cookie purpose started the two first-party sample services, with two initiated requests.

Using the explicitly labeled simulation control applied a fixture signal without changing the browser setting. Sample advertising became blocked/not eligible; local tools remained active/eligible, and cookie permission stayed allowed. The request counter stayed at two. The fixture flag is visible in the demo URL and is not an account identifier, real browser setting or trusted opt-out record.

Reload with that fixture flag preserved the saved cookie permission while starting only local tools: advertising remained blocked and the new page initiated one optional request. Reopening preferences showed both the cookie selection and the independent GPC explanation. Saving that same cookie choice left advertising blocked and the counter at one.

At 390×844, document client and scroll widths both measured 375 CSS pixels. At 320×568 they both measured 305 pixels, retaining the same cookie/service distinction. The mobile screenshot shows allowed cookie permission beside restricted advertising and eligible local tools. No page errors were observed. Temporary browser viewport overrides were reset after inspection.

Screenshot: [independent cookie and processing state](../assets/screenshots/privacy-signals-mobile.jpg).

## What this does not prove

The manual flow uses a **fixture signal**, not a live browser extension or HTTP GPC preference. Automated tests exercise the navigator/header readers separately. No cross-browser, extension, screen-reader, known-account or downstream-processor audit is claimed.

The latch lasts for one controller and is not persistent account/profile opt-out retention. A new controller with no observed signal can independently recover a still-valid cookie grant; the host must preserve and enforce applicable prior opt-outs. Legal applicability, manual opt-out routes, sensitive/minor/incentive scenarios, re-opt-in and downstream propagation remain incomplete. CA/CO/CT requirements therefore remain partial and legally unreviewed, even though this bounded runtime mechanism is implemented.
