# Repeat-prompt guard verification

Requirements: `REQ-IT-REPROMPT`, `REQ-PRODUCT-REGIONAL-PROMPTS`, `REQ-PRODUCT-CONSENT-RUNTIME`, `REQ-PRODUCT-CONSENT-EVIDENCE`.

Automated scenarios cover explicit configuration and projection; refusal, partial consent and dismissal; calendar/month-end/leap-year boundaries; choice expiry, changed lifetimes and removed/new purposes; legacy metadata; unavailable/failed storage; manual preferences; cross-tab interleavings and same-time acknowledgements; real lifecycle teardown; exact material-change transitions; custom-copy preservation; policy-bound archived evidence and stale runtime notices. Separate host tests cover self-hosted example runtime and script-free legal routes.

Independent review found and fixed legacy dismissal migration and enum coercion. Twelve focused tests pass, including recalculated notice hashes with mismatched archived policies and evidence-driven fresh-choice requests under suppression.

Actual browser checks: rejection followed by the simulated next day remained quiet with all permissions off and zero service starts. An exact declared transition displayed its change information and asked again. “Not now” acknowledged the new revision without changing choices; advancing to its six-month boundary enabled solicitation while permissions stayed off. Manual preferences remained reachable. Console errors were absent. Midnight layouts at 390px and 320px had equal scroll/client widths; time controls wrap rather than overlap.

Screenshots: [desktop rule panels](../assets/screenshots/regional-prompts-desktop.jpg), [midnight mobile](../assets/screenshots/regional-prompts-mobile.jpg), [320px change notice](../assets/screenshots/regional-prompts-change-mobile.jpg). At 320px the clock controls stack at full card width; the change notice retains its explanation and visible balanced actions. Deliberate preferences opening exposes the same explanation and unchecked purposes; Escape restores focus without granting or acknowledging a choice.

Final `npm run check` passed 228 package tests, 25 site tests, catalog validation, website generation and the Worker deployment dry-run. Actual local Worker integration checks also passed for the light/dark laboratory and policy module, script-free legal routes and existing SQLite-backed evidence/history workflows. No remote deployment was performed.

The mechanism measures a conservative floor from a deliberate withholding/dismissal action, not observed banner presentation. No overall regional support, legal review, complete browser matrix or authenticated event assertion is implied.
