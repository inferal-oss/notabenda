# Connect a recorded-cookie application

Use the [recorded-cookie application example](../examples/recorded-cookies/README.md) when you want to see the complete connection: a YAML configuration builds the legal pages, runtime and notice; native controls send choices to a host-authorized Cloudflare recorder; operators inspect the archived wording and reports.

The ordinary [Cloudflare starter](CLOUDFLARE-STARTER.md) remains a denying, read-only scaffold. This separate application demonstrates the HTTP policy an adopter supplies. It does not add public recording, login or visitor-identity issuance to the package.

## Start with the application boundary

Copy `examples/recorded-cookies` from the repository and follow its README to install local preview tarballs. Both authorization hooks deny access initially. Public legal pages remain usable and optional services remain off. Connect your existing visitor session in `authorizeVisitor`, and grant operator inspection/notice management independently in `authorizeOperator`.

```sh
npm run check  # Explicit draft build and Worker dry run.
npm run dev    # Owned local application on port 4188.
```

The supplied YAML is fictional draft content. Replace the operator, inventory, documents and lifetimes for your site. Production `build` and explicit `deploy` require reviewed configuration; initialization and local checks perform no deployment. No npm package is published by these commands.

## Prepare the notice separately

The application builds required-receipt controls with a fixed `cookie-choices` scope. The backend imports the matching compiled release. At `/backoffice`, an authorized notice manager first registers that exact release and notice, then explicitly activates the notice. Registration alone cannot authorize grants; read-only operators cannot perform either operation. Visitor traffic never activates a notice.

The browser loads a bootstrap containing the required runtime, immutable notice and authorized head. Its digest comes from the library's host-bound stream computation. Every read/write authenticates again. A submitted digest is compared with that host-derived stream; it cannot select another visitor. An account change with an old page is refused before recording into the new stream.

Connect logout/account changes to `application-session-changed` before switching identity. The example destroys its controller and stops services; reload starts a new bootstrap. A host must supply this lifecycle signal rather than waiting for another network request to discover the change.

## Understand failure and recovery

| Situation | Result |
| --- | --- |
| Bootstrap/session is unavailable | No controller grant or optional service startup. Legal pages remain available. |
| Write fails before commit | Optional services stay off; reload does not replay an uncommitted grant. |
| Write commits but its response is lost | The browser stays restrictive until an exact retry or authenticated head read confirms the original choice. |
| Withdrawal happens during an outage | Local services stop without waiting for a receipt. The pending refusal can recover later. |
| An older grant acknowledgment arrives after withdrawal | It cannot restart the services or replace the newer intent. |
| Host identity changes | The stream precondition prevents recording into the new identity; the host also disconnects the old controller. |

Replace the local service indicators with real lifecycle callbacks in `client.mjs`. The example makes no tracking calls; it cannot prove that an actual integration stops its network, storage or downstream processing correctly.

## Keep evidence and publication connected

`/backoffice/choices` inspects the same SQLite ledger, including the exact notice wording and pinned document references. Backend responses are private/no-store. The operator template stays outside public assets and its aliases are refused; read-only access grants no activation authority.

Keep earlier artifact/notice files through the [explicit retention inputs](CONSENT-EVIDENCE.md#keep-earlier-notices-available) when rebuilding in a clean deployment environment. A new compiled notice does not activate itself. Preserve database history, register the reviewed version and explicitly select it through the operator workflow.

The host owns verified authentication, rate limits/quotas, actual deployment origin, session lifecycle, retention/holds/erasure, backups and [isolated recovery](CLOUDFLARE-RECOVERY.md). The example is a complete wiring example for existing mechanisms, not production or jurisdiction certification. See [verification](verification/recorded-cookie-application.md).
