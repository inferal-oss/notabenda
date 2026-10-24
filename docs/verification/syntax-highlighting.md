# Source code highlighting verification

Requirements: `REQ-PRODUCT-SYNTAX-HIGHLIGHTING`, `REQ-PRODUCT-A11Y`, `REQ-PRODUCT-SAFE-CONTENT`, `REQ-PRODUCT-MOBILE`.

`site/test/syntax.test.mjs` exercises actual language grammars and built guide output. It checks exact selectable source text, escaping of executable-looking text, safe unknown-language fallback, deterministic token classes, external CSS coverage, palette contrast for both backgrounds, keyboard focus, forced colors and script-free output. The homepage command panel uses the dark variant.

Build-time highlighting is presentation only. It does not execute examples, transform archived legal content or add a runtime package dependency. A full accessibility/platform audit remains open.

Chromium inspection on 19 October 2026 confirmed six distinct token colors, self-hosted CSS, no inline styles, selectable monospace source and the expected light background. At a 320px viewport, document/client widths matched (305 CSS px after scrollbars); long lines scrolled inside 263px code blocks. [Desktop example](../assets/screenshots/syntax-highlighted-guide-desktop.jpg). Automated project validation passed 373 package and 53 site tests, catalog validation, site build and Worker dry run.
