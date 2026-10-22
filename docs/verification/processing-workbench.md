<!-- @requirements REQ-PRODUCT-PROCESSING-WORKBENCH -->
# Processing notice workbench verification

Requirement: `REQ-PRODUCT-PROCESSING-WORKBENCH`.

The local editor and settings-file compiler use the existing processing notice builder. English schema-1 and localized schema-2 notices match its exact canonical bytes and activity order. Final artifacts, changed pages and pins are checked before output; authored privacy artifacts compile directly without a configuration rebuild, and retained document files remain exact. Missing classifications and absent non-English dictionaries fail, while assessed empty classifications and broader explicit activity selection remain valid.

Plain bounded settings/context validation rejects unknown or executable fields, accessors, foreign pins, invalid scopes, duplicate/empty activities and UTF-8 overflow. Inert presentation shares the live control’s heading, description, action and policy reference, with selected language/direction. It creates no controller, active action, recording status or outside link. Local wording inputs follow the same language/direction, while scope stays LTR.

JSON, YAML and Markdown frontmatter compile through the direct artifact CLI to identical descriptors. Markdown body notes, private sources, pages, identities and transport details are absent from editor exports. Standalone editor files contain hash-bound script/styles and no external resources; directory delivery has a same-origin CSP. Exclusive output directories prevent overwriting an earlier build or silently leaving an old descriptor beside a replaced release.

UI tests cover initial empty selection, explicit release selection, shared inert preview, editing invalidation, clipboard fallback, download revocation, import order, competing formats, canceled file reads, replacement imports, closed/reopened drawers and destruction. No network or browser storage is used. Installed package types and independent browser bundling verify the optional entry boundary. Site semantic scans cover the mounted editor and preview; broader assistive, physical-device, translation and host workflow acceptance remain separate.

Local Chromium checks exercised the shared inert preview, explicit release selection, YAML copy and local YAML import. Editing invalidated preview and release selection; import restored wording while leaving that selection unchecked. Native Safari opened the CLI-generated single HTML file directly from disk, generated/copied YAML, and returned focus to the explicit export trigger after Escape. These are scoped browser checks, not assistive-technology or adopter integration acceptance.

Requested mobile widths 390 and 320 had observed content widths 375 and 305 with no horizontal overflow. In the 390-wide drawer, scrolling reached its 179px maximum while the sticky close control remained visible. Viewport emulation does not establish physical-device or on-screen-keyboard acceptance.
