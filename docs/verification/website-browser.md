# Website, host runtime and refreshed defaults

18 October 2026. Local integration and manual Chromium checks, linked to `REQ-PRODUCT-CF-HOST`, `REQ-PRODUCT-MOBILE` and `REQ-PRODUCT-A11Y`. These do not verify a cloud deployment or establish a full accessibility/legal audit.

## Host and persistence

- The pinned Wrangler version accepts the configuration and bundles the Worker with a deployment dry run. No cloud resource is created by this check.
- The actual local Workers runtime serves static site assets and a SQLite-backed Durable Object. Missing auth returns 401 for both friendly and encoded/direct-file protected routes. Wrong-origin demo POST returns 400 before object forwarding.
- An authenticated synthetic agreement is recorded, inspected through the backoffice, then recovered with the same receipt after stopping and restarting Wrangler using the same local persistence directory. `scripts/check-site-runtime.mjs` performs these assertions without printing credentials.
- An early-response request-stream error observed in the real runtime was corrected by validating and bounding writes at the outer host before DO forwarding. The object independently revalidates them. A subsequent runtime check completed without that exception.
- Host tests cover missing/malformed keys, normalization, protected no-store assets/redirects/errors, exact-origin and bounded bodies, object-instance retry recovery, allowlisted output, and internal link resolution. They use a storage fake separately from the real-runtime check.

Browser Basic-login entry itself, cloud routing, private repository integration, production secret provisioning, operator disclosures, backup/restore, retention/erasure and rate-limit operations remain unverified or unconfigured. The project site contains fictional example disclosures, not production operator policies. The host and npm packages remain separate.

## Website and refreshed interface

- The public site presents the toolkit, working examples, setup, and a requirement → source/code/test path. Its homepage and guide use no JavaScript or external fonts. No permission prompt or dialog appears on the homepage; focus remains on `BODY`.
- At 390×844 and 320×700, homepage client and scroll widths match. At 320×700 the requirements guide also keeps horizontal page width contained; its wide scope table scrolls within its container. Requirement links reach the appropriate catalog fragment.
- The refreshed default palette uses cool neutrals, deep ink actions and restrained periwinkle accents. Legal pages, cookie controls, terms cards and the evidence workspace use consistent sans-serif typography and rounded surfaces. Both accept and reject retain equal button treatment.
- At viewport widths 320/360/390/430 (305/345/375/415 CSS pixels available), the refreshed notice has no horizontal page overflow. It is about 200px high at 320, where action labels wrap, and 181px at the other sizes. Button heights remain at least 44px. These are observations, not a clipping target.
- Opening preferences still focuses the heading and creates a deliberate native dialog. Purpose cards keep an associated native checkbox and the full row label. Saving only measurement starts that sample service; suggestions remain blocked and the visible initiated-request counter becomes one. Rejecting through the persistent trigger stops it and restores focus to that trigger.
- The midnight theme retains a readable, compact notice with equal actions and no initial focus theft. Agreement still starts unchecked, records only after acknowledgment, and exposes its version context. Evidence details prioritize the statement and workflow; technical references remain available under a native disclosure.

Screenshots: [website desktop](../assets/screenshots/site-desktop.jpg), [website mobile](../assets/screenshots/site-mobile.jpg), [mobile controls](../assets/screenshots/consent-mobile.jpg), [preferences](../assets/screenshots/consent-drawer-mobile.jpg), [midnight theme](../assets/screenshots/consent-dark-mobile.jpg), and [document history](../assets/screenshots/history-desktop.jpg).

The project website footer includes the requested “Sponsored by Inferal” link and blue chevron, matching the attribution on kimage.dev. The generated public homepage was checked in Chromium at desktop, 390×844 and 320×700 sizes; the logo loaded and client/scroll widths matched at both mobile sizes. This credit belongs to the website layout. Screenshots: [desktop footer](../assets/screenshots/site-sponsor.jpg) and [mobile footer](../assets/screenshots/site-sponsor-mobile.jpg).

Full contrast audit, screen-reader and keyboard review, forced colors, zoom/large text, translations/RTL, safe-area/virtual-keyboard behavior and physical iOS/Android/WebKit/Firefox checks remain required. Selected text/background pairs were checked numerically while refining the palette; this is not a complete contrast audit.

