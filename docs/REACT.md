# Use Notabenda with React

The optional `notabenda/react` entry point connects React 19 to the same controller used by vanilla integrations. It supplies a provider, subscription hooks, native consent controls and a preferences button. Static document components also have a separate server-safe `notabenda/react/documents` entry point.

The default `notabenda` entry remains framework-independent and has no runtime dependencies. React is an optional peer: install your own React 19 application dependencies when using the React adapter. Packages remain an unpublished developer preview; use workspace builds or local tarballs.

## Use the compiled consent entry

For browser applications that already compile the site inventory, import the provider, hooks and controls from `notabenda/react/consent`:

```jsx
import {createConsentRuntime} from 'notabenda/consent';
import {ConsentProvider, ConsentControls, PreferencesButton} from 'notabenda/react/consent';
import 'notabenda/consent.css'; // optional

// Build-time: compileConsentRuntimeConfig(siteConfig, {evidence: 'local'})
const response = await fetch('/consent-runtime.json');
if (!response.ok) throw new Error('Privacy choices could not load.');
const consent = createConsentRuntime(await response.json());
// Register optional service lifecycles once here, before mounting the application.
root.render(<ConsentProvider controller={consent}>
  <YourApplication />
  <PreferencesButton />
  <ConsentControls />
</ConsentProvider>);
```

This entry accepts both compiled and complete-config controllers. Its `useConsentController()` returns `ConsentStateController`, whose `getConfig()` is the smaller `ConsentRuntimeInventory`. It does not promise operator contacts, terms authoring or other workflow configuration. The existing `notabenda/react` provider and hook retain their complete-config controller contract. A compiled controller cannot be passed to that compatibility provider in TypeScript.

Import a provider and its hooks/components from the **same entry point**. Each entry has a separately typed context; mixing them throws an explanatory error instead of pretending that a smaller controller has a complete config. Controls ownership is shared: the same controller can have only one native controls mount, including across the two entries. Multiple preference buttons remain supported.

Both entries share subscription, SSR/hydration, effective-permission and controls behavior. Required evidence is selected on the compiled descriptor and supplied through `requiredConsentEvidence` from `notabenda/consent/evidence` when constructing the controller; React never creates or downgrades that adapter. The [consent guide](CONSENT.md) covers its bounded descriptor and stored-choice migration.

The consent-only entry does not import static document renderers or form-permission controls. Render legal documents with the separate server-safe `notabenda/react/documents` entry when needed, and use `notabenda/react` for ordinary form permissions. React remains an optional host-supplied peer. `npm run size` reports the compiled React integration separately with that peer external; its number excludes React and React DOM and is not an application transfer-size claim.

## Own the controller outside React

Create one browser controller before optional integrations can start, register their lifecycles once, then pass it into React. Do not create a controller during render or register services inside an effect that React may repeat.

```jsx
import { createConsent } from 'notabenda';
import { ConsentProvider, ConsentControls, PreferencesButton } from 'notabenda/react';
import { createRoot } from 'react-dom/client';
import 'notabenda/styles.css'; // Optional; the same theme tokens apply.

const consent = createConsent(publicConfig);
consent.registerService('optional-metrics', {
  purposes: ['measurement'],
  async start({ signal }) {
    const metrics = await import('./metrics.js');
    if (signal.aborted) return () => {};
    return metrics.start({ signal }); // Must return cleanup, including after cancellation.
  },
});

const root = createRoot(document.getElementById('root'));
root.render(
  <ConsentProvider controller={consent}>
    <YourApplication />
    <PreferencesButton className="your-button">Privacy choices</PreferencesButton>
    <ConsentControls />
  </ConsentProvider>,
);

// At actual host teardown, rather than a transient React remount:
// root.unmount();
// consent.destroy();
```

`ConsentProvider` owns the React connection, not the controller. Unmounting it removes subscriptions and controls without destroying the host's consent engine. Replacing its `controller` switches the entire React connection. The application owns construction, service registration and eventual destruction. Do not share a mutable controller between server requests or visitors.

