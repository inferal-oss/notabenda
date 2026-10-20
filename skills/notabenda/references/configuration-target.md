# Determine the configuration target

Start from the requested behavior, then establish the facts needed for it. A cookie policy, a consent controller and a stored choice receipt are three different outcomes. A terms page, an explicit agreement and a paid checkout are also different. Ask which outcome is intended when that distinction changes the implementation; do not add all of them by default.

## Get the installed integration map

After trusted local installation:

```sh
npx --no-install notabenda describe
npx --no-install notabenda describe cookie-consent terms-agreement --json
```

`describe` reads the installed package's metadata. It does not inspect the project, read configuration, write files, select a jurisdiction or enable anything. The JSON reports the actual package version, requested targets, prerequisites, config paths, separate host work, facts needed, verification scenarios and guide URLs. Its setup questions and unknown-answer template come from the same engine used by the wizard. [The website reference](https://notabenda.org/integration-reference.json) describes the current preview when a local package is unavailable.

Config paths describe fields in `SiteConfig`, exported from `notabenda`. A path through an array describes its item field. `hostWork` and `hostWorkRefs` are application tasks, **not fields to insert into the config**. The CLI does not accept arbitrary `host` settings. Markdown/MDX uses the separate authoring API. Confirm exact field types and supported values against the installed declarations; the map is an integration reference, not a complete JSON Schema or legal applicability engine.

## Resolve ambiguous outcomes explicitly

The map's `selectionQuestions` distinguish task scope from the wizard's questions about processing practices. Start from its `selectionTemplate`, then fill only decisions supported by the request or confirmed with the operator. Missing answers remain `unknown`. For example, a request for explicit terms acceptance supports `explicit-agreement: yes`; it does not establish a need for cookie controls, translated content or a new backend.

```json
{
  "schemaVersion": 1,
  "answers": {
    "explicit-agreement": "yes",
    "stored-evidence": "unknown"
  }
}
```

Save this as a private `integration-selection.json`, then resolve it:

```sh
npx --no-install notabenda describe --selection ./integration-selection.json --json
```

This reads only the named bounded ordinary JSON file and installed package metadata. It does not inspect configuration or execute project code. The optional API is `selectIntegration(input)` from `notabenda/integration`. Both return requested targets, prerequisites, outstanding question IDs and the selected integration reference. All unknown or all declined produces an empty target list; the ordinary `describe` command without inputs instead lists the complete reference.

`scope-incomplete` means some task decisions remain open, not that independent work must stop. A `no` decision means no new work was requested in that area; a selected feature may still need supporting configuration already present in the project. `prerequisiteReview` highlights this distinction. `scope-recorded` means every scope question was answered; it never means production readiness. Neither result proves processing facts, legal applicability or review. Unknown unrelated features can stay outside the current task.

Keep this file separate from `wizard --answers`: scope decisions choose the work, while wizard answers describe practices and justifications. Neither automatically edits the site's configuration. Do not translate a requested control into a claim that its processing exists or that consent is its legal basis.

## Write a short integration brief

Record the following before editing, using existing project evidence wherever available:

1. **Requested outcomes:** selected target IDs and observable behavior. State what the user actually requested, without adding adjacent features by default.
2. **Existing integration:** framework, config/source locations, routes, build, active loaders, current scopes and retained releases. Prefer a patch to replacement.
3. **Confirmed facts:** value, source and confidence. Distinguish explicit operator decisions from code observations and provider-catalog hints. An SDK import cannot establish actual production use, necessity or legal basis.
4. **Open facts:** only material unknowns for the target, why they matter and what can proceed as a draft. Missing is `unknown`, not `no`. User-facing language does not determine jurisdiction. Legal basis, exemptions, retention and review require support beyond a guessed default.
5. **Exact changes:** config fields with proposed values or unresolved draft markers, document/frontmatter revisions, host build/runtime tasks and optional storage/auth work. Preserve unrelated settings. Copy no example identities or secrets into the host configuration.
6. **Acceptance:** concrete scenarios from the target map, including the actual host handoff and failure behavior, plus review/publication status.

Do not ask the operator for facts already established in the project or earlier instructions. Ask concise, grouped questions when missing facts affect a material choice. Continue independent implementation and preview work while those answers remain open; do not claim unresolved outcomes are complete.

## Turn facts into a reviewable draft

Use the selected reference's `targetAnswersTemplate` for relevant practice questions; `answersTemplate` covers the broader inventory. Fill only supported facts and retain unknown choices for unresolved items. Unknown unrelated questions do not enlarge the task. A practice declared `no` does not cancel requested work or remove existing restrictions.

Before editing an existing config, reconcile the explicit inputs:

```sh
npx --no-install notabenda assess --selection ./integration-selection.json --config ./notabenda.config.json --answers ./answers.json --json
```

The optional API is `assessIntegration({selection, config, answers})` from `notabenda/integration/assessment`. Omit `answers` if unavailable, or pass a saved private setup report; its recommendations are regenerated. CLI inputs are bounded ordinary JSON files; no project scripts execute and nothing is written. The report omits the config body and private notes, but diagnostics and review items can identify inventory entries. Keep it outside public assets.

Read the result in this order:

1. `requestedTargetIds` and `prerequisiteReview`: confirm the intended work and reuse existing support.
2. `validation.preview`: fix structural errors before drafting. `validation.production` separately reports draft/review errors.
3. `missingRequiredConfig`: minimum sections needed by selected targets. For example, optional-service control needs `consent`; an inventory alone does not configure it.
4. `questions`, `factConflicts` and `practiceConflicts`: collect relevant missing facts, support declared answers, and reconcile disagreements without overwriting either input.
5. `targets[].configuration`: observed paths and coverage through arrays. `absent`, `empty` or `partial` optional fields can be intentional. `declared` only reports presence, not correct values, legal suitability or runtime coverage.
6. `factsToConfirm`, `hostWorkToVerify` and `acceptanceScenarios`: verify the actual host behavior. These remain open even with valid configuration and recorded answers.

Exit zero means a report was produced. Status can be `invalid-config`, `no-targets`, `needs-input`, `needs-review` or `needs-verification`; none means production-ready. Scope decisions and practice declarations remain separate, and the assessment never enables a feature or invents config values. Read installed types and the linked target guides for the actual field shapes and host APIs.

Save explicit practice answers privately, then generate the draft:

```sh
npx --no-install notabenda wizard --answers ./answers.json \
  --config ./notabenda.config.json --out-dir ./setup-review
```

For a new site, omit `--config`. Use a new output directory. The wizard exports a draft and private recommendations; it does not fill in a full target integration. It preserves imported runtime settings, and review declarations become draft. Compare the exported config against the original and inspect conflicts/diagnostics before applying selected changes. Private notes are not public disclosure text.

Keep a separate list of host tasks. Adding `consent` does not gate a script that the host still loads directly. A generated terms page does not register an agreement offer. Recording an archive does not publish or activate it. A stored contract declaration does not send an acknowledgement, perform payment or fulfill a contract.

Run the exact target scenarios and validation. A successful preview is a draft milestone; production readiness also requires resolved facts, actual review and the host behavior needed for that target. Give a precise handoff for remaining decisions or unsupported capabilities.
