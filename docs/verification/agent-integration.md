# Agent integration verification

Requirement: `REQ-PRODUCT-AGENT-INTEGRATION`.

The package test packs the built package, installs that tarball offline in a temporary project, resolves its exported skill path and compares the installed skill against the maintained source. It extracts the skill's commands and runs project discovery, unattended guided setup with explicit answers, configuration checking and a preview build. An ordinary production check still rejects the draft. YAML parsing checks skill frontmatter and display metadata.

The integration-reference tests typecheck every advertised config path through the actual `SiteConfig` declaration and prove an invented field is rejected. They check requested/prerequisite separation, valid target/question IDs, unknown-answer defaults, detached snapshots and preservation of imported consent settings. The CLI test runs beside deliberately invalid private config and project code, verifies installed package version and no input reads/writes, and rejects unknown targets/options without echoing supplied markers.

The website test follows every curated `llms.txt` target and local link in generated Markdown guides, checks their HTML alternate links, and verifies the public skill matches the same source. A mixed Markdown fixture covers nested image links, reference definitions, escaped labels, titles and unchanged inline/fenced code. Public asset requests require no operator/demo namespace, set no session cookie and reject writes. Only the two selected skill files are included in the generated asset manifest.

These checks exercise documentation delivery and a real local CLI workflow. They do not evaluate an agent's reasoning, establish legal suitability, publish to npm, install a personal skill, provision resources or prove browser-crawler adoption. Existing controller, authoring, history and backend tests remain responsible for those implementations. Adopters decide their own CI and review workflow.

```sh
npm run build
node --test packages/notabenda/test/agent-integration.test.mjs packages/notabenda/test/integration-reference.test.mjs
node site/build.mjs
node --test site/test/agent-docs.test.mjs
python3 scripts/regulatory.py --check
```
