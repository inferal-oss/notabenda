<!-- @requirements REQ-PRODUCT-TERMS-ADAPTERS -->
# Terms framework adapter verification

Requirement: `REQ-PRODUCT-TERMS-ADAPTERS`. The existing terms and framework requirements retain their separate checks.

React tests use the actual terms controller and Cloudflare recorder. They cover conservative SSR over an already-recorded controller, hydration without recoverable errors, StrictMode without additional writes or controller destruction, cached/frozen nested receipt snapshots, explicit agreement actions independent of ordinary form submission, inert detached controls, uncertain acknowledgments with the same idempotency request after view remount, operation replacement during a pending transport, and terminal retirement.

Astro bridge tests cover import safety, named offer/context binding, repeated page-load events with no writes, navigation preserving the draft, absent routes, mismatched offers and same-offer/different-operation shells, permanently remembered controller context keys, duplicate or malformed shells, ownership cleanup after a failed mount, pending/error/recorded state after remount and explicit exact-request recovery. React/Astro ownership is shared. Both views retain the supported native localization, direction, statement, action label and pinned document URL.

Offline tarball consumers import both React entries, compile strict types including immutable receipt errors, and build the actual Astro shell without a script or checkbox. Public React and two-page Astro examples reuse the isolated session's existing terms endpoint; the server binds operation and subject independently of browser fields. Their exact offer assets and nested legal documents remain static.

These checks establish framework lifecycle behavior for the supported versioned packages. They do not establish legal enforceability, human identity, completion of the host operation, cross-reload recovery policy or full browser/assistive-technology coverage. The host owns authentication, controller bootstrap, uncertain-request retention and eventual destruction.

Native-browser checks exercised both actual examples: React hydrated unchecked, checking alone wrote nothing, and the explicit sample action returned an inspectable record. Astro kept the checked draft across its two-page transition and recorded only after the explicit action. Regression tests also exercise controller replacement during a parent layout effect and late acknowledgments during Astro navigation or session changes.
