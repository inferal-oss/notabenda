<!-- @requirements REQ-PRODUCT-COLLECTION-WORKBENCH REQ-PRODUCT-COLLECTION-FLOW -->
# Prepare a form notice

A form notice explains why a form asks for information. Some purposes may also need a separate permission. The workbench helps you write the notice, choose the presentation for each purpose, and prepare ordinary permission wording from an exact legal release.

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
3. Choose **Notice only** or **Separate permission** for every selected purpose. For a separate choice, enter its wording, action labels, withdrawal URL, channel, stable permission ID and wording revision. The editor does not interpret a legal basis, infer permission from optionality, or choose a route from a country.
4. Open **Preview notice**. The shared renderer shows the selected facts and the separate permission text. Links are inactive. This static view connects no permission controls, recording, submission or presentation receipt. Use the separate rehearsal below to try the choices locally. The preview has no authoritative notice or flow identity.
5. Review notice and permission wording separately. Editing a permission resets that permission’s declaration and the notice declaration to draft; edits clear the release confirmation and stale preview/export. Keep field instructions and required-field behavior in your actual form.
6. Choose **Copy build settings**. The dismissible drawer provides JSON, YAML or Markdown frontmatter and a copy button. If the clipboard is unavailable, copy the selected text manually. Save it as a separate settings file.

## Try the form flow

Confirm the selected release, then choose **Try form flow**. The drawer uses your current settings and the actual permission controls with a temporary recorder. It does not send information, run your form handler or change a review declaration.

- **Try ordinary submission** stands in for your application's submit button. It works without a permission, after refusal or withdrawal, and while a permission is unconfirmed. Only its own counter changes.
- **Check saved permissions** reads the temporary recorder. Reading and checking a box create no permission event. Each choice starts unchecked; choose its action deliberately.
- In **Recording scenario**, choose a failed read, a failure before recording, or a lost response after recording. The observer distinguishes the recorder's state from the controller's confirmed permission. A lost response can leave one event recorded while permission remains unconfirmed.
- Return to **Normal recording**, then use the choice's retry button. It resends the same pending request; the temporary recorder returns the earlier receipt without adding a second event. A refusal or withdrawal keeps permission off while confirmation is missing.
- **Start fresh** clears this run. Closing, reloading, importing a file or editing the settings also discards the rehearsal. Nothing resumes automatically.

The recovery journal exists only in memory. Native recovery messages such as “saved on this device” describe that temporary journal here; they do not mean the rehearsal survives reload. All policy, provider and withdrawal links are inactive. The source release remains visible under **Source release**; temporary rehearsal identities are never added to your settings or exported as a compiled flow.

Ordinary permission scope and language checks still apply. This rehearsal does not cover specialized marketing invitations, actual field placement, identity/contact binding, delivery or downstream effects. Build the final output and test those in your application.

To add the rehearsal to your own operator tool:

```ts
import {mountCollectionRehearsal} from '@notabenda/core/authoring/collection/rehearsal';
import '@notabenda/core/styles.css';
import '@notabenda/core/collection-workbench.css';

const rehearsal = mountCollectionRehearsal(container, {
  context,
  settings: editor.getSettings(),
  releaseConfirmed: true, // only after the operator chooses the release
});
await rehearsal.open(); // call from a deliberate user action
// Dispose when the settings change or the operator tool unmounts.
rehearsal.destroy();
```

Opening requires Web Crypto in a secure browser context. The context and settings are captured at mounting. Host controls and transports are intentionally not accepted; use the normal permission API when connecting the real application.

## Write a separate choice

Each selected purpose has its own permission editor. Start with the permission heading and statement, explain what happens if the person declines, and give the withdrawal route. The save/withdraw labels describe the actual actions your application will connect. The builder accepts one paragraph per permission field; line breaks are rejected.

**Channel, identifiers and recording** holds the stable permission ID, channel ID and label, wording revision and optional pending-command window. Keep the permission ID stable for ordinary wording revisions. A changed purpose or channel may need a new stream; do not rename a stream to make prior records disappear. Supply a new revision when meaning changes. This local tool cannot check every historical release or decide whether your wording is legally sufficient.

The optional delivery window is 30–3600 whole seconds. Blank preserves omission and uses the builder’s 600-second default. It limits delivery of a pending command, not the lifetime of permission. **Offer an explicit refusal action** exposes all four refusal labels/messages; leaving it off does not turn silence into a refusal record. Read the [permission API guide](FORM-PERMISSIONS.md) before connecting these actions.

Imported settings populate the current fields, including refusal and delivery-window settings. Toggling to notice-only hides the permission fields while retaining their draft in memory; switching back restores it. Only selected routes are exported. Reloading still discards edits, so copy settings before closing the tool.

Ordinary permissions require a nonmissing scope assessment with all four effective facts marked absent in the selected release. Missing, unknown or restrictive facts block that route. For a non-English release, `localization.formPermission` must also be complete; the collection dictionary alone is insufficient. The editor explains the missing prerequisite while keeping notice-only authoring available. It never changes the assessment, supplies a translated fallback, or silently converts a permission to notice-only.

Specialized South African marketing requests use their separate builder. Their fields are rejected in ordinary collection-flow settings. Contexts prepared by an earlier package version preserve their supplied complete permission branches; prepare a new workbench to edit them.

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

`createCollectionWorkbenchFiles` creates standalone HTML by default. `{delivery: 'directory'}` emits HTML, JavaScript and CSS separately for an existing host. The context is bounded public data from a trusted build, not a signature or a new evidence artifact. Browser structural checks cannot authenticate its sender. The final builder remains the authority for matching settings to your real release. The optional permission context contains only effective assessments for the selected purposes and the selected permission dictionary. No new `SiteConfig` field, backend, authentication mechanism or CI requirement is introduced.

[Verification and remaining limits](verification/collection-workbench.md).
