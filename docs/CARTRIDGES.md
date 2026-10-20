# Choose a job for your site

A pack keeps one job together: what it adds, the facts it needs, and the steps to connect and check it. [Open your pack library](/start).

Start with **Legal pages**, **Cookie choices** or **Terms agreement**. You can combine them or add another job later. Each works from the same site inventory.

## All twenty packs

The library shows every pack, grouped by the job it does. Use the links at the top to jump between groups.

Each description names the problem the pack addresses. **Try the example** opens a use case with a short walkthrough and an explanation of the result. The Ireland and Italy examples describe their two different clocks separately. Some example state survives a revisit; the walkthrough tells you when to reset it before comparing behaviour.

<!-- notabenda:packs -->

The regional packs cover those named mechanisms; they are not complete country coverage.

The [privacy-pack guide](PRIVACY-PACKS.md) explains the four added paths and their draft input reviews. The [consumer-pack guide](CONSUMER-PACKS.md) covers the five transaction jobs and their host dependencies. See the [pack roadmap](PACK-ROADMAP.md) for pack admission and remaining feature work.

The [specialist-pack guide](SPECIALIST-PACKS.md) covers technology notices, assessed storage settings and Google Basic, including their different prerequisites and limits.

## Prepare it your way

The website offers two paths. Choose **Set up my site** for a local questionnaire, or **Give to my agent** for an integration brief. Neither requires an account or uploads your answers. Save the draft and private report before leaving the tab.

The questionnaire shows the practice questions relevant to your selected jobs and their supporting foundations. Unknowns remain unknown. Complete configuration diagnostics and wider review items remain available when you prepare the draft.

With an explicitly installed local preview, the same packs are available in the terminal:

```sh
npx --no-install notabenda packs
npx --no-install notabenda packs cookie-choices --json
npx --no-install notabenda wizard --packs privacy-pages,cookie-choices
```

For an agent or noninteractive run, read the plan's `reference.targetAnswersTemplate`, supply actual answers, then use `--answers ./answers.json`. Add `--config ./notabenda.config.json` for an existing inventory. The wizard creates a new output directory and does not overwrite your site.

```sh
npx --no-install notabenda wizard --packs cookie-choices \
  --answers ./answers.json --config ./notabenda.config.json \
  --out-dir ./notabenda-setup
```

Save `setup.private.json` outside public assets. To resume, pass it as `--answers` alongside its matching draft config. Its selected pack revisions are retained. An explicit conflicting selection fails rather than silently changing the saved plan.

## What comes with a pack

Each pack explains its outcome and one key distinction, links to a working example, and resolves the existing integration guides, config fields, questions and checks. When cookie choices need privacy information, the plan asks you to inspect or reuse that foundation. It does not assume another feature must be installed from scratch.

The reusable model is available from `@notabenda/core/packs`: `packLibrary`, `selectPacks`, `planPacks`, `createPackSetupPlan`, `readPackSelection` and `formatPackBrief`. `mountSetup` accepts a `cartridges` selection for focused setup. Its `getDraft()` preserves pending answers separately from a prepared plan; `setCartridges(selection)` changes the focused work without replacing the editing session.

## Assess regional rules

Regional packs identify a specific mechanism. **Consent expiry · Ireland** proposes the supported grant cap for assessment. **Repeat prompts · Italy** proposes the supported solicitation guard. They serve different clocks, even when used together. Their installed plan names exact policy paths and fields; selection does not enable them.

Review applicability and wording before applying a policy. These are preview mechanisms, not complete country packs or legal certification. [Coverage and requirements](requirements/README.md) remain connected to each pack.

## Connect and check

After preparing the draft, **Connect to your site** shows the selected pack's integration tasks and a direct guide link. Expand **Checks to run in your application** for its acceptance scenarios. **Existing foundations to check** keeps shared work separate: reuse an existing privacy-page or consent integration when it already does the job. Regional proposals show only the selected policy path, profile and required fields; they remain disabled until the host applies an appropriate reviewed change.

**Review selected facts** returns to the questionnaire without losing the prepared draft. Editing an answer or changing packs invalidates the old guide and downloads, so the next draft reflects the new scope. Selection actions stay in reach while browsing the entire pack library.

The browser offers three downloads: `notabenda.config.json`, `setup.private.json` and `notabenda-setup-brief.txt`. A scoped terminal wizard now writes the same three files into its new output directory. Keep them together in a private working directory when handing work to an agent. The connection brief names those files, includes the installed target tasks and checks, supplies a preview-validation command and explains how to resume into a new directory. Operator answers and justifications remain in the private report; they are not copied into the brief.

`formatPackBrief(selection)` prepares the initial planning brief. `formatPackBrief(selection, 'connect')` prepares the post-draft handoff used by the UI and scoped wizard. Both reference the installed integration contract. These instructions do not run tests or mark a pack installed or verified. The host still connects the actual components, loaders or recording transport and verifies the result in its application. Publication and deployment verification remain separate steps.

