# Configure with YAML or Markdown

Keep your site facts in the format you prefer: JSON, YAML, or a Markdown document with YAML frontmatter. They describe the same `SiteConfig` and use the same semantic validation. The format does not enable a feature, select a jurisdiction or supply missing facts.

## Start with a file

```sh
notabenda init --config notabenda.config.yaml
notabenda check --config notabenda.config.yaml --preview
notabenda build --config notabenda.config.yaml --preview --out-dir legal-preview
```

Packages are an unpublished developer preview. Use the CLI from a trusted workspace build or locally installed tarball; these commands do not publish or deploy anything.

`init` creates a draft and refuses to overwrite a file. Choose `.json`, `.yaml`, `.yml` or `.md`. The default without `--config` remains `notabenda.config.json`; another format requires its explicit path. The wizard can import any of these formats, and writes its resulting draft as JSON in a new directory. It never rewrites your source, comments or notes.

The repository includes complete [YAML](../examples/configuration/notabenda.config.yaml) and [configuration-document](../examples/configuration/notabenda.config.md) examples of the same draft inventory.

## YAML configuration

The starter contains the complete structure. This excerpt shows how ordinary fields look in YAML:

```yaml
schemaVersion: 1
site:
  id: example-site
  name: Example site
  url: https://example.test
  locale: en
  description: A product documentation site.
controller:
  name: Example operator
  email: privacy@example.test
  address: Replace with the operator's public contact address.
```

Add the required purposes, services, storage, privacy details, terms settings and document metadata from your starter. Consult the installed schema for exact fields rather than inventing abbreviated settings:

```sh
notabenda schema services --json
notabenda schema consent --json
```

Use comments to explain decisions. Multiline strings support readable prose. Quote version numbers such as `"1.0"` so they remain text. Dates such as `2026-10-20` remain strings under the supported YAML 1.2 core schema. Configuration references use ordinary IDs, as in JSON; there are no YAML aliases, includes or automatic environment substitutions.

## A configuration document

A `.md` file puts the **complete site configuration** between its opening `---` lines. Below the closing delimiter, write supporting notes in Markdown. For example, after the complete frontmatter:

```md
---
# Complete SiteConfig fields go here.
---

# Review notes

Describe how the inventory was checked and what still needs confirmation.
```

The body is returned as `notes` by `readConfigSource`. It is never rendered, merged into configuration or included in release hashes by the compiler. Editing only a body note leaves the public release unchanged. Notes are plain text: Markdown, HTML and code in this configuration body do not execute. Keep the source file outside public assets, and decide separately whether it belongs in your repository. A private filename is not access control.

This differs from [legal-document authoring](AUTHORING.md): a policy's frontmatter describes **one document**, and its body supplies published legal wording. A configuration document describes **the entire site**, and its body is supporting material. Write your actual policies in separate `.md` or trusted `.mdx` sources.

## Read a configuration in your build

```js
import { readSiteConfig } from '@notabenda/core/config/node';
import { compileLegalDocuments } from '@notabenda/core/content';

const config = await readSiteConfig('./notabenda.config.yaml', { mode: 'preview' });
const release = compileLegalDocuments(config, { mode: 'preview' });
// Write the compiler's public files into your site output.
```

`readSiteConfig` validates in production mode by default, preserving explicitly private fields in the returned input. The public compiler still excludes them. For a configuration document, use `readConfigSource(path)` when you also need its separate notes; `parseConfigSource(text, format)` parses text without reading files. Parsing alone does not validate site facts. `formatConfigSource(config, format, notes?)` serializes a new draft; it does not preserve existing comments or perform an in-place edit.

The same loader is used by `check`, `build`, `assess`, `wizard --config`, capture-based `discover --config`, and `catalog review --config`. Answers, captures, retained artifacts, catalog files and private reports remain JSON. This is not a new manifest for JavaScript callbacks, authentication, secrets or runtime loaders; wire those in the host application.

## Input boundaries

Configuration files must be ordinary UTF-8 files, at most 512 KiB. Symlinks and special files are refused. YAML accepts one root mapping with string keys and JSON-compatible finite values. Duplicate keys, merge keys, tags, anchors, aliases and directives are rejected. Errors identify syntax locations when available without printing source excerpts.

The parser uses the documented [yaml package API](https://eemeli.org/yaml/), bundled into the Node-only configuration reader at package build time. It adds no installed runtime dependencies and stays out of the browser entry graphs. Configuration does not execute JavaScript or MDX and does not resolve imports, includes, environment variables or remote files. Existing review requirements, reference checks and preview/production rules still apply.