React's development [StrictMode](https://react.dev/reference/react/StrictMode) repeats effect setup and cleanup. The adapter handles that cycle without duplicating controls or closing shared preference state. Current service IDs remain reserved after unregistering, so do not wrap `registerService` in a naïve React effect; register once in the host bootstrap.

## Read state and build your own interface

```jsx
import { useConsentController, useConsentSnapshot, usePurposeAllowed } from 'notabenda/react';

function MeasurementStatus() {
  const consent = useConsentController();
  const state = useConsentSnapshot();
  const allowed = usePurposeAllowed('measurement');
  return (
    <section>
      <p>Measurement: {allowed ? 'allowed' : 'off'}</p>
      <p>Saved choice: {state.purposes.measurement}</p>
      <button type="button" onClick={() => consent.openPreferences()}>Review choices</button>
    </section>
  );
}
```

`useConsentSnapshot()` returns cached, deeply immutable UI state, including prompt-policy decisions and their nested source/requirement references. `purposes` describes saved choices; `permissions` describes effective permission. In required-receipt mode, a saved `granted` purpose can still have `permissions[id] === false` while checking, saving, unavailable or superseded. `usePurposeAllowed(id)` reads that effective projection; unknown purposes return false.

These values describe UI state. Use `registerService` for actual optional work; rendering a conditional component does not prevent eager imports, preloads, server-side requests or effects elsewhere. Do not call `controller.isAllowed()` during React render: it may refresh shared storage and trigger lifecycle/evidence work. The adapter reads a pure core projection instead.

Hooks use React's [external-store subscription API](https://react.dev/reference/react/useSyncExternalStore), with stable snapshot references and a conservative server snapshot. They create no second consent engine. The provider does not write choices or start services during render.

## Native controls and your own entry points

`<ConsentControls preferencesLabel="Privacy choices" className="your-wrapper" />` mounts the existing compact nonmodal notice and user-opened native drawer after React commits. Mount one controls component per controller. Use additional `<PreferencesButton>` components wherever visitors should reopen preferences.

The button accepts ordinary button attributes, children and classes; its type and click action are supplied by the adapter. It disables itself when its controller is destroyed. Controls use the same optional stylesheet and tokens as the vanilla interface; no framework-specific theme is required.

Control cleanup removes its UI without changing shared `preferencesOpen` state. If the host deliberately removes controls and wants preferences closed, call `closePreferences()` as part of that host action. Headless consumers can supply their own notice, draft selection and accessible dialog while using the same controller actions. Full keyboard/screen-reader/platform review remains necessary.

## Render legal documents on the server

```jsx
import { LegalDocument, LegalLinks } from 'notabenda/react/documents';

export function PrivacyPage({ publicConfig }) {
  return <YourPageLayout>
    <LegalDocument config={publicConfig} kind="privacy" />
    <LegalLinks config={publicConfig} />
  </YourPageLayout>;
}
```

These wrappers use exact validated core-renderer HTML. They need no provider, client hooks or browser APIs. `LegalDocument` accepts `kind`, `config`, optional `mode` and `className`. `LegalLinks` accepts `config` and optional `className`. Production mode is the default; use `mode="preview"` to display draft content explicitly.

The wrappers render structured site configuration. For rich **Markdown/MDX releases**, serve the authoring package's generated HTML or place its validated `release.fragments` in your own reviewed page shell. Re-rendering a readable structured projection is not equivalent to serving the exact archived rich artifact. See [the authoring guide](AUTHORING.md).

## Server rendering and hydration

Permission hooks return a stable conservative snapshot during server rendering and initial hydration: unknown purposes, false permissions and blocked services. No consent controls are inserted by server effects. The legal content remains ordinary readable HTML with JavaScript unavailable.

