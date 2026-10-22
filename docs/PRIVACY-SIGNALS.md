# Global Privacy Control and service restrictions

This preview can apply an operator-declared Global Privacy Control (GPC) policy to registered services. It keeps **device-access cookie permission** separate from **restrictions on sale, sharing or targeted advertising**. A cookie grant does not cancel a signal restriction.

This is a runtime mechanism, not a complete US privacy workflow or a reviewed jurisdiction pack. The host decides applicable law, classifies processing, retains and propagates account/profile opt-outs, and governs downstream processing. There is no automatic location inference, sensitive-data permission, loyalty-program exception or re-opt-in workflow.

## Declare the policy and every service

```js
config.privacySignals = {
  globalPrivacyControl: {
    appliesTo: ['sale', 'sharing', 'targeted-advertising'],
    explanation: 'Supply your reviewed explanation of how this site processes GPC, including account and downstream handling.',
  },
};

// Explicitly classify all services, including services with no listed activity.
config.services = [
  {...yourAdvertisingService, processingActivities: ['sharing', 'targeted-advertising']},
  {...yourLocalToolsService, processingActivities: []},
];
```

The activity names are classifications supplied by the operator, not a vendor detection result. With the policy enabled, validation rejects unclassified services and unknown activity names. The public projection retains these fields, and changing a service's classification changes its material consent scope. Declare necessary preference storage as usual; enabling this feature adds no separate browser storage key.

`appliesTo` is a host policy, not a legal conclusion. For example, the catalog distinguishes California sale/sharing from Colorado sale/targeted advertising. A host may select a broader protective policy. The toolkit does not choose policy by IP address, language, browser signal or the `jurisdictions` label.

Generated privacy documents include the supplied explanation as an escaped section. Supplied/Markdown/MDX policies must carry their own appropriate text; enabling a runtime option does not edit authored policies. Production review checks still apply. Do not claim account-wide handling unless the host actually implements it.

## Browser runtime

```js
import {createConsent, mountControls} from '@notabenda/core';
const consent = createConsent(publicConfig);
mountControls(document.querySelector('#privacy-controls'), {consent});

consent.registerService('your-advertising-service', {
  purposes: ['your-cookie-purpose'],
  start({signal}) {
    // Start only here. Subscribe to signal immediately and return real cleanup.
    return startYourReviewedIntegration({signal});
  },
});
```

The default reader samples the boolean `navigator.globalPrivacyControl` at construction, refresh/resume and immediately before queued optional work. An observed `true` restricts any service whose declared activities intersect the policy. A missing/false value is **not observed**, never affirmative permission. A throwing or malformed reader blocks covered processing as **unavailable**. A custom `ConsentEnvironment.globalPrivacyControl` callback supports explicit platform/test adapters; missing callbacks use the browser reader.

Once `true` is observed, it remains effective for that controller's lifetime. Later false, missing or failing reads cannot reverse it. A newly observed restriction aborts active/pending restricted generations, including while cleanup is unresolved. Other eligible services can continue. Cookie accept-all, granular saving and late evidence acknowledgments do not bypass it, and the signal never fabricates a cookie rejection or an evidence event.

Cookie state and effective eligibility are distinct:

| API | Meaning |
| --- | --- |
| `snapshot.purposes[id]` | Saved cookie-choice state |
| `snapshot.permissions[id]` | Effective cookie-purpose permission, including required receipts |
| `snapshot.servicePermissions[id]` | Cookie permission **and** independent service processing restrictions |
| `snapshot.services[id]` | Registered runtime phase, such as blocked, starting or active |
| `snapshot.privacySignals` | Current signal observation and declared restricted activities/services |
| `isServiceAllowed(id)` | Effectful current eligibility check; unknown services never pass |

Snapshot reads are pure; they do not sample the browser or refresh evidence. Use lifecycle registration for actual optional work. `isServiceAllowed` can refresh local state/sample signals and must not run during framework rendering. The [media adapter](EMBEDS.md) uses service eligibility rather than a cookie purpose alone. React provides `useServiceAllowed(serviceId)` for a pure UI projection; `usePurposeAllowed` continues to describe cookie-purpose permission. Both render conservatively during SSR/hydration.

