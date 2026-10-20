# Set up with an agent

Give your coding agent the [Notabenda skill](/skills/notabenda/SKILL.md) and ask it to inspect your existing site before making changes. The skill covers discovery, configuration, documents, frontend controls, revision history and the optional backend. It keeps unknown facts visible and preserves your existing settings.

```text
Use the Notabenda skill at https://notabenda.org/skills/notabenda/SKILL.md.
Inspect this project, identify the integration points, and set up privacy,
cookie and terms pages in preview mode. Reuse existing documents and settings.
Report the facts still needed for review before publishing.
```

## Install the skill

The repository contains `skills/notabenda/SKILL.md` and its optional `agents/openai.yaml` display metadata. Copy that directory into your agent's supported project or personal skill directory. For agents that use `.agents/skills/`, the project destination is `.agents/skills/notabenda/`; check your tool’s supported location. Review the skill before enabling it. Installing a skill does not install packages or grant account access.

The built package also includes the same files at `node_modules/notabenda/dist/skill/`, with exported paths `notabenda/skill/SKILL.md` and `notabenda/skill/agents/openai.yaml`. This lets you use the skill shipped with your installed package version. The website skill describes the current preview, so use installed types and documentation when versions differ.

**The packages are not on npm yet.** Use a trusted repository checkout or local tarballs. After installation, `npx --no-install notabenda --help` selects the local CLI without fetching a registry package. The [package guide](../packages/notabenda/README.md) explains the API; the [setup guide](SETUP.md) covers interactive and unattended input.

## Documentation without the page layout

[llms.txt](/llms.txt) is a short index of the integration guides and requirement catalog. Every source-backed guide has a Markdown version at its guide URL plus `/index.md`, for example [the setup guide in Markdown](/guide/setup/index.md). Guide pages advertise that version through an alternate link in their HTML head.

Both formats come from the same maintained document. Markdown links point to the corresponding Markdown guide where available; code blocks remain unchanged. The generated index and skill use explicit public inputs, with no project scan, private reports or backend records included.

## What still needs your decisions

An agent can connect the components and test their behavior. You supply the actual operator and processing facts, select applicable requirements, review wording and decide when to publish. A source match or passing build does not establish a legal basis or complete jurisdiction coverage.

Private discovery findings and justifications stay separate from public legal output. Markdown and MDX sources belong in the private history archive when retained there. MDX is trusted build code, so inspect its imports and components. The optional Cloudflare backend uses your authorization; the demonstration's access model is specific to that demo.

Ask for a concrete handoff: changed files, checks run, unresolved facts and deployment status. Discovery and CI are tools you may choose, rather than required services.
