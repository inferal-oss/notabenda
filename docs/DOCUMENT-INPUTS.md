<!-- @requirements REQ-PRODUCT-DOCUMENT-EXPLANATION REQ-PRODUCT-DOCUMENTS -->
# Review where document sections come from

Before publishing a generated privacy or cookie page, check which declarations it uses. A transfer statement may need correction in `privacy.transfers`; a recipient name comes from the service inventory. Editing the generated HTML would leave the next build using the old declaration.

After installing the preview package, run:

```sh
npx --no-install notabenda explain --config notabenda.config.yaml \
  --document privacy --preview
```

Choose `privacy`, `cookies` or `terms`. JSON, YAML and Markdown-frontmatter configuration use the same reader. `--json` returns a version-1 `document-input-review` report for an agent or local review tool. Omit `--preview` after reviewing the content; both the CLI and API default to production validation, including authoring shape and cross-field checks.

The command reads the named configuration and writes nothing. It does not open document sources, execute MDX, contact providers or check a deployed site. Markdown configuration notes and `private` metadata are excluded. Reports still contain public section headings and a declared document version; review them before sharing.

## Follow a section to its inputs

| Section | Inputs to review |
| --- | --- |
| Who is responsible | The declared controller contact; optional representative and data-protection contacts have separate sections. |
| What we collect and why | Purpose descriptions, data categories, declared basis and collection context. |
| Service providers and recipients | Service names, providers, locations, linked purpose names and declared privacy links. |
| International transfers | The operator's transfer statement. Provider location does not generate a safeguard claim. |
| Declared storage | Each item, its linked service/purposes and any referenced exception title. A classification remains an operator assertion. |

Each section includes `inputPaths`: JSON Pointers into the configuration, such as `/services/0/provider`. Array positions refer to this input, rather than a permanent identity across revisions. Collection paths explain empty states. Localized generation also points to the selected `localization.generatedDocuments` dictionary; that path describes the dictionary as a whole.

Generated sections are distinguished from supplied replacements and appended sections. A supplied document replaces generated clauses. An appended section points to its original array position, even though its published ID has an `additional-` prefix. No claim is made that supplied wording covers a particular obligation.

Requirement IDs link to catalog context. They do not establish that a jurisdiction applies, that a statement is accurate or that content has received legal approval. `reviewStatus` reports the operator's declaration, and the report's limits remain explicit.

## Use the build-time API

```ts
import {explainLegalDocument} from '@notabenda/core/content';

const report = explainLegalDocument(config, 'cookies', {mode: 'preview'});
for (const section of report.sections) {
  console.log(section.id, section.origin, section.inputPaths);
}
```

This reports current structured configuration. For Markdown/MDX policy content, use the [compiled release preview](AUTHORED-PREVIEW.md) to inspect the actual rendered document and custom components. The explanation report does not attribute MDX source lines or attest to a retained release. Check [published release bytes](PUBLICATION-CHECK.md) and working service controls separately.
