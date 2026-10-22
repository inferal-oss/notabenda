# Terms-agreement browser verification

18 October 2026. Manual Chromium checks of the fictional local example; not a cross-browser suite, accessibility audit or legal review.

Requirements exercised: `REQ-PRODUCT-TERMS-ACCEPTANCE`, `REQ-PRODUCT-MOBILE`, and `REQ-PRODUCT-A11Y`. The product interaction is implemented; broader mobile/accessibility requirements remain partial. Transaction, receipt, failure, scope and idempotency tests live in `packages/notabenda/test/terms.test.mjs`.

## Observed

The default visuals have since been refreshed. The same acknowledged agreement path was rechecked; current screenshots show the refreshed theme. See [website and design verification](website-browser.md) for shared layout changes and remaining accessibility checks.

- On `/agreement`, the native checkbox starts unchecked, the action is disabled, active focus remains on `BODY`, and no dialog is open. The statement, document version, effective date and draft warning are visible. The entire agreement stays inline in normal page flow.
- At 390×844, the document client width and scroll width are both 375 CSS pixels. At 320×700 in the alternate theme they are both 305; the action remains within the card. At 430×900 the alternate theme remains readable and the native label/control wrap without horizontal overflow.
- Checking explicitly enables the action. Submission shows a matching recorded-version status after the local backend acknowledges the event. On the alternate theme, Space checks the native checkbox, Tab reaches the action, and Enter submits; the recorded-version status appears.
- The version link targets `/artifacts/ARTIFACT_ID/terms.html`. Following its contents navigation keeps that artifact path and adds the section fragment, rather than navigating to the mutable terms route.
- Agreement search finds the synthetic record with both operation and document-version words. Its detail view shows exact statement/action wording, scope/operation, document digests, server time and provenance. At 390×844 the detail view has no horizontal page overflow. At 1280×1000 it presents a readable context card with supporting evidence below.
- Returning to the cookie-controls example after the agreement keeps both synthetic optional services off and its initiated-request count at zero. No cookie-grant action is part of the agreement flow. This is a visible sample check, not network/storage capture of arbitrary host scripts.

Screenshots: [unchecked mobile default](../assets/screenshots/terms-mobile.jpg), [acknowledged alternate theme](../assets/screenshots/terms-dark-mobile.jpg), [agreement evidence](../assets/screenshots/terms-evidence-desktop.jpg).

## Reproduce and limits

Run `npm run dev`; visit `/agreement` or `/dark/agreement`, explicitly check and submit, then follow the record-inspection link. The current website host uses a browser-session demo Durable Object with seeded records and one-day idle cleanup. It requires explicit preview opt-in. Run `npm run site:dev` to exercise that host; the lightweight `npm run dev` preview is a separate local adapter. These checks do not establish production contract validity or the adopter’s operational safeguards.

Still required: broader Safari/Firefox and physical mobile coverage, screen-reader/live-region review, complete keyboard handling across all states, 200–400% zoom/large text, translations/RTL/forced-colors/contrast, interrupted navigation/BFCache, real network failures, host authentication/CSRF/rate limiting, and production pinned-version retention/hosting. The selected native Safari checks below do not complete those areas. Automated tests cover lost acknowledgments, stale offers, server failures and destroy/late-ack behavior separately.

## 19 October: document, acceptance and operator layouts

Requirements: **REQ-PRODUCT-DOCUMENTS**, **REQ-PRODUCT-TERMS-ACCEPTANCE**, **REQ-PRODUCT-CF-ADMIN**, **REQ-PRODUCT-MOBILE**, **REQ-PRODUCT-A11Y**.

The refreshed reader uses a separate contents rail in a sufficiently wide full-page container. Narrow/embedded documents keep contents above the text. The MD/MDX body is included in the reading column. This is CSS presentation; the legal renderer and pinned HTML bytes are unchanged.

The acceptance component groups a document link, visible version/effective date and new-tab description above the native unchecked statement. The exact supplied statement and action label are retained. Chrome at 390 × 844 showed a 44.9px action, matching document/client widths of 375px, an initially disabled action and no preselection. A sample submission showed the recorded-version status only after a host receipt. Light and midnight layouts were inspected. At 320 × 740, the midnight terms reader retained 16px body text and matched 305px client/scroll widths.

The operator list removes repeated subject/site facts from each row while keeping person/operation, document version, received time and a statement preview. Detail puts the full statement and action wording beside document facts; hashes, IDs, optional retained facts and complete stored JSON remain available. The narrow list uses 44px record links and keeps 305px page width. Mobile search now gives the input its own full-width row.

Automated DOM/controller coverage checks the pinned document, accessible new-tab description, exact wording, native check, pending disabled controls and matching-receipt status. Operator projection tests cover exact multiline and hostile wording, absent fields, retained references and no executable stored URL. Existing authorization, storage, idempotency and receipt tests remain in place. Physical devices, other engines, assistive technology, forced colours and large-text acceptance remain separate work.

Current desktop previews: [document reader](../assets/screenshots/legal-reader-desktop.jpg), [acceptance flow](../assets/screenshots/agreement-redesign-desktop.jpg), [agreement list](../assets/screenshots/admin-agreements-desktop.jpg) and [agreement detail](../assets/screenshots/admin-agreement-detail-desktop.jpg). The viewport override was reset after inspection.

