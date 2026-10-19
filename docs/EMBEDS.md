# Media that waits for permission

Use `createEmbedService` for iframes and images that need an optional service's effective permission. It keeps resource URLs out of live resource attributes until every declared purpose is allowed. One service group manages several placeholders using the existing consent controller, including required-receipt gating.

The adapter is cooperative integration code. It does not classify a vendor, determine legal exemptions, intercept unrelated requests, or undo data already sent.

## Declare the service's destinations

Add `resourceOrigins` to the service in your site configuration:

```js
{
  id: 'optional-video',
  name: 'Video player',
  provider: 'Your selected provider',
  location: 'Your reviewed processing locations',
  purposeIds: ['embedded-media'],
  resourceOrigins: ['https://media.example.test'],
}
```

Also declare the purpose and service in `config.consent`. Origins must be exact canonical HTTPS origins, with no paths, trailing slash, credentials or wildcards. Use `'self'` for a first-party resource. The public projection retains this declaration, so changing it changes the affected consent scope and invalidates older grants. Update the service scope and reviewed disclosures whenever a vendor or its processing changes, even if its origin stays the same.

Origins restrict the **initial requested URL**. They do not constrain redirects, frame navigation, nested resources or a provider's server processing. Configure the host's `frame-src`, `img-src` and other relevant CSP directives for the destinations you intend to permit; review vendor behavior separately.

## Mount one group, then its media

```js
import {createConsent, createEmbedService, mountControls} from 'notabenda';
import publicConfig from './legal/notabenda.public.json';

const consent = createConsent(publicConfig);
mountControls(document.querySelector('#privacy-controls'), {consent});

// One registration for this service, owned by the host bootstrap.
const videos = createEmbedService({consent, serviceId: 'optional-video'});
const player = videos.mount(document.querySelector('#video'), {
  kind: 'iframe',
  src: 'https://media.example.test/player',
  title: 'A tour of the project',
  description: 'This player uses the optional media service. Review your choices before loading it.',
  sandbox: ['allow-scripts'], // Explicitly review what the provider needs.
});

// Route/unmount cleanup: remove this surface, retain the host's service group.
player.destroy();
// Eventual application cleanup; the group cannot be registered again on this controller.
videos.destroy();
consent.destroy();
```

`mount(container, options)` uses a dedicated container and returns `{refresh, destroy}`. It temporarily replaces the container's existing static fallback and restores it on destroy if the container is otherwise empty. Mount one resource per container. Several mounts can share one group; destroying one does not stop the others. Service IDs remain reserved for the controller's lifetime, so do not create/destroy groups in repeatable React effects or Astro page scripts. Keep the group in the host bootstrap and manage individual mounts with route/component lifetimes.

For images use `kind: 'image'`, a nonempty `alt`, and the same `src`, `title` and `description` fields. Sources accept HTTPS or root-relative paths, and must match the declared origins. URLs are resolved against the document URL, independent of a `<base>` element. Options are copied when mounting; changing the caller's object later cannot replace the destination or expand iframe permissions.

The placeholder button opens the existing preferences UI. It makes **no** consent choice, including no one-time grant. Keep `mountControls` or an equivalent working preferences UI available. Permission may already have been saved; the group still checks current effective permission before adding media, and required mode waits for acknowledged evidence.

## Inert server rendering

```js
import {renderEmbedPlaceholder} from 'notabenda';
const fallback = renderEmbedPlaceholder({
  title: 'A tour of the project',
  description: 'Optional media stays unloaded until you allow it.',
});
// Render fallback inside the dedicated #video container in your host template.
```

This renderer accepts only plain copy. It escapes that copy and emits no resource URL, iframe, image, resource hint or script. Its action stays hidden/disabled until the browser mount supplies a functioning action. Without JavaScript, the explanatory text remains readable and no media loads.

Do not place a live `src`, `srcset`, CSS background, remote poster, preload, preconnect or vendor script in the fallback. A detached image can initiate a request when its source is assigned; an element's being invisible or detached is not a consent gate. The adapter assigns no resource source while blocked, including on detached nodes.

## Lifecycle and browser limits

- All of the service's purposes must be effectively allowed. Saved grants awaiting a required receipt do not load media. Mounting into an active group checks current storage/permission rather than trusting a stale active flag.
- Withdrawal, expiry and controller destruction remove adapter-owned resource attributes and nodes immediately when their lifecycle signal aborts. Already sent requests, cached responses, third-party storage and server processing cannot be recalled or erased by removing a node. Browser suspension may delay ordinary lifecycle/timer checks.
- A detached container stays inert. Connection changes are observed where `MutationObserver` is available; `refresh()` checks an explicitly attached surface too. Dispose mounts before removing their containers; observation is a fallback and cannot guarantee cancellation before the next browser task.
- Iframes default to an empty sandbox and `referrerpolicy="no-referrer"`. The optional `sandbox` array lifts only explicitly selected restrictions; `allow` is an explicit iframe Permissions Policy string. There are no `srcdoc`, raw HTML, arbitrary attributes or broad default capabilities. Same-origin frames cannot request both `allow-scripts` and `allow-same-origin` through this adapter. Review redirects and use a separate origin for untrusted scripted content.
- An image error restores its explanatory placeholder, with no automatic retries. Reload or deliberately dispose/remount the surface after investigating. An iframe load event cannot prove the remote page successfully loaded, so the UI reports permission rather than claiming success. See the browser's [iframe reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) and [image reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img).

Import `notabenda/styles.css` for optional responsive card/media styles, or replace the low-specificity `.nb-embed*` rules. Existing theme tokens control surfaces, text, borders and actions. Native iframe/image titles and alternatives come from the supplied plain text.

## Try the example

Run `npm run dev` and open [the fictional media example](http://127.0.0.1:4178/embeds). It uses only two first-party sample resources: a script-free framed page and a generated illustration. The visible counter reports resource entries observed by the browser on this page, including requests served from cache; it is not an audit log or a claim about a live vendor.

`REQ-PRODUCT-EMBEDS` links the implementation and tests in the [catalog](requirements/README.md#req-product-embeds), with a [browser verification record](verification/embeds-browser.md). Regional device-access requirements remain partial; the adapter supplies a mechanism for the processing you have declared, not legal applicability rules.
