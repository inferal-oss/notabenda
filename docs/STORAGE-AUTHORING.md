<!-- @requirements REQ-PRODUCT-STORAGE-AUTHORING -->
# Declare browser storage in setup

Use **Browser storage** in guided setup to review the names, owners, duration and classification of storage actually used by your site. The editor is under **Site → Inventory and existing configuration**; cookie-pack connection steps also offer **Review browser storage**. Declare real services first. Search matches names, IDs and owners; a page shows at most twelve declarations.

Every new item needs a stable ID, exact name, type, owning service, actual duration and an explicit classification. Nothing is selected from a catalog hint. Necessary storage requires a public reason. That reason is an assertion for assessment, not proof of an exemption; private questionnaire notes are kept separately. Unknown facts must stay unresolved rather than becoming invented declarations.

Saving changes only the local inventory and explicit material versions. It performs no storage read/write, cookie expiration, service start, permission action or deployment. Existing policies, guards, enrollment and purpose versions remain intact; legal documents return to draft review. Canceling leaves prepared output intact. Saving invalidates it so the revised notice can be prepared again.

## Material versions and previous markers

The runtime's material service version must change for every affected consent-managed owner. Moving storage between owners needs a new version for both enrolled owners, including all purposes those owners serve. A batch applies inventory and supplied versions together. It never adds or removes consent enrollment, chooses a lifetime or supplies a new version automatically.

Use a never-reused version. The editor can compare only the current supplied configuration, not every historical version. Removing an item or changing its name/type/owner leaves old browser markers and cleanup targets to review. Download the separate **storage-change review** after saving: it retains previous declarations, affected owners, old/new material versions, any revised technology inputs and migration notes. The download contains every successful storage change from this editor session, including each site ID, even after importing or resetting the public draft. It is limited to 128 changes and 512 KiB; export it before leaving or starting a new session. This review is not part of public config or the ordinary setup-answer report. Keep it with your operator records. It contains no storage values; do not put personal identifiers or tokens into declaration names.

The [cleanup adapter](STORAGE-CLEANUP.md) supports exact optional cookie, localStorage and sessionStorage targets. IndexedDB and `other` remain valid disclosure types but need separate cleanup. Cookie path/domain, HttpOnly, third-party or partitioned behavior remains host work. Duplicate declared type/name pairs produce an ambiguity warning, never an assumption that they identify the same stored item.

## Profile-owned storage

An assessed-exception item's classification and its owning service membership are protected. Review the complete [storage-exception profile](STORAGE-EXCEPTIONS.md) separately. This editor cannot add ordinary storage to that owner or bypass review by reclassifying an item.

A [technology-bound service](TECHNOLOGY-COLLECTION.md) needs a revised complete declaration and its derived `technology-v1:` scope. Supply the declaration JSON in the editor and choose **Use revised declaration scope**. The API/CLI verify the same binding; a generic version cannot replace it. Keep the supplied settings, compile the release with their derived scope and rebuild the matching technology descriptor. Saving this inventory does not build or publish that descriptor.

## From an installed CLI

Packages remain unpublished. With a trusted local build or tarball installed, use a complete versioned proposal:

```json
{
  "schemaVersion": 1,
  "changes": [{
    "action": "add",
    "item": {
      "id": "reading-count",
      "name": "reading-count",
      "type": "sessionStorage",
      "serviceId": "reading-metrics",
      "duration": "Until withdrawal or the end of the session.",
      "classification": "optional"
    }
  }],
  "serviceScopes": [{"id": "reading-metrics", "scope": "reading-metrics-2"}]
}
```

Replace the example with actual facts and current inventory IDs. For `update`, supply `storageId` and a complete `item` with the same ID. For `remove`, supply only `action` and `storageId`. `serviceScopes` contains exactly the affected enrolled owners, once each; use `[]` if none are enrolled. For a technology-bound owner, also supply its complete revised settings as `technology` beside `id` and the matching derived `scope`.

```sh
npx --no-install notabenda wizard --packs cookie-choices \
  --config ./notabenda.config.json --answers ./answers.json \
  --storage ./storage-proposal.json --out-dir ./storage-review
```

The ordinary UTF-8 JSON proposal is limited to 128 KiB and 32 distinct item mutations. Symlinks/directories, duplicate IDs, unknown fields, invalid links between inventory/policies, stale baselines, unchanged current versions and no-op edits fail. The final setup inventory is limited to 512 items and the resulting config to the 512 KiB setup-import limit. Existing source files are never overwritten, and the output directory must be new.

Alongside the draft config and ordinary private report, the command writes **`storage-change-review.private.json`**, using private file permissions and a generated `.gitignore` entry. It is separate from the public configuration and is not automatically published or resumed as mutation history. The interactive wizard can review the same proposal and asks before adopting it. Optional storage without consent configuration remains a draft needing a separate controls decision; if controls already exist, the owner must be explicitly enrolled.

## Custom operator interfaces

```ts
import {createStorageDraftPlan, assertStorageDraftBaseline} from '@notabenda/core/setup/storage';
import {mountStorageEditor} from '@notabenda/core/setup/storage/ui';

const baseline = structuredClone(currentConfig);
const plan = await createStorageDraftPlan(currentConfig, {
  baseline,
  changes: explicitInventoryChanges,
  serviceScopes: explicitAffectedVersions,
});
// Review plan.changes, scopeChanges, technologyBindings and reviewItems.
// After the operator's decision, recheck current facts before adoption.
assertStorageDraftBaseline(currentConfig, baseline);
currentConfig = plan.config;

const editor = mountStorageEditor(container, {
  getConfig: () => currentConfig,
  onChange: plan => { currentConfig = plan.config; },
});
```

The asynchronous plan uses platform WebCrypto for technology-bound scopes. It validates and copies declarations before hashing. The full normalized public baseline fences each save, including changed policies, services and guards; custom interfaces must re-read the host config and call `assertStorageDraftBaseline(currentConfig, baseline)` immediately before adoption. The built-in editor performs that recheck, disables fields while saving and abandons pending work after cancel, import/reset or destruction. The host owns persistence and deployment. Supply `styles.css` and `cartridges.css`, or your own styles. Preserve the returned migration review and technology settings separately; changing an inventory declaration does not prove that a real service has stopped writing or that old data was removed.

See [verification](verification/storage-authoring.md) for tested boundaries and remaining operational work.