For SSR, use a fresh request-scoped controller with an empty environment (`createConsent(config, {})`), no optional lifecycles and no evidence transport; destroy it after rendering. In the browser, create the real controller once before hydration. The same server snapshot lets hydration match, then React updates to current browser state. Do not serialize browser storage or treat a browser-controlled choice as server authorization. The [React hydration guide](https://react.dev/reference/react-dom/client/hydrateRoot) describes the matching-output requirement.

Required receipts are still configured at controller construction through its third argument, before any optional lifecycle is registered. The provider needs no alternative mode. Use the explicit adapter when constructing a compiled controller. See [cookie evidence](CONSENT-EVIDENCE.md) for the authority and transport contract.

## Working example and verification

Run `npm run dev` and open the [React example](http://127.0.0.1:4178/react) or [midnight theme](http://127.0.0.1:4178/dark/react). [Example source](../examples/react/view.mjs) separates host bootstrap, shared view and the build. The light/midnight cookie example now uses the compiled controller and `notabenda/react/consent`, with a small descriptor and explicit legal-link metadata. Only this optional example bundles React; vanilla pages do not fetch it.

`REQ-PRODUCT-REACT` links implementation and tests. Tests cover core escaping, conservative SSR, hydration recovery, immutable/cached snapshots, StrictMode cleanup, controller replacement, required-receipt gating, storage changes without render-time effects, and packed consumer types. DOM simulations do not replace real-browser layout, dialog and assistive-technology verification.

See the [browser verification record and screenshots](verification/react-browser.md).

For configured [privacy signals](PRIVACY-SIGNALS.md), `useServiceAllowed(serviceId)` projects cookie permission plus independent processing restrictions. `usePurposeAllowed` describes cookie-purpose permission only. Both hooks stay pure and conservative during SSR; actual work still belongs in registered lifecycles.

## Ordinary form permissions

Use a separate controller and provider for each stable purpose/channel and host-bound person/contact generation. These controls share the [form permission controller](FORM-PERMISSIONS.md), exact offers, recovery journal and optional backend with vanilla integrations.

```jsx
import {FormPermissionProvider, FormPermissionField} from 'notabenda/react';

function AccountPreferences({permission}) {
  return <FormPermissionProvider controller={permission}>
    <FormPermissionField
      className="your-field"
      fallback={<p>Use our privacy contact if these controls are unavailable.</p>}
    />
  </FormPermissionProvider>;
}
```

Create `permission` once in the host bootstrap using `createFormPermission(offer, options)`. Supply the public offer and trusted opaque stream reference independently of the initial read. Mount the field, then deliberately call `permission.refresh()` where the application needs current state. The provider and field never create a controller, read the host, retry a pending action or destroy the controller as a side effect of mounting. StrictMode effect replay therefore makes no extra permission requests. The field mounts the same semantic native controls and optional stylesheet used by vanilla, including explicit retry and independent withdrawal.

`useFormPermissionController()` exposes that host-owned controller. `useFormPermissionSnapshot()` supplies a cached, deeply read-only snapshot; `useFormPermissionAllowed()` projects its acknowledged `allowed` value. All require `FormPermissionProvider`. Headless React controls can call the same explicit controller actions. Their buttons should use `type="button"`; submitting an unrelated form must not save permission or infer a grant from a checkbox.

Server rendering and initial hydration return an unchecked, off snapshot with no current event or recovery data, regardless of the controller's current browser state. The native field appears after commit. Its fallback remains readable without JavaScript; provide a real privacy/help destination in the surrounding page. This does not render a working server-side permission submission form. Keep policy documents independently accessible.

Mount one `FormPermissionField` per controller. Unmounting removes only the native field and subscriptions. It retains the host controller's draft and pending command; remounting does not save, refresh or retry them. Destroy the controller when discarding its person/contact context, and supply a new controller when that binding or offer changes. A journal remains owned by the host and should be closed when its use ends. Unmounting a field does not cancel an action already being recorded, and an old controller must not be used to display a newly selected account's state.

The light and midnight [React form permission example](http://127.0.0.1:4179/form-permissions/react/) uses a host-owned controller, IndexedDB recovery and the isolated session workspace. Preparing its ordinary workspace draft makes no permission write. Its plain JavaScript sibling uses the same offer and backend, so an acknowledged choice is visible through either integration after an explicit read.

Tests cover conservative SSR/hydration, immutable snapshots, StrictMode mount cleanup, absence of mount-time network traffic, primary-form independence, controller replacement, destruction and exact pending-request retry after remount. The packed package includes strict React consumer types. See [form permission verification](verification/form-permissions.md) for browser observations and remaining platform work.
