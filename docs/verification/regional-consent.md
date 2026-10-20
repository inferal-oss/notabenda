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

Tests: the `IE` and declaration cases in the same file. `VERIFY-IE-DEVICE` remains partial: these are shared-engine cases, not a complete Irish profile. The DPC note's remembered-consent duration guidance is tracked separately by `REQ-IE-CONSENT-DURATION`; its opt-in default cap is described below. No Italian repeat-prompt interval is selected by these scenarios.

## Ireland: a separate calendar grant cap

The explicit `ie-dpc-six-month-default` grant-expiry policy uses the earlier of the configured day lifetime and six UTC calendar months, with month-end clamping. This follows the default in the DPC note; case-specific longer-period qualification remains open. No market or locale selects the policy automatically.

[grant-expiry.test.mjs](../../packages/notabenda/test/grant-expiry.test.mjs) checks month ends, leap years, shorter lifetimes, exact timer-driven shutdown and reload, policy addition/removal without resurrecting positive grants, preserved refusals, failed local migration, and expired permissions while Italian solicitation remains suppressed. Both controller profiles exercise these behaviors. Required-evidence cases cover saved-command reload and rejection of a day-only acknowledgement. Cloudflare cases verify archive binding, client/server time anchoring and immutable historical retries after a new notice is activated.

The policy implementation is shared by the [browser](../../packages/notabenda/src/grant-expiry-policy.ts) and generated standalone Cloudflare copy. Notices, scopes, saved commands and CF registration bind it independently. The setup scenarios run the actual CLI and admin UI and verify that private notes do not enter the public configuration or activate the policy.

The local Chromium timing lab was also exercised in light and dark themes and at 320px and 390px. Selecting the cap, granting both purposes and advancing from 31 August to 28 February produced two starts, two stops and no remaining optional permissions. Its clock and effects are simulated; it makes no vendor requests.

These tests exercise synthetic service lifecycles and in-memory transactional stores. They do not establish real vendor shutdown, durable browser writes during failure, physical-device timing or legal qualification. A justified-extension workflow and a complete reviewed Irish profile remain open; `VERIFY-IE-CONSENT-DURATION` stays partial.

## Brazil: cookie choices and information

The [ANPD guide, version 1.0, October 2022](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf/@@display-file/file), printed pp. 30–33, recommends visible rejection on both layers, purpose-specific choices off initially, a rights entry and browser-control information. These are guidance items; they do not select a legal basis for every cookie. The [vendor article](https://www.iubenda.com/en/help/104366-brazil-new-cookie-requirements/) was used for discovery, with the final regulator document as the substantive source.

The actual bundled [Portuguese client](/localization/) has two independent optional services: a local reading suggestion and a session reading counter. Tests execute that bundle with its compiled descriptor, checking initial state, direct rejection on both layers, unsaved drafts, individual grants, reload, withdrawal, exact session-marker removal and failed preference persistence. The rights destination resolves to the example policy's rights section; browser guidance starts collapsed and opening it changes no choice. Help links use official Chrome and Firefox documentation; the example explains limits for its local/session storage.

[consent-information.test.mjs](../../packages/notabenda/test/consent-information.test.mjs) checks both controller profiles, public/runtime/notice parity, unsafe/malformed/private/oversized input, independent scope identity and refusal of mismatched evidence copy. The standalone CF test rejects rehashed forgeries against the archive, stores a real choice and inspects its retained information through the authorized admin. Setup recommends the fields while preserving imported facts and leaving activation to the host.

[br-cookie-ui.test.mjs](../../site/test/br-cookie-ui.test.mjs) runs the bundled client against DOM/storage fixtures. Chromium inspection supplements those assertions with desktop/mobile layout and native disclosure behavior. These tests do not establish actual rights fulfillment, browser-wide blocking, remote help-page contents, legally reviewed Portuguese wording or a complete Brazilian pack. The supplied example remains a draft. The earlier public Portuguese artifacts are explicit retained build inputs.

## What the checks establish

The probes observe registered callback starts, synthetic markers, abort/cleanup and effective permissions. They use no real vendor and are not browser network-interception tests. They do not establish the legality of a claimed exception, the adequacy of supplied disclosures, actual vendor teardown, processing outside the controller, a translation or a complete country pack. The cited primary sources were retrieved on 19 October 2026. The linked Irish statute was not retrieved in this pass, so a current statutory-consolidation check and legal review remain open.

Run the scenarios after building:

```sh
npm run build
node --test packages/notabenda/test/regional-consent.test.mjs \
  packages/notabenda/test/grant-expiry.test.mjs
node --test packages/notabenda/test/consent-information.test.mjs
node site/build.mjs
node --test site/test/br-cookie-ui.test.mjs
```
