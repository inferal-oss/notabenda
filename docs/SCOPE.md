# Current implementation scope and decisions

Updated 19 October 2026. This records accepted product decisions; implementation status is tracked separately in the requirements catalog.

## Build the basics first

- Ship a reusable npm package with typed site configuration, validation, and privacy/cookie/terms documents that can be rendered as ordinary HTML or inside a host application's layout.
- Support supplied terms and policy text. Generated disclosures must derive from explicit operator facts. Draft/review declarations are visible and production output must not silently accept unresolved placeholders.
- Keep browser/SSR imports dependency-free and separate from Node build tools. The optional Cloudflare component is a separate package, `notabenda-cf`.
- React 19 integration is an optional `notabenda/react` subpath, with an optional React peer; default imports remain framework-independent. The host supplies one controller, registers services outside React render/effect remounts and owns its destruction. Hooks expose effective permissions separately from saved choices, with conservative SSR/hydration. Server-safe legal wrappers use `notabenda/react/documents`.
- Astro integration uses optional packaged `.astro` surfaces and a `notabenda/astro/client` lifecycle bridge around the same host-owned controller. Static legal pages need no scripts. Interactive pages reuse the controller through client navigation, close unsaved drafts on swaps and remount controls once. Keep a working preferences surface on every client-routed page where optional services continue. The actual Astro 7 example build requires Node 22.22+; broader framework/platform review remains separate.
- The project website is a documentation and distribution home: installation, API/integration guides, requirements and primary sources, feature status, and interactive examples. Examples support the documentation; they do not define the site's entire purpose.
- Authoring accepts JSON through the CLI and structured JavaScript/TypeScript objects through the build API. The optional `notabenda-authoring` build package supports both Markdown (`.md`) and MDX (`.mdx`) with YAML frontmatter for title, route, version, effective date, review status and stable section IDs. MDX supports host-supplied static components as trusted build-time project code; the core stays framework-independent. Original source is archived privately alongside rendered output, with separately authorized source inspection and comparison. Shared operator/processing inventory stays reusable in site configuration. See [the authoring guide](AUTHORING.md) for format, trust boundaries and preview size limits. Word/PDF conversion remains later, reviewable import work.
- Keep work uncommitted and unpublished until instructed otherwise. Project content and examples must not record private business details or the origin story.

## Source and implementation traceability

- Use vendor articles and web search to discover differences, then record primary legal/regulator/platform sources, locators, applicability, dates, caveats, and review status.
- Connect individual `REQ-*` obligations to `FEAT-*` deliverables, `VERIFY-*` scenarios, and actual implementation/test references. Planned or partly implemented obligations must remain labeled honestly.
- Discovery is standalone tooling. Adopters decide when to run it and whether to connect it to CI or deployment gates.
- Regional behavior begins with an explicitly selected Italian repeat-prompt guard, independently versioned and explained with catalog references. Preserve withholding/dismissal suppression separately from permission expiry, require an exact declared significant-change transition and public explanation, and keep preferences manually reachable. This initial mechanism and its conservative timing calculation do not establish full regional support; see [repeat-prompt rules](REGIONAL-PROMPTS.md).
- Initial GPC runtime restrictions are explicitly configured, with exhaustive service activity classification, separate cookie/service eligibility, monotonic signal observation, control status and a server header helper. This adds no persistent opt-out identity or account system. Applicable account/profile retention and downstream enforcement remain host work; the corresponding CA/CO/CT legal requirements remain partial. See [privacy signals](PRIVACY-SIGNALS.md).

## Guided setup

- Provide `npx notabenda wizard` and a matching host-authorized admin setup UI. Ask about intended coverage, actual practices and justifications; distinguish confirmed facts, unknowns and review decisions.
- Reuse one versioned questionnaire and recommendation engine across CLI and admin. Explain each recommendation with linked catalog requirements and remaining implementation/review limits.
- Export a reviewable draft site config plus a separate private answer/justification report. Never infer compliance, auto-mark documents reviewed, enable collection from unanswered questions, overwrite existing configs, publish or deploy. Existing config import and targeted edits must preserve operator facts.
- The personal-data recommendation includes optional rights entry points. Imported rights actions and destinations are preserved, with their review declaration returned to draft alongside legal content. Setup supplies no invented submission routes or request-handling claims.
- Keep authentication with the host. Sensitive onboarding answers must stay out of generated public documents and browser bundles; local draft/export is the default unless the host explicitly supplies authorized persistence.

