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
import {createConsent, mountControls} from 'notabenda';
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
import {hasGlobalPrivacyControl, getPrivacySignalRestrictions, createConsent} from 'notabenda';

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

The initial research connects three separate items, all still **partial and legally unreviewed**:

- [California §7025](https://www.cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf), pp. 44–48, covers qualifying signals, conflicts, associated profiles/known consumers, status display and prior opt-outs. The browser gate and status implement only part of that workflow. [REQ-US-CA-GPC](requirements/README.md#req-us-ca-gpc).
- [Colorado's current recognized-mechanism guidance](https://coag.gov/opt-out/) identifies GPC for covered sale/targeted-advertising opt-outs and calls for a privacy-policy explanation. Thresholds, actual processing and downstream compliance remain separate. [REQ-US-CO-GPC](requirements/README.md#req-us-co-gpc).
- [Connecticut's official FAQs](https://portal.ct.gov/en/ag/sections/privacy/the-connecticut-data-privacy-act) address qualifying signals and conflicts with previous choices. Residency and the rest of the controller's obligations are not inferred here. [REQ-US-CT-GPC](requirements/README.md#req-us-ct-gpc).

Protocol parsing follows the current [W3C editor draft](https://w3c.github.io/gpc/), including boolean browser observation and header handling. That living draft is recorded separately from legal sources. Older implementation examples are not treated as current legal rules.

Run `npm run dev` and open the [fictional demonstration](http://127.0.0.1:4178/privacy-signals). Its explicit simulation adds a fixture signal in the demo URL without changing browser settings. Both optional integrations make first-party sample requests only. The [verification record](verification/privacy-signals-browser.md) distinguishes simulated browser flows from automated navigator/header and ledger tests.

For explicit manual actions or host-retained restrictions, see [recorded processing opt-outs](PROCESSING-CHOICES.md). Its controller composes with GPC in service eligibility, but the GPC reader does not automatically submit a persistent opt-out. The host must observe, bind and record the applicable source and propagate it to associated contexts.
