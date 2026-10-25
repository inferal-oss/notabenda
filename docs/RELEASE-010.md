<!-- @requirements REQ-PRODUCT-RELEASE-CANDIDATE REQ-PRODUCT-SOURCE-CANDIDATE -->
# Preparing 0.1.0

The first npm release is being prepared as a developer preview. No packages have been published. Finish release hardening before expanding the pack library; the [full plan](PLAN.md) and [feature catalog](FEATURES.md) retain their broader scope.

The user-approved unreleased primary API change requires build/SSR compilation of browser consent descriptors. Root/headless `createConsent` and both React adapters now expose the narrow controller contract; the full-site factory is an explicit `@notabenda/core/consent/compat` migration path. See [browser configuration](BROWSER-CONFIG.md) and [migration limits](MIGRATION.md#unreleased-browser-api-migration). Approval of this API change does not close the measurement gate: fresh primary-entry results on the chosen source remain pending.

The [draft release notes](../CHANGELOG.md) describe the preview for adopters. They remain unreleased while the gates below are open.

## What the release contains

| Package | Included surface |
| --- | --- |
| `@notabenda/core` | Site configuration; privacy/cookie/terms rendering; native/headless controls; current optional React/Astro adapters; installed packs, discovery, CLI and agent integration. |
| `@notabenda/authoring` | Build-time Markdown/MDX with YAML frontmatter, retained sources and the supported authoring helpers. Trusted MDX remains executable build code. |
| `@notabenda/cloudflare` | Optional host-authorized records, retained revisions/diffs, backoffice, starter and diagnostic tools. The host supplies authentication, identity, application behavior and operational policies. |

The installed 21-pack registry defines available setup jobs. A pack can organize a partial mechanism or review guide; selection is not legal applicability, installation evidence or a full jurisdiction implementation. Do not present unfinished rights fulfillment, marketing approach history, customer exceptions, real-provider delivery or certification as included automation. The commercial hosted service, billing and additional packs remain separate work.

## Release gates

These gates remain separate. Earlier successful checks do not approve changed source or artifacts, and package publication still requires an explicit decision.

| Gate | Evidence needed | Current boundary |
| --- | --- | --- |
| Source and scope | Reviewed commit, clean candidate source, exact package exports and public scope notes | Build from committed source; exclude unrelated unfinished edits. |
| Functional checks | Applicable package/site tests, catalog checks, Worker dry run and retained-file comparisons | Run for the final commit; retain failures and subsequent verification separately. |
| Distribution | Two equal source-built archives, isolated installed consumer and independently installed starter | [Source candidate](SOURCE-CANDIDATE.md) provides this workflow; preparing it alone is not a browser or deployment pass. |
| Dependency security and licenses | Dated advisory review, necessary fixes and packaged attribution/license review | The [Miniflare client fix](verification/toolchain-dependencies.md) addresses selected known issues. The [distribution license review](verification/distribution-licenses.md) checks package notices and corrects missing website/example license texts; broader security/content review remains required. |
| Private-content boundary | Inspect actual archives and deployment assets for secrets, private reports, private source and non-synthetic examples | The [dated content review](verification/release-candidate.md#23-october-public-content-review) covers actual archives/output, public JSON/ZIP contents, OCR of 132 screenshots and nine manual image inspections. Recheck changed bytes; this does not establish complete secret absence. |
| Browser and accessibility | Complete the planned keyboard, zoom, long-text/RTL, failure/recovery and mobile/platform acceptance | Selected Chromium/Safari observations exist. Physical iOS/Android and assistive-technology acceptance remain open; see [accessibility](verification/accessibility.md) and [consent checks](verification/consent-browser.md). |
| Browser footprint | Pass the existing size budgets on the chosen source | The primary API now requires compiled configuration. The [24 October measurement](verification/browser-delivery.md#24-october-compiled-configuration-is-the-primary-browser-api) is 15,347 bytes gzip against the unchanged 15,360-byte target on Node 22. Explicit full-input compatibility and required-receipt profiles remain separately reported. Recheck the final committed source; physical/browser acceptance remains separate. |
| Backend adoption | Generated starter default denial, real runtime, host authorization, lifecycle/recovery and migration checks | Existing scoped rehearsals are evidence for their scenarios, not arbitrary adopter or fresh-account acceptance. |
| Publication | Confirm registry access, final version/changelog/tag, intended archives and publication order | Core must be available before authoring resolves its matching core dependency. Publish no package during candidate preparation. |
| Registry installation | Install the published versions in a clean consumer and starter; verify imports, CLI, documents and default denial | Cannot be completed before publication. Report and remediate failures explicitly. |

## Order of work

1. Finish the current source-linked guidance and commit its verified changes.
2. Resolve dependency findings, complete archive/content review and address the outstanding browser-footprint target.
3. Complete the planned browser/accessibility checks and fix observed failures. Keep inaccessible physical-device evidence marked missing.
4. Build a final exact-source candidate, review supported scope and prepare release notes.
5. Obtain the separate publication decision, publish the reviewed packages, then perform clean registry-install checks.

This list does not remove the original acceptance requirements or declare the preview production-ready. Passing a technical gate is not legal review. Research additions and proposed future APIs do not need to become new packs before this release.
