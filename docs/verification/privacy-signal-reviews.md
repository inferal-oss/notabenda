# Texas, Oregon and Minnesota signal review

Checked 20 October 2026. Requirements: [REQ-US-OR-GPC](../requirements/README.md#req-us-or-gpc) and [REQ-US-MN-GPC](../requirements/README.md#req-us-mn-gpc). Both remain partial and legally unreviewed. The 22 October addition covers [REQ-US-TX-AGENT-SIGNALS](../requirements/README.md#req-us-tx-agent-signals), also partial and legally unreviewed.

`packages/notabenda/test/privacy-signal-reviews.test.mjs` exercises:

- Requirement/source/date consistency, primary-source access status and detached agent metadata.
- Explicit market interest and imported jurisdiction labels, including a conflicting “no” answer, without changing the current configuration or enabling GPC.
- Preservation of existing policy and historical questionnaire answers; advice is regenerated without rewriting the original report.
- Installed CLI reference/wizard parity, private-note isolation and browser setup presentation in JSDOM.
- Existing browser-controller gating and server header helpers with an explicit sale/targeted-advertising policy, no login or receipt transport, and a separate eligible service.
- Signal absence granting nothing and preserving a separately stored restriction, using the synthetic Cloudflare storage implementation.

Run after building the packages:

```sh
node --test packages/notabenda/test/privacy-signal-reviews.test.mjs packages/notabenda/test/privacy-signals.test.mjs packages/notabenda/test/processing.test.mjs
python3 scripts/regulatory.py --check
```

These checks establish the described mechanisms and advisory boundaries. The synthetic producer test is not an integration with an advertising provider. JSDOM does not establish real-browser or accessibility acceptance. Earlier [browser observations](privacy-signals-browser.md) remain separately scoped; no new manual jurisdiction test is implied.

Current consolidated Oregon text was inaccessible (HTTP 403). The catalog records that source gap separately from the readable DOJ guidance. Minnesota research uses current section 325M.14 and its effective-date note. Controller applicability, recognized-mechanism criteria, public placement, account associations, actual downstream enforcement, retention, exceptions and legal review remain deployment work. The reviewed sources do not establish full state-law coverage.

### Texas addition

The selected current chapter was read in the browser, including its consolidation banner; the enacted Act supplies the distinct subsection (e) commencement. The secondary explainer is a discovery reference only. Tests check the complete generated advice, including shared host checks, so toolkit login dependencies cannot become an apparent Texas authentication exemption. They also check the market option, primary-source/locator/date links, preservation of a declared-no answer, and absence of policy activation from a Texas label alone. Generic producer tests demonstrate the explicit mechanism rather than Texas legal qualification.

Observed Texas integration verification: all 1,406 package tests and 214 site tests passed, with the Worker dry run and offline package-content check. All 18 measured visitor browser profiles were unchanged, as were all 420 retained artifact files.

A local Chromium check selected Processing opt-outs and Texas, prepared the draft, opened the recommendation and all review notes, and followed the exact Texas guide anchor. Reload restored the saved answers while regenerating current advice, including commercially reasonable effort and the separate toolkit/authentication boundary. This checks the research handoff and navigation; it is not a Texas mechanism-qualification, legal, real-provider, mobile or complete accessibility acceptance test.

A subsequent native desktop Safari check on the deployed site selected Processing opt-outs and Texas, opened the scoped review, reloaded the page and followed the restored review’s direct guide link. The selected pack and market advice survived reload. The Texas guide showed the qualification boundary and primary-source links. The general integration checklist was then corrected to include Texas alongside Oregon and Minnesota. Browser version and CSS viewport were not independently established; this observation does not establish mobile or assistive-technology acceptance.
