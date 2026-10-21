# Set up with an agent

Give your coding agent the [Notabenda skill](/skills/notabenda/SKILL.md) and ask it to inspect your existing site before making changes. The skill covers discovery, configuration, documents, frontend controls, revision history and the optional backend. It keeps unknown facts visible and preserves your existing settings.

```text
Use the Notabenda skill at https://notabenda.org/skills/notabenda/SKILL.md.
Inspect this project, identify the integration points, and set up privacy,
cookie and terms pages in preview mode. Reuse existing documents and settings.
Report the facts still needed for review before publishing.
```

Start with the [compliance map](COMPLIANCE-MAP.md) to distinguish information, choices, contract actions and evidence. The separate [software/storage diagram](ARCHITECTURE.md) shows which work belongs in the build, browser and host backend.

For a product task, start from [packs](CARTRIDGES.md): a bounded job such as privacy pages, cookie choices or terms agreement. Use `notabenda packs ID --json` to read the installed job, existing target contract and relevant unknown-answer template. `wizard --packs ID --answers FILE` retains that scope in the private report. Reuse supporting work; selecting a pack does not prove a connected or verified integration.

## Install the skill

The repository contains `skills/notabenda/SKILL.md`, its configuration-target reference and optional `agents/openai.yaml` display metadata. Copy the complete directory into your agent's supported project or personal skill directory. For agents that use `.agents/skills/`, the project destination is `.agents/skills/notabenda/`; check your tool’s supported location. Review the skill before enabling it. Installing a skill does not install packages or grant account access.

The built package also includes the same files at `node_modules/@notabenda/core/dist/skill/`, with exported paths `@notabenda/core/skill/SKILL.md` and `@notabenda/core/skill/agents/openai.yaml`. This lets you use the skill shipped with your installed package version. The website skill describes the current preview, so use installed types and documentation when versions differ.

**The packages are not on npm yet.** Use a trusted repository checkout or local tarballs. After installation, `npx --no-install notabenda --help` selects the local CLI without fetching a registry package. The [package guide](../packages/notabenda/README.md) explains the API; the [setup guide](SETUP.md) covers interactive and unattended input.

## Find the right configuration

The local CLI provides a version-matched integration map:

```sh
npx --no-install notabenda describe
npx --no-install notabenda describe cookie-consent terms-agreement --json
```

Choose targets for the requested behavior: static legal pages, authored documents, cookie controls, gated media, explicit terms agreement, privacy request links, processing opt-outs, form permissions, consumer contracts, evidence, localization, regional timing or optional discovery. Prerequisites describe supporting work; nothing is activated. The map names exact configuration paths, separate host tasks, facts needed and acceptance scenarios. It includes actual wizard question IDs and an unknown-answer template from the shared setup engine.

Use [the machine-readable website reference](/integration-reference.json) if a local package is unavailable. The same reference is exposed as `describeIntegration(targetIds)` from `@notabenda/core/integration`; the CLI additionally identifies its package version. The task map links to the installed authoring schema for exact known fields and type values. It does not decide legal applicability. `hostWork` is application work, rather than a config property.

Read the field shape before proposing values:

```sh
npx --no-install notabenda schema consent --json
npx --no-install notabenda schema documents.terms --json
npx --no-install notabenda schema services.googleBasic.signals --json
```

Omit the path for the full schema. It is generated from `SiteConfig` on each package build and exported as `@notabenda/core/config/schema.json`; [the website copy](/site-config.schema.json) follows the current preview. Each field result includes only its referenced definitions, plus optional ancestor paths, array item paths and whether it exists only in some policy alternatives. `alternativeAncestors` points to parent alternatives whose sibling relationships the fragment cannot preserve; inspect those complete shapes before choosing values. For example, `consent.services.scope` describes each service's scope string; it does not create a literal dotted key or a service ID. The CLI reads no project configuration and supplies no default values.

The schema rejects unknown fields to catch misspellings. It covers authoring shape, including required fields, literal choices and policy alternatives. `check`, `build` and `readSiteConfig` apply that schema before checking IDs, relationships, URL safety, policy bounds, complete review and other semantic rules. Unknown fields fail rather than being silently discarded. The optional `validateAuthoredConfig` API from `@notabenda/core/config/validate` applies both checks to a plain object; assessment uses the same shape inspector. Use `check --preview --json` while drafting, then the ordinary production `check --json` after review. Passing the schema alone is insufficient. A schema reference can be associated through editor settings; `$schema` is not a `SiteConfig` field to add to the inventory.

