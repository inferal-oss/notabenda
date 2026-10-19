# Service reference data

The optional catalog seed currently has 363 provider identities and 402 product/reference entries. It combines 2,278 cookie/storage hints imported from a pinned Open Cookie Database revision with 39 original backend/provider references and three additional browser-product references. Nine official technical documentation sources inform seven passive browser rules for six products; these source checks do not verify provider practices. Every entry is unreviewed: this is a searchable starting point, not a list of approved vendors or a declaration of actual site use.

The source dataset has 2,279 rows. One generic XSRF-TOKEN row lacks both a platform and controller, so it remains in the preserved CSV and is omitted from provider/product identities. Product identity uses the source platform/controller pair; labels are not deduplicated into assumed legal entities. Generic drivers such as MongoDB, Redis, libSQL and Meilisearch can represent self-hosted software. An SDK match does not establish a hosted provider relationship.

- `backend-providers.json`: original identity/SDK reference candidates. Homepage URLs are reference-only, with no invented verification date. Signature and provider-practice review remains required.
- `sources/open-cookie-database/`: exact source CSV, Apache license and revision/content hashes.
- `schema.json`: public JSON Schema for the version-1 format. The package additionally checks cross-references, unique IDs, canonical dates and bounded plain data.
- `NOTICE`: attribution and modification notice, included in the npm package alongside the upstream license.

Rebuild or verify entirely offline:

```sh
python3 scripts/build-service-catalog.py
python3 scripts/build-service-catalog.py --check
```

The generated `packages/notabenda/src/catalog-data.json` is committed data. Ordinary installation/build performs no download. The default consent browser graph never imports the seed. The optional `notabenda/catalog/seed` entry and CLI load it explicitly.

Catalog normalization and search do not contact providers. No provider privacy text, legal role, transfer mechanism, hosting-region guarantee or legal classification is supplied by the backend seed. Upstream cookie categories and retention strings remain explicitly reported hints. They are never automatically copied into an adopter's purposes, legal basis, storage declaration or consent settings.

See [the catalog guide](../docs/SERVICE-CATALOG.md) for actual APIs and remaining work.
