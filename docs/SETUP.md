# Guided setup

Run `npx notabenda wizard` after installing the package, or use the [demo setup screen](/demo/admin/setup). The packages are unpublished. From this repository, run `node packages/notabenda/dist/cli.js wizard` after `npm run build`.

The wizard collects site details, processing practices and supporting notes, then produces a draft configuration and private report. Every practice supports **Yes**, **No** and **Not sure**. Necessary-storage items have separate justification fields.

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

The directory must not exist, including through a symlink. The wizard writes `notabenda.config.json`, `setup.private.json` and a local `.gitignore` excluding the report. On supported systems the directory and JSON files use private permissions. Input files must be JSON no larger than 512 KiB; normalized answers have a 128 KiB limit. Noninteractive use requires `--answers`; there is no silent answer default that activates collection. Imported configs are validated before interactive questions.

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

## Find project services during setup

After installing the local preview, opt into a project scan in the same command:

```sh
npx notabenda wizard --project . --out-dir ./setup-review
npx notabenda wizard --project ./app --config ./notabenda.config.json \
  --catalog ./service-catalog.json --out-dir ./setup-review
```

`--project` names the directory to inspect; setup never scans the current directory implicitly. The optional `--catalog` applies to both detected candidates and later manual catalog search, and requires `--project`. Project code, package scripts, installers and network probes never run. The [project scanner](SERVICE-CATALOG.md) reports its supported identifiers, skipped files and limited coverage. A source match can be unused, development-only, a commented import or a self-hosted client.

After purpose authoring, choose **Review project service candidates** to inspect findings in pages of 12. Enter a detected product ID to see its file, dependency/import context and matching rule. At most eight evidence items are printed per candidate; the full bounded scan remains in the private report. `next` and `back` move between pages; blank continues to manual catalog search. A skipped candidate remains unreviewed. An empty or limited scan never proves that no third parties are used.

A candidate opens the same actual-use review as manual selection: supply a unique local service ID, actual provider entity and processing location, declared purpose IDs, an optional verified privacy link and private supporting facts. Nothing is added until explicit confirmation succeeds. The wizard does not choose purposes, add storage, enable integrations, grant permission or declare an exemption from a source match. Existing restrictions and runtime settings remain intact.

With a project scan, setup also writes **`discovery.private.json`**, using private file permissions and an entry in the generated `.gitignore`. It contains the scanner's catalog revision, findings and coverage, including project file names. It stays separate from `notabenda.config.json` and `setup.private.json`; source lines, dependency values and secret-file contents are excluded. Keep both private reports out of public assets. Selected products link to the scan by product ID and catalog revision; private setup selections retain their own reviewed reference/purpose snapshots. A new scan does not refresh those earlier pins or archive discovery into legal-release history automatically.

```sh
# Noninteractive: retain new findings without automatically selecting providers.
npx notabenda wizard --answers ./answers.json --project ./app \
  --out-dir ./setup-review
```

Noninteractive use still requires `--answers` and, for existing selections, their matching `--config`. Existing answers and pins are checked before scanning; findings never change questionnaire answers or add providers automatically. Interactive setup requires a terminal. The output directory must be new, and setup checks that before asking questions or scanning. Explicit setup/catalog JSON inputs must be ordinary, bounded UTF-8 files; symlinks, devices and named pipes are rejected. Browser/admin setup cannot inspect a local filesystem: run project discovery locally and review the private output before entering confirmed site use in admin.

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

The browser interface has six navigable stages: start/import, public facts, markets, practices, storage justifications and review. Start includes local processing-purpose authoring and optional catalog search. Practice questions expand individually and display the current yes/no/unknown assessment. Moving between stages preserves notes; revisiting a section does not regenerate or activate anything. Preparing recommendations reveals current downloads, and an edit removes those downloads until you prepare a new review. Unknown answers stay explicit review items.

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

## Describe processing purposes

