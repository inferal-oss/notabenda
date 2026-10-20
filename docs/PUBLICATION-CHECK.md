# Check a published release

After deploying, check the pinned public files against the trusted compiler artifact you intended to publish. This Node-only command makes four anonymous GET requests. Running it is an explicit operator decision; it is not part of builds, setup or discovery.

Packages remain unpublished previews. Use the installed local build or trusted tarball. From a consuming project with that package installed:

```sh
npx --no-install notabenda check-publication \
  --artifact ./release/artifact.json \
  --origin https://your-site.example \
  --json
```

Use the actual public compiler artifact, not a private source envelope or a configuration file. `--packs privacy-pages,terms-agreement` adds requested pack revisions as context only. It does not test those packs or expand the request list. `--preview` explicitly allows preview artifacts and draft declarations; the report records this validation mode separately from the artifact's mode. Production validation is the default.

## What the result means

The command reads exactly `/artifacts/ID.json` and `/artifacts/ID/{privacy,cookies,terms}.html`, constructing paths from the locally validated artifact ID. JSON is normalized and compared canonically, so indentation does not matter. HTML is compared as raw bytes to the document hashes. Valid media types, UTF-8 declarations and inline delivery are checked too. Redirects are reported without following them. Hosts using HTML canonicalization must preserve the pinned `.html` URL as a direct response. The Notabenda website resolves its known artifact HTML through the asset binding internally; the URL and retained bytes stay unchanged. Scripts, linked assets, current framework routes and rights pages are not loaded.

Exit status zero means the four observed retained files matched. A mismatch or failed observation returns status one. Unsupported options or input fail before any deployment is inspected. Status distinctions include missing, denied, redirect, wrong media type, charset, download-only, different bytes, invalid JSON, oversized response, timeout and network failure. A SPA fallback returning 200 does not count as the expected artifact.

The report includes the checker version, timestamps, requested/configured origins, artifact and config identities, validation mode, pack context, per-resource hashes and explicit unverified work. An origin difference is visible; the caller decides whether the alternate deployment is intended. Keep reports private. Response bodies, transport errors, browser cookies and authorization credentials are not included.

A match establishes neither pack installation nor legal compliance. Check current document routes, active notice/offer bindings, real loaders and withdrawal, evidence recording, identity and authorization separately. Four requests are observations at different times, not an atomic deployment snapshot or a promise of future retention.

## Bounds and authority

The trusted input and each decompressed response are limited to 128 KiB. Larger artifacts are unsupported by the retained-artifact validator; a rejected local input says nothing about its deployment. The overall deadline defaults to 15 seconds, with at most four seconds per request. The API permits a bounded deadline up to 30 seconds. Streamed and compressed responses have the same decompressed limit.

An explicit origin-only HTTPS URL is required. `--allow-loopback` permits an explicitly selected loopback fixture, including HTTP. There is no crawler, remote input source, redirect following, write, ambient credential access or authentication option. Do not expose this tool as a public arbitrary-origin proxy: HTTPS alone is not SSRF protection. The intended authority is a local operator choosing the origin.

For programmatic use, import `checkLegalPublication` and `LegalPublicationReport` from `@notabenda/core/publication`. This export uses Node APIs and belongs in operator/build tooling, outside the browser bundle.

See [retained releases](RELEASES.md), [host deployment checks](CLOUDFLARE-DOCTOR.md) and the [verification record](verification/publication-check.md). Requirement: `REQ-PRODUCT-PUBLICATION-CHECK`.
