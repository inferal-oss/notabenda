# Browser delivery verification

Requirements: `REQ-PRODUCT-PACKAGE`, `REQ-PRODUCT-BUNDLE-BUDGET`.

The optional `scripts/measure-bundles.mjs` measures real bundled public imports with pinned esbuild, ESM/ES2022, minification and gzip level 9. It reports the headless controller, core plus vanilla controls, the published consent stylesheet and the complete component stylesheet separately. `--json` emits deterministic measurements and actual contributing input files. `--check` exits nonzero for missed targets; it is an opt-in tool, not an adopter CI policy.

The consent stylesheet is generated from the canonical `styles.css`. Tests compare each retained rule’s declarations, relative cascade order and surrounding media/layer conditions against that source. Focus, native dialog backdrop, reduced motion, forced colors, safe areas, hidden-state and print rules remain present. The full component stylesheet remains byte-identical to its canonical source. No remote assets or CSS imports are introduced.

The `notabenda/headless` export uses the exact existing consent factory and contains no mounting or rendering exports. An import test installs throwing browser-global getters before loading it. Bundle graph checks exclude backend, Node build tooling and framework code; the headless graph excludes DOM-control and document-rendering modules. Packed installation/type coverage includes the new entry and CSS export.

Measured core JavaScript still exceeds the 15 KiB target. The smaller stylesheet is not evidence that this separate runtime target is satisfied. Startup/interaction timings, cross-browser performance and the proposed compiled runtime/evidence-module split remain unfinished. Preserve current full config validation, exact material scopes, required-receipt gating and synchronous errors during that future refactor.

Measurement on 19 October 2026 with esbuild 0.28.2 and gzip level 9:

| Import/profile | Gzip | Target | Result |
| --- | ---: | ---: | --- |
| `createConsent` from `notabenda/headless` | 16.52 KiB | Report only | Same existing engine |
| `createConsent` + `mountControls` | 19.11 KiB | 15 KiB | Over target |
| `notabenda/consent.css` | 2.21 KiB | 5 KiB | Within target |
| `notabenda/styles.css`, all components | 9.35 KiB | Report separately | Includes document/operator/form layouts |

The transfer figures exclude a site’s configuration payload, page layout/theme, sample integration code and framework adapters. The cookie example’s actual browser entry bundles its own UI/example code as well; it does not represent the library-only size profile.

Chromium verification on 19 October 2026: at a 390px viewport, all 47 inspected page/control elements had identical computed values before and after the stylesheet change in both light and midnight themes. The comparison covered typography, colors, borders, dimensions, spacing, layout, overflow and backdrop color. Document/client widths matched (375 CSS px after the scrollbar), and the light page also matched at 320px (305 CSS px). The native preference dialog remained keyboard reachable.

The bundled light example started only measurement after a granular grant (one sample request started; suggestions stayed blocked). Reopening and rejecting returned both services to blocked without starting another request. This is a local browser interaction check, not external provider delivery evidence. [Light drawer](../assets/screenshots/browser-delivery-light-mobile.png), [midnight drawer](../assets/screenshots/browser-delivery-midnight-mobile.png).

Project validation passed 376 package tests and 59 site tests (435 total), catalog checks, website build and Worker dry run. The separate optional size check correctly reports the unresolved JavaScript target.