## Public interface and mobile design

- Treat design quality as a product-wide acceptance requirement across pages, examples, documents, widgets and admin screens. Review full compositions, real interaction states and responsive behavior; maintain [the shared design standard](DESIGN.md).
- Default designs should feel contemporary: crisp sans-serif typography, cool neutrals, restrained periwinkle accents, refined spacing and surfaces, and clear interaction states. Apply this consistently to legal pages, permission controls, agreement UI, evidence views and the project website. Theme tokens remain easy to override.

- Public legal pages inherit the site's design and work without JavaScript. Provide optional CSS tokens and unstyled composition.
- The initial consent-controls preview uses a compact, nonmodal bottom notice with clear, balanced choices on mobile; deliberate interaction opens a bottom drawer. Larger screens use a corner notice and side drawer. Full platform/accessibility review remains pending.
- Gated iframe/image placeholders use one host-owned service lifecycle for several surfaces. Declare initial resource origins in the inventory so changes invalidate grants; no live resource attributes exist before effective permission. The placeholder opens preferences without granting. Withdrawal removes owned resources, with explicit limits for requests already sent, redirects, remote storage and server processing. See [gated media](EMBEDS.md).
- Avoid automatic fullscreen takeovers, page-blocking initial overlays, clipped choices, and repeated nagging. Include safe-area spacing, touch-friendly controls, keyboard/assistive-technology support, and readable large-text layouts. Gestures supplement visible buttons; dismissal grants nothing.

## Cloudflare backoffice

- Provide pluggable workers and storage adapters, including a fixed-scope Durable Object adapter, for an operator to mount a backoffice in its own application.
- **Authentication and authorization belong to the host application.** The package supplies no account system, login UI, credential store, or identity provider. Require a caller authorization hook and fail closed when access is absent or fails.
- The host binds the authorized store/site scope. Do not expose a browser route for arbitrary Durable Object IDs or namespaces.
- Present information around compliance questions: what happened, when, to which subject/site/purpose, against which notice/version, with which provenance and retention information when recorded. Never invent missing evidence.
- Prefer searchable evidence cards, chronological summaries, readable detail views, and targeted comparisons. Tables and raw JSON are supporting views, not the entire interface. Bound search work and explain partial/continued results.
- Maintain one responsive admin frame across records, comparisons, lifecycle, export, demo overview and guided setup. Host-supplied navigation is presentation only; every destination retains its own authorization. Setup uses six navigable stages and expandable practice questions, with local-only notes and explicit review/export.
- Durable Objects are an explicitly supported storage path for this component. Earlier D1 designs are alternatives for later evidence services, not a mandatory dependency of this admin package.
- `notabenda-cf init` generates a new local standalone Worker project with SQLite class exports, fixed configured-site selection, the shared admin/setup UI and an initially denying host authorization hook. It preserves existing paths and performs no network, install, login, provisioning or deployment. Generated Wrangler scripts make local build/check/dev and remote deployment explicit. Private archive RPC checks site identity; public recording/identity/activation policy, operations and any deployment doctor remain separate work. See [the starter guide](CLOUDFLARE-STARTER.md).

## Terms and policy change history

- Provide mechanics to retain immutable released versions of privacy, cookie, and terms documents, including exact content, identifiers/digests, version/effective-date metadata, and an explicit change note when supplied.
- Make history inspectable in the backoffice, with previous/current version comparisons and readable diffs. Cosmetic/rendering changes must be distinguishable from authored content changes; a diff does not itself decide legal materiality.
- Archive the privacy, cookie, and terms documents together as a reproducible release. Preserve structured content and rendered HTML, verify their digests, and reject attempts to replace an existing release with conflicting content or change metadata.
- Show document versions, effective dates, recorded dates, optional actor/change notes, and content differences in human-readable views. Treat recorded dates and publication/effective dates as separate facts; never infer that storage means a document was published.
- Recording or reviewing a release does not publish it, notify users, obtain consent, or accept terms. Those are separate host/application actions.
- Retain earlier versions needed by evidence records, with operator-controlled retention/erasure and no claim that an append-only application log is undeletable.

