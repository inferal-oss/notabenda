# Write policies in Markdown or MDX

Keep shared operator, processing, service and storage facts in [site configuration](CONFIGURATION-SOURCES.md), which can use JSON, YAML or configuration-document frontmatter. Write document-specific metadata in **YAML frontmatter**, then use Markdown for prose or MDX for your own static components. Both formats feed the same immutable release and evidence workflow.

The optional `@notabenda/authoring` package runs in Node.js during your build. The browser core and Cloudflare backend retain zero runtime dependencies. Packages are currently an unpublished developer preview; use workspace builds or local tarballs.

## One metadata format for both

Use a `.md` or `.mdx` file with this frontmatter:

```md
---
kind: terms
title: Terms of use
route: /terms
version: "2026-10-18"
effectiveDate: 2026-10-18
review:
  status: draft
sectionIds:
  Using the service: use
  Your content: content
---

## Using the service

Your own appropriately reviewed provisions go here.

## Your content

Write in **Markdown**, with lists, links and tables when useful.
```

Required fields are `kind` (`privacy`, `cookies`, `terms`), `title`, `route`, `version`, `effectiveDate` and `review.status` (`draft` or `reviewed`). Quote versions so YAML retains them as strings. Dates use `YYYY-MM-DD`. Frontmatter cannot add arbitrary inventory fields, private data, aliases, explicit tags or duplicate keys. Routes, dates and review status are validated before any MDX executes. A review flag records your decision; it does not perform legal review.

`source` defaults to `supplied`: the body supplies that complete document. For privacy and cookie documents, use `source: generated` to retain inventory-generated sections and append your authored explanation. Generated addendum section IDs receive an `additional-` prefix. Terms always require supplied content.

`sectionIds` maps exact level-two heading text to a stable lowercase slug. Keep IDs stable across revisions so a wording change compares against the same provision. Without a mapping, IDs derive from headings. An optional intro before the first `##` becomes an Introduction section; each section needs readable body text. Deeper headings stay within their enclosing section. Duplicate or unresolved anchor references fail the build.

## Compile the documents

```js
import { readFile } from 'node:fs/promises';
import { compileAuthoredDocuments, readDocumentSource } from '@notabenda/authoring';

const config = JSON.parse(await readFile('./site.config.json', 'utf8'));
const terms = await readDocumentSource('./legal/terms.md');
const cookies = await readDocumentSource('./legal/cookies.md');
const release = await compileAuthoredDocuments(config, { terms, cookies }, {
  mode: 'preview', // Production is the default and requires reviewed documents.
});

// Write release.files to your static output directory.
// release.fragments contains article fragments for your own page shell.
// Keep release.archive outside your public output directory.
```

`readDocumentSource()` accepts regular UTF-8 `.md` and `.mdx` files up to 24 KiB, including any byte-order mark. It preserves the original text and line endings for source history. Symlinks, directories and special files such as named pipes are rejected. A file replaced during opening or growing past the limit also fails; error messages omit its path and contents.

Unspecified documents continue to come from site configuration. Document frontmatter overrides that document's configuration; shared inventory stays unchanged. The `notabenda` CLI accepts JSON, YAML or configuration-document frontmatter for site facts. Legal Markdown and MDX bodies still use this optional build API.

## Your own MDX components

MDX supports Markdown plus expressions, imports and JSX. Supply a component map, or use trusted local imports resolved relative to `readDocumentSource()`'s file URL.

```mdx
---
kind: terms
title: Terms of use
route: /terms
version: "one"
effectiveDate: 2026-10-18
review:
  status: draft
---

## Getting started

<PolicyNote title="Please read">
  Your own reviewed explanation goes here.
</PolicyNote>
```

```js
import { createElement } from 'react';
import { compileAuthoredDocuments, readDocumentSource } from '@notabenda/authoring';

const terms = await readDocumentSource('./legal/terms.mdx', {
  componentsRevision: 'policy-components-3',
  components: {
    PolicyNote: ({ title, children }) => createElement('aside', {
      className: 'policy-note',
    }, createElement('h3', null, title), children),
  },
});
const release = await compileAuthoredDocuments(config, { terms }, { mode: 'preview' });
```

