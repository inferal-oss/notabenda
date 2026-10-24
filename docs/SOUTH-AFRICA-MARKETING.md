<!-- @requirements REQ-PRODUCT-MARKETING-AUTHORING -->
<!-- @requirements REQ-PRODUCT-PACK-CAPABILITIES -->
# South African electronic marketing

`REQ-ZA-MARKETING` is partial and legally unreviewed. Notabenda records an explicit choice for a purpose and channel. A host still needs to establish whether it may ask for that choice and whether it may send a particular message.

## What the sources require

POPIA section 69 distinguishes consent from a qualifying existing-customer route. A consent request is limited to one approach where consent has not previously been withheld. The customer route has its own sale, similar-product and objection conditions. Each marketing message needs sender identity and a contact for stopping communications. The catalog links the [government Act, section 69](https://www.gov.za/sites/default/files/gcis_document/201409/3706726-11act4of2013protectionofpersonalinforcorrect.pdf); this is the original Act publication, not a reviewed current consolidation.

The Regulator's [direct-marketing guidance, sections 7.2–7.3](https://inforegulator.org.za/wp-content/uploads/2020/07/GUIDANCE-NOTE-ON-DIRECT-MARKETING-IN-TERMS-OF-THE-PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013-POPIA.pdf) explains specifying goods/services and the communication method, providing an affirmative or negative response, keeping proof and maintaining withholding/objection records. Read it with the later amendment. The regulator-linked [Form 4 reference, Part B](https://inforegulator.org.za/wp-content/uploads/2020/07/FORM-4-APPLICATION-FOR-THE-CONSENT-OF-A-DATA-SUBJECT-FOR-THE-PROCESSING-OF.pdf) also identifies goods/services, communication method and affirmative/negative responses. Its heading refers to the 2017 regulations; it is not treated here as a current consolidated legal instrument.

Amended [regulation 6](https://inforegulator.org.za/wp-content/uploads/2025/04/POPIA-2021-Regulations-FINAL-21-Jan-2025.pdf) addresses accessible consent methods, recorded telephone/automatic-call requests and access to those recordings. It expressly rejects opt-out as consent. The [17 April 2025 Gazette notice](https://www.gov.za/sites/default/files/gcis_document/202504/52523gon6126.pdf) publishes the amendment for immediate implementation. This date concerns the amendment, not the original commencement of section 69.

The Regulator's [21 April 2026 statement](https://inforegulator.org.za/wp-content/uploads/2026/04/MEDIA-STATEMENT-REGULATOR-NOTES-PUBLISHED-GAZETTE-OF-THE-CONSUMER-PROTECT-ACT-AMENDMENT-REGULATIONS-2026.pdf) distinguishes the Consumer Protection Act registry from POPIA permission. Absence from an opt-out register is not consent. The CPA amendment and registry operations have not been fully reviewed here.

## Select the web-request pack

Choose **Marketing requests · South Africa** (`za-marketing-requests`) in the [pack library](/start/#pack-za-marketing-requests). Its separate target, `south-africa-marketing-request`, includes the Form permissions foundation. Selection requests integration work; it does not set a market, change scope assessments or establish permission to approach a person.

```sh
npx --no-install notabenda packs za-marketing-requests --json
npx --no-install notabenda packs za-marketing-requests --brief
```

Use the returned unknown-answer template for focused setup. The private input review keeps solicitation eligibility, request review, recording and sending-system work visible even when the inventory is structurally valid. The [shared working example](https://notabenda.org/form-permissions) uses this specialized builder and offers explicit refusal. It sends no marketing.

The ordinary [form-notice workbench](COLLECTION-WORKBENCH.md) cannot author `za-popia-web-request`. Use `createSouthAfricaMarketingOffer` with explicit builder settings; do not invent `SiteConfig` fields. Its input reference is in [Form permissions](FORM-PERMISSIONS.md#south-african-web-marketing-requests).

## Prepare request settings

Use the [marketing request editor](MARKETING-WORKBENCH.md) or supply JSON, YAML or Markdown-frontmatter settings directly. Its compiler calls the same specialized builder against the exact final public artifact. It adds no recipient binding, recording transport, eligibility assessment or sending system.

## Connect the current mechanism

Use a direct-collection purpose and one permission per selected channel. Write a specific statement naming the goods/services and method, identify the responsible party, link the reviewed privacy information and keep refusal independent of ordinary form submission. Use the [web-request builder](FORM-PERMISSIONS.md#south-african-web-marketing-requests) to retain explicit goods/services and method particulars, display the release's responsible-party details beside the choice, and require explicit refusal copy. Deploy its updated backend and archive the exact offer before activation. This is an integration starting point; the generic field is not an assertion that prescribed information or form requirements are satisfied.

Evaluate `getFormPermissionState` on the server at downstream use. `refuse` and `withdraw` both keep `permitted` false; a receipt for an earlier grant cannot override that evaluation. The working form example records choices and lets an operator inspect them. It sends no marketing and does not claim that a provider has applied suppression.

## Host work still needed

- Keep invitation history and prior withholding against the responsible party and subject, across relevant sites, channels and contact changes. A new permission stream must not reset the once-only rule. No invitation counter or solicitation authorization is provided.
- Review request contents, accessible response routes and any required telephone recordings/transcripts. The web-request builder covers visible request particulars; prescribed-information sufficiency and other collection channels still need review.
- Assess any customer exception separately; ordinary consent state does not implement it.
- Apply objections to actual sending systems, including imports, queues and external copies. Maintain the appropriate wider suppression scope and test it end to end.
- Provide the required identity and cessation route in every message; review other applicable laws and the current statutory text.

## Invitation history review

Setup now adds a dated review when South Africa is selected or already declared. Installed `notabenda describe south-africa-marketing-request --json` includes `marketingRequestReviews`: source locators, current mechanism limits and separate engineering checks. It changes no configuration and authorizes no approach.

Before asking, establish earlier approaches and withholding across the responsible party's relevant systems. A new site, channel, address or offer revision is not evidence of a fresh opportunity. Missing history is unresolved. Test refusal races and uncertain delivery; do not treat a historical receipt as permission to send again. The [proposed shared-history workflow](MARKETING-APPROACH-HISTORY.md) records the backend design and acceptance work; it is not available in the package yet.

The [6 March 2026 Gazette, notice 7198](https://www.gov.za/sites/default/files/gcis_document/202603/54268gon7198.pdf) was screened separately. Regulations 2, 3 and 7.1 concern health information processed by certain responsible parties. This instrument is not a replacement for marketing regulation 6, and the request pack supplies no health-sector compliance. Selected sources were checked on 22 October 2026; full current-law and legal review remain open.

## Verification boundary

The linked tests cover explicit refusal before any grant, archived copy, backoffice search/inspection, failed reads, activation changes, late grants and exact retry after a lost acknowledgement or local-journal failure. The version 4 profile also covers method/channel consistency, complete host-language labels, visible scope and controller details, archive integrity, adapter presentation and profile revisions. These are mechanism checks. They do not verify invitation eligibility, prescribed-form equivalence, identity, contact ownership, customer exceptions, actual sending or external suppression. See `VERIFY-ZA-MARKETING` in the [requirement catalog](requirements/README.md).
