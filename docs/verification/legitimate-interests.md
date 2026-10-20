# Legitimate-interest disclosure verification

Requirement: `REQ-EU-INTERESTS-DISCLOSURE`.

The technical mechanism accepts an optional public purpose statement and preserves it through public projection, generated privacy wording, direct-collection notices, service details, setup edits, selected provider-review archives, permission facts and material consent scopes. It does not choose a basis, inspect a private balancing assessment or infer applicability from a language, country or free-form basis label. Supplied legal content remains author-owned. The NZ indirect-notice profile remains specific to that workflow; its descriptor accepts the complete purpose facts without claiming to implement GDPR Article 14.

Automated scenarios in `packages/notabenda/test/legitimate-interests.test.mjs` check UTF-8 bounds, control characters, missing/invalid values, unresolved production placeholders, private-field exclusion, safe rendering, localized content without new mandatory message keys, release identity, rehashed tampering/omission, consent scope isolation, standalone CF archive reconstruction and installed schema lookup. Purpose-editor tests check imported-statement preservation, edits, explicit removal and CLI placeholder handling. Catalog-release tests exercise selected snapshots and the independent CF policy.

Run `npm test`, then the site checks sequentially. Retained release files must remain byte-identical across a clean website build. A green check verifies the stated data flow and controls; it does not establish an adequate interest, balancing result, complete notice or lawful processing.

At this checkpoint, 778 package tests and 121 site tests pass. The clean production website build and Worker dry run pass, and all 356 previously retained artifact files remain byte-identical. Five affected static pages have no semantic violations, structural findings or audit warnings; axe leaves the main-landmark and primary-heading rules incomplete, while the audit's explicit structure checks pass. Contrast, assistive technology and broad platform coverage remain outside that scan.

In the actual local Worker, the light and dark notices fit a 390 × 844 viewport, start with details collapsed and toggle with Enter while retaining focus on the summary. The expanded details show the public interests beside the basis. The operator setup editor fits the same mobile width; a complete purpose was saved, then reopened at desktop size with the statement intact and correctly labelled. These checks use sample data and do not prove legal sufficiency or actual notice delivery.

Primary source: GDPR official text, Articles 6(1)(f), 13(1)(d), 14(2)(b); accessed 19 October 2026 through the [Official Journal PDF](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679). Legal review remains open. The research catalog records this selected disclosure separately from the broader notice requirement.
