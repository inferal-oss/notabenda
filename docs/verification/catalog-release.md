# Catalog references retained with policy releases

Requirements: `REQ-PRODUCT-SERVICE-CATALOG`, `REQ-PRODUCT-ARTIFACTS`, `REQ-PRODUCT-CF-HISTORY`, `REQ-PRODUCT-RETAINED-RELEASES`.

`attachCatalogReview` is an explicit build finalizer. It validates current selected disclosures/purposes, retains only selected product/provider/source facts and public site use, and excludes justification/questionnaire/re-review history. Its optional manifest descriptor binds the separate attachment. New artifact identities do not rewrite document HTML or earlier artifacts. Create notices and offers after finalization.

The backend validates declared attachment presence, digest, count and current-config consistency before immutable transactional storage. Historical release reconstruction retains both catalog and authored-source attachments. Existing public artifacts remain valid publication inputs; recording a release with a declared private attachment requires the complete archive.

Ordinary history list/get and export project no selected-reference attachment. A separate scoped store hook and explicit `allowCatalogReview` grant authorize inspection/comparison. Both sides of comparisons use that hook and must belong to the same site. The generated starter preserves attachments and forwards an independent host permission. No public ingestion endpoint or automatic release activation is added.

`packages/notabenda/test/catalog-release.test.mjs` checks exact legal HTML, hashes, old pinned URLs, source/fragments preservation, note exclusion, deterministic identities, stale/duplicate pins, missing/extra/tampered attachments, combined size limits, legacy releases, immutable retries, optional inspection authorization, ordinary export exclusion, source enum validation, multiline prose, CLI bounds and separate exclusive private files. Copies of the portable validators are compared byte-for-byte. Filesystem alias tests include symlinks and case aliases when the test volume is case-insensitive.

The website's catalog-history example archives two selected-reference snapshots with identical legal text. Site tests cover private history access and the public example's pinned artifacts. Source verification, legal review, operator identity, review chronology, publication and complete inventory coverage remain separate from these checks.


Local Worker verification also used SQLite Durable Object persistence: retained selected-reference inspection worked after stopping and restarting the Worker against the same state directory. The comparison was reviewed on desktop and at 390px/320px outer mobile widths. Changed fields precede the complete-facts disclosure; Enter opens it, and the expanded narrow view has no horizontal overflow. This does not establish screen-reader or physical-device acceptance.
