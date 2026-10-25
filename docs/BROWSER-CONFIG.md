# Build configuration for the browser

Cookie controllers take a compiled `ConsentRuntimeConfig` descriptor. `createConsent` from `@notabenda/core` or `@notabenda/core/headless` is the same bounded runtime factory as `createConsentRuntime` from `@notabenda/core/consent`. Compile the complete site configuration in build/server code, then send only the descriptor to the browser. Do not import the compiler or full configuration into a client bootstrap.

## Validate and compile before delivery

The compiler validates the complete site, including operator facts, documents and terms, before selecting the cookie runtime inventory. Production requires reviewed content. Use explicit preview mode for drafts; validation does not establish factual or legal correctness.

```js
// Build/server code only.
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
const runtimeConfig = compileConsentRuntimeConfig(siteConfig, {evidence: 'local'});
// Write JSON.stringify(runtimeConfig) to legal-dist/consent-runtime.json.
```

For configuration files, the CLI performs the same build:

```sh
notabenda build --config notabenda.config.yaml --consent-runtime local --out-dir legal-dist
```

JSON, YAML and Markdown frontmatter are supported. Choose `local` or `required` explicitly; there is no default evidence mode. This adds `consent-runtime.json` and `assets/notabenda-consent.css` alongside legal pages and their retained release. Repeat the flag when rebuilding a directory containing runtime output. `--preview` deliberately permits draft content.

## Consume the descriptor

```js
// Browser code: no compiler or full site configuration.
import {createConsent, mountControls} from '@notabenda/core';
import '@notabenda/core/consent.css';
const response = await fetch('/consent-runtime.json');
if (!response.ok) throw new Error('Privacy choices could not load.');
const consent = createConsent(await response.json());
// Register service lifecycles before optional work can start.
mountControls(document.querySelector('#privacy-controls'), {consent});
```

Runtime input is bounded and checked synchronously before browser capabilities are accessed. A full `SiteConfig` or `PublicSiteConfig` is not a valid runtime descriptor. The factory returns `ConsentStateController`; `getConfig()` exposes only `ConsentRuntimeInventory`. Default React and `@notabenda/core/react/consent` hooks use this same narrow contract. See [consent limits and lifecycles](CONSENT.md#smaller-browser-entry).

## Require a receipt explicitly

Build with `--consent-runtime required --consent-scope cookie-choices` to emit the native notice, its immutable notice-ID file and the runtime descriptor. Register and activate the notice through your authorized backend, then supply the separately imported adapter:

```js
import {requiredConsentEvidence} from '@notabenda/core/consent/evidence';
const consent = createConsent(requiredRuntimeConfig, undefined, {
  evidence: requiredConsentEvidence({
    notice, streamRef,
    read: ({signal}) => host.readConsentHead({signal}),
    write: (command, {signal}) => host.recordConsent(command, {signal}),
  }),
});
```

The host supplies authenticated transport, context binding and parsed responses. A required descriptor without an adapter fails; a local descriptor rejects a required adapter. A plain receipt-options object is not an adapter. Compilation creates neither service lifecycles nor a recording backend. See [cookie-choice evidence](CONSENT-EVIDENCE.md).

## Keep full-site work separate

Keep full configuration in build/SSR code for legal rendering, authoring and other workflows that require it. A browser cookie controller is not a source for operator contacts, terms, rights forms or other workflow configuration. Deliver separately selected public inputs to those components. For example, select media localization on the server and pass that dictionary to the media group explicitly.

SSR can validate and compile full configuration before constructing a request-scoped controller. Use an empty environment for conservative rendering, keep optional services unregistered and destroy the controller after rendering. A required descriptor still requires its adapter; do not change evidence modes to bypass that contract. Never share a mutable controller across visitors.

Older local integrations can temporarily import `createCompatibilityConsent` (or its `createConsent` alias) from `@notabenda/core/consent/compat`. It retains full-site validation, the full getter and plain receipt options, with the larger validation dependency graph. It is an explicit migration aid, not the default browser path or a way to meet the primary browser footprint budget. See [API migration and compatibility limits](MIGRATION.md#unreleased-browser-api-migration). Earlier dated bundle measurements describe their original API/source and do not prove the changed primary entry meets its release gate.
