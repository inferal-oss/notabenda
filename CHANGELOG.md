<!-- @requirements REQ-PRODUCT-RELEASE-CANDIDATE -->
# Changelog

## Unreleased — preparing 0.1.0

The first release is a developer preview. The packages have not been published to npm.

### Packages

- **[`@notabenda/core`](packages/notabenda/README.md):** site configuration, legal pages, browser controls, setup and discovery tools. Plain HTML, with optional React and Astro adapters.
- **[`@notabenda/authoring`](packages/notabenda-authoring/README.md):** build-time Markdown and MDX with YAML frontmatter, custom static components and retained source revisions.
- **[`@notabenda/cloudflare`](packages/notabenda-cf/README.md):** optional Durable Object storage, evidence inspection, document history and a Worker starter. Your application supplies authentication and authorization.

### Included in the preview

- **Legal pages:** describe your operator, purposes, service providers, storage and retention in TypeScript, JSON, YAML or Markdown frontmatter. Render static privacy and cookie pages, supply your own terms, and retain exact published revisions.
- **Visitor choices:** a compact cookie notice and preferences drawer, purpose-specific service gating, gated media and declared storage cleanup. Optional receipt-backed recording keeps grants off until acknowledged.
- **Terms and form permissions:** bind agreement to a particular terms version, or offer a separate purpose/channel permission with explicit refusal and withdrawal. Inspect the recorded wording alongside the current evaluated state.
- **Setup and discovery:** choose packs, answer questions in the CLI or admin UI, review recommendations and export a draft with a separate private report. Project discovery suggests services for review. The integration skill and installed reference support agent-led setup.
- **Records and operations:** search scoped evidence, compare policy and terms revisions, inspect retained source and apply the supported hold, retirement and purge mechanisms. The generated Worker starter denies access until you supply host authorization.
- **Additional controls:** selected processing opt-outs, regional consent timing, collection notices and purchase/contract mechanisms. Each has its own implementation and review limits in the [feature catalog](docs/FEATURES.md).

### Limits to review before adoption

Regional support is tracked requirement by requirement. The source catalog, setup recommendations and review declarations do not establish that a rule applies or that supplied wording is legally sufficient. See [scope and limits](docs/SCOPE.md) and the [requirements catalog](docs/requirements/README.md).

Your application owns identity, eligibility, provider behavior and downstream fulfillment. Privacy-request pages link to your workflows; they do not fulfill requests. Marketing approach-history mechanics remain a proposal. Customer-exception decisions and advertising CMP certification are not implemented. Confirmation delivery uses host callbacks rather than a built-in email provider.

The general-purpose consent entry remains above its 15 KiB gzip target; the compiled local entry meets that target. Browser and accessibility acceptance is incomplete, including physical devices and assistive technology. The [0.1.0 release checklist](docs/RELEASE-010.md) records the remaining gates. No release tag or publication is implied by these draft notes.

### Licensing and security

Notabenda code is available under [Apache 2.0](LICENSE-APACHE) or [MIT](LICENSE-MIT), at your option. Imported catalog data, bundled dependencies and official artwork retain their separate notices; see [LICENSE](LICENSE).

Report suspected vulnerabilities through the [security policy](SECURITY.md).
