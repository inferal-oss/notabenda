# Privacy information and opt-out packs

Four focused setup paths connect the existing components: **Form notices**, **Indirect collection**, **Privacy requests** and **Processing opt-outs**. Choose them in the [pack library](/start), or use the installed CLI:

```sh
npx --no-install notabenda packs collection-notices indirect-collection privacy-requests processing-opt-outs --json
npx --no-install notabenda wizard --packs privacy-requests --config ./notabenda.config.json
```

The wizard asks the relevant practice questions and retains your reasons privately. It does not create form-specific descriptors, request destinations, opt-out policies or recording transports from yes/no answers. The connection guide identifies missing declarations and the manual project work that remains. Give the matching config, private report and agent brief to the person or agent doing that work.

## Form notices

Use `collection-notices` for information beside fields where people provide data directly. Select actual direct or mixed-source purposes, supply context wording and build `createCollectionNotice` against the exact privacy release. The notice must appear at the real collection surface; keep individual field instructions and submission behavior in the host form.

The draft review identifies whether eligible purposes are declared. For a non-English site it also identifies the missing `localization.collection` dictionary. Those declarations still need factual and wording review. Scope IDs, purpose selection, descriptor review and unique layout IDs are manual builder inputs. [Direct collection integration](COLLECTION.md).

## Indirect collection

Use `indirect-collection` when information comes from another source. This has a separate integration target and questions. A mixed-source purpose can need both packs; neither path assumes that every category was collected indirectly.

The supported `nz-ipp3a` implementation requires an explicit applicability assessment. Supply the advance/collected phase, exact indirect category subsets, sources, recipients, authority declarations, access/correction route and reviewed wording against the pinned release. Arrange actual notification, timing and any required evidence separately. A rendered fragment does not establish notification.

The current indirect renderer is **English-only**. The direct form-notice dictionary does not translate it. Another site locale remains a review item; do not change the site's actual language to bypass the limit. This is an implementation preview with unreviewed legal coverage, not complete or production-supported New Zealand coverage. [Indirect collection integration](INDIRECT-COLLECTION.md).

## Privacy requests

Use `privacy-requests` for a static page that leads to actual request workflows. Supply `rightsCenter`: action kinds, scope explanations, stable destinations, a public email/phone fallback, next-step wording and a review declaration. Setup preserves imported actions while reopening their wording review; it does not invent routes.

Test each destination while logged out, without a suitable account and without JavaScript. The fallback must be available when an account workflow does not fit. Opening a link must not claim that a request has been submitted or fulfilled. Intake, identity, deadlines, decisions, appeals and fulfillment remain host work. No cookie controls or package evidence backend are required for this page. [Privacy request integration](RIGHTS.md).

The rights entry page is a supporting navigation page, outside the three pinned privacy/cookie/terms HTML files. Publish and test it and its destinations separately; retaining the three documents does not verify those routes.

## Processing opt-outs

Use `processing-opt-outs` to plan restrictions independently of cookie permission. Setup separates actual processing classification, applicability of browser signals, explicit recorded requests and server/account effects.

Classify every service with `processingActivities`. An explicit `[]` means the operator assessed no listed activities; an omitted field is still missing. An empty service inventory also needs review. Classification is a declaration, not a legal finding.

Choose the paths the actual application needs:

- An assessed browser-signal path uses `privacySignals` and actual observed signals. This alone does not require a recorded ledger.
- Explicit recorded restrictions use a pinned processing notice, host-bound context, read/submit transports and retained restriction handling. This alone does not require a `privacySignals` policy.
- Server jobs, provider calls, exports and associated accounts need real downstream enforcement and continuity. A browser indicator or stored instruction cannot establish those effects.

Test initial and failed reads, unavailable signals, lost acknowledgments, reloads, context changes and concurrent restrictions. Cookie accept-all cannot lift a separate restriction. There is no package reset or re-opt-in flow. Existing host service gates can be reused; selecting this pack does not automatically select the cookie or evidence-workspace packs. [Browser signals](PRIVACY-SIGNALS.md) · [Recorded processing restrictions](PROCESSING-CHOICES.md).

## Read the input review

The scoped private report includes a regenerated `packInputs` list for these four jobs. The UI shows missing declarations and review needs first; a foldout retains declared inputs and manual project tasks. The agent connection brief contains the same items without copying private justifications or config values.

```js
import {selectPacks, reviewPackInputs, formatPackBrief} from '@notabenda/core/packs';

const selection = selectPacks(['privacy-requests']);
const review = reviewPackInputs(selection, draftConfig);
const brief = formatPackBrief(selection, 'connect', {config: draftConfig});
```

`missing`, `needs-review`, `declared` and `host-work` describe input state only. `productionReady` is always false. A declaration is unverified, and the checks do not run builders, visit destinations, deliver notices, inspect a deployed integration or decide legal applicability. Keep the review private. Saved review objects are ignored on resume and rebuilt from the supplied config.

Questionnaire revision 6 adds the focused questions. Reports from revisions 1–5 remain readable; missing new answers remain unresolved. Existing pack IDs and revisions, imported restrictions and saved private notes are preserved. [Engineering verification](verification/privacy-packs.md).

<!-- @requirements REQ-PRODUCT-RIGHTS-AUTHORING -->
The **Privacy requests** pack has a [page editor and explicit CLI proposal](RIGHTS-AUTHORING.md) for actual destinations, scope, public fallback and next steps. Saving also updates the privacy link after confirmation. Its native presentation is English-only; requests still go to the host application.
