# Oregon and Minnesota signal review

Checked 20 October 2026. Requirements: [REQ-US-OR-GPC](../requirements/README.md#req-us-or-gpc) and [REQ-US-MN-GPC](../requirements/README.md#req-us-mn-gpc). Both remain partial and legally unreviewed.

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
