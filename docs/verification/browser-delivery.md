# Browser delivery verification

Requirements: `REQ-PRODUCT-PACKAGE`, `REQ-PRODUCT-BUNDLE-BUDGET`.

The optional `scripts/measure-bundles.mjs` measures real bundled public imports with pinned esbuild, ESM/ES2022, minification and gzip level 9. It reports compiled local controls, compiled required-receipt controls, the compatibility headless controller, core plus vanilla controls, the published consent stylesheet and the main component stylesheet and optional service-directory assets separately. `--json` emits deterministic measurements and actual contributing input files. `--check` exits nonzero for missed targets; it is an opt-in tool, not an adopter CI policy.

The consent stylesheet is generated from the canonical `styles.css`. Tests compare each retained rule’s declarations, relative cascade order and surrounding media/layer conditions against that source. Focus, native dialog backdrop, reduced motion, forced colors, safe areas, hidden-state and print rules remain present. The main component stylesheet remains byte-identical to its canonical source. The service directory has an independent stylesheet and does not increase consent CSS. No remote assets or CSS imports are introduced.

The `@notabenda/core/headless` export uses the exact existing consent factory and contains no mounting or rendering exports. An import test installs throwing browser-global getters before loading it. Bundle graph checks exclude backend, Node build tooling and framework code; the headless graph excludes DOM-control and document-rendering modules. Packed installation/type coverage includes the new entry and CSS export.

The compiled `@notabenda/core/consent` entry validates a bounded descriptor produced by the full build-time compiler. It shares the compatibility state machine; exact material scopes are reconstructed independently of input key order. A separately imported opaque required-evidence adapter fails closed if missing or forged. The smaller local graph excludes full site validation and the receipt implementation. Native controls, media/storage/Google adapters and the Astro client bridge accept the narrower controller; The optional `@notabenda/core/react/consent` entry accepts the compiled inventory; `@notabenda/core/react` keeps its existing full-controller contract.

Local and required-receipt suites run through both public factories. Additional tests exercise malformed descriptors before browser capabilities, field-order parity, private-data projection, mandatory adapter mode, failed command preparation, unavailable UUID generation, retirement and cross-tab changes. New records always declare local/required authority; markerless and required positives cannot become local grants. Valid negatives and independently parsed regional prompt memory remain, with no storage rewrite during parsing.

The compiled local profile meets its target. Compatibility core JavaScript still exceeds 15 KiB. The [controller timing tools](consent-performance.md) now measure synthetic fresh setup, snapshots and synchronous local choice calls; full page startup/paint and cross-browser performance remain unfinished; the catalog keeps the overall item partial.

Measurement on 19 October 2026 with esbuild 0.28.2 and gzip level 9:

| Import/profile | Gzip | Target | Result |
| --- | ---: | ---: | --- |
| `createConsentRuntime` + `mountControls`, compiled local | 12.18 KiB | 15 KiB | Within target |
| Same plus `requiredConsentEvidence` | 15.68 KiB | Report separately | Optional receipt implementation |
| Compiled runtime + React consent bindings, React peer external | 13.20 KiB | Report separately | Excludes React and React DOM |
| `createConsent` from `@notabenda/core/headless` | 16.59 KiB | Report only | Same existing engine |
| `createConsent` + `mountControls` | 19.50 KiB | 15 KiB | Over target |
| `@notabenda/core/consent.css` | 2.21 KiB | 5 KiB | Within target |
| `@notabenda/core/styles.css`, main component collection | 10.19 KiB | Report separately | Includes document/operator/form layouts, purpose authoring and optional catalog picker |
| `@notabenda/core/services`, model + render + local search | 10.68 KiB | Report separately | No reference dataset, Node or backend |
| `@notabenda/core/services.css` | 1.73 KiB | Report separately | Independent directory styling |

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

The configuration-file delivery path now supports `build --consent-runtime local|required`. CLI scenarios compare JSON, YAML, YML and Markdown output to the existing compiler, verify unchanged legal release manifests and exact consent-only CSS, and exercise actual local grant/withdrawal plus rejection of required descriptors without a receipt adapter. Invalid modes, omitted consent, unreviewed production content and oversized runtime inventories fail before output. Rebuilding an existing descriptor without an explicit mode fails without changing it or the legal output. This adds a data-file installation path; it does not lower the compatibility bundle's transfer size or establish deployment/enforcement correctness.

