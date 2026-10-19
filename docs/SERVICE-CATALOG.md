# Shared service catalog and passive detection

## Search a project with npx

After installing the preview package, run `npx notabenda discover --project . --out-dir ./service-review`. The scanner searches supported npm dependencies, JavaScript/TypeScript imports, Python package declarations and Terraform names against the same product identifiers used by setup and the service directory. It does not execute project code, install dependencies, send requests or infer production use. Review its private output, then explicitly select confirmed services in setup. A dependency can be unused, development-only or a self-hosted integration; unsupported languages and dynamic configuration can be missed.

For a single interactive workflow, run `npx notabenda wizard --project . --out-dir ./setup-review`. After purpose authoring, detected candidates open the same explicit actual-use review as catalog search. Noninteractive `--answers` runs save the scan without selecting services. An optional `--catalog FILE` selects the scanner/search reference; the default seed remains lazy unless requested. Findings stay in a separate ignored `discovery.private.json`, and existing reviewed pins do not refresh from a new scan. See [guided setup](SETUP.md#find-project-services-during-setup).

Reference catalog and static project discovery preview. Requirements: `REQ-PRODUCT-SERVICE-CATALOG`, `REQ-PRODUCT-SERVICE-DETECTION`. Normalization/search, explicit service draft selection, an optional offline seed and static project discovery are implemented. Shared public directory rendering is available from the declared inventory. CLI/admin setup now offers explicit catalog selection with private pinned review notes. Optional bounded browser signatures and local review are implemented; automatic archival of catalog provenance remains planned. The existing service inventory, privacy provider lists, cookie storage table and origin/name-only browser discovery remain available.

A versioned catalog should connect service selection, discovery, disclosures and operator review. A site selects and confirms its own use of a service; the catalog supplies reusable facts and technical recognition rules. It covers hosting, identity, payments, support, media and other recipients as well as analytics and advertising.

## Implemented preview APIs

Install the locally packed developer-preview package first; it is not published on npm yet. These commands then use that installed package:

```sh
npx notabenda catalog search email --delivery backend
npx notabenda catalog search stripe --json
npx notabenda discover --project .
npx notabenda discover --project . --out-dir ./service-review
```

From this repository after `npm run build`, use `node packages/notabenda/dist/cli.js` in place of `npx notabenda`. `--catalog FILE` selects a custom version-1 JSON catalog for either command. Catalog search accepts `--delivery browser|backend|infrastructure` and `--limit 1–100`; project scan deliberately rejects browser capture/config flags. No site config is needed for reference search or static scanning.

The seed has 363 provider identities and 402 product/reference entries, including 39 original backend/provider references, three additional browser-product references and 2,278 imported storage hints. The imported names are reference labels, not verified legal entities. Backend sources explicitly have `access: reference-only` and `checkedOn: null`; recorded homepages do not establish provider-practice verification. Upstream cookie categories and retention are reported hints, not site configuration defaults.

```ts
import {
  normalizeServiceCatalog, searchServiceCatalog, createCatalogServiceDraft,
} from 'notabenda/catalog';
import {serviceCatalogSeed} from 'notabenda/catalog/seed';

const catalog = normalizeServiceCatalog(serviceCatalogSeed);
const candidates = searchServiceCatalog(catalog, 'stripe', {delivery: 'backend'});
const draft = createCatalogServiceDraft(catalog, 'stripe-payments', {
  id: 'payments', purposeIds: ['checkout'], location: 'Your selected deployment',
});
// Review actual provider entity, purposes, settings, location and privacy link.
// draft.service is ordinary inventory data; draft.catalogSelection is a separate
// detached snapshot for your review/export. Neither is written or activated.
```

`notabenda/catalog/project` exports the Node-only `scanProjectServices(directory, catalog)` API. The optional seed is absent from normal consent graphs. The published schema is available at `notabenda/catalog/schema.json` and [/schemas/service-catalog-v1.json](/schemas/service-catalog-v1.json). Cross-reference/identity and resource checks additionally run in the normalizer.

Static scan recognizes declared npm dependencies, JavaScript/TypeScript module imports, Python requirements/imports and Terraform resource/data names. It labels development dependencies separately. Generic drivers, self-hosted software, commented imports and unused dependencies remain candidates. It does not establish deployed services. Docker identifier matching is available for custom catalog rules; the current seed has no reviewed Docker signatures. Optional browser path/global/combined signatures are described in [the discovery guide](DISCOVERY.md); additional language/config-file detectors remain planned.

Git projects use Git's ignored-file selection with filesystem monitoring disabled; failure to obtain that selection does not fall back to scanning ignored files in an identifiable repository. Non-Git projects use documented built-in skips. The scan excludes secret-named files, symlinks, dependency/generated directories and unsupported extensions. Limits are 5,000 selected files, 256 KiB per file, 32 MiB total read data and 20,000 distinct identifier tokens, with explicit limited coverage. It stores matched file/rule/known identifier references, never source snippets, dependency values, credentials or project execution results. Output paths and identifiers can still reveal private structure.

`--out-dir` requires a new directory and writes a private review JSON, text and `.gitignore`. Scanning does not execute project modules, SDKs, installers or network probes. It leaves configuration unchanged, keeps findings local and leaves CI policy to the adopter. Catalog-selection snapshots are not yet automatically joined to immutable legal-release provenance. See [verification](verification/service-catalog.md).

The [service directory guide](SERVICES.md) covers the shared native/React/Astro renderers, local search, themes and retained-inventory views. A reviewed `draft.service` can be added explicitly to the site configuration; the directory never imports or publishes the reference seed.

The [setup guide](SETUP.md) covers purpose authoring and the CLI/admin selection flow. A fresh setup can declare actual processing purposes before selecting services, with unresolved basis/retention text retained as production-blocking draft placeholders. `notabenda/catalog/selection` exports explicit draft selection and private pin validation; `notabenda/catalog/ui` supplies the optional local picker. These are separate from automatic catalog provenance archival in legal releases, which remains planned.

## Design direction

The sections below describe the broader catalog workflow; the preview above implements its first building blocks.

## The shared model

| Layer | Information | Ownership |
| --- | --- | --- |
| Provider | Stable ID, public name, official website, policy/documentation links, aliases | Catalog facts with sources |
| Product/service | Stable ID, provider reference, short original description, product variants, documented capabilities and possible data/storage patterns | Versioned catalog entry |
| Site use | Selected product/version/profile, actual purpose IDs, configured processing activities, relevant provider entity/role, destinations, data categories, retention and settings | Explicit operator declaration |
| Recognition rule | Stable rule/revision, required observations, match strength, explanation, positive and negative fixtures | Reviewed catalog data or separately trusted detector code |
| Observation | Rule/catalog revision, scenario/time, observed signal kind, coverage and omitted/ambiguous signals | Private discovery evidence, subject to review |
| Released disclosure | Reviewed, resolved public service facts and rendered output | Immutable site release and existing history |

Keep a provider's products distinct. Finding a shared provider domain does not identify every product that could use it. A product's capabilities do not establish which features, purposes, retention periods or contractual entity apply to this installation. Service references must coexist with entirely custom services and operator overrides.

Use a published, versioned JSON schema; maintainer-friendly YAML may compile into it. Give individual claims source URLs, checked dates and review/unknown status. Keep catalog entry IDs stable through renames and preserve aliases, deprecations and replacement information. Record origin and license/attribution for imported data. Localized original descriptions can be added without copying policy text.

## Recognition rules

Support a bounded declarative rule language first:

- Exact hosts and explicitly delimited subdomains; optional scheme, port and resource-type restrictions.
- Exact or prefix paths, exact storage names and simple wildcard/prefix patterns.
- Passive DOM markers and own data-property presence checks for known globals; do not invoke getters, SDK methods or page functions.
- Any/all combinations of independent signals, with a minimum evidence strength and a plain explanation of each matched clause.
- No arbitrary regex or executable rule payloads. A future regex extension would require a proven linear subset or non-backtracking engine; limiting pattern/input lengths alone does not prevent catastrophic backtracking.

More complex detectors can be host-installed, reviewed modules operating on a bounded observation interface. Catalog JSON must never carry arbitrary JavaScript for evaluation. Any advanced executable/regex extension needs enforceable isolation, termination and resource limits; an asynchronous timeout cannot interrupt a synchronous main-thread loop. A detector must not load a vendor, initialize an SDK, create tracking storage, or make probe requests to see whether the service exists.

Distinguish references/configuration, attempted resources and observed storage. An inert script reference is not a loaded SDK; a buffered resource entry does not prove delivery; an old cookie does not prove current execution. Preserve conflicting candidates instead of forcing one label. A CDN, tag manager or common cookie name alone is weak evidence. First-party proxies, self-hosting, CNAMEs, server-only services and unavailable browser APIs need explicit limits and manual declaration.

Useful first rules include common analytics loaders, tag managers, video embeds, payment widgets, support chat, error reporting and challenge widgets. Each rule needs real source research, positive fixtures and confusers/negative fixtures before shipping. Products sharing a loader host need discriminating evidence; do not invent product certainty from a host match.

## Privacy and existing capture compatibility

Keep version-1 captures unchanged. They retain origins and storage names, and can support only rules justified by those fields. They cannot retrospectively identify a path-specific loader.

A separately versioned richer capture can match transient script/request paths locally and retain the rule ID and a minimized signal explanation. Query values, account/container IDs, URL credentials/fragments, storage values, request bodies and headers must not enter ordinary exported captures. Any specific parameter discriminator should emit a predefined product class, never its raw value. Catalog matching is still untrusted observation, not proof of a human action, necessity, exemption, legal basis or permission. Record which catalog revision interpreted the evidence; reject incompatible or unknown rule references rather than silently reinterpreting a historical result.

## One review workflow, several views

1. Search/select a product manually, or run explicitly invoked discovery.
2. Show candidates with matched evidence, strength, confusers and unavailable coverage. Let the operator confirm, reject or add a custom service.
3. Ask for actual site use, settings and private justification; link relevant `REQ-*` obligations and unresolved fields.
4. Generate a reviewable inventory change. Never activate integrations, grant permission or publish legal text from detection alone.
5. Render the confirmed inventory as a public third-party directory, privacy-page provider sections, cookie inventory and preference details. Use the same headless model with native, React and Astro renderers.
6. In admin, search providers/products/aliases, inspect sources and stale facts, compare previous selections and follow retained releases. Keep unknown observations visible.

Public presentation should explain what the site uses, why, relevant data/storage, and the provider's privacy link. It should contain selected, resolved site facts, not the entire reference database. Mobile cards/disclosures and keyboard-accessible details should match the current design system. Operator views should prioritize actionable review and evidence over raw tables.

Resolve and snapshot the selected catalog facts during build/review. Pin entry and detector revisions and retain provenance alongside release history. Catalog updates produce a reviewable diff; they never silently rewrite existing published policies. Existing material-scope semantics determine when a confirmed change invalidates a grant. A recognition-rule-only correction does not itself change a site's declared processing.

## Distribution and seed strategy

Keep the large reference data and operator matcher out of ordinary consent bundles. Selected service facts compile into public output; discovery/admin load only the catalog they need. Support offline pinned data, custom entries and extensions; no mandatory hosted catalog request or vendor-controlled remote UI.

Start with a curated cross-category set, then expand through a reproducible import/review pipeline. Imported cookie rows are candidates for storage patterns, not automatically complete service descriptions or approved legal classifications. Backend-only recipients need manual setup even when browser discovery finds nothing.

Sources checked on 19 October 2026:

- [Open Cookie Database](https://github.com/jkwakman/Open-Cookie-Database) distributes cookie metadata as CSV and is a useful seed candidate. Its [repository license](https://github.com/jkwakman/Open-Cookie-Database/blob/master/LICENSE) is Apache-2.0. Pin an exact revision, preserve notices/attribution and validate imported fields; do not inherit a category as a site's legal conclusion.
- [DuckDuckGo Tracker Radar's data license](https://github.com/duckduckgo/tracker-radar/blob/main/LICENSE) is CC BY-NC-SA 4.0. Do not silently merge that data into a generally commercially reusable Apache-2.0 catalog. Separately licensed detector software does not change the data's license.
- The existing IAB/TCF research remains advertising-specific. A general service inventory or detection entry does not provide TCF registration or CMP certification; those remain a deferred feature.

The current optional seed imports pinned Open Cookie Database metadata and adds original backend/provider reference candidates. All seed entries remain unreviewed. Details, attribution and source hashes are in [the data record](../catalog/README.md).


## Implementation order and acceptance

1. Catalog schema/normalization, source/entry revisioning and a small researched seed; selection resolves into the existing site inventory.
2. Shared public directory/provider rendering and config authoring, including optional product profiles, overrides, unknowns and immutable release tests.
3. Passive declarative matcher with exact, wildcard and combined rules; compatible version-1 analysis plus explicitly versioned richer captures.
4. CLI/admin setup and discovery review, proposed changes and explanatory match details; maintain the same source-linked review model.
5. Reproducible licensed imports and broader seed coverage, deprecation/staleness review and regression fixtures per rule.

Verify false positives and shared hosts, bounded/hostile rules, normalization and escaping, old-capture compatibility, absent/blocked APIs, signal/value minimization, no probe execution/network/storage writes, review-before-apply, custom entries, offline operation, render parity, selected-only browser graphs, pinned revisions and unchanged historical documents. Legal and operational review remain separate from those engineering checks.
