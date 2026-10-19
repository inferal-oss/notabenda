# Regional consent baseline checks

`REQ-FR-SCOPE`, `REQ-DE-DEVICE` and `REQ-IE-DEVICE` now have scenarios against both the full-configuration controller and the compiled browser controller. The host explicitly declares applicability. These checks exercise the shared engine; they do not select a country from language, location or vendor identity.

## France: added and changed purposes

The [CNIL tracker guidance](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi) calls for prior permission for covered trackers and a new choice when another consent-requiring purpose is added. Its exemption discussion is conditional.

The scenarios start with a measurement grant, add a distinct advertising purpose, then register both lifecycles. The measurement grant remains scoped to its original facts; advertising creates no effect until explicitly allowed. Opening, closing or dismissing controls cannot grant the added purpose. Separate cases preserve choices across presentation-only edits, invalidate a grant when its purpose description changes, and keep a refusal after that change.

Code: `consentScopes` in [consent-notice.ts](../../packages/notabenda/src/consent-notice.ts), with the shared [state engine](../../packages/notabenda/src/consent-engine.ts). Tests: [regional-consent.test.mjs](../../packages/notabenda/test/regional-consent.test.mjs), the `FR` cases. This verifies `VERIFY-FR-SCOPE`; exemption qualification and a complete reviewed French profile remain open.

## Germany: declared storage conditions

[Section 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html) distinguishes prior informed permission from the transmission-only and expressly requested-service exceptions.

A missing `necessityReason` now identifies `REQ-DE-DEVICE` when Germany is explicitly declared and asks for the underlying condition. This validates an explanation's presence, not its legal sufficiency. Relabeling storage as necessary does not start a consent-managed advertising service. Removing that service from the consent scope makes lifecycle registration fail; accepting other purposes does not authorize it.

Code: [configuration diagnostics](../../packages/notabenda/src/config.ts) and the shared state engine. Tests: the `DE` cases in the same test file. `VERIFY-DE-DEVICE` remains partial because actual qualification and integration review are outside those assertions. Code loaded directly by the host can bypass a cooperative lifecycle and needs its own inspection.

## Ireland: optional first-party measurement

The [DPC guidance page](https://www.dataprotection.ie/en/dpc-guidance/guidance-cookies-and-other-tracking-technologies), its [linked April 2020 note](https://www.dataprotection.ie/sites/default/files/uploads/2020-04/Guidance%20note%20on%20cookies%20and%20other%20tracking%20technologies.pdf) and [analytics answer](https://www.dataprotection.ie/en/faqs/cookies/do-i-need-consent-analytics-cookies) distinguish the narrow exceptions from ordinary analytics. Calling a service first-party does not itself exempt it.

The scenarios keep optional measurement inert through dismissal and preference-panel navigation. An explicit purpose choice starts it; withdrawal stops it. A service using both measurement and advertising requires both choices and stops when either is withdrawn. A missing necessity explanation identifies `REQ-IE-DEVICE` when Ireland is declared.

Tests: the `IE` and declaration cases in the same file. `VERIFY-IE-DEVICE` remains partial: these are shared-engine cases, not a complete Irish profile. The DPC note's remembered-consent duration guidance is recorded separately as `REQ-IE-CONSENT-DURATION`; the existing day-based configuration does not implement that assessment. No Italian repeat-prompt interval is selected by these scenarios.

## What the checks establish

The probes observe registered callback starts, synthetic markers, abort/cleanup and effective permissions. They use no real vendor and are not browser network-interception tests. They do not establish the legality of a claimed exception, the adequacy of supplied disclosures, actual vendor teardown, processing outside the controller, a translation or a complete country pack. The cited primary sources were retrieved on 19 October 2026. The linked Irish statute was not retrieved in this pass, so a current statutory-consolidation check and legal review remain open.

Run the scenarios after building:

```sh
npm run build
node --test packages/notabenda/test/regional-consent.test.mjs
```
