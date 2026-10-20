# Choose a job for your site

A cartridge keeps one job together: what it adds, the facts it needs, and the steps to connect and check it. [Open your cartridge library](/start).

Start with **Privacy pages**, **Cookie choices** or **Terms agreement**. You can combine them or add another job later. Each works from the same site inventory.

## Prepare it your way

The website offers two paths. Choose **Set up my site** for a local questionnaire, or **Give to my agent** for an integration brief. Neither requires an account or uploads your answers. Save the draft and private report before leaving the tab.

The questionnaire shows the practice questions relevant to your selected jobs and their supporting foundations. Unknowns remain unknown. Complete configuration diagnostics and wider review items remain available when you prepare the draft.

With an explicitly installed local preview, the same cartridges are available in the terminal:

```sh
npx --no-install notabenda cartridges
npx --no-install notabenda cartridges cookie-choices --json
npx --no-install notabenda wizard --cartridges privacy-pages,cookie-choices
```

For an agent or noninteractive run, read the plan's `reference.targetAnswersTemplate`, supply actual answers, then use `--answers ./answers.json`. Add `--config ./notabenda.config.json` for an existing inventory. The wizard creates a new output directory and does not overwrite your site.

```sh
npx --no-install notabenda wizard --cartridges cookie-choices \
  --answers ./answers.json --config ./notabenda.config.json \
  --out-dir ./notabenda-setup
```

Save `setup.private.json` outside public assets. To resume, pass it as `--answers` alongside its matching draft config. Its selected cartridge revisions are retained. An explicit conflicting selection fails rather than silently changing the saved plan.

## What comes with a cartridge

Each cartridge explains its outcome and one key distinction, links to a working example, and resolves the existing integration guides, config fields, questions and checks. When cookie choices need privacy information, the plan asks you to inspect or reuse that foundation. It does not assume another feature must be installed from scratch.

The reusable model is available from `notabenda/cartridges`: `cartridgeLibrary`, `selectCartridges`, `planCartridges`, `createCartridgeSetupPlan`, `readCartridgeSelection` and `formatCartridgeBrief`. `mountSetup` accepts a `cartridges` selection for focused setup. Its `getDraft()` preserves pending answers separately from a prepared plan; `setCartridges(selection)` changes the focused work without replacing the editing session.

## Regional rules

Regional cartridges identify a specific mechanism. **Irish grant duration** proposes the supported grant cap for assessment. **Italian repeat requests** proposes the supported solicitation guard. They serve different clocks, even when used together. Their installed plan names exact policy paths and fields; selection does not enable them.

Review applicability and wording before applying a policy. These are preview mechanisms, not complete country packs or legal certification. [Coverage and requirements](requirements/README.md) remain connected to each cartridge.

## Connect and check

The current flow produces a draft config, private report and agent brief. Your host still connects the actual components, loaders or recording transport. The selected integration reference lists the scenarios to test. Publication and deployment verification are separate from preparing a draft.

The cartridge approach is being carried through the rest of the product. Advanced configuration remains available in the guides; existing APIs continue to work.
