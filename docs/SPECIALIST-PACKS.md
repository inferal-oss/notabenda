# Technology, storage and tag packs

These three packs connect narrower jobs to existing components. Choose them when the actual site needs the supported mechanism. Market, language, vendor labels and pack selection do not establish applicability or enable anything.

| Pack · stable ID | What it does | Foundation |
| --- | --- | --- |
| Profiling & location notices · `technology-notices` | Explain identification, location or profiling features before activation. Québec-focused profile. | [Technology declaration](TECHNOLOGY-COLLECTION.md), existing consent controls and a retained privacy release. |
| Storage exceptions · `assessed-storage-settings` | Provide an off switch for qualifying UK statistical or appearance storage, separately from cookie consent. | [Storage exceptions](STORAGE-EXCEPTIONS.md), exclusive inventory ownership and an atomic preference journal. No consent-control prerequisite. |
| Google Basic Consent Mode · `google-basic` | Connect Google Analytics or Ads to cookie choices using Basic Consent Mode. | [Google Basic adapter](GOOGLE-BASIC.md), existing consent controls and one Google owner per document. |

Use the [pack library](/start/) or the explicitly installed local preview:

```sh
npx --no-install notabenda packs assessed-storage-settings --json
npx --no-install notabenda wizard --packs assessed-storage-settings \
  --answers ./answers.json --config ./notabenda.config.json \
  --out-dir ./storage-settings-setup
```

Read `reference.targetAnswersTemplate` for the selected job, keep unknown facts unresolved and compare the draft with the existing project. The UI, private report and matching connection brief share the same input review. Declared fields remain unverified. Separate builder inputs and actual host connections remain project work. Questionnaire revision 8 accepts reports from revisions 1–7; newly added facts stay unknown on resume. Packages remain unpublished previews.

## Profiling & location notices

This path uses the explicit `qc-private-technology-v1` declaration. Assess its scope; it is not complete Québec coverage. Identify the real technology, all identification/location/profiling functions, complete purposes, data and activation opportunities. Separate it from always-running or mixed-purpose work in the actual application.

The supported builder selects one consent-managed service with at most eight complete purposes, direct/both collection sources and only optional owned storage. The input review flags missing consent enrollment and guards, plus visible inventory conflicts for each enrolled service. It cannot select the actual declaration or verify a digest from inventory alone. Preserve the facts and scope restrictions; never change unknown or present specialized contexts to absent just to use the builder.

Author the complete declaration, host wording, function labels and direction. This is a separate builder input, not `localization.collection` or a new `SiteConfig` property. Assign `technologyCollectionScope(declaration)` before compiling, then verify the descriptor against the retained artifact. Keep the notice visible before every activation opportunity, including a global accept-all control. Opening the actual controls route must not grant permission.

Retain the exact supplemental notice separately, alongside its legal artifact and any required presentation evidence. Ordinary consent receipts do not automatically archive it or establish that someone saw it. Test old grants, disclosure placement, opening controls without saving, withdrawal cleanup, receipt failure and independent restrictions. See `REQ-QC-PROFILING` and the underlying [verification](verification/technology-collection.md).

## Storage exceptions

Review statistical and appearance uses separately, their technical isolation, qualification evidence, free objection route and the storage that remembers objections. The supported profile conditions are explicit assertions to establish, not defaults to copy:

| Profile | Required conditions |
| --- | --- |
| Both | `informationSocietyService: true`. |
| `uk-pecr-statistical` | `soleImprovementStatistics`, `aggregateNonIdentifyingResults`, `noIndividualDecisions`, `deleteIndividualDataAfterAggregation`, `noAutomaticallyEmittedSignals` and `noOtherUseOrLinking` must be true. `thirdPartyUse` is `none` or `processor-improvement-only`. |
| `uk-pecr-appearance` | `soleAppearanceOrFunctionality`, `noBehaviouralContentSelection` and `onlyNecessaryPersonalData` must be true. |

The implementation validates this supported shape and ownership; it cannot establish the underlying facts. Keep actual evidence for every condition and assess downstream personal-data processing independently. Advertising, profiling and mixed-purpose SDKs do not qualify through this path. Splitting IDs is not technical separation.

Declare `storageExceptions` with exact exclusive entry/service/purpose/storage ownership, explicit `processingActivities: []`, no Google declaration and no consent enrollment for the same managed work. Missing policy, entries or guards appear as missing inputs. Draft entries need review; even a reviewed flag is unverified. The input review lists each entry's actual condition paths without copying its values.

Provide an atomic notifying journal, hydrate it and present usable information/free objection controls before starts. Non-English native controls require complete `localization.storageExceptions` messages plus translated entry facts and information. A consent dictionary cannot translate that interface; a custom headless presentation remains available. Detaching the presentation must close its gate.

Disclose the supported until-cleared preference lifetime and its own storage. Preserve stable IDs across material revisions and never discard an objection by renaming an entry. Test failed writes, stale resume, cross-tab changes, removal of the presentation, cleanup and cookie accept-all. Consent acceptance must not clear an exception objection. Disposal of owned work and journals remains host work. See `REQ-UK-EXCEPTIONS`, `REQ-PRODUCT-STORAGE-EXCEPTIONS` and [verification](verification/storage-exceptions.md).

## Google Basic connection

Inventory the actual supported `G-*`/`AW-*` destinations. Declare every signal array: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`. An empty array keeps that signal denied. Their union must match the service's purposes; product-specific mappings, initial origin, processing classification and consent enrollment are required. The entire combined service waits for all of its purposes. No targets or mappings are generated from a provider name.

The target assessment requires at least one populated `services.googleBasic` declaration. Other services need no Google property; they do not cause a false missing-field result. Multiple declared Google services prompt an ownership review rather than automatic rejection: they may belong to different pages. Each actual document must have one adapter owning the Google globals.

Remove existing snippets, GTM, hints, queues and competing loaders before registering once, outside replayed framework renders. Inspect actual account settings, connected destinations and event payloads. DOM checks cannot prove an earlier script never ran. GTM containers, Advanced mode, enhanced conversions, identity upload and unsupported destinations remain outside this adapter.

Test zero loader attempts before effective permission and after initial refusal, denied defaults before initialization, required receipts and independent restrictions, pending-load withdrawal and deliberate event handling. Discarded events never replay. After any loading attempt, withdrawal, error or cancellation requires a new document before regrant. Removing a script cannot undo vendor code, data already sent or every later request. Plan actual full reload/navigation and storage cleanup; do not promise post-load network silence or CMP certification. Verify the real host network and account, not only the simulator. See `REQ-GOOGLE-MODE` and [the adapter guide](GOOGLE-BASIC.md).

These packs add setup paths without expanding the underlying legal coverage. `REQ-PRODUCT-SPECIALIST-PACKS` connects their registry, questions, input review, handoff and [tests](verification/specialist-packs.md).
