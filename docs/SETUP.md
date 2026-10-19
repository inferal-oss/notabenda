# Guided setup

Run `npx notabenda wizard` after installing the package, or use the [demo setup screen](/demo/admin/setup). The npm package remains a local developer preview and has not been published from this workspace; here, run `node packages/notabenda/dist/cli.js wizard` after `npm run build`.

The wizard asks for public site facts, markets to investigate, actual practices and supporting justifications. It covers personal-data processing, optional browser storage, embeds, sale/sharing/targeted advertising, explicit terms agreement, paid consumer workflows, distance contracts, continuing paid contracts, children, transfers, durable records and Markdown/MDX authoring. Every practice supports **yes**, **no** and **not sure**. Existing necessary-storage inventory items get individual private justification fields.

One versioned engine powers the CLI and browser UI. Recommendations name the relevant configuration fields or host integration, explain what to enable or investigate, and link to catalog requirements. A selected market starts an applicability review; the catalog supplies sources, dates, caveats and current implementation status. The market list is incomplete, and no jurisdiction pack is production-supported. The wizard does not infer an exemption, legal basis, adequacy, age or compliance from a checkbox.

## CLI

```sh
npx notabenda wizard
# Keep existing inventory/runtime settings; write to a NEW review directory.
npx notabenda wizard --config ./notabenda.config.json --out-dir ./setup-review
# Repeatable noninteractive input, including a previously exported private report:
npx notabenda wizard --answers ./answers.json --out-dir ./setup-review-2
npx notabenda wizard --answers ./setup-review/setup.private.json \
  --config ./setup-review/notabenda.config.json --out-dir ./setup-review-3
```

The directory must not exist, including through a symlink. The wizard writes `notabenda.config.json`, `setup.private.json` and a local `.gitignore` excluding the report. On supported systems the directory and JSON files use private permissions. Input files are explicit JSON up to 512 KiB; normalized answers are bounded to 128 KiB. Noninteractive use requires `--answers`; there is no silent answer default that activates collection. Imported configs are validated before interactive questions.

A minimal answers file:

```json
{
  "schemaVersion": 1,
  "publicFacts": {"siteName": "Fictional Meadow", "siteId": "fictional-meadow", "siteUrl": "https://meadow.example.test"},
  "markets": ["EU-EEA", "US-CA"],
  "answers": {
    "optional-storage": {"choice": "yes", "justification": "Fictional measurement tool writes a local marker."},
    "children": {"choice": "unknown", "justification": "Audience assessment remains open."}
  },
  "storageJustifications": {}
}
```

Question/market IDs and public fact fields are exported from `notabenda/setup`. Missing questions remain unresolved. Notes for necessary storage are keyed by inventory item ID; they do not rewrite public `necessityReason` text. A saved report can resume answers; its old recommendations are ignored and regenerated. Questionnaire revision 3 accepts private reports from revisions 1, 2 and 3. Missing new questions remain unresolved.

## What gets exported

The config is a draft built from starter values or the imported **public configuration projection**, with supplied public site facts. It preserves existing inventory, runtime scopes, lifetimes, restrictions, document wording and routes. All document review declarations become draft. Private/imported unknown fields are excluded; keep the original file if you need those fields. No file is overwritten.

The private report contains answers, justifications, recommendations, conflicts, unresolved items and production validation diagnostics. It never becomes a legal document or a public compiler artifact. Keep it out of public asset roots and version control according to your own policy. These are operator statements, not audited evidence or an approved legal assessment.

Recommendations do not silently activate services or invent purpose/vendor inventories, scope versions, preference lifetimes or evidence identity. For example, declaring optional storage recommends `consent` and lifecycle/cleanup integration, but you still inventory the actual service and choose scopes/lifetimes explicitly. Contradictions with imported facts are flagged while existing restrictions/settings remain intact. Complete the config, inspect the report, supply reviewed content and run normal `check`/build review before adopting changes.

## Browser and Cloudflare integration

```js
import {mountSetup} from 'notabenda/setup/ui';
const ui = mountSetup(document.querySelector('#setup'), {
  documentationBase: '/guide', // optional; defaults to https://notabenda.org/guide
});
// getPlan returns a detached plan only after a current successful review.
ui.getPlan();
ui.destroy();
```

The UI runs locally in the operator's tab. Config/report imports use local files; answers are not uploaded or stored in browser persistence. Downloads are explicit. Editing invalidates earlier export links; object URLs are revoked on edits and destruction. Reloading loses unsaved notes. Reimport keeps notes by storage ID, including removed items in the private report. Resuming a report replaces current answers, so save any notes you want to retain first. Import its matching config separately.

The browser interface has six navigable stages: start/import, public facts, markets, practices, storage justifications and review. Practice questions expand individually and display the current yes/no/unknown assessment. Moving between stages preserves notes; revisiting a section does not regenerate or activate anything. Preparing recommendations reveals current downloads, and an edit removes those downloads until you prepare a new review. Unknown answers stay explicit review items.

```js
import {createSetupWorker} from 'notabenda-cf';
export default createSetupWorker({
  basePath: '/admin/setup',
  authorize: (request, env) => hostCanConfigure(request, env),
  scriptUrl: '/assets/setup.mjs',
  stylesheetUrl: '/assets/notabenda.css',
  workspaceLabel: 'Your evidence studio',
  navigation: [
    {label: 'Evidence', href: '/admin/evidence'},
    {label: 'Guided setup', href: '/admin/setup'},
  ],
});
```

