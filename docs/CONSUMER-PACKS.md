# Purchase and contract packs

Choose the customer job you need. Questionnaire revision 7 accepts reports from revisions 1–6, leaving new facts unknown. The five packs reuse existing components; their plans keep applicability decisions, separate builder inputs and host work visible. Selection creates no profile, route, quote, payment, delivery or guarantee qualification.

| Pack · stable ID | What it does | Integration |
| --- | --- | --- |
| Contract withdrawal · `contract-withdrawal` | Give customers an online route to withdraw from an eligible purchase and keep a copy. | [Contract actions](CONTRACT-ACTIONS.md), [independent delivery runners](CONTRACT-DISPATCH.md). |
| German contract cancellation · `subscription-cancellation` | Provide the supported German cancellation form for eligible continuing contracts, such as subscriptions. | The supported `de-cancellation` flow in [contract actions](CONTRACT-ACTIONS.md). |
| Paid order review · `paid-order-review` | Show products, total charges and ongoing commitments before a customer places a paid order. | [Paid orders](PAID-ORDERS.md), including original product-label files. |
| Contract confirmation copies · `customer-confirmations` | Keep the customer’s full contract copy and track its handoff to your delivery service. | [Confirmation preparation and delivery](ORDER-CONFIRMATIONS.md). |
| Guarantee notices & labels · `guarantee-information` | Display the EU shop guarantee notice and qualifying producer durability labels on products. | Separate [shop notice](GUARANTEES.md) and [product label](GUARANTEE-LABELS.md) branches. |

Open [the pack library](/start/#pack-contract-withdrawal), or ask the installed CLI for one plan:

```sh
npx --no-install notabenda packs contract-withdrawal --json
npx --no-install notabenda wizard --packs customer-confirmations \
  --answers ./answers.json --config ./notabenda.config.json \
  --out-dir ./confirmation-setup
```

Packages remain unpublished previews. Install the trusted local build first. Use `reference.targetAnswersTemplate` from the pack plan, leave unknown facts unanswered, and keep the resulting configuration, private report and connection brief together. The wizard writes a new directory; it does not modify the application.

## Gather the facts for this job

Withdrawal and cancellation ask about actual contract formation and the public declaration route. Withdrawal supports the explicitly assessed `de-withdrawal`, `eu-withdrawal` and `br-withdrawal` profiles; cancellation currently supports `de-cancellation`. Built-in v1 labels retain their original German, English or Brazilian Portuguese. Custom native copy uses the complete `localization.contractActions` dictionary and four explicit definition wording fields, bound to the actual site language in v2. Language never selects a legal profile or establishes eligibility; keep unsupported regimes unresolved. See [contract interface copy](CONTRACT-ACTIONS.md#supply-your-own-interface-copy).

Paid orders ask about goods, digital content and recurring, calculated, later or conditional charges. Author the definition and live quote separately from `SiteConfig`; setup cannot create truthful prices or choose a product's guarantee branch. The exact offer, payment action and host admission/recovery must agree. A recorded action does not mean payment, contract formation or fulfillment occurred.

Confirmations ask about the complete personally addressed copy, actual contract conclusion, digital-content evidence or an explicit non-applicability reason, destination and delivery handling. **The current builder requires an existing received `@notabenda/cloudflare/orders` admission and its retained review in the same checkout context.** It cannot take an arbitrary external receipt. Inspect or integrate that foundation without automatically adding a checkout UI or manufacturing an admission for an old order. Independent pack selection does not make the backend optional for this path.

Guarantee information asks separately about the shop notice and producer labels. The shop notice's official language, source edition, extracted text and placement need review. Each product label needs the exact product/model, producer, duration and all four qualification facts, plus finished producer artwork. Unknown information cannot mean that no label is required. Structural image validation and hashes do not approve the artwork or establish legal qualification. Follow the source discrepancy and language guidance in the underlying guides.

## Read the draft input review

The UI, private report and matching agent brief share `reviewPackInputs`. Observable inventory fields are marked **declared**, never verified. A business-only audience prompts review; it is preserved rather than rewritten. Separate definitions, quote ownership, profile assessment, actual public routes, admission, delivery and artwork review remain **host work**. A locale or market does not mark those inputs present.

Builder inputs live outside `SiteConfig`. Do not add `contractActions`, order quotes, confirmation destinations or guarantee descriptors to that schema. The focused target reference lists public config paths separately from host tasks; the connection brief points to the exact builder guides and acceptance scenarios.

The legacy `consumer-contracts` target remains available for broad investigation. It is not a prerequisite of these packs. No pack silently adds terms acceptance, cookie controls or the evidence-workspace UI. Withdrawal/cancellation reuse legal release references; guarantees and paid-order definitions can stand on their own supported inputs. Stored evidence still needs host authorization, context, retention and operational policy.

## Verify the actual customer flow

Test withdrawal review and the deliberate final action, then exact-request recovery after uncertainty. The German cancellation flow instead keeps its final action directly on the confirmation page. Preserve type, optional reason and requested ending; blank means earliest possible and does not calculate a date. Acknowledgment delivery must proceed independently of contract matching or application failure.

At checkout, check the real price model, original label files and readable facts immediately before dispatch. Test stale quotes, concurrent nonces and lost-response recovery. For confirmations, test the exact files and fixed destination after restart, uncertain settlement and stale leases. Keep provider acceptance distinct from recipient delivery. For guarantee displays, review complete artwork, product association, readable alternatives, QR links and real narrow-screen placement.

Underlying legal requirements retain their own implementation and review status in the [catalog](requirements/README.md). These setup packs do not expand jurisdiction coverage or establish legal approval. Product requirement: `REQ-PRODUCT-CONSUMER-PACKS`; see [verification](verification/consumer-packs.md).

<!-- @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION -->
