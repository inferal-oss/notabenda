# Discovery, on your terms

Requirements: `REQ-PRODUCT-DISCOVERY`, `REQ-AU-PIXELS`.

Discovery helps compare observations with the site inventory. It is optional standalone tooling: capture in your own browser, review locally, and decide which findings need investigation. Adopters choose whether to use CI or deployment gates. Nothing automatically changes config, grants permission, classifies a vendor as necessary or uploads a report.

Try [the working example](/discovery). It uses fictional local storage: allow sample memory, capture, withdraw, and capture again. The example explicitly selects its current preview observation origin and preserves the configured fictional deployment separately; your own deployment should declare the real site origin in its config.

## Capture in a browser

```ts
import {captureDiscovery, analyzeDiscovery} from 'notabenda/discovery';

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
import {mountDiscovery} from 'notabenda/discovery/ui';
import 'notabenda/styles.css';

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
npx notabenda discover --config notabenda.config.json --capture capture.json
npx notabenda discover --config notabenda.config.json \
  --capture initial.json --capture rejected.json --capture allowed.json \
  --out-dir discovery-review
# Machine-readable output, when you explicitly want it:
npx notabenda discover --capture capture.json --json
```

The command reads explicit local JSON inputs; it does not crawl, launch a browser or execute project modules. Supply 1–20 version-1 capture files, each up to 1 MiB, and a JSON inventory up to 512 KiB. By default captures must match the configured site’s exact origin, including scheme/port. For a deliberate staging or loopback review, supply `--capture-origin http://127.0.0.1:4179` (or `captureOrigin` in the analysis/UI options). Both `configuredOrigin` and `observedOrigin` remain explicit in the report, and captured origins are never relabelled as production. An override is an operator scope decision, not evidence that the environments behave alike.

Optional output requires a **new** directory. It writes `discovery.private.json`, `review.txt` and a `.gitignore`, using private permissions where supported. Existing paths, including symlinks, are not overwritten. Default output is human-readable; `--json` prints the private review. Review terminal/CI log access before choosing machine-readable output. This workspace remains unpublished: use `node packages/notabenda/dist/cli.js discover ...` after building for local development.

## What a candidate means

The report preserves each capture's time, origin, route/scenario labels, API access status and omitted counts. Network/reference origins are compared with declared `services.resourceOrigins`, resolving `self` to the configured site origin. Several services can match one origin. Storage uses exact type/name matches against the inventory and can also have several candidates. Declared purpose IDs follow only from those matched services. The tool does not guess vendors or legal bases from domain names.

Unmapped first-party observations still require investigation; first-party does not mean necessary. A matched name/origin does not establish ownership or permission. No score, exemption or supported-jurisdiction claim is produced. OAIC recommends ongoing tracking-technology review; this tool supplies limited inventory observations, rather than completing Australian notice, sensitive-data consent or other obligations. [OAIC guidance](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/tracking-pixels-and-privacy-obligations).

Capture work is bounded to 2,000 resource entries, 5,000 DOM elements, 500 aggregated origin/type groups per category and 200 names per accessible storage type. Long/invalid names are omitted with a count. “Available” means the API was readable, not that all tracking was observable. “Limited,” “unavailable,” or an empty capture never establishes absence of tracking. Repeated snapshots remain separate observations; their counts must not be summed as unique requests.

The [shared service catalog](SERVICE-CATALOG.md) now provides reference search and static project discovery through `notabenda discover --project DIRECTORY`, without requiring a site config. The current browser matcher remains origin/name-only; catalog-backed browser and combined signatures are still planned. Existing browser captures and their privacy limits remain unchanged.
