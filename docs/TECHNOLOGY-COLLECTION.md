# Technology functions and activation

Use the optional build-time `notabenda/technology` entry to describe a declared service’s identification, location or profiling functions before offering activation. The [working example](/technology/) builds a browser-only reading-interest profile after a saved choice. Every article remains available while the profile is off.

This initial `qc-private-technology-v1` profile supports the mechanics linked to `REQ-QC-PROFILING`. It does not determine Québec applicability, necessity or legal basis, perform legal review, or support biometrics, specialized high-risk processing or entirely automated decision workflows.

## Declare the technology

Supply a complete public declaration. `technologyDescription` explains the actual technology and data use; `activationInstructions` explains the real controls. Label text comes from the host, with explicit document language and direction. No language selects a jurisdiction.

```ts
import {
  technologyCollectionScope,
  createTechnologyCollectionNotice,
  renderTechnologyCollectionNotice,
} from 'notabenda/technology';
import { compileLegalDocuments } from 'notabenda/content';

const declaration = {
  profile: 'qc-private-technology-v1',
  scopeId: 'reading-profile',
  serviceId: 'reading-profile',
  revision: 'reading-profile-1',
  functions: ['profiling'],
  technologyDescription:
    'Counts the topics opened while enabled and suggests a topic from those counts.',
  activationInstructions:
    'Open privacy choices, select Reading interests and save. Turn it off there to remove the session profile.',
  controlsLink: { label: 'Open privacy choices', href: '/reading/#privacy-choices' },
  reviewStatus: 'draft',
  direction: 'ltr',
  wording: {
    title: 'Reading interests',
    intro: 'Choose whether this page remembers the topics you open.',
    functionsLabel: 'Function',
    purposesLabel: 'What it is for',
    providerLabel: 'Service',
    defaultOff: 'This feature starts off. Opening this notice does not enable it.',
    activationLabel: 'How to turn it on or off',
    privacyLinkLabel: 'Read the privacy policy',
    draftLabel: 'Draft notice for review',
    contactLabel: 'Contact',
  },
  functionLabels: {
    identification: 'Identification',
    location: 'Location',
    profiling: 'Profiling',
  },
} as const;

// The inventory must already declare this service, its complete purposes,
// optional storage, explicit scope assessments and consent scopes.
if (!config.consent) throw new Error('Declare optional consent scopes first.');
const service = config.consent.services.find(s => s.id === declaration.serviceId);
if (!service) throw new Error('Declare the consent-managed service first.');
service.scope = technologyCollectionScope(declaration);
const build = compileLegalDocuments(config, { mode: 'preview' });
const notice = createTechnologyCollectionNotice(build.artifact, declaration, {
  mode: 'preview',
});
const html = renderTechnologyCollectionNotice(notice, {
  idPrefix: 'reading-profile',
  allowPreview: true,
});
```

The builder accepts one explicitly consent-managed service with at most eight purposes and one to three unique function kinds. Declaration prose is bounded to 2,000 UTF-8 bytes per field and the public revision to 200 bytes. All host label keys are required, including labels for each function kind. It uses the service’s complete purpose set. Collection sources must be direct or both. Scope guards must explicitly assess the specialized contexts as absent for those purposes; unknown or present facts require a separate supported process. Ordinary profiling is not automatically high-risk profiling. Every storage item belonging to this service must be optional. A function inside an always-running service needs an actual host separation before using this profile.

The API verifies the whole retained public artifact, including configuration, document models and exact rendered bytes. It derives provider, purpose, controller and privacy-document facts from that artifact. It rejects a service scope that does not match the declaration.

## Place the information before activation

Render the technology description, functions, purpose, default-off explanation and activation instructions visibly before the first activation opportunity. Include the disclosure where a global choice could start the function too. A link to a hidden explanation after an earlier “accept all” opportunity is insufficient for this integration.

The static renderer emits semantic HTML with no JavaScript dependency. It does not activate the service or attach a click handler. Its controls link is a safe root-relative host destination. Connect that destination to your actual controls; following it must not itself grant permission.

```ts
import { createConsentRuntime, mountControls } from 'notabenda/consent';
import 'notabenda/consent.css';
import 'notabenda/technology.css';

const consent = createConsentRuntime(compiledRuntime);
consent.registerService('reading-profile', {
  purposes: ['reading-interests'],
  start({ signal }) {
    return startReadingProfile({ signal }); // Return the owned cleanup callback.
  },
});
mountControls(document.querySelector('#privacy-controls'), {
  consent,
  noticeMode: 'on-demand',
});
```

`on-demand` leaves the initial automatic notice hidden and keeps the preferences trigger. It changes no choice, expiry or receipt state. The normal automatic mode remains the default. The host still supplies the disclosure and a persistent route to reopen choices. Existing receipt requirements, processing restrictions, scope guards, storage failures and service cleanup continue to apply.

The example’s controls link opens the existing preferences dialog. Opening a topic, opening preferences or closing without saving does not enable the profile. Permission starts the topic-count listener; withdrawal removes it and the exact session marker. The example uses local topic counts, with no location request, identity verification or vendor traffic. It is a demonstration of cooperative host gating, not an audit of arbitrary scripts or backend processing.

## Revisions and retained evidence

Assign `technologyCollectionScope(declaration)` **before** compiling. It hashes the profile, service, revision, selected functions, technology description, activation instructions and controls destination. Introducing the declaration changes the service’s material scope, so an old generic grant cannot enable it. Changes to those fields also require the newly derived scope and a new release.

Presentation labels, direction and review declarations are outside that material hash. Editing them changes the notice identity without discarding grants solely for a cosmetic change. If wording changes what the person authorizes, advance the public `revision` as well.

Retain the exact public notice JSON alongside its referenced legal artifact and immutable privacy HTML. `verifyTechnologyCollectionNotice(notice, artifact)` independently verifies their binding; use explicit preview mode for drafts. Descriptor hashes establish identity, not authenticity or proof of presentation. The ordinary consent receipt binds its own notice and release: it does **not** automatically archive this supplemental technology notice or prove that someone saw it. The host must retain the supplemental descriptor and any needed deployment/presentation evidence separately.

Production calls reject draft declarations and releases. Use `reviewStatus: 'reviewed'` only for an actual review. This profile and its French label tests do not supply reviewed legal or translation content.

## Sources and verification

The [CAI private-sector collection guidance](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/collecte-renseignements-personnels_entreprises), under technology functions, describes prior information and voluntary activation with the functions off by default. Its separate sections address necessity, privacy defaults, biometrics and automated decisions. Those assessments remain operator work.

The [verification report](verification/technology-collection.md) connects the descriptor, scope checks, runtime and actual browser example to `REQ-QC-PROFILING`. Full Québec coverage and legal review remain open.
