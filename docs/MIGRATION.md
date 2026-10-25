<!-- @requirements REQ-PRODUCT-RELEASE-CANDIDATE -->
# Move an existing site to Notabenda

Start with the site’s actual processing and the choices it already holds. Replacing a banner is only one part of the change. Keep the old deployment recoverable while you connect and test the new one.

## Unreleased browser API migration

The unreleased primary browser API now requires a compiled descriptor. Replace `createConsent(fullSiteConfig)` from root/headless with `createConsent(runtimeConfig)` where `runtimeConfig` was emitted by `compileConsentRuntimeConfig` in build/SSR code or by `notabenda build --consent-runtime local|required`. Do not move the compiler into browser code. [Browser configuration](BROWSER-CONFIG.md) shows both paths.

Wrap required-receipt options in `requiredConsentEvidence(...)` from `@notabenda/core/consent/evidence` and compile with `evidence: 'required'`. The primary factory rejects plain receipt options and rejects a required descriptor without its adapter. Local mode also rejects an adapter; there is no implicit downgrade.

`createConsent` returns `ConsentStateController`, whose `getConfig()` contains only `ConsentRuntimeInventory`. Both React entries expose this narrow type. Keep full config separately in build/SSR code for legal documents and other workflows; select public dictionaries or descriptors for browser components that need them. Do not cast the smaller inventory to the full type. Keep provider and hooks/components from the same React entry.

For a staged migration, explicitly opt into the older behavior:

```js
import {createCompatibilityConsent} from '@notabenda/core/consent/compat';
const consent = createCompatibilityConsent(publicSiteConfig, environment, {
  // evidence: plainRequiredReceiptOptions, when required receipts are used
});
```

This subpath also exports `createConsent` as an alias. It validates full site configuration, preserves the full getter and accepts the previous plain evidence options. Its larger browser dependency graph is outside the primary small-runtime path; importing it does not satisfy the primary transfer-size gate. It does not waive production review, receipt binding, service cleanup or storage-migration requirements. Prefer completing the descriptor migration before shipping. Dated verification reports retain measurements for the API and source they tested; new primary-entry measurements must be verified separately.

Preserve valid refusals, withdrawals, prompt memory and pending receipt recovery. See [stored-choice migration](CONSENT.md#stored-choice-migration) for the conservative treatment of older grants; changing the import does not authorize rewriting archived notices or releases.

## Record what is running

Run [project discovery](DISCOVERY.md), inspect the browser and review backend processing. Include script loaders, embeds, preloads, tag managers, storage, audience exports and account-linked restrictions. Keep the private discovery report and setup justifications outside public assets and Git. Discovery findings need review; absence from a scan does not establish absence from the application.

Keep a lawful copy of earlier policies and evidence that the operator needs to retain. Preserve their original identifiers, wording and dates. Retaining an adopter’s own historical documents does not grant a right to redistribute another vendor’s proprietary templates in this project.

## Decide how old choices will be respected

Notabenda does not import an opaque preference cookie as permission. A value such as `accepted: true` cannot establish matching purposes, providers, wording, scope or expiry. Without a reviewed, technically verified mapping, the new controller starts with no grants. Keep covered work blocked until an appropriate deliberate choice is available.

Existing refusals, objections, browser signals and account restrictions still matter. Preserve the old values and arrange how the host will honor them. Do not erase refusal memory, rename an identity or change a processing revision to obtain another prompt. A new UI is not a reason to discard an earlier restriction.

While reviewing solicitation timing, the native controls can stay on demand:

```js
import {createConsent, mountControls} from '@notabenda/core';

// Build-time descriptor, as described in browser configuration.
const consent = createConsent(runtimeConfig);
const controls = mountControls(container, {consent, noticeMode: 'on-demand'});
// The persistent preferences trigger remains available. Opening it grants nothing.
```

This changes presentation only. It imports no legacy decision, determines no legal prompt timing and blocks no tracker already running outside the registered lifecycles. Connect actual work through the controller and preserve separate restrictions. This is the vanilla mount option; framework adapters have their own documented options. See the [consent guide](CONSENT.md).

## Replace loaders before directing traffic

Remove the old automatic snippet, tag manager triggers, hints and competing initialization from the new deployment. Register one owner for each optional service before it can be requested. Check server jobs separately. Do not let the old and new systems both initialize the same tracker during a staged rollout.

Prepare truthful inventory, reviewed documents and version-bound notices. Choose explicit lifetimes and the desired local or recorded-evidence mode. The [pack connection guide](CARTRIDGES.md#connect-and-check) keeps the required facts and application work together. For recorded evidence, resolve identities and contexts on the host; browser fields do not authenticate a person.

## Preserve history and retry continuity

Retain exact older public artifact paths when records still refer to them, using the [release helper](RELEASES.md). Keep private Markdown/MDX archives separate. Do not rebuild an old version from current config or rewrite its provenance identifiers.

If migrating an existing Notabenda preview, compare the installed schemas and guides before changing code. Keep stable purpose, service, exception and context identifiers where they still describe the same thing. Advance material versions when the facts change. Preserve pending immutable requests, later withdrawals, objection memory and retired-context fences. A rollback must still honor restrictions recorded after its original snapshot; [recovery guidance](CLOUDFLARE-RECOVERY.md) explains why restoring old bytes is not enough.

## Check the actual rollout

Use a fresh browser and a returning browser with known prior refusal. Check initial blocking, deliberate granular choices, withdrawal, reload, expiry, changed scope, unavailable storage and an unavailable recording endpoint. Check the network and owned storage, including hints, frames and backend effects. A current “accepted” display is insufficient evidence.

Read the legal pages with JavaScript disabled. Check mobile layout, keyboard use, accessible labels and the real privacy-request destinations. Inspect retained versions and, where used, the exact recorded choices. [Pinned publication checks](PUBLICATION-CHECK.md) verify selected public file bytes; they do not verify loader behavior, legal wording or the whole deployment.

Publish only after the host’s rollout review. Keep an explicit rollback path that stops optional work and preserves newer restrictions. Adopters choose their own CI and deployment gates.

## Remove or replace Notabenda

1. Stop the affected processing or connect an effective replacement before removing its controls. Stop server jobs and vendor calls separately; removing a widget does not stop them.
2. Settle or preserve pending restrictions, withdrawals and delivery commands according to the host’s recovery policy. Do not invent acknowledgments or replace an uncertain command with a fresh identity.
3. Destroy mounted views, then the host-owned controllers and service registrations at the appropriate application teardown. Wait for asynchronous cleanup and close owned journals. Executed vendor code may require a full document navigation; a removed script cannot recall data already sent.
4. Remove imports, bootstrap code, snippets, resource hints and unused package dependencies. For a local tarball installation, `npm uninstall @notabenda/core @notabenda/authoring @notabenda/cloudflare` removes the selected dependencies from that project; remove only the packages that it no longer uses.
5. Keep required public document routes, retained releases, private records and operator access available for the applicable retention period. Removing npm dependencies is not an instruction to erase evidence or Cloudflare objects. Continue retention/hold, export, backup-expiry and authorized erasure handling through the host.
6. Clean only exact obsolete browser keys after checking pending recovery and restriction continuity. Do not clear all site storage. Deleting local choice memory does not grant permission or erase server records; a replacement must retain the applicable restrictions.

No migration, uninstall command or documentation page decides that historical records may be deleted. The host owns the retention and erasure decision, including copies and restore procedures.