## Explicit terms agreement

- Keep an unchecked terms statement separate from privacy notices, cookie choices, and optional marketing permissions. Bind the exact terms HTML/content and interface wording into an immutable offer.
- Register an archived offer separately from explicit host activation. The trusted host binds site, subject, intended workflow and operation; browser fields cannot supply that authority.
- Report recorded agreement only after a matching persisted receipt. Check the active offer and write new agreements in one transaction; uncertain retries recover the original record without changing its version.
- Show agreement context in the authorized backoffice. A stored assertion is not proof of identity, a human click, legal enforceability, delivery, or completion of a related purchase/signup.
- The host retains and serves pinned versions, implements authentication/CSRF/operation authorization, and owns retention, replay policy, delivery and business actions. Paid checkout and applicable consumer actions require their own reviewed flows.

## Durable cookie-choice reports

- Keep the local-only controller independent. Optional server helpers register an immutable notice, activate it explicitly, and bind exact wording, purpose scope and archived privacy/cookie versions to each report.
- Host authorization resolves the site, intended scope and opaque stream. The package supplies no login, public account binding, raw capability storage or identity recovery.
- Append events and advance the stream head atomically. Grant-bearing snapshots require a matching current revision and active notice; stale grants need a new deliberate choice. An explicit revoke-all may arrive from a known older notice and clears newer purposes too.
- Idempotent retries return the original historical receipt together with the current head; they never replay the historical command. Keep client-reported time separate from server receipt time and do not extend expiry through retries.
- Present historical purpose cards, exact notice wording, causal revisions and document references in the backoffice. Choice expiry is distinct from evidence retention. Host retention, erasure, audit and replay policy remain required production work.
- Browser delivery and required-receipt gating are opt-in at controller construction before optional work can start. Saved local choices remain separate from effective permission. Bounded retries preserve the original action, head reads confirm current evidence after reload/resume, and late acknowledgments cannot replace refusal. Public local-only and session-isolated recorded-choice examples remain distinct.

## Branding, documentation, and license

- License project code under **Apache-2.0**. Clearly distinguish code licensing from supplied or separately licensed legal content.
- Design an original scalable logo and wordmark. Keep the main README human-readable: what works today, a quick start, examples/screenshots, and links to deeper material.
- Preserve the detailed overview in documentation rather than discarding it.
- Include the requested public “Sponsored by Inferal” website footer credit, linking to the sponsor with its existing chevron mark. Keep this attribution in the project website; reusable widgets and fictional legal examples carry no sponsor branding.
- Show milestone screenshots in the chat. Optional browser-based milestone delivery can be skipped if it encounters a blocker; do not put notification destinations or session details in project files.

Recorded processing opt-outs use a separate one-way restriction controller and CF ledger, with pinned privacy wording, local pending recovery and host-owned stable context. Cookie acceptance, delivery timeout and newer policies cannot remove those restrictions. The admin workspace separates event-time intent from current retained state. Identity continuity, downstream execution, regional review, retention/erasure and any re-opt-in process remain host responsibilities. See [recorded opt-outs](PROCESSING-CHOICES.md).

Clean deployments can explicitly include retained public compiler artifacts through a build-time API or repeated CLI inputs. Preserve exact old HTML at pinned URLs without rewriting current routes or publishing private MD/MDX source archives. Trusted input selection, linked assets, public availability/retention and any release activation remain host decisions. See [retained releases](RELEASES.md).

Exact declared browser-storage cleanup is opt-in per service, preserves unrelated keys and exposes point-in-time web-storage checks separately from cookie expiration requests. The host stops producers and handles inaccessible/vendor/server storage. See [storage cleanup](STORAGE-CLEANUP.md).

