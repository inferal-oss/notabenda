# A directory of declared services

Use one inventory for privacy disclosures and a readable service directory. Each service shows its provider, declared purposes and processing location. Native expandable details show purpose-specific data categories, legal basis, retention and linked browser-storage items. The directory identifies missing privacy links and storage declarations.

The directory reads only the site's declared `services`, `purposes` and `storage`. It supports entirely custom services and ordinary services proposed by the [catalog](SERVICE-CATALOG.md). Detection never publishes an entry. Confirm actual use and review the configuration before production rendering. Reference datasets, catalog provenance, private reasoning, integration scopes and resource origins are absent from the display model.

Try the [light example](/services) and [midnight example](/dark/services). The example services and locations are illustrative; they do not describe this website's actual providers.

## Native HTML and local search

```ts
import {renderServiceDirectory, mountServiceDirectory} from 'notabenda/services';
import 'notabenda/services.css';

// Server or build: no script required for reading cards and opening details.
const html = renderServiceDirectory(reviewedConfig, {
  idPrefix: 'site-services', headingLevel: 2,
});

// Optional browser enhancement on a dedicated host container.
const directory = mountServiceDirectory(container, reviewedConfig, {
  idPrefix: 'site-services', headingLevel: 2,
});
// Later, before removing or reusing that container:
directory.destroy();
```

`idPrefix` must be unique on the page. Choose heading levels 1–4 to fit the host outline. The directory uses the host's font and shared `--nb-*` theme tokens, with `--nb-services-width` for its maximum width. Its optional stylesheet is separate from legal/consent styles and carries no remote assets. A complete script-free page is available through `renderServiceDirectoryPage(config, {idPrefix, stylesheetUrl})`.

Optional search matches literal words in service/provider names, locations, declared purpose descriptions/data categories and storage names. The purpose selector combines with that search. Counts announce changes politely; the inputs retain focus, and native detail state is preserved when matching server markup is enhanced. All content remains available when the enhancement is absent or destroyed. Searches stay in the current page: no request, storage write, consent change or database allocation occurs.

For server-rendered filters, supply `query` and/or `purposeId`; the result states how many of the declared services are shown. This is a filtered directory, not a complete inventory assertion. Unknown purpose IDs and oversized/unsafe search input are rejected. Supply translated title/description through options; full UI localization remains future work.

## React and Astro

```tsx
import {ServiceDirectory} from 'notabenda/react/documents';
import 'notabenda/services.css';

<ServiceDirectory config={reviewedConfig} idPrefix="services" headingLevel={2} />
```

```astro
---
import ServiceDirectory from 'notabenda/astro/ServiceDirectory.astro';
import 'notabenda/services.css';
---
<ServiceDirectory config={reviewedConfig} idPrefix="services" headingLevel={2} />
```

These wrappers use the exact native renderer and need no consent provider, client hooks or Astro island. React hosts can provide controlled `query`/`purposeId` props with their own search UI. To use the native local enhancer, give it ownership of a dedicated container outside a framework-managed subtree.

Production rendering defaults to full configuration validation and reviewed-document declarations. Examples/drafts require explicit `mode: 'preview'`; preview output carries a visible review note. These checks do not verify the truth or legal completeness of a service declaration.

## Headless data and retained releases

`createServiceInventory(config)` returns detached service display facts. `createServiceDirectory(config, filters)` also provides the site identity, linked policy revisions, purpose choices and count information. Privacy provider sections and the directory share the same declared-service projection. Cookie disclosures use the same declared storage relationships.

For a historical inventory, render from the exact retained `artifact.publicConfig`, not the current reference seed or current site configuration. Config changes already change legal-release identity. The directory is an additional view of those facts, not a fourth legal document or a separately archived HTML page. Catalog-selection snapshots remain separate from the public directory. Use the explicit [release finalizer](SERVICE-CATALOG.md#retain-selections-with-policy-releases) to attach selected source/reference facts to a policy release for authorized backend inspection; rendering a directory does not archive a selection.

Requirements and tests: `REQ-PRODUCT-SERVICE-CATALOG`, [verification](verification/service-catalog.md). Public directory rendering, wizard/admin selection, optional browser recognition and explicit selected-reference archival are implemented previews. Automatic selection, silent reference updates and complete provider verification are not supplied.