In **Start → Processing purposes**, add the reasons you actually use personal data before selecting providers. Each purpose has a stable ID, a public name and description, data categories, legal basis and retention text, plus collection source, context, requirement and consequences. The form groups these facts instead of asking you to write JSON. Purpose facts belong in public notices; keep private supporting reasoning in the questionnaire.

Collection source and whether providing information is required need explicit answers. Blank legal basis, retention or consequences become `{{purposes.ID.FIELD}}` placeholders, visible in the draft and rejected by production checks. The editor does not choose a basis, exception or retention period for you. New fields start empty; importing does not create default purposes.

Edits preserve the purpose ID and all existing service links, runtime settings and restrictions. Removing a purpose needs a separate confirmation and is blocked while a service, consent scope or scope restriction references it. No dependent item is removed automatically. Changes reopen all document review declarations. The consent runtime's existing material-scope comparison also includes complete purpose facts, so a changed purpose cannot inherit an old visitor grant. Review and publish a new release through your normal process.

Preparing recommendations exports the current public inventory. Starting or cancelling an unfinished purpose edit does not change the inventory or invalidate a prepared report; saving or removing does. Replacing a config import closes an unsaved purpose edit explicitly. A purpose edit makes affected catalog notes stale; the original private note remains visible until you re-review its current site use or remove it. Removing that stale note preserves the existing changed inventory.

Interactive CLI setup offers **Review processing purposes** before catalog search. Choose `add`, `edit` or `remove`, inspect the public facts and confirm the local change. Blank keeps an existing text value; `?` marks basis, retention or consequences unresolved. On a new purpose those three fields may be left blank for draft review. `done` continues to the remaining wizard. Noninteractive setup continues to accept purpose facts through the imported config, with no questionnaire schema change.

For a custom UI, optional browser-safe APIs are available:

```js
import {createPurposeDraftPlan} from 'notabenda/setup/purposes';
import {mountPurposeEditor} from 'notabenda/setup/purposes/ui';

// reviewedPurpose is your complete public Purpose object.
const added = createPurposeDraftPlan(config, {action: 'add', purpose: reviewedPurpose});
const edited = createPurposeDraftPlan(added.config, {
  action: 'update', previous: reviewedPurpose, purpose: changedPurpose,
});
// Updates/removals reject stale previous facts and stable-ID renaming.
const editor = mountPurposeEditor(container, {
  getConfig: () => currentDraft,
  onChange: plan => { currentDraft = plan.config; },
});
editor.refresh(); // refresh the list after an external draft change
editor.destroy();
```

`normalizeDraftPurpose` validates a detached closed purpose object. Authoring accepts up to 256 purposes, 64 unique data-category labels per purpose, 120-character IDs, 300-character names/category labels and 4,000-character narrative fields. Existing config validation and all production review checks still apply. The host owns persistence, authorization, deployment and any private reasoning.

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

Declare the site's actual processing purposes in the setup editor/CLI or import them from configuration; catalog selection can only link to declared IDs. Fresh starter configs have no purposes. If you add or edit one while a service proposal is open, reopen the service review to see current facts. Entirely custom services remain valid ordinary config entries.

The private setup report optionally includes `catalogSelections`: each retains the selected provider/product metadata, source URLs/revisions/retrieval status, the explicit service facts, the selected purpose definitions and the private justification. Detector rules and imported storage hints are omitted because this action did not review or apply them. The snapshot is bounded to 128 KiB per entry, 32 entries, and 512 KiB for the complete report. Public config and legal/compiler output contain none of these notes.

Import the matching draft config separately when resuming a report. The selected public service facts and complete purpose definitions must still match, while independently configured integration fields are not treated as reviewed by the catalog note. Changing a purpose's name, description, legal basis, data categories, retention or collection facts requires renewed review even when its ID stays the same. The picker also rejects a proposal if those purpose facts change while it is open; reopen the service review to see the current purposes. Headless clients can supply `reviewedPurposes` to enforce the same precondition. A changed provider, location or product/name cannot silently inherit an older selection review. Use Re-review beside a selected service to compare and renew it, or remove only the stale note. Removing a catalog selection removes an unreferenced, unchanged local service added through this flow; existing changed, extended or referenced inventory is preserved. Search and unfinished proposals do not invalidate an already prepared questionnaire export; adding/removing or confirming a renewed selection does.

