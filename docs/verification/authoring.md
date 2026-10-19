# Markdown/MDX authoring verification

18 October 2026. Linked to `REQ-PRODUCT-AUTHORING`, `REQ-PRODUCT-CF-HISTORY`, `REQ-PRODUCT-SAFE-CONTENT` and `REQ-PRODUCT-MOBILE`.

- Package tests compile Markdown and MDX with YAML frontmatter, static component maps, stable heading IDs, generated addenda, GFM tables, link destinations and image alternatives. They reject invalid metadata before executing components, unsafe output, missing references and suspended fallbacks.
- Source-only edits produce new release identities while retaining equal rendered hashes. Component-output changes with equal authored source change body and readable-content hashes. Archive registration rejects missing, extra, mismatched and tampered source attachments; ordinary history projections omit raw source.
- Source routes authorize before storage, reject invalid references, escape stored MDX, support HEAD and use private/no-store responses. Diff tests cover source-only changes, separate distant ranges, insertions/deletions, newline-only changes and bounded work for large inputs.
- The authoring npm tarball installs offline from the dependency cache, compiles a real document outside the workspace, and passes a strict TypeScript consumer check without depending on this repository's ambient type setup. Core and CF packages retain their existing zero-dependency distribution checks.
- Site tests initialize the host's synthetic archives, deny unauthenticated source access and recover the same source through a new object instance. The actual local Wrangler/SQLite runtime also passed `scripts/check-site-runtime.mjs`: protected source inspection, source comparison and public static output all worked. No cloud deployment was performed.
- Browser inspection at 390×844 confirmed readable MDX terms, a styled static custom callout and ordinary legal navigation. The source comparison displayed separate metadata and provision changes with surrounding context. At 320×700, document client and scroll widths were both 305 CSS pixels, including after expanding complete retained MDX source. The viewport override was reset afterward.

Screenshots: [mobile authored terms](../assets/screenshots/authoring-mobile.jpg), [source comparison](../assets/screenshots/authoring-source-diff.jpg).

Full keyboard/screen-reader review, platform-matrix testing, reproducibility across arbitrary host components and retention/erasure operations remain adopter work or later verification. Static-output sanitization does not sandbox trusted MDX execution.
