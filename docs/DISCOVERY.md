# Inspect browser resources and storage

Requirements: `REQ-PRODUCT-DISCOVERY`, `REQ-AU-PIXELS`.

Capture the current page's resource references and accessible storage names, then compare them with your declared inventory. For dependency and infrastructure references, run `npx @notabenda/core discover --project . --out-dir ./service-review` from your project folder. Use both views when reviewing providers: a browser capture cannot inspect your backend source, and a source match does not prove that a service runs in production.

## Optional provider recognition

The catalog also supports [project discovery](SERVICE-CATALOG.md) and an optional browser recognizer (`REQ-PRODUCT-SERVICE-DETECTION`). Neither changes the site's inventory automatically.

```ts
import {captureBrowserCatalog, analyzeBrowserCatalogCapture} from '@notabenda/core/catalog/browser';
import {browserCatalogSeed} from '@notabenda/core/catalog/browser/seed';

// Run from an operator tool, after choosing the scenario to capture.
const captured = captureBrowserCatalog(
  {routeLabel:'Landing', scenario:'Rejected optional'}, browserCatalogSeed,
);
const candidates = analyzeBrowserCatalogCapture(captured);
```

The optional seed contains nineteen original rules for sixteen products. It covers the documented browser references below. Each rule records the official technical references used to author it. All catalog entries remain unreviewed; checking a documented technical signature does not verify provider practices or determine appropriate processing purposes.

### Which browser services can it recognize?

| Service | Recognized reference |
| --- | --- |
| Google tag | The `gtag/js` loader plus the `gtag` function. Destinations remain unknown. |
| Google Tag Manager | The container script or frame path. The container’s tags are not inspected. |
| Stripe | Its documented script host and loader paths. No payment action is inferred. |
| Cloudflare Turnstile | The widget loader, or a class marker together with its API object. |
| Intercom | Its widget loader plus the `Intercom` queue/function. |
| PostHog | A supported cloud loader, or a cookie-name pattern together with the API object. |
| Segment | Its CDN loader path together with the `analytics` queue/object. |
| Sentry | Its public-key-derived loader and listed CDN bundle paths. Enabled SDK features remain unknown. |
| Datadog RUM | Its browser-agent host and RUM loader filename. The pattern does not validate region or version. |
| Zendesk Web Widget | The widget snippet. Classic versus messaging features remain unknown. |
| Cloudflare Web Analytics | Its performance-beacon loader. No hosting product or account configuration is inferred. |
| Plausible | The current site-specific `pa-…js` loader and archived legacy script families. Enhanced settings remain unknown. |
| Fathom | Its CDN script. Site identifiers and script settings are not read. |
| Umami Cloud | The cloud script. Arbitrary self-hosted or renamed paths are outside this rule. |
| Microsoft Clarity | Its tag prefix together with the `clarity` queue/function. |
| Crisp | Its chatbox loader together with the `$crisp` queue/object. |

The sources are pinned with each rule snapshot; the [source index](requirements/SOURCES.md) records the selected first-party references. Script URLs, code images and technical guides establish recognition patterns only. A “matched” result means the declared signature matched, not that an SDK ran, sent data or qualifies for an exemption. A global queue alone remains a partial hint.

For source-project discovery, the shared catalog also recognizes the officially documented `@microsoft/clarity`, `@plausible-analytics/tracker` and `crisp-sdk-web` npm identifiers. Run `discover --project` for those declarations and imports; a browser capture cannot inspect the project filesystem.

Resource rules match HTTPS/default-port URLs without credentials, exact lowercase hosts (or explicitly enabled label-bound subdomains), resource type and an optional path on **the same observation**. Paths are case-sensitive parsed URL pathnames without percent-decoding. Supported patterns are exact, prefix and anchored single-wildcard matching: `*` matches zero or more characters, including `/`. Path prefixes must end with `/`. Arbitrary regex, code, selectors and probes are unsupported. Storage rules inspect accessible names only. Global rules inspect named top-level own data descriptors for object/function presence, skipping getters and never invoking SDK methods. DOM markers use a fixed tag and class token.

