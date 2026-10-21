<!-- @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN -->
# Connect opt-outs to server processing

Use the [processing application example](../examples/processing-application/README.md) to connect a privacy choice to an actual server admission decision. The visitor page, restriction ledger, dispatch queue and independent synthetic destination show different parts of the same flow. A saved restriction record alone does not prove that a destination stopped receiving calls.

## Start before the browser loads

A first anonymous navigation with `Sec-GPC: 1` blocks the covered server producer before page rendering. It does not require login, an Origin header, a cookie or a previous receipt. The unrelated sample producer continues independently. If the host cannot resolve anonymous continuity, the current request still obeys the signal while persistence remains unconfirmed.

Connect the host's existing anonymous context in `resolveVisitor`. The example provides no identity issuer. Operator inspection, fixed notice registration and dispatch each require explicit host permissions. The notice is archived before recording; public traffic cannot register it.

## Keep the controls independent

The client uses the existing [recorded restriction controller](PROCESSING-CHOICES.md), [GPC gate](PRIVACY-SIGNALS.md) and local cookie controller. Cookie acceptance cannot clear a processing restriction. Manual submissions and browser-only signals share the same pending journal, exact request retries and `browser-report` provenance. Only actual request-header observation is recorded as `gpc-header`.

A browser report states what the backend knows; it is not proof of a manual click or a real HTTP header. The simulation checkbox is labeled accordingly. Automatic reporting waits for original pending commands and refuses to confirm local intent whose original outbox was lost.

## Check at dispatch

Queued work has no permanent permission to send. Each dispatch admission rereads the retained head and pending fence in the same serialized workspace. Once a restriction commits, later admissions cannot send covered work. A previously admitted call may still complete; the example makes that boundary explicit.

The independent destination counts received attempts and deduplicates committed payloads by a stable delivery ID/digest. An uncertain attempt stays uncertain until confirmed. Retries are bounded, share one in-flight send within an object, and recheck restrictions after restart. An opt-out prevents retransmission without inventing a delivery failure for an earlier attempt.

At `/backoffice`, compare the delivery queue with the destination's observations. Open **Restriction records** to inspect original wording, source, pinned privacy document and retained state. The private operator template is never served as a public static alias.

## Preserve unresolved intent

A pending server fence is saved before the restriction transaction. If recording fails afterward, recreating the object cannot silently reopen covered admissions. Confirmation clears only the activities actually covered by the retained head. Total storage failure cannot guarantee persistence through restart; the page reports that limitation and the browser retains its own recovery journal where storage permits.

The example is bounded application code, not a scheduler, production retention policy or real provider integration. Connect host context changes, rate limits, actual service teardown, downstream idempotency/reconciliation, erasure and recovery before deployment. Regional applicability and legal review remain separate. See [verification](verification/processing-application.md).