The target map distinguishes consent-based controls from `storage-exceptions`, whose services use a separate objection controller and must stay outside consent enrollment. Form permissions require an explicit `scopeGuards` assessment; unknown or present restricted facts cannot be changed to `absent` to make a control work. For non-English native interfaces, the map declares conditional requirements for `localization.terms` and `localization.formPermission`. A valid translated policy page alone does not configure those controls.

For an ambiguous request, use the reference's `selectionQuestions` to clarify the distinctions that matter. Its `selectionTemplate` accepts explicit `yes`, `no` and `unknown` task decisions. Save a private selection file and run:

```sh
npx --no-install notabenda describe --selection ./integration-selection.json --json
```

The result identifies requested targets, supporting work and unanswered questions; the API equivalent is `selectIntegration(input)`. All unanswered or declined selects nothing. Check prerequisites against existing documents and configuration before adding work. The selection file describes task scope and is separate from wizard practice answers. A fully recorded scope still requires actual facts, implementation and review; it does not establish production readiness.

The [configuration-target reference](/skills/notabenda/references/configuration-target.md) explains how to turn the user's request and project evidence into a brief, collect only material missing facts, prepare explicit answers and compare a wizard draft with the existing configuration. A policy page, runtime control and durable receipt remain separate choices. An agent should preserve unrelated settings and report the actual host work still needed.

For an existing inventory, the agent can check those inputs together:

```sh
npx --no-install notabenda assess --selection ./integration-selection.json --config ./notabenda.config.json --answers ./answers.json --json
```

Start the practice answers from the selected reference's `targetAnswersTemplate`. The optional `--answers` accepts an answers file or a saved private setup report. The read-only assessment reports relevant unknowns, minimum missing config, contradictory facts, preview/production diagnostics and host tasks to verify. It never copies sample values into the config. Field presence is reported as a declaration, with coverage through inventory arrays; it does not prove content or behavior. Keep the report private. Exit zero means a report was produced, and `productionReady` remains false. The API equivalent is `assessIntegration({selection, config, answers})` from `@notabenda/core/integration/assessment`.

Read `validation.authoringShape` first. Assessment runs the installed generated schema as well as both runtime validation modes. Shape diagnostics use JSON Pointer `instancePath`, identify the schema rule and never copy the rejected value. They catch unknown fields even where runtime projection would ignore them. Up to 100 diagnostics are returned; `truncated` means fix those and rerun. `invalid-config` takes precedence over the other assessment states when either the shape or preview rules fail. Native-interface dictionaries become required only for the selected target and a valid non-English configuration; unrelated optional dictionaries remain optional.

## Documentation without the page layout

[llms.txt](/llms.txt) is a short index of the integration guides and requirement catalog. Every source-backed guide has a Markdown version at its guide URL plus `/index.md`, for example [the setup guide in Markdown](/guide/setup/index.md). Guide pages advertise that version through an alternate link in their HTML head.

Both formats come from the same maintained document. Markdown links point to the corresponding Markdown guide where available; code blocks remain unchanged. The generated index and skill use explicit public inputs, with no project scan, private reports or backend records included.

## What still needs your decisions

An agent can connect the components and test their behavior. You supply the actual operator and processing facts, select applicable requirements, review wording and decide when to publish. A source match or passing build does not establish a legal basis or complete jurisdiction coverage.

Private discovery findings and justifications stay separate from public legal output. Markdown and MDX sources belong in the private history archive when retained there. MDX is trusted build code, so inspect its imports and components. The optional Cloudflare backend uses your authorization; the demonstration's access model is specific to that demo.

Ask for a concrete handoff: changed files, checks run, unresolved facts and deployment status. Discovery and CI are tools you may choose, rather than required services.

Configuration format is a tooling choice, not a `SiteConfig` field. The browser setup can import JSON, YAML or Markdown frontmatter and select a draft download format. The CLI uses `wizard --config-format json|yaml|markdown`; its report remains JSON. Preserve the original file and comments, keep Markdown body notes separate, and use the filename shown in the agent handoff. `@notabenda/core/config/document` exposes the browser-safe codec; the Node reader re-exports it.