Rules combine signals using alternatives of required conditions. Conditions can come from different observations within one bounded capture; this does not establish simultaneous activity or causality. A marker or bootstrap stub alone can be a partial hint. Google tag's shared delivery host does not identify its Analytics/Ads destinations. Custom hosts, proxies, persistence settings and backend integrations can be missed.

One capture pass produces the unchanged version-1 origin/name aggregates and minimized witnesses containing only rule ID, signal ID, channel and count. Recognition retains no additional observed URL paths, query values, storage values, DOM contents or global contents. The embedded version-1 origins, storage names and operator labels can still contain identifiers. Keep downloads private and inspect before sharing.

`catalog-browser-capture` is a separate kind with its complete evaluated rule/catalog/source snapshot and matcher version. Analysis uses that snapshot, preserving historical interpretation; a revision label does not authenticate it. Supply `expectedRules` to compare complete metadata against a separately trusted snapshot. Unknown versions, duplicate/dangling witnesses and incompatible channels are rejected.

Snapshots are limited to 512 KiB, 100 rules, 256 total signals, 16 signals per rule and eight alternative groups per rule. Matching stops at 100,000 comparisons and skips URLs/class strings over 4,096 characters. Capture normalization is capped at 2 MiB. The baseline discovery limits still apply. Coverage reports available/limited/unavailable channels; none establishes complete visibility or absence of tracking.

To add catalog review to the existing UI, pass `browserRules: browserCatalogSeed` to `mountDiscovery`. It exposes `getCatalogReport()` plus separate catalog-capture and rule-snapshot downloads. Its new local search, status filters, native condition disclosures and source links preserve the captured report. The seed remains an explicit import outside normal visitor consent bundles.

```sh
npx @notabenda/core catalog detect --capture notabenda-catalog-capture.json --out-dir ./browser-review
npx @notabenda/core catalog detect --capture notabenda-catalog-capture.json --rules trusted-rules.json --json
```

The CLI reads one explicit local capture, never launches a browser, and creates a new private output directory without overwriting existing files. Old version-1 captures can be analyzed with the packaged seed or `--rules FILE`, but contain no paths, globals or DOM markers; only origin-only rules and storage-name signals can contribute. This retrospective mode is explicitly labeled. Review remains separate from setup selection, permission and publication.

Discovery helps compare observations with the site inventory. It is optional standalone tooling: capture in your own browser, review locally, and decide which findings need investigation. Adopters choose whether to use CI or deployment gates. Nothing automatically changes config, grants permission, classifies a vendor as necessary or uploads a report.

Try [the working example](/discovery). It uses fictional local storage: allow sample memory, capture, withdraw, and capture again. The example explicitly selects its current preview observation origin and preserves the configured fictional deployment separately; your own deployment should declare the real site origin in its config.

## Capture in a browser

```ts
import {captureDiscovery, analyzeDiscovery} from '@notabenda/core/discovery';

// Invoke deliberately in an authorized developer/operator context.
const capture = captureDiscovery({routeLabel:'Public landing', scenario:'Rejected optional'});
const review = analyzeDiscovery(siteConfig, [capture]);
```

Imports are browser/SSR safe. Actual capture requires an HTTP(S) document; it does not run on import. `routeLabel` and `scenario` are operator-supplied context, without automatic URL-path collection. A scenario label does not prove an action happened or isolate requests made after that action. Use a fresh browser context and a network inspector to test initial load, reject, granular grant, reload and withdrawal separately.

The capture contains origins and initiator counts from the **currently buffered Resource Timing entries**, declared DOM resource/hint origins, and accessible cookie/localStorage/sessionStorage **names only**. Paths, query strings, fragments, URL credentials, headers, bodies, form contents, storage values, IP addresses and user agents are not included. Storage names, origins and operator labels may still be sensitive; inspect files before sharing.