The host supplies a same-origin browser entry module that mounts the UI, the package CSS/runtime modules (or a bundle), and authentication/authorization. The Worker checks operator access on every request, permits GET/HEAD only and returns private/no-store responses with a restrictive CSP. It provides no account system, server answer storage or deployment action. The public demo setup belongs to the browser’s isolated, password-free session. Operational `/backoffice/setup` requires host-owned admin authorization.

Setup and record inspection share one responsive workspace frame. Optional `workspaceLabel`, `workspaceNote` and `navigation` are display configuration, accepted by both Worker factories. Links use unique same-origin paths; each destination still needs its own authorization. Desktop navigation becomes an explicit native menu on smaller screens. These links cannot choose a store or extend a caller's permission.

Traceability: `REQ-PRODUCT-SETUP`; tests in `setup.test.mjs` in both packages and the packed-package check.


Questionnaire revision 2 adds explicit child-data, sensitive-data, high-risk-profiling and specialized-sector declarations. It accepts earlier revision-1 private reports; missing new answers remain unresolved. Draft configs carry [scope guards](SCOPE-GUARDS.md), keep private reasoning in the separate report and never relax an imported restriction through a contradictory answer. Review actual facts and assign a new material assessment revision before publishing changes.

## Consumer contract review

Distance-contract and continuing-paid-service questions describe actual practices. Germany is a separate coverage interest; selecting it starts review of cancellation and electronic withdrawal requirements. It does not decide applicability. The payment question alone does not classify withdrawal rights. Conflicting paid-service answers and a business-only terms audience remain explicit review items.

A positive consumer-workflow answer connects the optional [contract declaration forms](CONTRACT-ACTIONS.md) with [independent application and acknowledgement handoffs](CONTRACT-DISPATCH.md). Review transaction scope, national implementation, exclusions, withdrawal windows and actual entry points before selecting a profile. Provider acceptance does not establish delivery or contract fulfillment.

The CLI prints requirement IDs, guide links and configuration/integration paths for each recommendation. Paths such as `host.contractActions` and `host.contractDispatch` describe host work; they are advisory references, not fields added to `SiteConfig`. Setup never enables routes, providers, schedulers or regional profiles automatically. Public exports preserve imported facts and remain drafts; private justifications remain in the separate report.

## Review services from the catalog

Interactive CLI setup offers an optional reference search after the questionnaire. Search by provider/product/category, choose one of the displayed product IDs, then supply the actual provider entity, processing location, existing purpose IDs, an optional verified privacy URL and a private justification. Only an explicit confirmation adds an ordinary service entry to the draft. The reference seed loads only after choosing search. Noninteractive report resume uses its pinned metadata and does not retrieve a newer catalog.

The admin setup example offers the same review in **Start → Find a service in the reference catalog**. A host opts in with `catalog` or `loadCatalog`:

```js
import {mountSetup} from 'notabenda/setup/ui';
const setup = mountSetup(container, {
  config: existingPublicConfig,
  loadCatalog: () => import('notabenda/catalog/seed')
    .then(module => module.serviceCatalogSeed),
});
```

Bundle or serve that optional module from a host-approved source; the project example uses a same-origin lazy module with its notices/license. Reading a reference catalog is separate from uploading answers. Seed entries remain unreviewed even after an operator confirms actual site use. Catalog selection does not populate cookie/storage declarations, legal bases, processing-activity classifications or consent scopes, and never initializes a vendor.

Declare the site's actual processing purposes in configuration first and import it; selection can only link to those IDs. Fresh starter configs have no purposes, so catalog search alone cannot add a service. Full purpose authoring in setup remains future work. Entirely custom services remain valid ordinary config entries.

The private setup report optionally includes `catalogSelections`: each retains the selected provider/product metadata, source URLs/revisions/retrieval status, the explicit service facts, the selected purpose definitions and the private justification. Detector rules and imported storage hints are omitted because this action did not review or apply them. The snapshot is bounded to 128 KiB per entry, 32 entries, and 512 KiB for the complete report. Public config and legal/compiler output contain none of these notes.

Import the matching draft config separately when resuming a report. The selected public service facts and complete purpose definitions must still match, while independently configured integration fields are not treated as reviewed by the catalog note. Changing a purpose's name, description, legal basis, data categories, retention or collection facts requires renewed review even when its ID stays the same. The picker also rejects a proposal if those purpose facts change while it is open; reopen the service review to see the current purposes. Headless clients can supply `reviewedPurposes` to enforce the same precondition. A changed provider, location or product/name cannot silently inherit an older selection review. Remove stale notes or explicitly review a new selection. Removing a catalog selection removes an unreferenced, unchanged local service added through this flow; existing changed, extended or referenced inventory is preserved. Search and unfinished proposals do not invalidate an already prepared questionnaire export; adding/removing a selection does.

The browser keeps selections and notes only in memory. Download the private report before leaving. These are operator declarations and source pins, not verified identities, checked provider practices or automatic legal-release provenance archival. See [catalog design](SERVICE-CATALOG.md) and [verification](verification/service-catalog.md).
