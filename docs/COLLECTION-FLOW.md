<!-- @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS -->
# A notice and a separate permission

A contact form can use an address to answer a message while offering a separate choice about email updates. The notice explains both uses. The updates have their own unchecked control; sending the message does not select that control or record permission.

The collection-flow composer builds this arrangement from explicit host decisions. It belongs to the existing **Form notices** and **Form permissions** packs. Try the [combined form](/collection-flow/) or its [midnight theme](/dark/collection-flow/).

## Decide what each purpose needs

Select one to eight ordinary direct-collection purposes from a reviewed legal release. Write the actual processing condition in each purpose's `legalBasis`, then choose its presentation:

| Decision | Generated output |
| --- | --- |
| `notice-only` | The purpose appears in the collection notice. No permission offer or control is created for it. |
| `separate-permission` | The purpose appears in the notice and has one separately worded purpose/channel permission offer. |

These are presentation instructions, not legal-basis values. The composer does not interpret `legalBasis`, decide whether a condition applies or infer a route from optional fields, jurisdiction or language. If one purpose mixes activities that need different handling, split those activities into suitable purposes first. A notice-only decision does not authorize a cookie or exempt device access from another applicable rule.

Every selected purpose needs a decision. Missing, duplicate, unknown or unresolved decisions fail. A notice-only decision cannot carry permission settings; a separate-permission decision needs all offer settings. Specialized marketing profiles, indirect/mixed collection and unsupported ordinary-permission contexts need their separate APIs or process. This first composer does not combine several channels for the same purpose.

## Build from a reviewed release

```ts
import {createCollectionFlow, verifyCollectionFlow} from '@notabenda/core/content';

const flow = createCollectionFlow(build.artifact, {
  reviewedArtifactId: build.manifest.artifactId,
  notice: {
    scopeId: 'contact-form',
    purposeIds: ['enquiries', 'product-news'],
    reviewStatus: 'reviewed',
    wording: {
      title: 'About this form',
      intro: 'We use your message to answer you. Email updates are a separate choice.',
    },
  },
  decisions: [
    {purposeId: 'enquiries', presentation: 'notice-only'},
    {
      purposeId: 'product-news',
      presentation: 'separate-permission',
      permission: {
        permissionId: 'product-news-email',
        channel: {id: 'email', label: 'Email'},
        revision: 'one',
        reviewStatus: 'reviewed',
        wording: {
          title: 'Email updates',
          statement: 'Send me product news by email.',
          grantLabel: 'Save email permission',
          withdrawLabel: 'Withdraw email permission',
          optionality: 'Optional. Your message works without updates.',
          withdrawalExplanation: 'Withdraw updates here at any time.',
        },
        withdrawalUrl: '/preferences',
      },
    },
  ],
});
verifyCollectionFlow(flow, build.artifact);
```

Pin `reviewedArtifactId` after reviewing that exact release. A new release requires a new explicit review input; passing old decisions by purpose ID alone fails. The builder checks the release and derives the notice and offers together. The verifier reconstructs the complete flow against a trusted artifact, including purpose facts, documents, identities, routes and wording. Neither hashes nor review flags establish legal approval or authenticate an unknown author.

Public flow output contains the selected disclosure facts and presentation decisions. Keep private assessments outside these inputs. Production requires reviewed production privacy content, notice wording and permission wording. Preview needs `{mode:'preview'}` when building and `{allowPreview:true}` on the frontend.

## Use a configuration document

The CLI accepts the same settings as `.json`, `.yaml`, `.yml` or Markdown YAML frontmatter:

```sh
notabenda build --config notabenda.yaml --out-dir legal-dist
# Review this build and copy its exact artifact ID into the flow settings.
notabenda build --config notabenda.yaml --collection-flow contact-flow.md --out-dir legal-dist
```

The second command writes `collection-flow.json`, a static `collection-flow.html` fragment and `collection-flows/<flowId>/` files containing that same flow, fragment and individual offers. Markdown body notes are excluded from public output. The file is build input, not a field to add to `SiteConfig`. A rebuild into a directory containing `collection-flow.json` requires the switch again, so an omitted option cannot silently leave an old flow beside a changed legal release. Publishing files does not register or activate backend offers.

## Render and connect

```ts
import {renderCollectionFlow, mountCollectionFlow} from '@notabenda/core/collection/flow';
import {createFormPermission} from '@notabenda/core';
import '@notabenda/core/styles.css';

// Server/build: put this fragment in a dedicated container beside the host fields.
const html = renderCollectionFlow(flow, {idPrefix: 'contact-privacy', headingLevel: 3});

// Browser: supply the host context and transports for the existing permission API.
const offer = flow.permissions[0];
const permission = createFormPermission(offer, hostPermissionOptions);
const view = mountCollectionFlow(container, {
  flow, idPrefix: 'contact-privacy', headingLevel: 3,
  permissions: {[offer.permissionId]: permission},
});
// The host may deliberately load the current state after mounting.
await permission.refresh();
```

Static output keeps the notice and distinct permission text readable without JavaScript. There is no notice-approval field. Hydration verifies the exact static fragment, preserves its notice and opened details, and adds only the declared permission controls. Use a unique instance prefix and match render/mount options. A changed fragment or controller from another offer fails before replacing content.

Mounting adds no transport read or form-submit handler. Checking the permission changes a draft; its own recording action waits for a receipt. The host owns ordinary form submission, authenticated identity/contact binding, transports, journal choice and downstream enforcement. Connect each generated offer through the [existing Cloudflare permission API](FORM-PERMISSIONS.md#trusted-cloudflare-operations). Call `view.destroy()` when removing the view, then destroy owned controllers and journals separately.

For another language, supply complete matching `localization.collection` and, when a permission is selected, `localization.formPermission` messages in the release. Author the notice and offer text in that language too. A notice-only flow needs no form-permission dictionary. Keep the language and unresolved translation work explicit.

The [Türkiye review](TURKEY-PROCESSING.md) explains the source context for keeping the two concepts separate. This composer does not supply a country certification, translated legal clauses or a finding that the user's processing condition is valid.

Use the [form-notice workbench](COLLECTION-WORKBENCH.md) to choose direct purposes, write the notice and export separate build settings from an exact final release. New notice-only flows and preservation of supplied complete permission branches are supported.
