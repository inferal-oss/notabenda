# Service reference data

The optional catalog seed currently has 368 provider identities and 409 product/reference entries. It combines 2,278 cookie/storage hints imported from a pinned Open Cookie Database revision with 39 original backend/provider references and ten additional browser-product references. Twenty-six official technical references inform nineteen passive browser rules for sixteen products; these source checks do not verify provider practices. Every entry is unreviewed: this is a searchable starting point, not a list of approved vendors or a declaration of actual site use.

The source dataset has 2,279 rows. One generic XSRF-TOKEN row lacks both a platform and controller, so it remains in the preserved CSV and is omitted from provider/product identities. Product identity uses the source platform/controller pair; labels are not deduplicated into assumed legal entities. Generic drivers such as MongoDB, Redis, libSQL and Meilisearch can represent self-hosted software. An SDK match does not establish a hosted provider relationship.

- `product-profiles.json`: eight original, source-linked product profiles with explicit catalog/product revisions. Nineteen additional official references were retrieved on 20 October 2026 for Clerk, Vercel, PostHog and Sentry. The original four profile revisions remain unchanged; reading a reference does not establish actual use or approval.
- `browser-expansion.json`: original analytics, monitoring and support signatures, explicit product revisions and three source-backed npm identifiers. Existing snapshots and unaffected product pins remain unchanged.
- `backend-providers.json`: original identity/SDK reference candidates. Homepage URLs are reference-only, with no invented verification date. Signature and provider-practice review remains required.
- `sources/open-cookie-database/`: exact source CSV, Apache license and revision/content hashes.
- `schema.json`: public JSON Schema for the version-1 format. The package additionally checks cross-references, unique IDs, canonical dates and bounded plain data.
- `NOTICE`: attribution and modification notice, included in the npm package alongside the upstream license.

Rebuild or verify entirely offline:

```sh
python3 scripts/build-service-catalog.py
python3 scripts/build-service-catalog.py --check
```

The generated `packages/notabenda/src/catalog-data.json` is committed data. Ordinary installation/build performs no download. The default consent browser graph never imports the seed. The optional `@notabenda/core/catalog/seed` entry and CLI load it explicitly.

Catalog normalization and search do not contact providers. No provider privacy text, legal role, transfer mechanism, hosting-region guarantee or legal classification is supplied by the backend seed. Upstream cookie categories and retention strings remain explicitly reported hints. They are never automatically copied into an adopter's purposes, legal basis, storage declaration or consent settings.

See [the catalog guide](../docs/SERVICE-CATALOG.md) for actual APIs and remaining work.

## Go SDK signatures

`go-providers.json` adds retrieved official SDK namespace references to seven existing products. It records identifiers and original factual notes, without copying SDK code or documentation prose. Sources remain separate from provider-practice review; products remain unreviewed. The generator applies the catalog and affected-product revision explicitly, after existing profiles, while preserving unaffected product pins.

Go matching is case-sensitive. Exact rules identify a module/package root; prefix rules end with a slash. Project scanning distinguishes ordinary and indirect `go.mod` requirements from production-file and test-file imports. It does not resolve versions, build tags, replacements, workspaces or runtime use. See [the service-catalog guide](../docs/SERVICE-CATALOG.md#go-projects).
