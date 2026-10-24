# Contract dispatch verification

Requirements: `REQ-PRODUCT-CONTRACT-ACTIONS`, `REQ-PRODUCT-EVIDENCE-LIFECYCLE`.

Eleven focused tests in `packages/notabenda-cf/test/contract-dispatch.test.mjs` exercise the actual claim/settle ledger with the new runners. They cover independent acknowledgement during a synchronous application failure or asynchronous hang; validation of both configurations before any claim; detached callback leases and captured context/options; pre-abort, abort during a delayed claim, and abort during the final clock hook; nearly expired and regressing preflight clocks; malformed/accessor provider results; late success/rejection after timeout and a replacement attempt; neutral terminal/active/exhausted claims; accepted provider outcomes with failed or ambiguously committed settlement; and claim-response loss. A caller abort leaves uncertainty and cannot bypass lifecycle draining.

Astra reproduced two defects during review: cancellation triggered inside the final host clock read could still permit callback invocation, and clock regression below the claim time was detected only at settlement. Both are fixed with preflight high-water checks and a final cancellation check immediately before invocation, with regressions asserting zero provider calls. Review found no further actionable issue after these fixes.

The optional `scripts/check-contract-dispatch-runtime.mjs` ran successfully with the actual local Wrangler runtime. Its dedicated fixture, `scripts/fixtures/contract-dispatch-worker.mjs`, uses separate SQLite Durable Objects for the declaration ledger and an independent provider simulation. The harness binds loopback only and uses an ephemeral test capability; these test endpoints are not added to the website, package or starter.

Observed sequence:

1. Capture a declaration and dispatch both jobs. Acknowledgement accepts and settles while the simulated application accepts but loses its response; the application job stays uncertain.
2. Claim application again, stop the Worker, and restart against the same SQLite state. The live lease and original receipt survive; a premature competing attempt invokes no provider.
3. Advance the controlled clock beyond expiry and dispatch again. The new attempt uses the original delivery ID/digest. The provider simulation sees two requests but retains one committed acceptance. The old lease cannot settle over the replacement, and acknowledgement is not sent again.
4. Capture another declaration with an application callback that never settles. The helper times out that attempt while acknowledgement remains independently accepted. Original capture receipts remain unchanged.

This proves local state-machine and restart behavior with test providers and a controlled clock. It does not prove a real provider's idempotency, a production alarm/queue or retry policy, prompt acknowledgement in service, recipient delivery, external quiescence, fulfillment, or regional legal suitability. Synchronous blocking callbacks and unresponsive storage cannot be preempted by a JavaScript timer. The feature and regional verification remain partial.

The complete workspace check passed: 369 package tests and 50 site tests (419 total), requirement/source traceability, packed installed TypeScript consumers, static website build and Worker deployment dry run. The packed consumer imports both runner APIs, supplies the typed callbacks and checks invalid callback/partial-destination configurations at compile time.

The rendered [delivery guide](../assets/screenshots/contract-dispatch-guide-desktop.jpg) was inspected in Chromium. At 320px, its documentation menu starts collapsed, page width stayed within the viewport, and wide code/table content scrolled within its own container. The screenshot is documentation evidence; no new delivery control or test dispatch endpoint was added to the public demo.
