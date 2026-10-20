# Scope guards

Scope guards keep declared child-data, sensitive-data, high-risk-profiling and specialized sector contexts from being enabled through the generic optional-service runtime. They describe the operator's processing assessment, never a visitor's age, health or identity. They do not implement the separate authorization or operational workflows those contexts may need.

Static privacy/cookie/terms pages, collection information, ordinary terms agreement, rejection, withdrawal and processing opt-outs remain available. The guard applies to optional services registered with the consent controller; it cannot stop unregistered scripts, server processing or a host's other code.

[REQ-PRODUCT-SCOPE-GUARDS](requirements/README.md#req-product-scope-guards) tracks this mechanism. Broader legal workflows and review remain partial. [Try the laboratory](http://127.0.0.1:4179/scope-guards/) or its [midnight version](http://127.0.0.1:4179/dark/scope-guards/).

## Declare the context

```ts
scopeGuards: {
  version: 1,
  revision: 'processing-assessment-2026-10-18',
  site: {
    children: 'absent',
    sensitiveData: 'absent',
    highRiskProfiling: 'absent',
    regulatedSector: 'absent',
  },
  purposes: [{
    id: 'specialized-suggestions',
    facts: {sensitiveData: 'present'},
  }],
}
```

Each fact is `absent`, `present` or `unknown`. All four site facts are required. Purpose entries can add restrictions; they cannot relax a restrictive site declaration. When two declarations differ, `present` takes precedence over `unknown`, and both take precedence over `absent`. Service eligibility requires every purpose to be available as well as normally permitted.

These fields are public configuration. Keep assessment reasoning, supporting evidence and business details in the private setup report or `private` metadata; no narrative or override field is accepted in `scopeGuards`.

Advance `revision` to a new, never-reused value whenever the assessment changes, including when a restricted or unknown context is resolved. The normalized facts and revision enter material consent scope, so old grants do not activate the revised context. A site-wide revision affects all managed purposes. Do not delete the policy or reuse an earlier revision to resolve a restriction; maintain an explicit new declaration. Still-current refusals and withdrawals remain respected.

An `absent` declaration is an operator fact, not legal clearance or permission. Normal consent, required evidence, GPC and processing restrictions still apply. The toolkit does not derive declarations from country, contract audience, data-category text, vendor names, discovery observations or a document's reviewed flag.

## Behavior at each boundary

| Boundary | Behavior |
| --- | --- |
| Config validation | Malformed facts, unknown fields, duplicate/unknown purpose IDs and oversized revisions fail. Valid restrictive declarations produce warnings and remain usable for static compilation. |
| Legacy config | Missing declarations preserve existing behavior, with an explicit `unassessed-scope` warning and `unassessed` decision. There is no implied assessment. |
| New starter | All four facts begin as `unknown`. |
| Effective permission | `present` and `unknown` block affected optional purposes and any service using them, including stored grants and queued starts. |
| Granular choice | A `true` choice for a blocked purpose throws `ScopeGuardError` before local persistence or transport. Explicit rejection remains available. |
| `acceptAll()` | Enables available purposes and leaves blocked ones false, using a `save` command for a mixed selection. With no available purpose it returns `{persisted:false}` and records nothing; it does not invent a refusal. |
| Default controls | Unavailable purposes are disabled and explained. A mixed notice says “Allow available”. With every optional purpose blocked, there is no automatic permission prompt. Preferences remain manually reachable. |
| Required evidence | Exact guard facts are bound into the archived notice scope. CF independently rejects a new blocked-purpose grant against that archive with `scope-restricted`; browser declarations alone cannot authorize it. |
| Historical evidence | Prior receipts remain historical and inspectable. Refusal/withdrawal can still use a known older notice. The backoffice distinguishes values held off by the guard from a reported decline. |

There is no `reviewed:true`, host boolean, preview option or generic checkbox that unlocks these contexts. A genuinely specialized implementation must be designed and reviewed separately. The guard itself is cooperative integration tooling, not a security boundary against an operator who removes it or bypasses the toolkit.

## Explain the result

```ts
import {evaluateScopeGuards, ScopeGuardError} from '@notabenda/core';

const result = evaluateScopeGuards(publicConfig);
// status: unassessed | restricted | no-declared-restrictions
// blockedPurposeIds / blockedServiceIds
// purposeRestrictions: fact, declared value, source path and requirement IDs
// coverage: registered-optional-services
```

`consent.getSnapshot().scopeGuards` returns the same detached decision. Snapshot reads are pure. React's bridge exposes an immutable version and keeps SSR permissions off. The API never returns a result called safe, compliant or consent-satisfied.

The declaration applies to a configured processing context, not a per-person age decision. If the host has separately assessed contexts, resolve them through its trusted application design; never use this policy as an age screen or collect identity material merely to populate a generic banner.

## Setup and revisions

The CLI wizard and admin setup UI ask about children, sensitive information, high-risk profiling and specialized sector workflows. Current questionnaire revision 3 accepts revision-1/2/3 private reports; missing later questions stay unresolved. Revision 2 introduced these specialized-scope declarations.

New drafts translate explicit answers into declarations, without putting their private justifications into public config. Imported `present` or `unknown` restrictions cannot be relaxed by a contradictory answer. Existing purpose restrictions are preserved. Changes remain draft recommendations requiring explicit review and a new material revision before publication. The wizard does not activate runtime features or decide legal applicability.

## Connected research

The catalog separates these support boundaries from the underlying obligations:

- [COPPA parental-consent rules](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm), particularly §312.5(a), require a separate analysis and, where applicable, verifiable parental consent. `REQ-US-COPPA-SCOPE` remains partial; no parental-verification flow is implemented.
- [Virginia's statute](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/) addresses applicable sensitive-data consent in §59.1-578(A)(5) and rights appeals in §59.1-577(C). The guard implements neither an appeal process nor specialized consent; `REQ-US-VA-RIGHTS` remains partial.
- [Canadian OPC advertising guidance](https://www.priv.gc.ca/en/privacy-topics/technology/online-privacy-tracking-cookies/tracking-and-ads/gl_ba_1112/) makes opt-out suitability conditional and discusses sensitivity and children. `REQ-CA-OBA` stays partial; the guard does not implement a Canadian opt-out profile.
- [FDPIC's clarification](https://www.edoeb.admin.ch/en/cookie-guidelines-updated-version) links certain advertising and location contexts to high-risk profiling considerations. `REQ-CH-PROFILING` stays partial; software does not classify legal risk from a cookie label.
- [OAIC pixel guidance](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations) addresses sensitive-information and tracking obligations. `REQ-AU-PIXELS` stays partial; blocking registered optional work is only one engineering measure.

`regulatedSector` is a broad product support boundary, not an exhaustive sector-law rule pack. All these legal requirements remain unreviewed. [Verification](verification/scope-guards.md) records actual checks and remaining limits.