The browser keeps selections and notes only in memory. Download the private report before leaving. These are operator declarations and source pins, not verified identities or checked provider practices. The explicit build finalizer can retain current reference facts with a legal release; private reasons and revision history stay separate. See [catalog design](SERVICE-CATALOG.md) and [verification](verification/service-catalog.md).


### Re-review an existing service

Choose **Re-review** beside a catalog selection in admin setup. The comparison starts from its retained reference. **Compare current reference catalog** explicitly loads the host-selected catalog; opening setup never refreshes a pin. Inspect prior/proposed provider, location, public name, purposes and source facts; write a new private reason and confirm. If the current draft changes while the comparison is open, reopen it before confirming.

The current operator service name, provider, location, privacy link and purpose IDs are preserved. Reference label changes stay reference facts. Linked storage, consent/enforcement settings and other inventory remain unchanged. The private report retains both pins in `catalogSelectionRevisions`; this records declared reviews, not verified identity, timestamps, provider-practice validation or policy publication. Logs support up to 32 revisions and the existing 512 KiB report bound. Keep previous reports when starting a new one. This is still separate from immutable legal-release provenance.

For a focused terminal workflow:

```sh
npx notabenda catalog review --config notabenda.config.json \
  --report setup.private.json --service payments --out-dir renewed-review
# Explicitly compare the shipped reference seed instead of the pinned reference:
npx notabenda catalog review --config notabenda.config.json \
  --report setup.private.json --service payments --latest --out-dir renewed-latest
```

`--catalog FILE` uses a chosen offline catalog instead of `--latest`. The command needs a terminal, displays both versions and asks for a new reason and confirmation. Cancellation writes nothing. Confirmation requires a new output directory, writes a draft config plus ignored private report with restricted local permissions, and preserves the input files. This focused review preserves current site/contact/scope/review settings; historical questionnaire answers remain context and are not reapplied. Other stale selections still need review before a report can be exported. No modules, installers, network requests or deployment commands execute.

Headless integrations use `prepareCatalogSelectionReview(config, previous, optionalCatalog)` and `confirmCatalogSelectionReview(config, comparison, {confirmed:true, justification})` from `notabenda/catalog/review`. The first operation is a detached proposal; confirmation checks the full current service and selected purposes against the displayed snapshot. Store the returned `revision` privately. `createSetupPlan` accepts `catalogSelectionRevisions`; `preserveConfig:true` regenerates advisory reports for an explicit current config without applying historical answers or reopening document reviews. Hosts choose authorization, storage and release archival.


### Assess practices in a grid

The Practices section groups all 15 questions into Data and tools, Customers and contracts, Sensitive contexts, and Evidence and publishing. Answer each card directly with Yes, No or Not sure; no disclosure or select menu is needed to answer. Explanations stay visible. Add supporting facts through the private notes disclosure; imported notes open automatically. The two-column layout becomes a single column in a narrow container, with 44px choice targets.

Native radio groups support keyboard arrow navigation. Answering never advances the section or moves focus; Enter on a radio does not submit or navigate. A No answer does not hide independent questions. The summary counts yes/no assessments, Not sure answers and supporting notes separately; neither an answer nor a count establishes legal readiness. Unknowns and missing reasons remain review items, with the same advisory engine and saved-report schema.

The browser setup displays the project-discovery command beside service selection and again in the final configuration review. Run it in your project directory for a fuller inventory of dependency/import and infrastructure candidates, then review the findings before adding services. Matches do not prove production use, and unsupported or dynamic integrations can be missed. The browser UI cannot read the project tree or run that command. Project discovery is optional; your team chooses when to run it and whether to use CI.


To retain the current catalog references with a policy release, use [the build finalizer](SERVICE-CATALOG.md#retain-selections-with-policy-releases) after document compilation. It checks pins against final service/purpose facts and excludes private reasons, answers and review history. Keep the resulting archive outside public assets.
