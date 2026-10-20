# Use Notabenda with Astro

For terms agreements, use the [named static shell and operation-bound client bridge](TERMS.md#astro). It preserves a draft across same-context navigation and leaves changed offers or operations unbound until the host replaces the controller.

Astro can render the legal documents as ordinary static HTML, then add a small browser bootstrap only where consent controls are needed. The optional `.astro` components use the same validated core renderer. The browser bridge uses the existing host-owned controller; it creates no second consent engine.

This preview is tested with **Astro 7.4.0**, which needs Node.js 22.22 or later. The core package itself still supports Node.js 22. Astro is an optional peer and is not installed by a default core installation. Packages remain unpublished; use workspace builds or local tarballs.

## Static legal pages

```astro
---
import LegalDocument from '@notabenda/core/astro/LegalDocument.astro';
import LegalLinks from '@notabenda/core/astro/LegalLinks.astro';
import publicConfig from '../legal/notabenda.public.json';
---
<html lang="en">
  <head><title>Privacy policy</title></head>
  <body>
    <main><LegalDocument config={publicConfig} kind="privacy" /></main>
    <footer><LegalLinks config={publicConfig} /></footer>
  </body>
</html>
```

The components add no scripts or framework hydration. Astro's [static routes](https://docs.astro.build/en/guides/routing/) decide the page URL. Keep those routes consistent with `documents.*.route` in the configuration. Import the optional `@notabenda/core/styles.css`, or use your own host layout and stylesheet.

`LegalDocument` accepts `config`, `kind`, optional `mode` and `class`. Production is the default and requires a reviewed document. Use `mode="preview"` to show drafts explicitly. `LegalLinks` accepts `config` and optional `class`; its ordinary anchors do not imply consent or terms agreement.

For **rich Markdown/MDX releases**, serve the authoring package's generated HTML or put its validated `release.fragments` in your reviewed host shell. Structured document wrappers do not reconstruct exact rich artifacts. Keep pinned full-page artifacts when an evidence workflow references their exact hashes. See [authoring](AUTHORING.md) and [terms agreement](TERMS.md).

## Add a controls surface

In a shared interactive layout:

```astro
---
import ConsentControls from '@notabenda/core/astro/ConsentControls.astro';
import PreferencesButton from '@notabenda/core/astro/PreferencesButton.astro';
---
<main><slot /></main>
<footer>
  <PreferencesButton class="your-button">Privacy choices</PreferencesButton>
  <ConsentControls preferencesLabel="Privacy choices" />
</footer>
<script>
  import { createConsent } from '@notabenda/core';
  import { mountAstroConsent } from '@notabenda/core/astro/client';
  import publicConfig from '../legal/notabenda.public.json';

  const consent = createConsent(publicConfig);
  // Register declared optional services once here, before any optional work.
  // Use the same registerService/start/AbortSignal/cleanup contract as vanilla.
  const controls = mountAstroConsent({ consent });
</script>
```

Use a normal processed Astro script, so imports bundle locally and the module executes once. Do not turn this bootstrap into a rerunning inline script: that can create duplicate controllers or repeat service registration. Do not serialize private operator configuration into HTML or client bundles; use the public build projection.

`ConsentControls.astro` is a placeholder for the native compact notice and deliberate drawer. It accepts optional `class` and `preferencesLabel`. Mount one per page. `PreferencesButton.astro` accepts `class` and slot text; it stays hidden until the bridge provides a working controls surface. Additional preference buttons reopen the same controller.

The bridge imports safely on the server, but call `mountAstroConsent` only in a browser. Its optional `document` argument supports explicit document binding. `refresh()` binds the current surface; `destroy()` removes the bridge's UI and listeners without destroying the host controller. The host owns eventual `consent.destroy()`, service teardown and route-specific integration work.

## Keep choices through client navigation

With Astro's `<ClientRouter />`, normal page scripts do not necessarily run again after navigation. The bridge listens to [Astro's navigation lifecycle](https://docs.astro.build/en/guides/view-transitions/): before a swap it detaches the old UI and closes an unsaved preference draft; on page load it mounts the new surface once. A draft is not saved by navigation. Existing consent and service registrations remain with the host controller, so a refused purpose stays refused and an active lifecycle is not started again merely because a page changes.

Every client-routed page where optional services continue **must retain a working preferences surface**, normally `ConsentControls` in the shared layout. A route without that component has no built-in withdrawal UI; the bridge does not automatically stop services or invent a withdrawal. Its extra preference buttons hide while no surface is available. Either keep the component throughout that client-routed area or use a full page navigation to a separate static area.

The example's legal pages deliberately omit `ClientRouter` and contain no scripts. Navigating there leaves the interactive application through a full page load. Its interactive first/second pages share one bootstrap and one controller. A browser without the relevant navigation support can fall back to ordinary page loads and recover choices from storage.

The bridge rejects duplicate owners for the same controller or document, and duplicate controls surfaces on a page. It does not register services, perform authentication, determine legal applicability, or enforce unrelated scripts. Required-receipt mode is still configured before registration through the controller's third argument; see [cookie evidence](CONSENT-EVIDENCE.md).

## Run the real example

```sh
npm install
npm run dev
# Open http://127.0.0.1:4178/astro/

# Or compile only the real Astro project:
npm run example:astro
```

The example is a real Astro build, not a static imitation. [Source](../examples/astro/src/pages/astro/index.astro) includes static legal routes, two client-routed pages, and fictional optional services making first-party sample requests. The repository's project website also publishes the example alongside the guide.

The example build disables telemetry, uses external self-hosted scripts/styles, and checks generated public inputs and outputs against explicit allowed paths. No account details, source maps or private deployment configuration are public assets. Existing unmanaged output fails for inspection rather than being uploaded silently.

`REQ-PRODUCT-ASTRO` connects the components, lifecycle bridge, real build and packed-consumer tests in the [catalog](requirements/README.md#req-product-astro). The [verification record](verification/astro-browser.md) covers initial real Chromium navigation and mobile native-dialog checks, with explicit limits. DOM lifecycle simulations do not replace assistive-technology or broader platform review.

## Ordinary form permissions

Astro has an optional field component and named browser bridge around the [same form permission controller](FORM-PERMISSIONS.md) used by vanilla and React. Each field represents one exact offer, stable purpose/channel and host-bound person/contact generation.

```astro
---
import FormPermissionField from '@notabenda/core/astro/FormPermissionField.astro';
import publicOffer from '../legal/product-news.offer.json';
---
<FormPermissionField id="product-news" offerId={publicOffer.offerId}>
  <p>If controls are unavailable, use our privacy contact below.</p>
</FormPermissionField>
```

The component emits a static fallback and an empty mount. It supplies no account binding, script, automatic request or working server-side submission form. `id` is a stable lowercase field key, unique within the page; it is not an account selector or permission authority. `offerId` identifies the exact public offer. The fallback stays readable without JavaScript; provide a real privacy/contact destination alongside it.

In the application's processed browser bootstrap:

```js
import {createFormPermission} from '@notabenda/core';
import {mountAstroFormPermission} from '@notabenda/core/astro/client';

// Host-supplied public offer, opaque contact-generation reference and authorized transports.
const permission = createFormPermission(publicOffer, {
  streamRef,
  read: ({signal}) => hostReadPermission({signal}),
  submit: (command, {signal}) => hostRecordPermission(command, {signal}),
});
const field = mountAstroFormPermission({permission, id:'product-news'});
// Mount first so withdrawal survives a failed initial read.
void permission.refresh().catch(() => {});
```

The host owns creation, optional transactional recovery journal, deliberate reads/retries and eventual destruction. Neither mounting nor `field.refresh()` reads, records or retries permission. The bridge mounts the existing semantic native field, retains its styling tokens and reattaches it on `astro:page-load`. `astro:before-swap` removes the old field and restores its fallback. A route without the named component has no built-in permission UI.

Drafts and pending actions stay in the host-owned controller through navigation. Navigation does not save a checked draft, deliver a pending command, cancel an already dispatched request or destroy the controller. The host may clear an editable draft explicitly when its product flow calls for that. Ordinary form submission remains separate from permission recording. In the maintained local-draft example, `data-astro-reload` excludes the form from Astro router handling and the host submit handler prevents native submission, so preparing the draft does not navigate or place its fields in the URL.

Mount one bridge per controller and document/field key. Different named fields can coexist with separate controllers. Duplicate surfaces fail closed. The bridge checks the field's exact offer ID before attaching; changed wording requires a new host controller. It cannot infer that a person/contact changed merely from a route URL. A host using client navigation must validate its trusted context before the bridge's page-load callback, destroy old controllers on binding changes, and bootstrap new ones as appropriate. The session example closes the old context and shows an explicit reload path when its generation, contact reference or offer changes. Never reuse a prior account's controller for a new account, even when the offer is identical.

`destroy()` removes the bridge's listeners and field, restores the fallback and releases the named mount. It does not destroy the controller, close the journal or delete pending recovery. The optional `document` argument supports an explicitly bound browser document. Importing the bridge is server-safe; call it only in the browser.

The real [Astro permission example](http://127.0.0.1:4179/form-permissions/astro/) has two client-routed pages, shared workspace draft state, IndexedDB recovery and the isolated Cloudflare demo backend. Use the repository's local Worker to run its recording flow. A static Astro build alone cannot invent that backend or its trusted stream binding. Legal links remain static, and the standalone build includes its exact pinned policy documents. See [verification](verification/form-permissions.md#astro-field-verification) for observed behavior and limits.
