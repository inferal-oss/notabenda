# notabenda-authoring

Write legal documents in Markdown or MDX, with YAML frontmatter for titles, versions, routes and review status. Bring your own static MDX components and keep exact source alongside immutable rendered releases.

This optional **build-time** package leaves the `notabenda` browser core framework-independent. It needs Node.js 22 or later. Apache 2.0. Currently an unpublished developer preview.

```js
import { compileAuthoredDocuments, readDocumentSource } from 'notabenda-authoring';

const terms = await readDocumentSource('./legal/terms.md');
const release = await compileAuthoredDocuments(siteConfig, { terms }, { mode: 'preview' });
// Publish release.files. Archive release.archive through your authenticated backend.
```

Both `.md` and `.mdx` begin with YAML:

```md
---
kind: terms
title: Terms of use
route: /terms
version: "one"
effectiveDate: 2026-10-18
review:
  status: draft
---

## Using the service

Your appropriately reviewed terms go here.
```

Production builds require reviewed documents. `sectionIds` maps level-two headings to stable slugs. `source: generated` preserves privacy/cookie inventory and appends your authored explanation; the default `supplied` replaces that document's body.

For MDX, pass `components` and `componentsRevision` to `readDocumentSource`. Components render to validated static HTML during the build; no React runtime is shipped to visitors. MDX is trusted executable project code. Do not evaluate untrusted uploads. Scripts, frames, forms, inline styles, remote images and suspended fallbacks are rejected in published output.

`release.files` and `release.artifact` contain public rendered output and hashes. **`release.archive` contains original source and must remain private.** It can be atomically registered with `recordLegalRelease` from `notabenda-cf`; source inspection and comparisons use the host's existing authorization hook.

Source limit: 24 KiB per document. Rendered body: 48 KiB. Combined private archive: 124 KiB. Markdown, MDX, metadata, component output, source integrity and private inspection are covered by tests.

Full guide: [docs/AUTHORING.md](../../docs/AUTHORING.md). Working example: [examples/authoring](../../examples/authoring/build.mjs). Legal review, applicability, reproducible builds and host security remain the adopter's responsibility.
