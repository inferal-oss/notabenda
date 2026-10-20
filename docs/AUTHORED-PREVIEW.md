<!-- @requirements REQ-PRODUCT-AUTHORED-PREVIEW -->
# Preview the authored release

Markdown, MDX and custom components can produce pages that differ from a configuration preview. Read the compiled result before publishing it, then export that same build.

[Open the compiled example](/authored/preview/). Expand a document to read it. The reader identifies Markdown, MDX and configuration-based pages, their versions, dates and declared review status. File references include the original HTML digest and, for authored documents, the source digest and component revision. Original source is kept in the private archive.

## Generate a local reader

Compile trusted project sources first. The optional Node-only preview helper accepts that build; it does not compile or evaluate MDX, fetch anything, start a server or write files.

```js
import {compileAuthoredDocuments, readDocumentSource} from '@notabenda/authoring';
import {createAuthoredReleasePreview} from '@notabenda/authoring/preview';

const terms = await readDocumentSource('./legal/terms.mdx', {
  components: yourStaticComponents,
  componentsRevision: 'legal-components-4',
});
const build = await compileAuthoredDocuments(siteConfig, {terms});
const preview = await createAuthoredReleasePreview(build, {
  initialDocument: 'terms',
});
// Write preview.files to a separate local preview directory.
// Publish the public release only after reviewing it.
// Retain build.archive through your private archival integration.
```

Write the returned `files` map using your existing build tooling and serve that folder locally. Open its `index.html`. Use an isolated preview folder rather than writing into existing website output. The helper never receives original source through a separate upload or browser compiler. MDX compilation remains trusted build-time code that may run imports and custom components.

Production validation is the default. For a deliberately incomplete build, pass `{mode: 'preview'}` to both compilation and the preview helper. Drafts remain marked; opening the reader changes no review declaration. This is a fixed release, not a live connection to setup. Rebuild after changing inventory, source or components.

## Export the build you reviewed

**Download public release** saves a deterministic ZIP containing the exact compiler public files: current legal pages, pinned HTML, public artifact, manifest and configuration. A configured supporting privacy-request page is included unchanged. The chosen stylesheet is included too. **Public artifact JSON** downloads the same artifact for later publication checks.

`publicFiles` also exposes those export files directly to local build tooling. The `files` map is the separate reader, its assets and downloads. Neither map includes source attachments, component implementations, local source paths or private reports. The preview requires the compiler's exact public file map and rejects extra files, including an accidentally added source file. Keep `build.archive` separate; existing host-authorized source/history inspection remains available in the backend.

The ZIP uses UTF-8 stored entries with fixed timestamps, CRC checksums, ordinary file attributes and bounded ASCII relative paths. Export input is limited by the existing 128 KiB public-artifact validator; the ZIP's combined content budget is 1 MiB. Larger or unsupported builds fail rather than silently omitting files.

After deploying the ZIP's public files, run the installed publication checker against the downloaded artifact:

```sh
npx --no-install notabenda check-publication \
  --artifact ./artifact.json --origin https://your-site.example --json
```

Pass `--preview` only for an intentionally preview-mode artifact. The checker compares four retained files. It does not verify current routes, active recording selections, browser behavior, applicability or legal compliance. See [publication checks](PUBLICATION-CHECK.md).

## Presentation and trust

The reading frames reconstruct static article markup from the compiled pages. URLs, executable attributes, forms, foreign content and active elements are removed. Images become labeled placeholders; custom fonts are blocked. Frames allow their same-origin stylesheets and retain native reading/disclosure controls, but no scripts, forms, popups or navigation. The original HTML is unchanged in the export. Hash consistency is not authentication of a build or approval of its content.

Serve the reader and its assets together. Its CSP permits same-origin styles and frames; an additional host CSP must permit these too. It needs no script permission or remote preview endpoint. Host-provided CSS is trusted presentation code; a stylesheet may request same-origin imports. Prefer an isolated local origin without application credentials. Fonts, images and other deployment assets are not bundled or verified by this reader.

The default stylesheet comes from the installed core package. To use the actual CSS behind a custom compiler stylesheet URL, pass both `stylesheetUrl` and its exact `stylesheet` text. The helper never reads an inferred project path or follows a URL. These styles are separate from the HTML hashes; the ZIP digest binds their exported bytes. Supply other site assets through your deployment tooling.

See [verification](verification/authored-preview.md).