The 21 October scope-construction refinement preserves prior scope bytes while resolving and sorting managed services once per construction. The compiled local profile measures **15,360 bytes gzip**, required-receipt controls **19,256 bytes**, and compatibility core plus controls **28,726 bytes**. Consent CSS measures **2,840 bytes**. The compiled local profile is at its target with no remaining headroom; compatibility remains above target. The change improves a measured constructor substep, rather than reducing the compatibility transfer size. See [scope and returning-choice measurements](consent-performance.md#scope-construction-and-returning-choices).


The 21 October delivery refactor shares ordered, allowlisted purpose/service/storage projections between the full authoring path and the bounded browser descriptor. It also dispatches full-site translation bodies through their existing interface policies and resolves only the current receipt-status message when controls update. Complete public configuration, selected message output and compiled inventory were compared byte-for-byte with the preceding implementation for ordinary, saved-scope and combined localized configurations. The fixed preceding saved-choice fixture continues to exercise exact scope strings and grant recovery through both public factories. Required-evidence provenance and negative-choice behavior are unchanged.

With esbuild 0.28.2, ES2022 ESM minification and gzip level 9, compiled local plus native controls is **15,288 bytes** (72 bytes below the unchanged 15,360-byte target), required-receipt controls **19,200 bytes**, and compatibility core plus controls **28,449 bytes**. The preceding sizes were 15,360, 19,256 and 28,726 bytes respectively. These are small transfer-size reductions; compatibility remains above target and compiled headroom remains limited. Consent CSS is unchanged at **2,840 bytes**. This work does not establish faster browser startup or broader platform acceptance. The optional size gate continues to report failure for the compatibility target.

Verification for this refactor passed 1,333 package tests, 205 site tests, catalog checks and a Worker deployment dry run. Chromium's rebuilt local example started only Measurement after its deliberate granular grant, left Suggestions blocked and returned both to blocked after rejection without another sample request; captured console warnings/errors were empty. The 416 previously retained artifact files remained byte-identical. This browser check does not add a Safari, Firefox or physical-mobile acceptance claim.

## 23 October: localization dispatch cleanup

Full-site normalization previously called six interface selectors only to discard their selected metadata objects. It now checks each policy's missing-body diagnostic directly, then runs the same complete body validator. The standalone selectors share those diagnostics with their policies. Policy order, own-data-field checks, byte limits and public message ordering remain unchanged; generated Cloudflare copies retain the same source.

A comparison against the verified `838a057` package archive covered 493 cases: combined dictionaries, absent and malformed bodies, missing keys, invalid placeholders and markup, accessors, extra fields and metadata variations. Accepted serialized output and observed error names/messages matched. A regression fingerprint retains the combined public bytes; nested output edits remain separate from the input. This comparison covers these cases, rather than proving equivalence for every possible JavaScript value.

The same 18-profile measurement reports these changes in gzip bytes:

| Profile | Before | After | Change |
| --- | ---: | ---: | ---: |
| General consent plus controls | 28,449 | 28,268 | −181 |
| General headless consent | 25,031 | 24,847 | −184 |
| Service directory | 18,527 | 18,358 | −169 |
| Storage exceptions | 18,909 | 18,715 | −194 |
| Terms recovery | 4,155 | 4,182 | +27 |
| Collection flow | 10,690 | 10,727 | +37 |

Compiled local controls remain 15,288 bytes, compiled required-receipt controls 19,200 bytes and consent CSS 2,840 bytes. The general entry still exceeds its unchanged 15,360-byte target by 12,908 bytes; the size gate remains open. These are modest transfer-size changes, not evidence of faster page startup or broader browser acceptance.

## 23 October normalization-reuse investigation

A temporary prototype reused the complete results of seven optional policy normalizers between full site validation and public projection. It retained validation order, cross-field checks and the public validation-result shape. General-entry gzip changed from **28,268 to 28,244 bytes**, a 24-byte reduction; localization-only and storage-exception-only variants saved three bytes and one byte respectively. None meets the original target.

For ordinary data, 2,592 malformed-leaf comparisons matched validation results and errors. Three valid fixtures retained serialized public output, ordering and separate-call mutation isolation. Repeated local Node measurements found about 0.09–0.11 ms less construction time for richer localized fixtures; the basic fixture stayed within measurement noise. These synthetic CPU measurements do not establish browser startup or interaction performance.

The prototype was rejected after two independently reproduced counterexamples. A root getter can supply a valid policy during validation and an invalid replacement during projection. A later document-field getter can also mutate the original policy body without changing its identity. The existing projection rejects both; unconditional reuse accepts them. Reference equality is insufficient to preserve this behavior. Regression tests cover both changes in preview and production modes. All four tests pass the current implementation and fail against the rejected prototype. No normalization reuse or weaker validation was shipped, and the general-entry size gate remains open.


## 23 October: public composition and portable reports

Run `node scripts/measure-bundles.mjs --explain` after building the packages. The optional explanation bundles three additional groups of real public exports and lists each input's minified contribution to the general controls bundle. `--json --check --explain` emits the same data and still exits nonzero when an original budget is missed. The explanation groups are reported separately and do not replace or change any budget. No implementation is stubbed or omitted for these measurements. Reports include the Node/platform versions, compression-library version and SHA-256 of each uncompressed profile.

At committed baseline `b64201e`, Node 26.10.0 with zlib 1.2.12, esbuild 0.28.2 and gzip level 9 produced:

| Public exports | Gzip bytes |
| --- | ---: |
| `validateSiteConfig` | 13,858 |
| `toPublicConfig` | 14,973 |
| `toPublicConfig` and `mountControls` | 19,213 |
| `createConsent` and `mountControls` | 28,268 |

The current full-site validation/projection plus controls already exceeds the unchanged 15,360-byte target by 3,853 bytes before adding the consent engine and receipt session. The general entry's gap remains 12,908 bytes. Shared dependencies and gzip dictionaries mean these independently bundled values are **not additive**. They describe the current factoring, not a theoretical lower bound or evidence that no redesign could meet the target. Minified input contributions are raw output bytes, not per-module gzip costs.

An independent Astra review found no demonstrated, maintainable reduction of at least 1 KiB that preserves the complete current synchronous API. Full site validation and public projection remain reachable; optional receipt support is also reachable through the general controller's options. No substantial accidentally retained implementation was identified. The prior normalization-reuse counterexamples and rejected compact representations remain relevant to a larger redesign. No runtime change, removed validation, target increase or size-gate pass follows from this investigation.

A separate reproduction found that running the measurement script from a different directory changed input paths in its JSON report, including developer-directory components, while transfer sizes stayed equal. Bundling now sets the project working directory explicitly. On the same runtime and built inputs, the report is byte-for-byte stable when invoked from a separate temporary directory. Its input paths remain project-relative. Regression checks cover the explanatory public imports, actual graph contributions, unmodified default profiles/budgets and the failing `--check` exit status. This is deterministic build-reporting evidence, not a browser performance or secret-absence claim. Compiled local controls remain 15,288 bytes, required-receipt controls 19,200 bytes and consent CSS 2,840 bytes.


A cross-toolchain check initially failed when it compared gzip counts from Node 22 against a prior Node 26 report. Repeating the measurement with content digests confirmed that all 18 ordinary JS/CSS profile contents were byte-identical; the compression-library results differed:

| Profile | Node 26.10.0 / zlib 1.2.12 | Node 22.22.0 / zlib 1.3.1-470d3a2 |
| --- | ---: | ---: |
| Compiled local controls | 15,288 | 15,336 |
| Compiled required-receipt controls | 19,200 | 19,269 |
| General controls | 28,268 | 28,327 |
| Consent CSS | 2,840 | 2,842 |

The supported Node 22 release toolchain therefore leaves only **24 bytes** of compiled-local headroom and a **12,967-byte** general-entry gap. Its `--check` still exits 1. Node 22 measures validation at 13,929 bytes, public projection at 15,042 and projection plus controls at 19,273. These differences do not represent changed package code or faster/slower browser execution. Compression counts must be compared with their recorded runtime/library versions; equal uncompressed SHA-256 values identify unchanged profile content. No target has changed, and the size gate remains open on both toolchains.
