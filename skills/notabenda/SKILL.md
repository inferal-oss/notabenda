---
name: notabenda
description: Set up or update Notabenda in a website, including site configuration, service discovery, privacy/cookie/terms pages, Markdown or MDX revisions, consent controls, and the optional Cloudflare evidence backend. Use when integrating Notabenda or reviewing an existing integration.
---

# Integrate Notabenda

Package names are `@notabenda/core`, `@notabenda/cloudflare` and `@notabenda/authoring`; installed CLI binaries remain `notabenda` and `notabenda-cf`. Use the installed package's documentation and types for its version. The current website describes the developer preview; packages have not been published to npm. In this workspace, build with `npm run build` and run `node packages/notabenda/dist/cli.js`. In a consuming project, install a trusted local tarball first, then use its local CLI. Do not let `npx` fetch an unrelated registry package if Notabenda is absent.

Read [the documentation index](https://notabenda.org/llms.txt), then fetch only the guides needed for the task. Markdown guides have `/index.md` after their guide URL, for example `https://notabenda.org/guide/setup/index.md`.

## 1. Determine the target and inspect the host project

Read [configuration target selection](references/configuration-target.md). Distinguish documents, interactive controls, recorded evidence and host workflows. Do not enable adjacent features by default. Use the installed integration map and record a short brief: requested outcomes, existing integration, confirmed facts with provenance, material unknowns, exact config changes, host work and acceptance scenarios.

```sh
npx --no-install notabenda describe cookie-consent terms-agreement --json
```

Select the target IDs that match the actual request; omit IDs to list all. The read-only JSON supplies config paths, prerequisite targets, facts needed, setup question IDs, an unknown-answer template and checks. Its `hostWork` entries are application tasks, not JSON config fields. Use `notabenda schema PATH --json` for exact field shapes and allowed type values, then `check` for semantic validation. The schema supplies no defaults or facts. The map advises work; it does not enable it or decide applicability. If no package is installed, use [the current preview reference](https://notabenda.org/integration-reference.json).

Use `storage-exceptions` for an explicitly assessed supported exception/objection workflow; it is separate from consent enrollment. Form permissions need scope assessment and an actually supported offer. Non-English native terms/form controls need their own complete dictionary, beyond localized documents. Consult `conditionalConfig` in the map; never change unknown facts to unlock a feature.

When the requested outcome is ambiguous, use the map's `selectionQuestions` and `selectionTemplate`. Record supported task decisions as `yes` or `no`; keep unanswered ones `unknown`. Resolve the private selection file with `describe --selection FILE --json`. An empty selection requests nothing. Ask only the distinctions that affect the current task; do not require the operator to complete all questions. Scope decisions are separate from wizard practice answers, applicability and review. Inspect prerequisite work against what the project already supplies before adding it.

Identify its framework, build command, routes, existing legal documents, optional service loaders and authorization. Find the current Notabenda config before creating another. Preserve existing facts, restrictions, runtime settings, routes and review history. Propose targeted changes rather than replacing the inventory with a starter.

Use the installed CLI's `--help` to confirm options. After local installation, these commands inspect explicit inputs and write a new private review directory:

```sh
npx --no-install notabenda discover --project . --out-dir ./service-review
npx --no-install notabenda wizard --config ./notabenda.config.json --out-dir ./setup-review
```

The wizard is interactive. For unattended use, supply an explicit answers file with `--answers`; the [setup guide](https://notabenda.org/guide/setup/index.md) documents its schema. For a new integration without a config, omit `--config`, or use `init` to create a draft JSON starter. Output directories must be new. Choose unused paths and retain the original inputs.

For an existing config, reconcile selected work with the actual inventory before editing it:

```sh
npx --no-install notabenda assess --selection ./integration-selection.json --config ./notabenda.config.json --answers ./answers.json --json
```

Use `targetAnswersTemplate` from the selected reference to focus practice questions on this task. Omit `--answers` while facts are unknown; it also accepts a saved private setup report. Assessment is read-only. Inspect `missingRequiredConfig`, `factConflicts`, `practiceConflicts`, authoring-shape and both runtime validation results, plus target host work. `declared` means a field exists, not that its content is true or the feature works. Optional absent fields do not automatically need filling. A successful command only means it produced a report; run the host acceptance scenarios before claiming completion. Keep this report private.

Discovery findings are candidates. Confirm actual use, provider entity, processing location, purposes, data, storage, retention and supporting facts before adding services. Backend-only providers can be missed. A match never grants consent, proves necessity or supplies a legal basis. Keep discovery captures, setup reports and justifications outside public assets; inspect them before sharing. Discovery and CI remain the adopter's decision.

Read `validation.authoringShape` before the runtime diagnostics. It checks exact installed fields and alternatives; errors use JSON Pointer paths and omit rejected values. Fix shape/preview failures and rerun. A valid inventory still needs the selected control's actual offer, host lifecycle and acceptance checks.

## 2. Draft the inventory and documents

Follow [configuration](https://notabenda.org/guide/package/index.md) and [service review](https://notabenda.org/guide/service-catalog/index.md). Ask for material facts that the project cannot establish; leave unknowns and drafts explicit. Do not invent operator contacts, legal bases, retention periods, exemptions or regional applicability. Locale is presentation, not jurisdiction selection. No complete jurisdiction pack is production-supported; consult individual requirement status and primary sources.

The JSON CLI supports `init`, `check` and `build`. Markdown/MDX authoring uses the separate `@notabenda/authoring` build API, not a CLI flag. Follow [authoring](https://notabenda.org/guide/authoring/index.md): YAML frontmatter supplies kind, title, route, version, effective date, review declaration and optional stable section IDs. Terms require supplied wording. Only compile trusted MDX: its imports and components execute as project code during the build. Keep original source archives private.

Use preview mode while drafting:

```sh
npx --no-install notabenda check --config ./notabenda.config.json --preview
npx --no-install notabenda build --config ./notabenda.config.json --preview --out-dir ./legal-preview
```

Do not mark content reviewed to make a build pass. A review declaration records the operator's actual review; validation does not perform it. Production mode is the default when `--preview` is absent.

## 3. Connect only the requested controls

Choose the host's integration: [vanilla consent](https://notabenda.org/guide/consent/index.md), [React](https://notabenda.org/guide/react/index.md) or [Astro](https://notabenda.org/guide/astro/index.md). Use the documented controller and lifecycle APIs; wire the actual optional loader through them. Remove pre-consent tags, preconnects, resource URLs or parallel loaders that bypass the gate. The cleanup callback must stop owned work and remove declared markers within the documented limits. Do not treat rejection, dismissal, a failed receipt or an unchecked agreement as permission.

Keep cookie consent, [terms agreement](https://notabenda.org/guide/terms/index.md), processing opt-outs and form permissions separate. Retain effective restriction/scope guards. Regional timing policies are explicit opt-ins with individual coverage limits; never activate them merely from a language or selected market.

Use the host's typography and theme tokens. Keep balanced choices, a persistent way to reopen settings, readable legal pages and visible keyboard focus. Inspect narrow screens, large text, dark mode and reduced motion as relevant. Default notices stay compact; a deliberate action opens detailed settings.

## 4. Preserve releases; add a backend only when needed

Follow [retained releases](https://notabenda.org/guide/releases/index.md). Preserve exact public artifacts and pinned URLs needed by existing records, including after a clean build. Advance document versions and material consent scopes deliberately. Registering an archive, publishing pages and activating a notice are separate operations. Never overwrite historical evidence to match current wording.

For stored evidence use [the Cloudflare starter](https://notabenda.org/guide/cloudflare-starter/index.md) and [backend API](https://notabenda.org/guide/cloudflare/index.md). `notabenda-cf init` scaffolds locally; it does not install or deploy. The host supplies authorization, fixed site/object scope, write admission, secrets, retention and operational policy. Preserve default denial until host authorization is implemented. Never copy the public demo's passwordless access or development credentials into an operator backend. Keep private reports, MD/MDX source and credentials out of public bundles and Git.

## 5. Verify and report

Run the host's appropriate build/tests plus config validation. Test actual integration behavior: no optional request before permission; rejection stays off; a granular grant starts only its service; withdrawal stops owned work; reload respects saved state; failures remain safe. Check legal routes without JavaScript, keyboard/mobile controls, exact terms revision and retained historical URLs. For a backend, verify denied access and separately authorized source/export access. Discovery helps investigate; it is not a complete network audit or proof of compliance.

After an authorized deployment, explicitly check pinned publication with `npx --no-install notabenda check-publication --artifact FILE --origin HTTPS_ORIGIN --json`, using the intended trusted public compiler artifact. Read [publication checking](https://notabenda.org/guide/publication-check/index.md) first. Keep its report private. Four matching files do not verify current routes, active bindings, controls, evidence or legal applicability. Use preview mode only deliberately; larger-than-supported artifacts are unsupported input, not failed deployments.

Report changed files, commands run, observed behavior, unresolved facts and remaining host work. Distinguish preview from production and local verification from deployment. Publish, deploy or grant account access only within the user's authorized task. Do not add an obligatory CI workflow or claim legal compliance from passing tests.

For Form notices, Indirect collection, Privacy requests or Processing opt-outs, read [privacy packs](https://notabenda.org/guide/privacy-packs/index.md). Inspect the regenerated private `packInputs` and matching connection brief. Distinguish missing declarations, unverified declared values and manual builder/host work. Direct collection dictionaries do not translate the English-only indirect renderer. Preserve existing request routes and restrictions; never infer configuration, notification, fulfillment or downstream enforcement from questionnaire answers.

For withdrawal, subscription cancellation, paid orders, customer confirmations or guarantee information, read [consumer packs](https://notabenda.org/guide/consumer-packs/index.md). Use the focused target; do not select the broad consumer-contracts target as a prerequisite. Definitions, quotes, destinations and producer files are separate builder inputs, not SiteConfig fields. Preserve unknowns and fixed profile-language limits. Confirmations require an existing received Cloudflare order admission and retained review in the same checkout context; do not manufacture admissions or force a checkout UI. Assess shop notice and producer-label branches separately. Inspect regenerated packInputs and verify the actual public route, action recovery, payment behavior, customer copy and delivery as applicable.
