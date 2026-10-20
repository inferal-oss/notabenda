# Growing the pack library

The twelve installed packs are the first setup paths, rather than the full compliance overview. Several implemented components still require adopters to assemble their own integration. Those are good candidates for additional packs.

This is a product roadmap. The first privacy group is now available; later groups remain proposals. The [installed library](CARTRIDGES.md) remains the source of availability; the [feature catalog](FEATURES.md) records implementation status separately.

## First: everyday privacy jobs

| Available pack | Existing foundation | What remains in the adopter’s project |
| --- | --- | --- |
| Form notices and Indirect collection | [Direct notices](COLLECTION.md), [indirect notices](INDIRECT-COLLECTION.md); FEAT-FORMS | Ask where and how information is collected, select the relevant purposes and exact released wording, then guide placement and review. Direct and indirect collection need distinct paths. Rendering a notice records no permission. |
| Privacy requests | [Rights entry points](RIGHTS.md); FEAT-RIGHTS | Ask which request routes actually exist, their scope and fallback contact. Check that each link reaches a working host workflow. This is an entry point, not rights-case management or fulfillment. |
| Processing opt-outs | [Browser signals](PRIVACY-SIGNALS.md), [recorded restrictions](PROCESSING-CHOICES.md); FEAT-US-CHOICES | Gather applicability and actual processing activities; connect signals, browser restrictions and optional durable account/downstream handling. Cookie acceptance must not clear an independent restriction. |

These four setup paths are now in the installed library. They reuse the collection, rights and processing modules, with separate direct/indirect targets, focused questions and a draft input review shared by the UI, private report and agent brief. Builders, destinations, notification and downstream effects still need project integration and verification. See [the privacy-pack guide](PRIVACY-PACKS.md).

## Next: consumer transactions

| Proposed pack | Existing foundation | What setup still needs |
| --- | --- | --- |
| Contract withdrawal | [Contract actions](CONTRACT-ACTIONS.md), [delivery runners](CONTRACT-DISPATCH.md); FEAT-CONTRACT-ACTIONS | Select an assessed supported withdrawal profile, exact definition and host handoff; show what remains before an acknowledgment or delivery can be claimed. |
| Subscription cancellation | The separate cancellation flow in [contract actions](CONTRACT-ACTIONS.md); FEAT-CONTRACT-ACTIONS | Gather continuing-contract facts and supported profile conditions. Keep cancellation separate from withdrawal windows and privacy-consent withdrawal. |
| Paid order review | [Paid orders](PAID-ORDERS.md); FEAT-PAID-ORDERS | Bind the reviewed offer, items, full price and deliberate action to actual host payment/contract behavior. An evidence receipt does not perform payment or fulfillment. |
| Customer confirmations | [Confirmation archives and delivery](ORDER-CONFIRMATIONS.md); FEAT-ORDER-CONFIRMATION | Gather the personally addressed content, attachments, fixed destination and real delivery integration. Make unresolved or uncertain delivery visible. Keep it independently selectable from order review. |
| Product guarantee information | [Shop notice](GUARANTEES.md), [product labels](GUARANTEE-LABELS.md) | Distinguish shop-level legal information from an eligible producer's product-specific guarantee. Ask the relevant product, producer, language, applicability and review questions; do not enable labels from a country selection alone. |

The existing `consumer-contracts` target is deliberately broad. Before adding these packs, split its configuration questions, prerequisites and checks into the specific supported jobs. A shared target must not silently select every purchase feature.

## Then: named regional mechanisms and integrations

- **Technology activation information:** the supported [technology-function notice](TECHNOLOGY-COLLECTION.md), with its own scope, placement and activation checks. Avoid presenting it as complete Québec coverage (`REQ-QC-PROFILING`).
- **Assessed storage settings:** the supported [storage-exception profiles](STORAGE-EXCEPTIONS.md), with every eligibility condition and independent objection route. This is not a shortcut around cookie permission (`REQ-UK-EXCEPTIONS`, with the exact supported profiles and sources in that guide).
- **Google Basic connection:** the [adapter](GOOGLE-BASIC.md), only where the host uses those tags. Require the actual purpose mapping, loader order and network tests; certification remains a separate deferred undertaking (`REQ-GOOGLE-MODE`, FEAT-AD-CMP).

Do not manufacture one pack per jurisdiction or catalog requirement. Some requirements belong inside an existing pack's questions, wording or tests. Scope guards, localization, service discovery, Markdown/MDX authoring and framework selection support multiple packs; keep them available where needed without turning every supporting capability into a new installation decision.

## Admission rule

A pack joins the installed registry only when it has a bounded outcome, supported applicability questions, exact configuration and review paths, an integration example, a useful connection brief and tests for its behavior and failure states. Link it to the existing requirement and verification IDs. Show unknown facts and remaining host work; selection must not activate a feature or imply legal approval.

Keep one registry for the website, reusable UI, CLI and agent handoff. Adding a pack does not require another npm package. Split distribution only when a real dependency, runtime or release boundary warrants it.