### Host disclosure separation

`site/test/website-notice.test.mjs` checks bounded explicit public operator/contact input, production-build rejection without those facts, safe contact rendering, a script-free public notice that allocates no demo session, real-storage context before recorded forms and unchanged canonical document bytes. The notice distinguishes browser-session access, scheduled one-day idle cleanup and externally retained copies. Public legal completeness and the operator’s contact handling remain separate review work.

Astra’s follow-up review found one language inheritance issue on the German cancellation example; the injected English note now declares `lang="en"`. Chromium inspection confirmed the note appears before the form and links to the distinct notice. Document/client widths matched at both 390px (375 CSS px after scrollbar) and 320px (305 CSS px), including the privacy reading page. [Mobile storage note](../assets/screenshots/website-demo-storage-note-mobile.png). The final project check passed 373 package tests and 57 site tests, catalog validation, website build and Worker dry run. No remote deployment is implied by that check.

## Preserving hosted HTML

A live browser inspection found a Cloudflare Web Analytics beacon element in the homepage DOM while the built and separately fetched HTML contained no script. The response CSP permits no script on that page and does not admit the beacon origin; no execution or analytics delivery is inferred from the element alone. Cloudflare's official setup documentation identifies `no-transform` as a way to prevent its automatic injection.

The host now appends `no-transform` to public asset cache directives and uses `private, no-store, no-transform` for protected/session responses. Tests preserve exact body text, ETag, prior caching directives, private variation and CSP, and avoid duplicate directives. All 63 site tests and the Worker deployment dry run passed. Live edge verification remains separate; the header is not a claim that every proxy obeys it or that hosting request/security processing stops.

## Website topic organization

19 October 2026. The homepage introduces document pages and privacy choices before linking to deeper areas. The examples directory and guide overview share six task groups: getting started, privacy information, privacy choices, terms and purchases, records, and integration. Consumer-contract and specialist-control examples have separate subsections; theme and framework variants remain beside their main example. Existing example destinations remain available. The original project README is retained at `/guide/project`; `/guide/all` indexes every rendered source document, with verification reports collapsed initially.

`site/test/site-organization.test.mjs` checks category ownership, the previous example destinations and variants, valid local links, current-page context, desktop/mobile destination parity, absence of nested mobile disclosures, preserved README content and complete guide-index reachability. The guide overview has no misleading category breadcrumb. Native disclosures and static links require no JavaScript.

Manual Chromium checks used the local Workers runtime on a separate QA port. At 320×700 and 390×844, document client and scroll widths matched for the homepage, examples overview, terms-and-purchases category, guide overview, complete index and producer-label guide. A narrow header overflow found during review was corrected. The mobile documentation summary opens with Enter; its navigation contains no nested disclosures and links have a minimum observed height of 44px. Desktop review checked the category hierarchy, grouped guide sidebar and current-page highlight. These selected checks do not replace the broader accessibility and device review listed above.

Validation passed all 80 site tests, catalog/source checks and the Worker dry run. All 200 retained artifact files matched their prior SHA-256 values. Package implementation is unchanged by this organization pass.


### Task paths and area overviews

The second organization pass adds dedicated documentation area pages, ordered guide groups and contextual links between guides and examples. The homepage uses the same three-step starting path as the guide overview and removes the repeated closing call to action. Example categories use smaller groups with local jump links; the contracts area separates agreement, pre-purchase and post-purchase work. Producer-artwork preparation links back to the product-label integration. Every original destination remains available.

The native mobile menu shows the current area's guides and a single destination for every other area. Desktop navigation uses the same destinations, with subgroup labels inside the active area. Area pages and the complete index keep verification reports collapsed by default. Automated checks cover one subgroup per example, valid area/guide/example links, primary guide ownership, current context, preserved complete-index reachability and the shared starting path.

Chromium review on the separate QA server checked category-to-guide navigation, area overviews and the mobile disclosure. At 390×844 and 320×700, the reviewed area and homepage contained their horizontal width. Software checks use the last published package sources in an isolated build, keeping unfinished runtime changes out of this website milestone. The website suite passed 83 tests and the Worker dry run. These navigation checks do not constitute a full accessibility audit.
