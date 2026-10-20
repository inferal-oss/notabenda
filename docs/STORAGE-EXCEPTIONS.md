# UK storage settings

`REQ-UK-EXCEPTIONS` connects this optional integration to the [source catalog](requirements/README.md#req-uk-exceptions). The [working example](https://notabenda.org/storage-exceptions/) keeps these settings separate from ordinary consent.

The initial profiles cover declared statistical and appearance uses. The operator must assess eligibility and provide information and a simple, free objection route. See [PECR Schedule A1 paragraphs 5–6, inserted by Schedule 12 of the 2025 Act](https://www.legislation.gov.uk/ukpga/2025/18/pdfs/ukpga_20250018_en.pdf#page=243) and the [ICO guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/). Advertising, profiling and mixed-purpose SDKs cannot be enabled through this integration. A device-access exception does not determine the basis for downstream personal-data processing.

This is an opt-in software mechanism. Ordinary configurations retain their consent behavior. Legal coverage remains partial and unreviewed.

## Declare the exact scope

Add `storageExceptions` to the normal site configuration. Each entry has a stable `id`, positive integer `revision`, explicit service/purpose/storage IDs, title, description, profile, conditions and review status. Storage owned by the entry uses `classification: 'exception'` and its `exceptionId`. It never becomes necessary storage or a consent grant.

```ts
import type {StorageExceptionEntry} from '@notabenda/core';

const appearance: StorageExceptionEntry = {
  id: 'reading-layout', revision: 1,
  serviceIds: ['reading-layout-service'],
  purposeIds: ['reading-layout'], storageIds: ['layout-preference'],
  title: 'Reading layout',
  description: 'Remember your preferred reading spacing.',
  profile: 'uk-pecr-appearance', reviewStatus: 'draft',
  conditions: {
    informationSocietyService: true,
    soleAppearanceOrFunctionality: true,
    noBehaviouralContentSelection: true,
    onlyNecessaryPersonalData: true,
  },
};

config.storageExceptions = {
  schemaVersion: 1, applicability: 'host-assessed-uk-pecr',
  preferenceRetention: 'until-cleared',
  preferenceNotice: 'These settings stay in this browser until its storage is cleared.',
  information: {label: 'Storage information', href: '/cookies'},
  entries: [appearance],
};
```

These declarations are assertions the host must establish. Validation cannot establish their truth. Production validation requires reviewed entries; previews require explicit `allowPreview: true`. The [complete sample configuration](../examples/storage-exceptions/config.mjs) also shows the statistical profile and preference-storage inventory. Statistical declarations constrain aggregate outputs, individual decisions and retention, emitted signals, and third-party use. This schema supports a deliberately limited subset of uses.

Every managed service and purpose has one exception-entry owner. It cannot also appear in consent services, share consent purposes, carry Google Basic declarations, mix storage classifications, or declare sale/sharing/targeted-advertising processing. `processingActivities: []` and explicit scope guards are required. Present or unknown restricted-scope facts keep the affected service off. Splitting one multi-purpose SDK into multiple IDs does not establish technical separation or legal eligibility.

Increment an entry's revision when its material facts change, including its information, purposes, services, storage, assessment or linked document versions. Reusing a revision with different material facts fails closed. Old tabs cannot resume newer definitions. Stable IDs preserve objections through revisions; never change an ID to discard one. Removed IDs remain in the browser preference row, up to a bounded history of 128 IDs.

## Mount the controls before starting work

```ts
import {
  createStorageExceptions, createIndexedDBStorageExceptionJournal,
} from '@notabenda/core/storage-exceptions';
import {mountStorageExceptionControls} from '@notabenda/core/storage-exceptions/ui';
import '@notabenda/core/storage-exceptions.css';
import publicConfig from './legal/notabenda.public.json';

const journal = createIndexedDBStorageExceptionJournal();
const settings = createStorageExceptions(publicConfig, {journal});
const detachService = settings.registerService('reading-layout-service', {
  purposes: ['reading-layout'],
  start({signal}) {
    // Start only owned work, honor signal.aborted, and return a teardown.
    return () => { /* stop the owned producer */ };
  },
});
const controls = mountStorageExceptionControls(
  document.querySelector('#storage-settings'), settings,
  {idPrefix: 'storage-settings', title: 'Your storage settings'},
);
```

Use a connected container. Native controls are inline, use labeled checkboxes and ordinary buttons, and open no overlay. Detaching them removes the presentation gate. Supply CSS variables or your own styles for the semantic markup. Keep the information and objection route available wherever the features run, including mobile layouts.

The controller waits for atomic journal hydration and a presentation before starting registered services. A headless host may call `attachPresentation()` after making equivalent information and controls usable, and must dispose that attachment when they cease to be available. That method records the host's promise; it cannot inspect the clarity or visibility of a custom interface.

`getSnapshot()` exposes per-entry objection, availability, reason, pending state, unsaved objection and service status. `subscribe()` receives copies. `getPolicy()` and `getConfig()` return copies. No API writes a consent receipt, sends events or starts an undeclared service.

## Object and resume

`object(id)` and `objectAll()` close their gates synchronously, then persist the objection. An unresolved or failed write keeps the local objection in place. `refresh()` retries unsaved objections before reopening anything; malformed or unreadable records stay blocked. New notifications during a read force another read before work resumes.

To turn an objected feature back on, use an explicit action with the revision shown by the current interface:

```ts
const revision = settings.getSnapshot().revision;
if (revision !== null) {
  await settings.resume('reading-layout', {expectedRevision: revision});
}
```

The row revision must be current and the entry definition must match. A stale action fails instead of clearing a newer objection. `settled()` waits for this controller's pending persistence and lifecycle work. It does not prove downstream deletion or completion of a producer that ignores its abort signal.

The optional IndexedDB journal stores only stable entry IDs, revision/digests and objection booleans under the site ID. It makes no network request. Its chosen engineering lifetime is until browser clearing; disclose and review that choice, including the storage used to remember it. A custom journal must provide atomic read/modify/write transactions, enforce bounded data, and notify other active controllers; a read followed by an unrelated write is insufficient. The host owns storage availability and database isolation.

## Cleanup and consent remain separate

The existing exact-key cleanup adapter accepts `{exceptions: settings}` in place of `{consent}`. It validates ownership before mutation, waits through initial hydration, and removes declared markers when a gate closes. It never enumerates browser storage or deletes the preference journal. Transient verification pauses can also stop a generation and clear its markers, so preserve only suitable application state in the host's lifecycle. Cookies require explicit scopes; HttpOnly and remote data remain outside this adapter. See [storage cleanup](STORAGE-CLEANUP.md).

Consent's default accept/reject labels scope themselves to “these services” when exception storage exists. Accepting consent never clears an objection. A deliberately broad “turn off all optional features” action must close both controllers:

```ts
import {rejectAllOptionalActivity} from '@notabenda/core/storage-exceptions/ui';
await rejectAllOptionalActivity(consent, settings);
```

On page disposal, destroy mounted controls, unregister or destroy service helpers, call `settings.destroy()`, wait for owned teardown, and then close the journal you created. A persisted pagehide should preserve the existing page/controller lifecycle rather than constructing duplicate owners.

[Verification and remaining acceptance work](verification/storage-exceptions.md) covers the automated cases and browser checks. Actual qualification, service behavior, accessibility across supported devices, downstream processing and operator legal review remain host work.
