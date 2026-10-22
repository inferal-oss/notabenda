<!-- @requirements REQ-PRODUCT-PROCESSING-WORKBENCH -->
# Prepare a processing opt-out notice

Use the workbench to choose the activities covered by one opt-out action and write its heading, explanation and button label. It starts from your exact final public policy artifact. [Try the editor](/processing-notice-workbench/).

This is separate from cookie consent. The resulting control opts out of every activity named in the notice. The application still binds the visitor’s context, records the request and applies restrictions to browser services, account workflows and downstream processing.

## Prepare the editor

After installing the local preview package and building your final legal release:

```sh
npx --no-install notabenda processing-workbench \
  --artifact ./legal/artifacts/RELEASE_ID.json \
  --out-dir ./processing-editor
```

Open `processing-editor/index.html` locally. The page contains its own script and styles; it needs no server or upload. Keep this editor out of your public deployment. For an existing settings file, add `--settings ./processing-notice.yaml`. Preview artifacts require an explicit `--preview`.

The tool verifies the complete artifact before preparing the editor. Every service must have an explicit `processingActivities` declaration, including `[]` where assessed empty. A missing declaration is unresolved. Non-English notices need the release’s complete `localization.processingChoices` dictionary.

## Choose the scope and wording

**Workflow scope** is part of the durable restriction context. Use a stable name such as `privacy-choices`; exclude person and account identifiers. Changing it creates a different context and must not be used to clear previous opt-outs.

Select one to three supported activities: sale, sharing or targeted advertising. These checkboxes configure the notice; they are not visitor-facing granular choices. Activities are not inferred from markets, signal settings or service classifications. A notice may cover an activity absent from the current service list. Review its actual legal meaning and the routes your application must support.

Write the heading, explanation and button label in the intended language. Status and recovery messages stay owned by the release dictionary. The editor’s wording fields and preview use that dictionary’s language and direction; the scope identifier stays LTR.

**Preview notice** shows the shared native presentation. Its action and policy reference are inactive, and it shows no invented saved or ready state. Edits clear the preview and release selection. The release checkbox confirms which artifact the settings name; it does not approve newly written wording.

**Get build settings** opens a dismissible drawer with JSON, YAML or Markdown frontmatter, a copy button and an optional download. Imports and exports remain local. Markdown body notes are excluded from settings and compiled notices.

```yaml
schemaVersion: 1
reviewedArtifactId: EXACT_FINAL_ARTIFACT_SHA256
scopeId: privacy-choices
activities:
  - sale
  - sharing
wording:
  title: Your privacy choices
  description: Opt out of sale and sharing of your personal information.
  actionLabel: Opt out of sale and sharing
```

Settings contain exactly these fields. Scope IDs allow 1–120 lowercase slug characters; heading, explanation and action label allow 300, 2,000 and 120 UTF-8 bytes. Activities must be unique. Imported order is preserved because it contributes to the existing notice identity. Settings are separate builder inputs, not fields added to `SiteConfig`.

## Compile the exact notice

```sh
npx --no-install notabenda processing-notice \
  --artifact ./legal/artifacts/RELEASE_ID.json \
  --settings ./processing-notice.yaml \
  --out-dir ./processing-notice-build
```

This command reads the final artifact directly. It also works with Markdown/MDX or catalog-bound artifacts that a plain configuration build cannot reproduce. It rejects a different release pin before creating output. Both commands require a new directory and refuse existing files, directories and symlinks.

The output contains:

- `processing-notice.json`, a convenient current descriptor.
- `processing-notices/NOTICE_ID.json`, the same bytes under its immutable notice identity.
- The exact pinned privacy, cookie and terms files and public artifact from the selected release.

Publish these files with your site, retaining earlier referenced releases and notices. Then follow [the processing integration guide](PROCESSING-CHOICES.md) to register the notice, bind a trusted context and connect the controller, recorder and enforcement. Publishing files creates no restriction and selects no identity or backend workflow. Keep browser-signal handling separate; a signals-only path needs no recorded-notice workflow.

## Package APIs

Build-time helpers live in `@notabenda/core/authoring/processing`: `prepareProcessingWorkbenchContext`, `createProcessingWorkbenchFiles`, `createProcessingNoticeFromSettings` and `createProcessingNoticeFiles`. The browser UI is `mountProcessingWorkbench` from `/authoring/processing/ui`; settings validation and formatting are in `/authoring/processing/model`. Use `@notabenda/core/processing-workbench.css` with the ordinary package styles when mounting it in your own page.

A prepared context contains public reference facts, not proof of an unknown sender’s authenticity. Browser exports contain settings only; final compilation verifies the intact release again. Existing JavaScript `createProcessingNotice` calls and schema-1/schema-2 descriptors remain supported. [Verification](verification/processing-workbench.md) records the checked boundary.