Resource Timing is not a full network log. Its entries may include cached/aborted fetches, exclude blocked/in-flight requests, and overlap across captures. Buffers can already have lost entries before capture. Frame internals, worker activity, server-side tracking and redirects are not fully covered. See the [W3C Resource Timing draft](https://www.w3.org/TR/2026/CRD-resource-timing-20260901/), especially resources included, cross-origin restrictions and buffer behavior.

DOM inspection covers script/image/frame/media/object sources, selected image `currentSrc`, stylesheets, and preload/modulepreload/prefetch/preconnect/dns-prefetch/prerender hints. It records reference origins, not proof of execution or a network request. Unselected `srcset`/picture candidates, CSS URL parsing, inline code, nested browsing contexts and shadow trees are outside this baseline. Cookie scope/partition/HttpOnly restrictions and IndexedDB/caches are outside storage coverage.

## Optional local review UI

```ts
import {mountDiscovery} from '@notabenda/core/discovery/ui';
import '@notabenda/core/styles.css';

const tool = mountDiscovery(document.querySelector('#developer-tools')!, {
  config: siteConfig,
  routeLabel: 'Public landing',
  scenario: 'Initial load',
});
tool.getReport(); // detached current report, or undefined before capture/after editing
tool.destroy();
```

The UI reads only after its explicit capture action. It creates local JSON download links for a capture and a private review, shows searchable/type-filtered candidate mappings and coverage limits, and revokes downloads when labels change, a capture fails, the review is cleared or the UI is destroyed. It stores no report in browser persistence and sends no requests. Host authorization and placement belong to the integrating application; do not expose an operator tool on a real public page merely because the synthetic example is public.

## Review through the CLI

```sh
npx @notabenda/core discover --config notabenda.config.json --capture capture.json
npx @notabenda/core discover --config notabenda.config.json \
  --capture initial.json --capture rejected.json --capture allowed.json \
  --out-dir discovery-review
# Machine-readable output, when you explicitly want it:
npx @notabenda/core discover --capture capture.json --json
```

The command reads an explicit local [site configuration](CONFIGURATION-SOURCES.md) and JSON capture inputs; it does not crawl, launch a browser or execute project modules. Supply 1–20 version-1 capture files, each up to 1 MiB, and an inventory up to 512 KiB. By default captures must match the configured site’s exact origin, including scheme/port. For a deliberate staging or loopback review, supply `--capture-origin http://127.0.0.1:4179` (or `captureOrigin` in the analysis/UI options). Both `configuredOrigin` and `observedOrigin` remain explicit in the report, and captured origins are never relabelled as production. An override is an operator scope decision, not evidence that the environments behave alike.

Optional output requires a **new** directory. It writes `discovery.private.json`, `review.txt` and a `.gitignore`, using private permissions where supported. Existing paths, including symlinks, are not overwritten. Default output is human-readable; `--json` prints the private review. Review terminal/CI log access before choosing machine-readable output. This workspace remains unpublished: use `node packages/notabenda/dist/cli.js discover ...` after building for local development.

## What a candidate means

The report preserves each capture's time, origin, route/scenario labels, API access status and omitted counts. Network/reference origins are compared with declared `services.resourceOrigins`, resolving `self` to the configured site origin. Several services can match one origin. Storage uses exact type/name matches against the inventory and can also have several candidates. Declared purpose IDs follow only from those matched services. The tool does not guess vendors or legal bases from domain names.

Unmapped first-party observations still require investigation; first-party does not mean necessary. A matched name/origin does not establish ownership or permission. No score, exemption or supported-jurisdiction claim is produced. OAIC recommends ongoing tracking-technology review; this tool supplies limited inventory observations, rather than completing Australian notice, sensitive-data consent or other obligations. [OAIC guidance](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations).

Capture work is bounded to 2,000 resource entries, 5,000 DOM elements, 500 aggregated origin/type groups per category and 200 names per accessible storage type. Long/invalid names are omitted with a count. “Available” means the API was readable, not that all tracking was observable. “Limited,” “unavailable,” or an empty capture never establishes absence of tracking. Repeated snapshots remain separate observations; their counts must not be summed as unique requests.

The [shared service catalog](SERVICE-CATALOG.md) now provides reference search and static project discovery through `notabenda discover --project DIRECTORY`, without requiring a site config. The baseline browser inventory remains origin/name-only. The optional provider recognizer described above uses a separate versioned capture with path, global, marker and combined signals; it does not add those signals to legacy captures. Existing privacy and visibility limits still apply.

For .NET projects, the same `discover --project` command reads selected NuGet project, central-package and legacy XML declarations. See [supported inputs and limits](SERVICE-CATALOG.md#net-nuget-projects); a central package listing does not establish a project dependency.
