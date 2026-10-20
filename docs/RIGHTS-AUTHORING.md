<!-- @requirements REQ-PRODUCT-RIGHTS-AUTHORING -->
# Configure a privacy request page

The **Privacy requests** pack can produce a draft page with your wording, request destinations, public email or phone fallback, and next steps. It also updates `privacy.rightsUrl` to that page route after an explicit decision. This is a navigation page: your application still handles requests, identity checks, deadlines, responses and appeals.

Non-English native pages and authoring require a complete `localization.rights` dictionary in the site's existing localization declaration. The operator editor remains English. Keep the actual locale intact and supply the page messages; a collection-notice dictionary cannot translate this page. See [request-page localization](LOCALIZATION.md#privacy-request-pages).

## In guided setup

Choose **Privacy requests**, prepare the draft, then choose **Configure request page**. Existing declarations show **Edit request page**. The editor lives in the Site stage alongside your imported inventory.

Supply the page route, revision and public wording. Add only the destinations you actually offer; each needs its own stable ID, kind, explanation, scope and link. No kind is selected for you. Existing destination cards start collapsed and retain their IDs. Add a public fallback and explain the next steps.

Before saving, review the current and proposed privacy link, then select **Use this page for privacy links**. Saving updates the page and link together in the local draft. It does not copy an old destination into a new action, create redirects, navigate to a workflow or verify that it works. Changing public wording, contact or routes requires a new revision; historical uniqueness remains your responsibility.

Cancel leaves the draft and its downloads intact. Saving invalidates previously prepared downloads; prepare again to include the change. Importing another config or resetting setup closes unsaved edits.

Choose **Preview pages** to read the request page beside the three legal documents. Every outside destination, including email and phone, is inactive in this local preview. The request page is a supporting navigation surface, outside the three pinned legal-document HTML files.

## From the installed CLI

Packages remain unpublished. Use a trusted workspace build or locally installed tarball. Supply a complete ordinary JSON proposal:

```json
{
  "schemaVersion": 1,
  "linkPrivacyToPage": true,
  "settings": {
    "schemaVersion": 1,
    "revision": "requests-1",
    "route": "/privacy-requests",
    "title": "Privacy requests",
    "intro": "Choose a route below, or contact our privacy team.",
    "contact": {
      "label": "Email the privacy team",
      "href": "mailto:privacy@example.test",
      "description": "Contact us if the account workflow does not fit your request."
    },
    "actions": [{
      "id": "account-access",
      "kind": "access",
      "title": "A copy of your account information",
      "description": "Find the next step for an access request.",
      "scope": "Information relating to your account; the application explains identity checks.",
      "link": {"label": "Open the request workflow", "href": "/account/privacy/access"}
    }],
    "nextSteps": ["The linked application explains how to make your request."]
  }
}
```

These are example values. Replace them with the operator's actual wording and routes; do not infer applicable rights from this sample. The file accepts no `reviewStatus`; authoring always creates a draft.

```sh
npx --no-install notabenda wizard --packs privacy-requests \
  --answers ./answers.json --config ./notabenda.config.json \
  --rights ./request-page.json --out-dir ./request-page-review
```

The proposal is limited to 128 KiB and must be an ordinary UTF-8 JSON file; symlinks and directories are rejected. Settings have the existing 64 KiB rights-page limit, one to sixteen destinations and one to six next steps. The output directory must be new. Original files are untouched. The interactive wizard can review the same JSON proposal and asks separately before replacing the privacy link.

All settings are public. Keep request contents, account identifiers, tokens and private assessments outside them. Use stable root-relative or HTTPS destinations, plain email addresses or international phone URIs. The fallback must be email or phone; it does not establish that every applicable submission-method requirement is met.

## In a custom setup interface

```ts
import {createRightsDraftPlan} from '@notabenda/core/setup/rights';
import {mountRightsEditor} from '@notabenda/core/setup/rights/ui';

const baseline = structuredClone(currentConfig);
const plan = createRightsDraftPlan(currentConfig, {
  baseline,
  settings: completePublicPageSettings,
  linkPrivacyToPage: true,
});
// Review plan.privacyLink and adopt plan.config in your local draft.

const editor = mountRightsEditor(container, {
  getConfig: () => currentConfig,
  onChange: plan => { currentConfig = plan.config; },
});
```

The draft API compares the complete normalized public baseline before saving, validates route collisions and links through the existing config contract, and returns a detached config. Unrelated inventory, restrictions and policies remain intact. The page and legal-document reviews return to draft. A stale baseline, incomplete settings or a reused current revision fails without applying the proposal. The host's synchronous `onChange` callback adopts the local result; persistence and deployment remain host work. Use the package's `styles.css` and `cartridges.css`, or supply your own styles.

See [request-page configuration and rendering](RIGHTS.md), [privacy packs](PRIVACY-PACKS.md) and [verification](verification/rights-authoring.md). The requirements catalog connects this authoring behavior to its implementation and tests without claiming complete privacy-request handling.
