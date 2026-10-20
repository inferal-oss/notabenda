# Browser delivery verification

Requirements: `REQ-PRODUCT-PACKAGE`, `REQ-PRODUCT-BUNDLE-BUDGET`.

The optional `scripts/measure-bundles.mjs` measures real bundled public imports with pinned esbuild, ESM/ES2022, minification and gzip level 9. It reports compiled local controls, compiled required-receipt controls, the compatibility headless controller, core plus vanilla controls, the published consent stylesheet and the main component stylesheet and optional service-directory assets separately. `--json` emits deterministic measurements and actual contributing input files. `--check` exits nonzero for missed targets; it is an opt-in tool, not an adopter CI policy.

The consent stylesheet is generated from the canonical `styles.css`. Tests compare each retained rule’s declarations, relative cascade order and surrounding media/layer conditions against that source. Focus, native dialog backdrop, reduced motion, forced colors, safe areas, hidden-state and print rules remain present. The main component stylesheet remains byte-identical to its canonical source. The service directory has an independent stylesheet and does not increase consent CSS. No remote assets or CSS imports are introduced.

The `notabenda/headless` export uses the exact existing consent factory and contains no mounting or rendering exports. An import test installs throwing browser-global getters before loading it. Bundle graph checks exclude backend, Node build tooling and framework code; the headless graph excludes DOM-control and document-rendering modules. Packed installation/type coverage includes the new entry and CSS export.

The compiled `notabenda/consent` entry validates a bounded descriptor produced by the full build-time compiler. It shares the compatibility state machine; exact material scopes are reconstructed independently of input key order. A separately imported opaque required-evidence adapter fails closed if missing or forged. The smaller local graph excludes full site validation and the receipt implementation. Native controls, media/storage/Google adapters and the Astro client bridge accept the narrower controller; The optional `notabenda/react/consent` entry accepts the compiled inventory; `notabenda/react` keeps its existing full-controller contract.

Local and required-receipt suites run through both public factories. Additional tests exercise malformed descriptors before browser capabilities, field-order parity, private-data projection, mandatory adapter mode, failed command preparation, unavailable UUID generation, retirement and cross-tab changes. New records always declare local/required authority; markerless and required positives cannot become local grants. Valid negatives and independently parsed regional prompt memory remain, with no storage rewrite during parsing.

The compiled local profile meets its target. Compatibility core JavaScript still exceeds 15 KiB. The [controller timing tools](consent-performance.md) now measure synthetic fresh setup, snapshots and synchronous local choice calls; full page startup/paint and cross-browser performance remain unfinished; the catalog keeps the overall item partial.

Measurement on 19 October 2026 with esbuild 0.28.2 and gzip level 9:

| Import/profile | Gzip | Target | Result |
| --- | ---: | ---: | --- |
| `createConsentRuntime` + `mountControls`, compiled local | 12.18 KiB | 15 KiB | Within target |
| Same plus `requiredConsentEvidence` | 15.68 KiB | Report separately | Optional receipt implementation |
| Compiled runtime + React consent bindings, React peer external | 13.20 KiB | Report separately | Excludes React and React DOM |
| `createConsent` from `notabenda/headless` | 16.59 KiB | Report only | Same existing engine |
| `createConsent` + `mountControls` | 19.50 KiB | 15 KiB | Over target |
| `notabenda/consent.css` | 2.21 KiB | 5 KiB | Within target |
| `notabenda/styles.css`, main component collection | 10.19 KiB | Report separately | Includes document/operator/form layouts, purpose authoring and optional catalog picker |
| `notabenda/services`, model + render + local search | 10.68 KiB | Report separately | No reference dataset, Node or backend |
| `notabenda/services.css` | 1.73 KiB | Report separately | Independent directory styling |

The transfer figures exclude a site’s configuration payload, page layout/theme, sample integration code and framework adapters. The cookie example’s actual browser entry bundles its own UI/example code as well; it does not represent the library-only size profile.

Chromium verification on 19 October 2026: at a 390px viewport, all 47 inspected page/control elements had identical computed values before and after the stylesheet change in both light and midnight themes. The comparison covered typography, colors, borders, dimensions, spacing, layout, overflow and backdrop color. Document/client widths matched (375 CSS px after the scrollbar), and the light page also matched at 320px (305 CSS px). The native preference dialog remained keyboard reachable.

The bundled light example started only measurement after a granular grant (one sample request started; suggestions stayed blocked). Reopening and rejecting returned both services to blocked without starting another request. This is a local browser interaction check, not external provider delivery evidence. [Light drawer](../assets/screenshots/browser-delivery-light-mobile.png), [midnight drawer](../assets/screenshots/browser-delivery-midnight-mobile.png).

Project checks include package and site tests, catalog consistency, website build and Worker dry run. The optional size check continues to report the unresolved compatibility JavaScript target.

Compiled-runtime browser check on 19 October 2026: the rebuilt local `/choices/` example loaded the bounded descriptor, started measurement only after its explicit granular choice, kept suggestions blocked, and returned both services to blocked after rejection without starting another request. [Compiled entry, granular choice](../assets/screenshots/compiled-consent-granular-desktop.png). The visible layout and controls continue to use the same canonical CSS. This check does not add a cross-browser or mobile performance claim.

This milestone passed 417 package tests and 60 site tests (477 total), catalog validation, the website build and Worker dry run. A development build initially caught three stale hashed Astro outputs; those generated files were retained outside deployment output and the asset guard remains unchanged.

The current measurement includes the native-control focus/accessibility refinement in [consent focus verification](consent-focus.md). That refinement preserves the compiled local target; the compatibility entry remains above target.

The later technology-notice milestone on 19 October 2026 measured compiled local runtime plus controls at **14.90 KiB gzip**, required-receipt runtime at **18.71 KiB**, and compatibility core plus controls at **25.29 KiB**. Consent CSS remains **2.59 KiB**; the separate `technology.css` is **0.70 KiB**. The optional build/server technology declaration module is absent from the compiled browser graph. These are transfer-size measurements, not interaction timings; the earlier table records the first compiled-entry milestone.

The controller-performance refinement measures compiled local plus controls at **14.89 KiB gzip** (15,252 bytes), with compatibility core plus controls at **25.29 KiB** (25,895 bytes). The targets are unchanged. Service inventory indexing and direct per-service restrictions reduce repeated snapshot work without caching permissions across queries. See [the timing method and limits](consent-performance.md).

With localized form permissions and direct-collection notices, compiled local plus controls remains **14.89 KiB gzip** (15,252 bytes). Compatibility core plus controls is **25.83 KiB** (26,454 bytes); its original target remains unmet. The form/collection message policies and the standalone agent-assessment validator are absent from the compiled consent browser graph. The assessment validator is generated at package build time and is loaded only by the separate assessment entry.

The shared localization-validator refinement measures compiled local plus controls at **15,314 bytes gzip** and compatibility core plus controls at **26,563 bytes**. The latter is 93 bytes smaller than its preceding 26,656-byte build; it remains above the unchanged 15,360-byte target. Required-receipt runtime measures **19,204 bytes**. The refactor avoids repeated language-metadata validation during full-site normalization; these transfer figures do not establish browser startup or interaction performance.
