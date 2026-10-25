# Software and storage architecture

The build/SSR boundary validates full site configuration and emits the cookie runtime descriptor. Root/headless `createConsent` consumes that descriptor and exposes only the cookie inventory; full-site documents and workflow inputs stay separate. See [browser configuration](BROWSER-CONFIG.md) for CLI output, required evidence and compatibility migration.

The [compliance map](COMPLIANCE-MAP.md) explains what each component serves. This diagram shows where the supporting software runs and where its information is kept.

## All twenty-one packs

Start with one job or combine several. Each pack below opens its place in the setup library. The software diagram that follows shows their shared infrastructure.

<!-- notabenda:packs -->

The library is smaller than the component API. The [pack roadmap](PACK-ROADMAP.md) identifies existing components that still need their own guided setup path.

## Build, browser and optional backend

<!-- notabenda:diagram storage -->

Arrows show configured integration paths, not automatic data collection. Static documents need no browser runtime or backend. A host can use its existing recording transport instead of the optional Cloudflare package.

## Storage boundaries

| Location | Contents | Who controls it |
| --- | --- | --- |
| Public deployment | Rendered legal pages, public facts, selected runtime settings and retained public revisions. | The site's build and deployment. Private notes and source archives stay outside these assets. |
| Visitor browser | Local preference memory and, for selected modules, objection or pending-action journals. | The browser and host integration. Unavailable or invalid state keeps managed work blocked; fresh-state behavior depends on the selected module. |
| Scoped Durable Object | Registered releases, selected evidence ledgers and optional private source or job archives. | The host chooses the object/context and authorizes recording and inspection. |
| Host application and providers | Accounts, submissions, fulfillment, payment or delivery state. | The adopter's application. Notabenda records do not perform those operations. |

Browser storage and server evidence have separate lifetimes. In particular, expiring a permission does not determine when its evidence must be erased, and retaining an event does not keep that permission active.

## Operator access and operations

The optional worker receives a host-authorized scope before accessing storage. The [backoffice](../packages/notabenda-cf/README.md) can search retained records and compare document revisions. Private source and export access require separate grants. The package provides no account or login system.

The host owns access policy, identity/contact binding, write admission, deployment secrets, scheduling, provider delivery, retention, holds and erasure eligibility. The [Cloudflare starter](CLOUDFLARE-STARTER.md) and [evidence lifecycle guide](EVIDENCE-LIFECYCLE.md) describe the implemented hooks and remaining host work. Discovery and CI remain optional adopter tooling.