Inline collection notices are display-only static surfaces beside host forms, derived from selected direct/mixed-source purposes and an exact privacy release. Review notice wording separately from policy review; preserve purpose-level vs field-level distinctions. No privacy-acceptance checkbox or display/consent record is implied. Vanilla, React and Astro wrappers share the same renderer; actual form/marketing workflows remain separate. See [collection notices](COLLECTION.md).

Evidence export is an explicit host permission, separate from inspection. A script-free review and fresh JSON download preserve filters and bounded continuation within the authorized store. Files include all returned fields without redaction; no source-hook or external-artifact traversal, snapshot, identity or completeness guarantee is implied. Hosts own audit, disclosure review, downloaded-copy security and retention/erasure. See [evidence export](EVIDENCE-EXPORT.md).

Discovery provides an explicit browser capture/review API and optional local UI, plus a CLI for explicit capture files. Preserve origin/name-only observations, scenario labels, API-readability/limit metadata and candidate mappings to declared services/purposes. No automatic config changes, purpose/exemption classification, legal scores, uploads or prescribed CI workflow. Capture limits and unseen network/storage paths remain visible; see [discovery](DISCOVERY.md).

All demonstration entry pages receive the same maintained design care as the gallery and choices page. Shared Juniper framing supplies responsive layouts, navigation, readable state panels and light/dark tokens. Keep framework hydration trees intact and never restyle pinned legal HTML by rewriting its archived bytes. Native framework examples ship the frame in their own build as well as the project website.


Evidence lifecycle operations are trusted host calls: fixed context retirement before replay-safe transactional payload purge, explicit eligibility and stored revisioned holds, bounded resumable scans, and authoritative manifest reapplication before restored traffic. The backoffice explains progress through read-only cards and details. Retired frontend controllers stop retrying and stay restrictive. Retained pseudonymous metadata, shared policy archives, downloaded copies, external logs/backups and legal review remain host responsibilities. No automatic legal period, tombstone expiry, identity resolution, public deletion endpoint or complete-erasure claim. See [evidence lifecycle](EVIDENCE-LIFECYCLE.md).


Scope guards use public, explicit tri-state operator declarations for children, sensitive information, high-risk profiling and specialized sector contexts. Present or unknown facts keep affected registered optional purposes/services off; purpose declarations cannot relax site restrictions. Static disclosures, ordinary terms, rejection/withdrawal and processing opt-outs remain usable. Bind material assessment revisions to the consent scope and enforce blocked grants against the archived declaration in CF. New starters begin unknown; missing legacy declarations remain explicitly unassessed. Questionnaire revision 2 preserves imported restrictions and private justifications. No age screen, parental/specialized authorization, legal classifier or host boolean override is supplied. See [scope guards](SCOPE-GUARDS.md).

### Public example workspaces

Visitors following examples into admin receive an on-demand, isolated demo database in its own Durable Object, filled with realistic fictional journeys. Public links never lead to the site's operational admin. The demo includes searchable choices, terms, opt-outs, document revisions and lifecycle scenarios, with password-free browser-session access and cleanup after one day without use. Example actions belong to that browser's demo generation. Operational authorization remains host-owned and separate.

### Privacy request entry points

An optional `rightsCenter` declaration renders a script-free supporting page, legal footer links and static vanilla, React and Astro surfaces. Operators explicitly choose actions, explain their scope, supply safe destinations and maintain a public email/phone fallback. Production requires a reviewed declaration. No jurisdiction or saved choice creates an action automatically. The current page is included in static and MD/MDX builds; its public declaration is hashed into the release, while the three pinned legal-document kinds stay unchanged. Intake, identity checks, acknowledgments, deadlines, fulfillment and appeals remain separate application workflows. `FEAT-RIGHTS` remains partial; see [the rights guide](RIGHTS.md).

### Guided setup presentation

Admin setup is included in the default design standard. Use the same responsive component composition in package mounts and the host-authorized Worker: connected section navigation, grouped local imports, public facts, market choices, private assessments, storage justifications and a separate review/export screen. Preserve answers between stages, invalidate stale downloads after edits, and move keyboard focus to the active section or generated review. Navigation progress must not imply legal readiness.

