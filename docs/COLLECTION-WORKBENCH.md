<!-- @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-COLLECTION-FLOW -->
# Prepare a form notice

A form notice explains why a form asks for information. Some purposes may also need a separate permission. The workbench helps you write that notice and choose the presentation for each purpose from an exact legal release.

[Try the editor with the combined form’s settings](/form-notice-workbench/). It runs the reusable package UI. Your edits stay in memory; reloading discards them. To work on your own site, prepare a local copy from your final public artifact.

## Start with the release you will use

Build and review the privacy content first, including any Markdown/MDX output and attached catalog review. Choose one to eight **direct-only** purposes that could belong on this form. Mixed-source and indirect purposes need their separate notice APIs; this composer does not cover them.

```sh
npx --no-install notabenda form-workbench \
  --artifact legal-dist/artifacts/EXACT_ARTIFACT_ID.json \
  --purposes enquiries,product-news \
  --out-dir .local/contact-notice
```

Add `--preview` for a preview artifact. Add `--settings contact-flow.yaml` to continue from existing complete settings. JSON, YAML and Markdown YAML frontmatter are accepted for settings; use the public artifact JSON for `--artifact`, never the private source archive.

The output directory must be new and its parent must exist. Open `index.html` directly in your browser. The standalone file includes its code, styles and selected public facts. It makes no network requests, runs no source/MDX, and uses no browser storage. Keep it outside your public deployment: controller details, purpose facts, provider associations and document references may still be sensitive in context. Preparing a copy does not change the release, settings file or site configuration.

## Work through the form

1. Check the document version, language, date and release reference. Explicitly choose that release for the settings; loading a file does not check this box.
2. Enter a stable form scope, heading and introduction in the content language. Choose the purposes actually used here. No purpose is selected in a new workbench.
3. Choose **Notice only** or **Separate permission** for every selected purpose. The editor does not interpret a legal basis, infer permission from optionality, or choose a route from a country.
4. Open **Preview notice**. The shared renderer shows the selected facts and any preserved permission text. Links are inactive. No permission controls, recording, submission or presentation receipt are connected. The preview has no authoritative notice or flow identity.
5. Review the notice wording separately. Changes to wording, scope or purpose selection return its declaration to draft and clear the release confirmation. Keep field instructions and required-field behavior in your actual form.
6. Choose **Copy build settings**. The dismissible drawer provides JSON, YAML or Markdown frontmatter and a copy button. If the clipboard is unavailable, copy the selected text manually. Save it as a separate settings file.

The first authoring path supports new notice-only flows. A separate-permission route needs complete host-authored settings supplied when preparing the context. Existing channel, revision, wording, withdrawal URL, refusal and delivery-window settings are preserved. The workbench does not create or edit those offers; an incomplete branch blocks preview and export. Revise it with the [existing permission API](FORM-PERMISSIONS.md), then prepare a new context. No branch is silently converted to notice-only.

## Build the authoritative output

For a release produced by the plain configuration CLI, use the same configuration and build settings:

```sh
npx --no-install notabenda build \
  --config notabenda.yaml \
  --collection-flow contact-flow.yaml \
  --out-dir legal-dist
```

Use the plain CLI rebuild only when it produces the same release. A preview artifact needs `--preview`. Draft wording against an already production-mode artifact needs the exact-artifact API below with `{mode: 'preview'}`; adding `--preview` to a plain configuration rebuild would change the artifact ID. The drawer selects this exact-artifact path when needed. A reviewed declaration in the editor is an operator input, not a legal finding.

For Markdown/MDX or catalog-attached releases, use the **same final build pipeline** that produced the selected artifact:

```ts
import {createCollectionFlow, verifyCollectionFlow} from '@notabenda/core/content';

// For draft wording or a preview artifact, pass {mode: 'preview'} to both calls.
const flow = createCollectionFlow(finalBuild.artifact, settings);
verifyCollectionFlow(flow, finalBuild.artifact);
```

The drawer uses the exact-artifact path whenever a default configuration rebuild cannot reproduce the selected release, including authored content, catalog attachments and custom build options. A plain-configuration rebuild cannot reproduce an authored release; it will reject the different `reviewedArtifactId`. Rebuild, review and prepare a new workbench after a release changes. Never replace the pin merely to make a stale settings file pass.

The final builder verifies the real artifact and generates the descriptor, exact fragment and individual permission offers. Publish those outputs and place the fragment beside the actual fields. Test the pinned privacy route and no-JavaScript reading separately. Host permission controllers, identity/contact binding, submission, recording and downstream behavior remain your application’s work. See [compose a collection form](COLLECTION-FLOW.md).

## Embed the editor in your own tools

Prepare the public context in Node after finalizing the release:

```ts
import {prepareCollectionWorkbenchContext} from '@notabenda/core/authoring/collection';

const context = prepareCollectionWorkbenchContext(finalBuild.artifact, {
  purposeIds: ['enquiries', 'product-news'],
  settings: existingCompleteSettings, // optional
});
```

Then mount the separate browser entry and styles:

```ts
import {mountCollectionWorkbench} from '@notabenda/core/authoring/collection/ui';
import '@notabenda/core/styles.css';
import '@notabenda/core/collection-workbench.css';

const editor = mountCollectionWorkbench(container, {context});
// This requires a complete explicit route and current release confirmation.
const settings = editor.getSettings();
editor.destroy();
```

`createCollectionWorkbenchFiles` creates standalone HTML by default. `{delivery: 'directory'}` emits HTML, JavaScript and CSS separately for an existing host. The context is bounded public data from a trusted build, not a signature or a new evidence artifact. Browser structural checks cannot authenticate its sender. The final builder remains the authority for matching settings to your real release. No new `SiteConfig` field, backend, authentication mechanism or CI requirement is introduced.

[Verification and remaining limits](verification/collection-workbench.md).