The pack approach is being carried through the rest of the product. Advanced configuration remains available in the guides; existing APIs continue to work.

## Put the library in your own application

The website and new Cloudflare starter use the same component exported by `@notabenda/core/packs/ui`. Include `@notabenda/core/styles.css` for the questionnaire and `@notabenda/core/packs.css` for the library. Both are separate from the smaller visitor consent stylesheet.

```js
import {mountPackConsole} from '@notabenda/core/packs/ui';
import '@notabenda/core/styles.css';
import '@notabenda/core/packs.css';

const console = mountPackConsole(document.querySelector('#setup'), {
  documentationBase: '/help/notabenda',
  exampleLinks: {'cookie-choices': '/try-cookies'},
  guideUrl: '/help/notabenda/cartridges',
  mapUrl: '/help/notabenda/compliance-map',
});

// On navigation away:
console.destroy();
```

Destinations are optional. The component does not assume that your application serves Notabenda's website routes. Example/map/guide links must be local paths without query strings; the questionnaire's existing `documentationBase` contract also permits an explicit HTTPS documentation origin. Supply `loadCatalog` only if you want catalog-assisted inventory editing.

For server rendering, insert the result of `renderPackConsole(options)` and mount its `[data-cartridge-console]` element with the same options. The server renderer adds no script, stylesheet, account or storage. A fresh empty mount also works. Use native checkboxes, tab navigation and the ordinary setup button; no drag or gesture is required.

Pass `cartridges: selectPacks([...])` to preselect work. Pass a private report as `answers`, with its matching `config`, to resume. Conflicting explicit/report selections fail before replacing host content. Going back and adding a pack preserves the current editing session. `getDraft()` returns the setup draft after setup has opened; it is undefined while only choosing packs. An unavailable browser download API hides the initial agent download without blocking setup. Call `destroy()` when unmounting to release download URLs and listeners.

The Cloudflare `createSetupWorker` accepts an optional `cartridgeStylesheetUrl` alongside the existing host module and questionnaire stylesheet. Use it with a module that mounts this console. The generated starter builds these assets, requires the host's configuration permission for all of them and checks their presence in `notabenda-cf doctor`. Existing hosts can continue mounting `mountSetup` directly.

## Read the draft before connecting it

After preparing a pack draft, choose **Preview pages**. It opens the privacy, cookie and terms pages in a local reader, using the same document renderer and default legal styles. Switch documents or expand the contents list to jump to a section, then close the reader to return to the draft. Nothing is published, stored or marked reviewed by opening it.

The reader shows the configuration supplied to it, including placeholders and existing review declarations. It does not verify that those declarations match actual practices. Outside links have no navigable destination inside this preview. It loads neither separate MD/MDX project files nor a running website. Use the project's authoring build to review those authored files and custom components; this reader covers config-generated pages and supplied structured sections.

The viewer is also available independently. Include `@notabenda/core/styles.css` and `@notabenda/core/packs.css` and mount it on your own page:

```js
import {mountLegalPreview} from '@notabenda/core/setup/preview';

const preview = mountLegalPreview(document.querySelector('#preview'), {
  config: draftConfig,
  initialDocument: 'cookies',
});

// From a deliberate user action:
preview.open();
// On unmount:
preview.destroy();
```

It uses a native dialog with a close button and Escape support. Closing returns focus to the opener. Document IDs are namespaced so the reader can coexist with a legal page on your site. Input is validated in preview mode and projected to a fixed public snapshot before creating DOM; operator-only config notes do not appear. Missing supplied sections fail the existing configuration validation; the reader does not invent clauses.

The website and new Cloudflare starter serve the reader module only when it is requested. The starter protects that module with the same configuration permission as the rest of setup, and its doctor checks the built asset. Other bundlers may inline or split the package's dynamic import according to their own build settings.

## Compatibility

`notabenda cartridges`, `wizard --cartridges`, the `@notabenda/core/cartridges` imports and their existing function names remain supported. Saved reports keep their `cartridges` field and pinned revisions; changing the display name does not require migrating a draft. New examples use `packs` commands and import paths.

<!-- @requirements REQ-PRODUCT-CARTRIDGES -->
The pack artwork uses a flat, downward-facing keyed card edge with separate muted contact banks and an open notch. It remains decorative and hidden from assistive technology; selection continues to use the labeled native checkbox and visible selected state. Reduced-motion and forced-color preferences retain usable selection controls. Visual changes are reviewed in local desktop/mobile previews before publication.

For cookie packs, [inspect the actual connection](CONNECTION-INSPECTION.md) after registering the real lifecycles. A matching inventory and registration count remain separate from published files and tested application behavior.
