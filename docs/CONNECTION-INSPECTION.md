<!-- @requirements REQ-PRODUCT-CONNECTION-INSPECTION -->
# Inspect a consent connection

A service can be blocked because it is waiting for permission, or because its lifecycle callback was never registered. Inspect the actual controller to distinguish those cases before testing the integration.

```ts
import {inspectConsentConnection} from '@notabenda/core/consent/inspect';

const report = inspectConsentConnection(consent, {
  expected: intendedCompiledConsentDescriptor,
});
```

Pass the controller that owns your page’s services and the compiled descriptor you intended to connect. Both the compatibility and compiled consent controllers are supported. This optional browser/SSR-safe entry makes no network requests or storage writes, refreshes nothing, waits for no pending work and takes no consent action. It reads the supplied controller, including its configured host clock and existing processing/evidence snapshots. Under required evidence, the snapshot can read local choice storage to check grant freshness. It does not bypass those checks. Custom controllers or host callbacks remain trusted application code.

The returned private JSON report separates four questions:

| Question | Observation |
| --- | --- |
| Is the intended configuration running? | `configuration.comparison` compares the normalized selected consent inventory, with differing top-level sections. Omit `expected` to leave this comparison explicitly unrequested. |
| Are callbacks connected to this controller? | Each enrolled service has `missing`, `registered` or `removed` registration and its current lifecycle phase. A registered callback may correctly remain `blocked`. |
| Were files published? | `publication.status` remains `not-checked`. Run the separate [publication checker](PUBLICATION-CHECK.md) with the intended public artifact. |
| Does the application behave correctly? | `behavior.status` remains `not-tested`. Check real network/storage effects, rejection, granular choice, withdrawal, reload, scope changes, evidence and failure paths. |

Configuration comparison covers only the inventory used by consent: site, purposes, services, storage, policy, privacy/cookie document metadata, selected localization, scope guards and privacy signals. The compiler and inspector share that projection. It does not compare other packs, authored bodies, release files, controller evidence mode or actual receipts. Matching presentation metadata does not establish correct UI placement or reviewed wording.

## Registration and phase

For a small registration-only check:

```ts
const registrations = consent.getServiceRegistrations();
// { 'optional-metrics': 'registered', 'optional-media': 'missing' }
```

The map is a detached copy. Inspection does not register, unregister, grant, reject, refresh, start or stop anything. Registration means the controller owns a callback; it cannot prove that the callback tells the truth or that no parallel script exists elsewhere. A removed registration can still be stopping or require a reload after failed cleanup. Destroyed controllers remain identifiable; pending starts/stops remain transitional rather than being awaited.

The full report contains service IDs and a local observation time, without stored values, personal subjects, callback code or source configuration bodies. It is an in-process diagnostic, not an authenticated receipt or a tamper-proof record. Keep exported reports private and repeat inspection after the controller changes. A successful inspection has no overall readiness or legal-compliance verdict.

## Try it

Open the [cookie-choice example](https://notabenda.org/choices/) and expand **Inspect this connection**. The inspector module loads only after **Inspect runtime** is pressed. The example shows configuration and registration observations alongside the two checks it has not performed. Subsequent controller changes invalidate the displayed snapshot; inspect again after testing a choice. Light and midnight examples use the same inspector.

For agent-assisted setup, include this runtime report alongside configuration assessment, publication results and the actual application test output. Record what each check observed and what remains unverified. Do not promote a registration count to an installed or tested pack.

See [verification](verification/connection-inspection.md).
