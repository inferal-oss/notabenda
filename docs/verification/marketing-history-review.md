<!-- @requirements REQ-ZA-MARKETING REQ-PRODUCT-AGENT-INTEGRATION -->
# Marketing invitation-history review verification

The focused test is `packages/notabenda/test/marketing-request-reviews.test.mjs`. It checks selected source/catalog agreement, separate screening of the 2026 health-information instrument, detached agent metadata, preserved configuration and declared-no answers, unchanged historical reports, private CLI output boundaries and the shared browser setup recommendation.

This verifies advisory setup behavior, not invitation eligibility. The [approach-history proposal](../MARKETING-APPROACH-HISTORY.md) has no implemented ledger, admission API, atomic refusal integration, sender or restore barrier. Its acceptance scenarios remain planned. Existing purpose/channel permission tests continue to cover the installed choice mechanism separately.

Run `npm run build`, then `node --test packages/notabenda/test/marketing-request-reviews.test.mjs`.
