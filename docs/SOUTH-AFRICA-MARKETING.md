# South African electronic marketing

`REQ-ZA-MARKETING` is partial and legally unreviewed. Notabenda records an explicit choice for a purpose and channel. A host still needs to establish whether it may ask for that choice and whether it may send a particular message.

## What the sources require

POPIA section 69 distinguishes consent from a qualifying existing-customer route. A consent request is limited to one approach where consent has not previously been withheld. The customer route has its own sale, similar-product and objection conditions. Each marketing message needs sender identity and a contact for stopping communications. The catalog links the [government Act, section 69](https://www.gov.za/sites/default/files/gcis_document/201409/3706726-11act4of2013protectionofpersonalinforcorrect.pdf); this is the original Act publication, not a reviewed current consolidation.

The Regulator's [direct-marketing guidance, sections 7.2–7.3](https://inforegulator.org.za/wp-content/uploads/2020/07/GUIDANCE-NOTE-ON-DIRECT-MARKETING-IN-TERMS-OF-THE-PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013-POPIA.pdf) explains specifying goods/services and the communication method, providing an affirmative or negative response, keeping proof and maintaining withholding/objection records. Read it with the later amendment.

Amended [regulation 6](https://inforegulator.org.za/wp-content/uploads/2025/04/POPIA-2021-Regulations-FINAL-21-Jan-2025.pdf) addresses accessible consent methods, recorded telephone/automatic-call requests and access to those recordings. It expressly rejects opt-out as consent. The [17 April 2025 Gazette notice](https://www.gov.za/sites/default/files/gcis_document/202504/52523gon6126.pdf) publishes the amendment for immediate implementation. This date concerns the amendment, not the original commencement of section 69.

The Regulator's [21 April 2026 statement](https://inforegulator.org.za/wp-content/uploads/2026/04/MEDIA-STATEMENT-REGULATOR-NOTES-PUBLISHED-GAZETTE-OF-THE-CONSUMER-PROTECT-ACT-AMENDMENT-REGULATIONS-2026.pdf) distinguishes the Consumer Protection Act registry from POPIA permission. Absence from an opt-out register is not consent. The CPA amendment and registry operations have not been fully reviewed here.

## Connect the current mechanism

Use a direct-collection purpose and one permission per selected channel. Write a specific statement naming the goods/services and method, identify the responsible party, link the reviewed privacy information and keep refusal independent of ordinary form submission. Add the [explicit refusal copy](FORM-PERMISSIONS.md#record-an-explicit-refusal), deploy its updated backend and archive the exact offer before activation. This is an integration starting point; the generic field is not an assertion that prescribed information or form requirements are satisfied.

Evaluate `getFormPermissionState` on the server at downstream use. `refuse` and `withdraw` both keep `permitted` false; a receipt for an earlier grant cannot override that evaluation. The working form example records choices and lets an operator inspect them. It sends no marketing and does not claim that a provider has applied suppression.

## Host work still needed

- Keep invitation history and prior withholding against the responsible party and subject, across relevant sites, channels and contact changes. A new permission stream must not reset the once-only rule. No invitation counter or solicitation authorization is provided.
- Review request contents, accessible response routes and any required telephone recordings/transcripts. A dedicated regional offer builder and reviewed prescribed-information presentation remain work to do.
- Assess any customer exception separately; ordinary consent state does not implement it.
- Apply objections to actual sending systems, including imports, queues and external copies. Maintain the appropriate wider suppression scope and test it end to end.
- Provide the required identity and cessation route in every message; review other applicable laws and the current statutory text.

## Verification boundary

The linked tests cover explicit refusal before any grant, archived copy, backoffice search/inspection, failed reads, activation changes, late grants and exact retry after a lost acknowledgement or local-journal failure. These are mechanism checks. They do not verify invitation eligibility, prescribed-form equivalence, identity, contact ownership, customer exceptions, actual sending or external suppression. See `VERIFY-ZA-MARKETING` in the [requirement catalog](requirements/README.md).