### Ordinary form permissions

Stable purpose/channel permissions are separate from collection disclosures, cookies and terms. Exact reviewed offers bind public facts and scope guards; the host resolves a person/contact-generation stream. Grants compare stream, head and activation preconditions. Withdrawal stays independent, historical retries return evaluated current state, and retirement/holds/purge apply to the new permissions ledger. No form submission implicitly grants or withdraws. No sending platform, contact verification, customer-exception inference, universal lifetime or regional certification. Light/midnight examples use the isolated demo workspace; local SQLite restart and initial-read failure recovery are checked. Optional transactional browser recovery retains exact pending actions, protects withdrawal across reload/stale tabs and requires explicit retry. React provider/hooks/native-field wrappers now reuse the same controller with conservative SSR and no mount-time requests. Astro now supplies an exact-offer named field and lifecycle bridge with no mount/navigation transport, plus a real two-page session example. Background delivery and broader platform acceptance remain in progress; see [form permissions](FORM-PERMISSIONS.md).

### Usability review

Review both visitor choices and operator tasks. Visitor states distinguish drafts, saved local intent and confirmed host records; recovery never silently grants. Keep status text plain, grant/withdraw separate, unsupported choices explained and keyboard focus on a visible control when actions disappear. Operator setup identifies invalid public fields and actionable publishing fixes, labels assessments by question, and preserves private answers. Evidence inspection connects a contact-generation history, recorded action, current state and exact source wording without implying identity or legal readiness. See [UX verification](verification/ux-review.md).

### Google Basic integration

An optional `notabenda/google` adapter owns one combined Google service per document, validates product-specific four-signal mappings in public inventory and material scopes, and gates tag insertion on the existing effective permission engine. Defaults are denied; page views and events require explicit application calls. A loaded or attempted tag is terminal after withdrawal, failure or cancellation until full document reset. GA4 disable flags and removal do not guarantee post-load network silence. Intercepted loader tests and a local public simulator are supporting adapter evidence; actual vendor/browser review, Google account settings, GTM/TCF and CMP certification remain separate. See [Google Basic](GOOGLE-BASIC.md).

### Local deployment diagnostics

`notabenda-cf doctor` inspects the generated local starter with bounded JSON/JSONC reads and named-environment selection. It reports configuration/assets/binding/default-deny-hook issues separately from manual access and lifecycle checks. It executes no project code, loads no credentials, performs no network or changes, and does not certify production readiness. Adopters choose their own CI use; build/deploy remain explicit host commands. See [the doctor guide](CLOUDFLARE-DOCTOR.md).

### Initial contract-action mechanics

Versioned cancellation/withdrawal definitions and native forms stay independent from privacy choices and terms acceptance. The CF transaction captures a declaration, exact receipt and two separate handoff jobs; it never claims termination, refund or email delivery. Host runners own prompt real dispatch and downstream idempotency. Retirement applies to one declaration and waits for pending/leased work to be drained or explicitly quiesced. Regional eligibility, case-law review, examples/operator presentation and runtime/operational acceptance remain partial. See [contract actions](CONTRACT-ACTIONS.md).

Contract-action examples explicitly retain the sealed request in tab-scoped session storage to support exact recovery after a full Back/reload. They never replay on mount, never silently replace an uncertain nonce and remain isolated by signed demo generation. Production hosts must choose their own private recovery/retention policy. Native document links announce a new tab to preserve the draft.

Optional contract dispatch runners orchestrate single or independent paired host callbacks. They preserve provider outcome separately from ledger-settlement certainty, bound asynchronous callback attempts using the remaining lease, and add no automatic retry, public write route, provider or scheduler. Timeout/abort never establishes external quiescence. Production hosts supply admission, authenticated destinations, durable scheduling/reconciliation, downstream idempotency and operational rehearsal.

The project website has a separate disclosure for actual session cookies, demo entries, browser storage, hosting and scheduled cleanup. Sample legal pages remain sample documents. Public builds require explicit operator/contact facts; the repository contains no invented personal contact or account details.
