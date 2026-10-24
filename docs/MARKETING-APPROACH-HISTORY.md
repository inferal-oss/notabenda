<!-- @requirements REQ-ZA-MARKETING -->
# Shared marketing approach history — proposed

This is the next backend design for the South African marketing-request pack. **It is not an installed API.** The current package records a purpose/channel choice; the application still owns approach history, eligibility and sending. This proposal extends that pack rather than creating another pack for the same job.

The [source review](SOUTH-AFRICA-MARKETING.md#invitation-history-review) explains the distinction. The mechanics below are conservative engineering decisions proposed on 22 October 2026, not additional legal requirements or a finding that a particular request is lawful.

## One history across sites and channels

The host supplies stable opaque responsible-party and person identifiers. Their pair selects one authoritative transaction domain. Site, purpose, channel, offer revision and contact generation are supporting facts, never a fresh once-only allowance. Separate Durable Objects with matching key prefixes do not share state.

New histories start unknown. An explicit host assessment/import must cover earlier systems and relevant channels, retaining an assessment reference and time. An empty permission stream or a new email address cannot establish that nobody has approached the person before. Identity merges preserve every restriction and consumed opportunity; identifier migrations must not reset history.

Store separate dimensions for history coverage, unused/consumed approach, withholding/objection, retirement, delivery outcome and evidence retention. Read models must show those facts separately, without an “eligible to contact” verdict. A later affirmative choice does not erase approach history or automatically lift unrelated restrictions.

## Admit once, preserve uncertainty

An admission transaction checks assessed history, restrictions, retirement and the unused opportunity. It consumes that opportunity and records an immutable host intent together with a pending outbox entry. No provider call runs inside the transaction. Rendering, opening the editor or reloading a request page consumes nothing.

The first implementation should have no automatic release. Cancellation, timeout, bounce, lease expiry or an uncertain provider result cannot reopen the opportunity. This deliberately sacrifices some unsent opportunities. Any future recovery of a proven-unsent attempt needs its own reviewed contract.

The idempotency digest binds the responsible-party/person pair, exact archived offer, destination-generation reference and host intent. An exact retry returns the original admission plus current restrictions and delivery state. Reusing its key with different inputs conflicts. A different key cannot bypass consumed history. A historical receipt never recreates a cancelled job or authorizes another provider call.

## Refusal must participate in the same transaction

The specialized permission route must record refusal or withdrawal and the applicable wider restriction atomically with admission state. Calling today's generic permission recorder and then updating another ledger is insufficient. The implementation needs a dedicated atomic wrapper or an internal composable transaction helper, with no alternate unbound write route.

If refusal wins the race, admission fails. If admission wins, a later refusal fences pending delivery. A request already in flight cannot be recalled. Preserve the original scope of a channel-specific refusal; a conservative block on new approaches must not silently revoke unrelated grants.

The medium used to request consent is distinct from the method selected for future marketing. A web request for SMS permission does not establish permission to deliver an invitation by SMS.

## Sending remains an explicit host connection

Start with a synthetic outbox, not a built-in sender. The host owns identity, destination, applicability, request contents and external suppression. Stable job IDs alone cannot prevent provider duplicates: uncertain handoffs require provider idempotency with a known retention window or authoritative reconciliation. An expired lease or aborted request does not prove the provider stopped.

## Retention and restore must preserve restrictions

Use a separate responsible-party/person lifecycle. Purging a site's permission evidence must not remove shared approach history. After detailed evidence is erased, retain only the host-justified consumed/restricted/retired marker and replay fence. The host must assess retention and legal basis; opaque identifiers can still be personal data. Retirement also requires external job fencing.

Restoring a backup from before an approach or refusal can resurrect an unused opportunity. Before traffic resumes, reapply **all** authoritative consumed approaches, restrictions, identity aliases and outbox fences from outside that rollback. A retirement journal alone is insufficient. If completeness cannot be established, keep history unknown and block admission. No schema can reconstruct state after all authoritative copies are lost.

## Deliver as one complete workflow

1. Shared history initialization/import, atomic admission and explicit state reads.
2. Atomic specialized refusal/withdrawal integration and fenced synthetic outbox.
3. A two-site example covering another channel, contact changes, lost responses, refusal races and uncertain handoffs.
4. Separate lifecycle, minimized markers and restore barrier, including a backup predating both an approach and a refusal.
5. Host-authorized read-only inspection/export: timeline, approach decision, history coverage, restrictions and delivery uncertainty. Auth remains supplied by the host.
6. Connected pack, workbench, agent and starter guidance, with exact source references and current limitations.

Acceptance must include concurrent cross-site admissions, refusal before and after admission, exact retry after refusal, contact/identity changes, imported history, unknown history, transaction rollback and old-backup restore. None of these tests is implemented by this design document. Keep the existing requirement partial until the complete mechanism and host acceptance are verified.