The native controls explain an active/unavailable signal restriction while preserving the saved cookie selection. If every service associated with an unresolved purpose is restricted, that purpose does not cause an unsolicited cookie notice. The persistent preferences control remains available. This does not hide unrelated notices or turn a restriction into permission.

## Server and edge boundary

```js
import {hasGlobalPrivacyControl, getPrivacySignalRestrictions, createConsent} from '@notabenda/core';

const observed = hasGlobalPrivacyControl(request);
const restrictions = getPrivacySignalRestrictions(publicConfig, {
  globalPrivacyControl: observed,
});
if (restrictions && Object.hasOwn(restrictions.restrictedServices, 'your-advertising-service')) {
  // Apply restrictions in this trusted request's actual processing workflow.
}

// Pass a host observation into the browser controller before registration.
const consent = createConsent(publicConfig, undefined, {
  globalPrivacyControl: observed,
});
```

The request helper handles the `Sec-GPC` field's `1` value, including combined duplicate fields under the current editor draft. Fetch can hide original field boundaries, so any comma-delimited token exactly equal to `1` is conservatively treated as observed; other values are ignored. It does not interpret Do Not Track as GPC. The pure server helper validates the configuration and returns declared restrictions; it grants nothing, authenticates nobody and writes no account record. Server-rendered configuration must use the public projection and avoid embedding private request/account details.

A host-observed true combines with browser true; supplying false never cancels the browser signal. The host must process the HTTP header before any server tracking, bind a known consumer/profile using its own trusted identity, retain applicable opt-outs and propagate them to processors, account settings and downstream jobs. Do not wait for client hydration to restrict server work.

The controller's latch is **not** durable opt-out retention. A new controller with no observed signal does not recover a former signal from a new tracking identifier or invent an account binding. It may recover a still-valid cookie grant independently. The host must preserve applicable prior account/profile opt-outs and enforce them in addition to this browser mechanism. Removing a signal, clearing storage or a generic cookie acceptance must not be used as a re-opt-in workflow. This package does not automatically publish `/.well-known/gpc.json`, which would make an origin-wide support assertion beyond this preview's scope.

## Source-linked scope

The catalog records separate jurisdiction items, all still **partial and legally unreviewed**:

- [California §7025](https://www.cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf), pp. 44–48, covers qualifying signals, conflicts, associated profiles/known consumers, status display and prior opt-outs. The browser gate and status implement only part of that workflow. [REQ-US-CA-GPC](requirements/README.md#req-us-ca-gpc).
- [Colorado's current recognized-mechanism guidance](https://coag.gov/opt-out/) identifies GPC for covered sale/targeted-advertising opt-outs and calls for a privacy-policy explanation. Thresholds, actual processing and downstream compliance remain separate. [REQ-US-CO-GPC](requirements/README.md#req-us-co-gpc).
- [Connecticut's official FAQs](https://portal.ct.gov/en/ag/sections/privacy/the-connecticut-data-privacy-act) address qualifying signals and conflicts with previous choices. Residency and the rest of the controller's obligations are not inferred here. [REQ-US-CT-GPC](requirements/README.md#req-us-ct-gpc).
- [Oregon DOJ's business FAQs](https://www.doj.state.or.us/consumer-protection/for-businesses/privacy-law-faqs-for-businesses/) and [January 2026 announcement](https://www.doj.state.or.us/media-home/news-media-releases/oregon-doj-highlights-new-universal-opt-out-tool-on-data-privacy-day/) identify mandatory universal opt-outs from 1 January 2026. Review sale/targeted-advertising flows and a clear public opt-out route. Cookie controls alone may be insufficient. Current consolidated statute access was blocked; separate child/geolocation prohibitions and applicability still need review. [REQ-US-OR-GPC](requirements/README.md#req-us-or-gpc).
- [Minnesota §325M.14](https://www.revisor.mn.gov/statutes/cite/325M.14), subdivisions 3 and 4(h), addresses signal criteria, conflicts and opt-out authentication. Its general commencement is 31 July 2025, with a later date for specified postsecondary institutions. Assess scope and the recognition route separately. [REQ-US-MN-GPC](requirements/README.md#req-us-mn-gpc).

Protocol parsing follows the current [W3C editor draft](https://w3c.github.io/gpc/), including boolean browser observation and header handling. That living draft is recorded separately from legal sources. Older implementation examples are not treated as current legal rules.

Run `npm run dev` and open the [fictional demonstration](http://127.0.0.1:4178/privacy-signals). Its explicit simulation adds a fixture signal in the demo URL without changing browser settings. Both optional integrations make first-party sample requests only. The [verification record](verification/privacy-signals-browser.md) distinguishes simulated browser flows from automated navigator/header and ledger tests.

For explicit manual actions or host-retained restrictions, see [recorded processing opt-outs](PROCESSING-CHOICES.md). Its controller composes with GPC in service eligibility, but the GPC reader does not automatically submit a persistent opt-out. The host must observe, bind and record the applicable source and propagate it to associated contexts.

## Setup and agent handoff

Selecting Texas, Oregon or Minnesota in setup, or reviewing an inventory that already lists `US-TX`, `US-OR` or `US-MN`, adds a regional review. It leaves `jurisdictions`, `privacySignals` and service classifications unchanged. Even an answer of “no” to the signal question does not suppress a selected market's review. Resolve that assessment explicitly.

```sh
npx @notabenda/core describe processing-opt-outs --json
```

The installed reference's `privacySignalReviews` contains the research revision, check dates, selected effective dates, requirement/source IDs, activity mappings, applicability questions and host checks. These are advisory metadata, outside `SiteConfig`. They are not jurisdiction presets or a freshness guarantee. The mechanism’s login/storage booleans describe toolkit dependencies, not legal authentication rules. The questionnaire remains version 8; these additional market choices and independently versioned research do not change existing questions or answers. Resuming an old report preserves its answers and regenerates advice from the installed version. Keep the original report when its historical advice matters.

For a site assessment:

1. Establish actual applicability, processing and the public opt-out route. Use [project discovery](DISCOVERY.md) to find additional integrations; matches still require review.
2. Explicitly choose policy activities and classify every service. Do not copy California's `sharing` category into another state's policy solely from a press release's wording.
3. Apply the header helper before server producers run, and connect the browser controller before optional client producers. The configured toolkit restriction path runs independently of login and receipt storage; host request qualification remains separate. The authenticated cookie-evidence example is a separate integration.
4. Preserve independent account/downstream restrictions when no signal is present. Test actual provider calls, exports and associated accounts; a browser status or saved receipt is insufficient.
5. Test cookie accept-all while GPC is active, reload with existing restrictions, and backend failure. Cookie acceptance cannot remove the restriction. Minnesota's separate conflicting-settings confirmation provision is not implemented as re-opt-in.

The [verification record](verification/privacy-signal-reviews.md) describes automated synthetic checks and the remaining legal and deployment work.

## Texas: agent requests through technology

Checked 22 October 2026. [REQ-US-TX-AGENT-SIGNALS](requirements/README.md#req-us-tx-agent-signals) remains partial and legally unreviewed.

Texas allows technology-designated agents for sale and targeted-advertising opt-outs. Section 541.055(e) has its own **1 January 2025** commencement in [HB 4, section 7](https://capitol.texas.gov/tlodocs/88R/billtext/html/HB00004F.htm); the general Act began in July 2024.

The [current chapter](https://statutes.capitol.texas.gov/?artSec=541.055&chapter=BC.541&code=BC&tab=1) ties the agent route to commercially reasonable verification efforts and exceptions. Its technology criteria also require affirmative non-default choice and usability. A GPC value does not establish those facts.

Selecting Texas adds review tasks to setup and `describe` output. It changes no service classification or policy. After assessing applicability and the actual mechanism, an operator can explicitly use the existing `sale`/`targeted-advertising` restrictions. These toolkit calls run without login; that is not a legal finding about request authentication. The host still handles qualification and associated account/downstream restrictions. The [Attorney General’s overview](https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights/texas-data-privacy-and-security-act) also identifies separate notice and request-handling work.

No GPC approval, residency detector or agent-verification service is included. Profiling, sensitive/child data, appeals and complete Texas coverage remain separate.