Set `componentsRevision` when providing a component map. It is a human-readable build reference, not an independently verified dependency lock. The compiler also hashes actual rendered output, so a component changing its words changes the release even when the MDX source stays identical. Components receive `config` (public document configuration) and `site` props. Keep builds deterministic and retain your dependency lockfile and component code for reproducibility.

MDX is **trusted project code**: evaluation can run JavaScript and imports with your build process's privileges. Never feed untrusted visitor uploads into it. Published-output sanitization does not sandbox evaluation. The [MDX compiler documentation](https://mdxjs.com/packages/mdx/) explains evaluation and component rendering; Notabenda separately parses the YAML because [MDX does not handle it by default](https://mdxjs.com/guides/frontmatter/).

## Static output that fits your site

Output is ordinary HTML, with no React runtime or hydration delivered to visitors. Markdown supports paragraphs, headings, emphasis, lists, links, code and GFM tables. Raw HTML requires explicit MDX. MDX components can render static callouts, local images with alternative text, accessible disclosure sections, and similar content.

The output policy rejects scripts, frames, forms, event handlers, inline styles and components requiring interactive controls. Use classes and your site's stylesheet. Images use local paths; links allow HTTPS, mailto and same-origin paths. URL normalization must also leave a local path local: dot segments that would produce a protocol-relative `//host/path` are rejected. IDs and local references are namespaced; tables scroll within their own region on small screens. A component that suspends with a fallback fails rather than publishing temporary text.

The actual rendered output is validated and sanitized before hashes and readable comparison text are derived. Readable history includes component text, list and table boundaries, link targets and image alternatives. Exact HTML remains authoritative; the text comparison does not decide legal materiality.

## Archive source privately

```js
import { recordLegalRelease, createDocumentHistory } from '@notabenda/cloudflare';

// The host supplies authenticated access and a scoped Durable Object storage binding.
await recordLegalRelease(storage, release.archive, {
  recordedAt: new Date().toISOString(),
  changeNote: 'Explain the actual change for reviewers.',
});
const store = createDocumentHistory(storage);
```

`release.files` and `release.artifact` are public build outputs. They contain exact rendered pages, structured readable documents and hashes, **not original source attachments or local file paths**. `release.archive` is a separate private envelope with the public artifact and the exact original Markdown/MDX strings. Comments and frontmatter remain in those strings. Do not write it into public assets or send it to a browser.

The backend registers the full envelope atomically. Every declared source must be present and match its format, UTF-8 byte count and SHA-256. Registering the public authored artifact alone fails; source cannot be attached afterward. Equal source and output produce the same release ID. Source-only edits change release identity even when the rendered text does not change.

The host-authorized backoffice offers source inspection and source comparisons separately from ordinary release search. It escapes stored source and never executes it. Comparison distinguishes source changes from output changes and links back to structured document comparisons. A custom history store can optionally implement `getSource(releaseId, kind)` for the same interface. Expose that hook only for a caller allowed to inspect private source; without it, source routes return 404 and their entry links are omitted. The generated CF starter requires a separate explicit source permission. Authentication, storage scope, retention and deletion remain host responsibilities.

Each source is limited to 24 KiB UTF-8, frontmatter to 8 KiB, and rendered body to 48 KiB. The combined private build archive is limited to 124 KiB, reserving 4 KiB of the backend's 128 KiB record budget for host metadata. These are explicit preview limits; oversized builds fail clearly.

See the working [authoring example](../examples/authoring/build.mjs), [MDX terms](../examples/authoring/terms.mdx), and [Markdown addendum](../examples/authoring/cookies.md). These sample files are deliberately published as read-only source views. Per-site source archives use the separate host-authorized access described above. Verification is linked through **REQ-PRODUCT-AUTHORING** in the [requirements catalog](requirements/README.md#req-product-authoring).

See the [verification record and screenshots](verification/authoring.md) for tested behavior and remaining review work.

Preview and export the actual compiled HTML with the optional [authored-release reader](AUTHORED-PREVIEW.md). It keeps public downloads separate from source archives and works without browser JavaScript.