## 22 October: native Safari reader, agreement and evidence

Requirements: **REQ-PRODUCT-TERMS-ACCEPTANCE**, **REQ-PRODUCT-A11Y**. These are desktop observations in native Safari, rather than a simulated engine or a conformance audit. The browser version and CSS viewport dimensions were not independently established. Screenshots and accessibility observations are retained privately; no session identifiers enter this report.

The hosted example was exercised in a fresh isolated demo workspace after its expired-session screen offered a new workspace. Its terms explicitly describe a fictional example that creates no real contract.

- The agreement started unchecked, with its action disabled. Option-Tab reached the pinned terms link; Return opened the reader in a separate tab. Contents navigation added a section fragment to the same artifact path.
- Returning from the reader restored focus to the terms link. Option-Tab reached the statement; Space checked it; Option-Tab reached the enabled action; Return submitted. A matching-version acknowledgment appeared, both controls were disabled, and focus moved to the status container.
- Admin search by the sample operation family and document version found one new record. Its detail showed the exact statement/action, workflow scope, version/date, artifact, hashes and host-assertion provenance. Fresh agreement navigation did not preselect or submit, and the same search still showed one matching record with unchanged time and reference.
- The separate cookie example still showed both optional sample services blocked and zero sample requests on that visit. This is a visible local-service check, not arbitrary provider network capture.

### Rejected transport and retry

The existing local accessibility fixture was built from committed package sources. At `/qa-a11y/widget.html?widget=terms`, the actual native agreement component uses an intentionally rejecting host callback. It does not contact an operational database or provider.

Keyboard submission showed the explicit unconfirmed error and focused its status container. Shift-Option-Tab reached the enabled retry action. A second submission failed again without acknowledgment. Returning to the checkbox and clearing it removed the error, disabled the action and kept focus on that checkbox. Safari keyboard preferences were unchanged; Option-Tab was used for full traversal.

The review also found a broken fixture document link: its offer referenced a compiled release that the local server did not serve. The fixture now keeps exact pinned HTML in its own generated directory. A bounded manifest exposes only those canonical reader paths through the read-only loopback server. Tests compare served bytes with the offer's HTML hash, retain ordinary public-file fallback and reject unrelated/duplicate/oversized manifests and escaping symlinks. Native Safari then opened the fixed reader and followed its contents on the same pinned path. These test releases never enter deployable site output.

Run `npm run a11y:fixture`, then `npm run a11y:serve -- --port 4188` after the normal package/site build. Open the terms widget above and make the explicit keyboard choice. This verifies callback-rejection presentation; real HTTP outages, uncertain delivery, browser retry identity, other framework views and full host acceptance remain separate work.

## HTTP receipt-loss rehearsal

<!-- @requirements REQ-PRODUCT-TERMS-ACCEPTANCE -->
The dedicated maintainer check uses the actual demo agreement transport, native field and Cloudflare recorder across real loopback HTTP:

```sh
npm run build
npm run terms:transport -- --port 4208
```

Open the printed loopback URL. Reading and checking the field send no agreement. On the first explicit submission, the recorder commits, then the server transmits HTTP headers and only part of the JSON receipt before closing the connection. The field must keep the outcome unconfirmed. Explicit retry should send the same command, recover the original receipt and leave one stored record. A separate read-only panel reports server attempt/record counts and canonical command/receipt equality; it does not change the controller's outcome.

The process uses fresh in-memory storage and fictional terms. It binds only to loopback, serves an explicit asset map and the exact pinned terms reader, and accepts bounded submissions only for its synthetic server context with matching Host/Origin/demo headers. No operational account, authentication credential or durable database is used. Four accepted attempts bound a run; restart this dedicated server for a fresh run. An occupied port is an error and no existing server is stopped. The separate accessibility server remains read-only.

Automated cases exercise an actual truncated response, the real recorder and controller, a deliberate retry, one-record preservation, a changed-command negative control, request guards, pinned HTML bytes, isolated assets and the concurrent attempt bound. They do not substitute a mocked callback error for HTTP loss. The browser fixture uses the existing demo transport; automated controller tests supply their own fetch callback.

The initial check covered same-controller explicit retry. The subsequent [reload recovery check](terms-recovery.md) uses the optional private journal to retain a key while still starting unchecked; the host continues to bind and authorize its operation and subject. Server restarts discard this fixture's data. It is not a Durable Object persistence/restart test, arbitrary network-failure simulation, provider acknowledgment test, legal review or production host acceptance.

### Native Safari observation, 22 October 2026

The desktop run used Option-Tab, Space and Return with browser preferences unchanged. Initial load and checking left both server counts at zero. The first explicit action showed the unconfirmed error and focused its status container; server observations showed one accepted attempt and one stored record. Shift-Option-Tab returned to the enabled action. Return retried, the field acknowledged its pinned version and disabled both controls, and the panel showed two attempts, one record, the same canonical command and the original receipt. Reload then started unchecked/disabled with no acknowledgment and unchanged server counts. A separate current-server read confirmed those final observations.

Screenshots and accessibility observations are retained privately. The browser version and CSS viewport were not independently established; this is selected desktop Safari evidence, not complete platform or assistive-technology acceptance. The test tab was closed and the dedicated server stopped after inspection.
