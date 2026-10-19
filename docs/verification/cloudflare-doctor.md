# Cloudflare doctor verification

Requirements: `REQ-PRODUCT-CF-DOCTOR`, `REQ-PRODUCT-CF-STARTER`.

`packages/notabenda-cf/test/doctor.test.mjs` creates disposable projects with the actual initializer and runs the actual doctor CLI. It covers the default deny hook, missing assets/dependency manifests, JSONC comments/strings/trailing commas, redacted syntax errors, explicit named environments, non-inherited evidence bindings, whole-object asset overrides, unsafe asset routing, nonlive exports, conflicting migrations, out-of-project files, ambiguous configurations, public private-file patterns, symlinks, walk limits and malformed/unsupported flags.

The read-only test compares file content hashes, modification times and modes before and after inspection. Throwing authorization/build files are never executed. Dynamic JavaScript settings fail static validation without being imported. Private sentinel contents in configuration, environment files and setup reports do not appear in either report format. An instrumented file-read regression confirms that Worker entries and built assets use metadata only. Known private-file aliases and dependency symlinks outside the selected project are rejected before their content is read. These tests use local files only; no endpoint or credential input is offered by the command.

The existing npm-package test packs both actual packages, installs them offline and invokes the installed CF CLI. Its bundled doctor module runs against the newly generated project, reports the default deny stub and retains `productionReadiness: "not-assessed"`.

These are static starter checks. They do not prove actual authorization, remote routing, installed dependency integrity, private-data absence in arbitrary file contents, legal compliance or lifecycle safety. The generated starter's separate local SQLite runtime checks remain recorded in [the starter verification](cloudflare-starter.md). A wider production deployment/access/restore acceptance remains open.

An additional attempt to install a complete disposable starter using only the existing local npm cache could not resolve uncached Wrangler metadata. No online install or remote acceptance is claimed from that attempt. Installed-package coverage above uses the offline tarball consumer test; dependency-manifest fixtures in focused tests are explicitly local stand-ins, not a dependency integrity check.

The complete maintainer check passed 389 tests (343 package and 46 site), catalog validation for 71 requirements/63 primary sources, 65 generated guide pages and a Worker deployment dry run. Local Chromium verified the new guide and its keyboard-operable compact mobile navigation; at 320 CSS pixels the document had no horizontal overflow and the menu target was 52 pixels high. [Desktop guide](../assets/screenshots/cloudflare-doctor-guide.jpg), [mobile guide](../assets/screenshots/cloudflare-doctor-mobile.jpg).
