<!-- @requirements REQ-PRODUCT-MARKETING-AUTHORING REQ-ZA-MARKETING -->
# Prepare a South African web marketing request

Write one request for one purpose and future contact method. The editor brings together the products or services, responsible-party details, optional choice and explicit refusal. It exports data settings for the existing South African request builder; it does not decide whether you may approach a person.

[Try the request editor](/marketing-request-workbench/). The ordinary form composer remains separate: it does not author this specialized profile.

## Prepare an editor from your release

Build the legal release first, with the actual public operator details, purpose and permission-interface language. Choose a direct or mixed-source purpose. The editor needs `localization.formPermission` for a non-English release; it does not require a collection-notice dictionary.

```sh
npx --no-install notabenda marketing-workbench \
  --artifact legal-dist/artifacts/EXACT_ARTIFACT_ID.json \
  --purpose product-news \
  --out-dir .local/marketing-request
```

Add `--preview` for a preview artifact and `--settings marketing-request.yaml` to continue an existing request. The output directory must be new and its parent must exist. Open `index.html` directly in your browser: the file contains its code, styles and selected public facts. No server, package-operated service, browser storage or upload is needed.

Keep the prepared editor outside public assets. Its selected public facts may still be sensitive in context. No private source archive, recipient identity or contact value is needed.

## Write the request

1. Check the release version, language and selected purpose. The responsible-party name, address and email come from that release. Correct those facts in the inventory and rebuild if needed.
2. Describe the products or services. Choose **Email**, **SMS** or **WhatsApp** as the future marketing method, then supply its name in the request’s language. This web form collects the choice; selecting a method sends nothing.
3. Write the permission statement, optionality explanation, withdrawal explanation and action labels. Use one paragraph per field; hard line breaks and control characters are rejected.
4. Open **Request section headings** to supply the labels above the products, contact method and responsible-party details. **Refusal and confirmation copy** holds the required refusal action and its recorded, unconfirmed and retry messages.
5. Supply a stable permission ID, wording revision and actual withdrawal-help URL. A changed method needs a different stable permission; a material wording change needs a fresh revision. This editor does not check your complete historical archive. Neither change resets invitation or prior-withholding history.
6. Choose **Preview request**. It shows the same request particulars before the unchecked choice. Controls and links are inactive, with no invented saved state. A release that keeps grants blocked retains that restriction; negative actions remain representable in the connected mechanism.
7. Review the wording and explicitly select the exact release. **Get build settings** opens a dismissible drawer with JSON, YAML or Markdown-frontmatter output, copy and optional download. Copy manually if browser clipboard access is unavailable.

Editing a field clears the preview, release selection and previous export, and returns wording review to draft. Imported settings must match the prepared release and purpose; loading them does not select the release. Failed or stale imports preserve the current draft. Closing or reloading discards edits; save settings before leaving.

The optional pending-command window accepts 30–3600 whole seconds. Omission retains the builder’s 600-second default. It limits pending delivery, not the lifetime of permission. A reviewed wording declaration is an operator input, not a legal finding or permission to ask.

## Use data settings directly

The settings envelope contains one complete `SouthAfricaMarketingSettings` object. These are builder inputs, not fields to add to `SiteConfig`. All request and refusal wording is explicit; `channel` is derived from the declared future method.

```yaml
schemaVersion: 1
reviewedArtifactId: COPY_THE_EXACT_FINAL_ARTIFACT_ID
permission:
  permissionId: product-news-email
  purposeId: product-news
  revision: request-1
  reviewStatus: draft
  methodLabel: Email
  marketingRequest:
    profile: za-popia-web-request
    version: 1
    goodsServices: Reading tools and product offers.
    method: email
    labels:
      goodsServices: Products and services
      method: How we would contact you
      responsibleParty: Who is asking
  refusal:
    label: I do not consent
    recorded: Your refusal has been recorded.
    pending: Waiting for confirmation of your refusal.
    retry: Retry refusal
  wording:
    title: Product updates
    statement: I consent to receive offers for these products by email.
    grantLabel: Save email permission
    withdrawLabel: Withdraw email permission
    optionality: Optional. Continue without product offers.
    withdrawalExplanation: Withdraw here at any time.
  withdrawalUrl: /preferences
```

Replace the example facts and artifact placeholder with reviewed project inputs. JSON has the same shape; a Markdown file puts this YAML between `---` delimiters. Its body is ignored and never added to the export. Settings must be plain bounded data: no controller overrides, recipient identity, functions or additional fields. Individual fields use the underlying builder’s UTF-8-byte limits.

## Compile against the exact final artifact

```sh
npx --no-install notabenda marketing-request \
  --artifact legal-dist/artifacts/EXACT_ARTIFACT_ID.json \
  --settings marketing-request.yaml \
  --out-dir .local/marketing-request-build \
  --preview
```

Use `--preview` for a preview artifact or draft wording. Draft wording against a production artifact keeps that artifact’s identity and mode; this command does not recompile configuration or silently update the pin. Production compilation requires the existing production/review checks.

The output contains `marketing-request.json`, an identical immutable `form-permissions/OFFER_ID.json` and the exact retained privacy, cookie and terms files plus public artifact. Existing output directories and symlinks are rejected. Publish the intended files through your application; publication does not register or activate the offer.

The build API is available from `@notabenda/core/authoring/marketing`: `createMarketingRequestFromSettings`, `createMarketingRequestFiles`, `prepareMarketingWorkbenchContext` and `createMarketingWorkbenchFiles`. The browser editor is `mountMarketingWorkbench` from `@notabenda/core/authoring/marketing/ui`, with `@notabenda/core/styles.css` and `@notabenda/core/marketing-workbench.css`. Use the model subpath for settings validation and formatting. Prepared contexts and previews have no authoritative offer identity; final compilation verifies the intact release again.

## Connect the real request

Archive and activate the exact offer separately. The host supplies identity/contact binding, recording transport, current-state enforcement and the actual sending systems. Refusal, withdrawal and silence remain different states. A receipt for an earlier grant does not override current restrictions.

Review invitation eligibility and wider prior-withholding history, request contents and accessibility, any customer exception, message-level duties and actual provider suppression. The editor, compiler and tests do not establish these. See [South African electronic marketing](SOUTH-AFRICA-MARKETING.md) and [Form permissions](FORM-PERMISSIONS.md).
