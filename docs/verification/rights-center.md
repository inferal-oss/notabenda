# Rights center verification

Requirement: `REQ-PRODUCT-RIGHTS-CENTER`. Related legal requirements remain partial and unreviewed.

The initial mechanism supplies bounded operator-configured, script-free navigation with an explicit scope per action, public contact fallback, review gates and safe destinations. It does not submit, acknowledge, authenticate or fulfill a privacy request.

Tests cover configuration projection, safe routes and links, absence of automatic applicability decisions, independent consent state, static accessibility relationships, private metadata isolation, exact React/core output, Markdown/MDX preservation and archive compatibility with the existing three legal-document kinds. Setup recommendations invent no actions or destinations; imported reviewed pages preserve their declarations and return to draft. Regression cases include array-valued enums, case-only route collisions and accidental draft rendering without explicit preview mode.

Verified locally on 18 October 2026:

- `npm run check`: 269 package tests and 37 site tests passed; catalog validation and the Worker dry run passed.
- Catalog: 66 requirements, 21 features, 54 sources and 66 verification scenarios, including 27 automated scenarios. Legal review and regional support remain separate statuses.
- `node scripts/check-site-runtime.mjs`: the real local Worker served the static rights destinations and native Astro page, alongside the existing SQLite history, choice, processing, lifecycle and isolated-demo checks.
- Chromium: light and midnight layouts, native action navigation and explanatory destinations, public contact, keyboard skip link and the actual compiled Astro component. Layouts at 320px and 390px had no horizontal overflow; action links retained touch-sized targets. This is an initial browser review, not a full accessibility audit.

Screenshots: [desktop](../assets/screenshots/rights-center-desktop.jpg), [mobile](../assets/screenshots/rights-center-mobile.jpg), [midnight](../assets/screenshots/rights-center-dark.jpg).

These checks establish the navigation mechanism. No request intake, identity verification, response deadline, case-management, fulfillment or appeal workflow is asserted.
