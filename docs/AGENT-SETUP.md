# Set up with an agent

Give your coding agent the [Notabenda skill](/skills/notabenda/SKILL.md) and ask it to inspect your existing site before making changes. The skill covers discovery, configuration, documents, frontend controls, revision history and the optional backend. It keeps unknown facts visible and preserves your existing settings.

```text
Use the Notabenda skill at https://notabenda.org/skills/notabenda/SKILL.md.
Inspect this project, identify the integration points, and set up privacy,
cookie and terms pages in preview mode. Reuse existing documents and settings.
Report the facts still needed for review before publishing.
```

## Install the skill

The repository contains `skills/notabenda/SKILL.md`, its configuration-target reference and optional `agents/openai.yaml` display metadata. Copy the complete directory into your agent's supported project or personal skill directory. For agents that use `.agents/skills/`, the project destination is `.agents/skills/notabenda/`; check your tool’s supported location. Review the skill before enabling it. Installing a skill does not install packages or grant account access.

The built package also includes the same files at `node_modules/notabenda/dist/skill/`, with exported paths `notabenda/skill/SKILL.md` and `notabenda/skill/agents/openai.yaml`. This lets you use the skill shipped with your installed package version. The website skill describes the current preview, so use installed types and documentation when versions differ.

**The packages are not on npm yet.** Use a trusted repository checkout or local tarballs. After installation, `npx --no-install notabenda --help` selects the local CLI without fetching a registry package. The [package guide](../packages/notabenda/README.md) explains the API; the [setup guide](SETUP.md) covers interactive and unattended input.

## Find the right configuration

The local CLI provides a version-matched integration map:

```sh
npx --no-install notabenda describe
npx --no-install notabenda describe cookie-consent terms-agreement --json
```

Choose targets for the requested behavior: static legal pages, authored documents, cookie controls, gated media, explicit terms agreement, privacy request links, processing opt-outs, form permissions, consumer contracts, evidence, localization, regional timing or optional discovery. Prerequisites describe supporting work; nothing is activated. The map names exact configuration paths, separate host tasks, facts needed and acceptance scenarios. It includes actual wizard question IDs and an unknown-answer template from the shared setup engine.

Use [the machine-readable website reference](/integration-reference.json) if a local package is unavailable. The same reference is exposed as `describeIntegration(targetIds)` from `notabenda/integration`; the CLI additionally identifies its package version. This is a task map, not a complete JSON Schema or legal classifier. Read installed `SiteConfig` types for exact value shapes. `hostWork` is application work, rather than a config property.

The [configuration-target reference](/skills/notabenda/references/configuration-target.md) explains how to turn the user's request and project evidence into a brief, collect only material missing facts, prepare explicit answers and compare a wizard draft with the existing configuration. A policy page, runtime control and durable receipt remain separate choices. An agent should preserve unrelated settings and report the actual host work still needed.

## Documentation without the page layout

[llms.txt](/llms.txt) is a short index of the integration guides and requirement catalog. Every source-backed guide has a Markdown version at its guide URL plus `/index.md`, for example [the setup guide in Markdown](/guide/setup/index.md). Guide pages advertise that version through an alternate link in their HTML head.

Both formats come from the same maintained document. Markdown links point to the corresponding Markdown guide where available; code blocks remain unchanged. The generated index and skill use explicit public inputs, with no project scan, private reports or backend records included.

## What still needs your decisions

An agent can connect the components and test their behavior. You supply the actual operator and processing facts, select applicable requirements, review wording and decide when to publish. A source match or passing build does not establish a legal basis or complete jurisdiction coverage.

Private discovery findings and justifications stay separate from public legal output. Markdown and MDX sources belong in the private history archive when retained there. MDX is trusted build code, so inspect its imports and components. The optional Cloudflare backend uses your authorization; the demonstration's access model is specific to that demo.

Ask for a concrete handoff: changed files, checks run, unresolved facts and deployment status. Discovery and CI are tools you may choose, rather than required services.
