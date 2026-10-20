# Local draft page preview verification

Requirements: `REQ-PRODUCT-DRAFT-PREVIEW`, `REQ-PRODUCT-CARTRIDGES`, `REQ-PRODUCT-SAFE-CONTENT`.

The installed viewer tests cover explicit opening, the fixed public snapshot, excluded operator-only notes, unchanged review status, escaped supplied text, no execution of expressions, disabled outside destinations, local contents navigation, unique IDs across host and preview instances, focus return, reopening and idempotent destruction. Missing supplied terms remain invalid; previewing never relaxes that boundary. Invalid inputs fail before host DOM changes.

The actual setup UI is exercised through draft preparation and its asynchronous preview action. Tests preserve the plan/report across opening and closing, select the cookie page for a cookie pack, destroy an existing reader on scope changes and prevent an invalidated draft from opening after its module resolves.

Website delivery checks assert that the main pack bundle imports the separate local reader asset without containing the document renderer. The ordinary consent bundle does not acquire this feature. Generated-starter tests deny the reader asset without configuration permission and serve it only after host authorization; local doctor fixtures include that asset. The semantic accessibility suite checks the named native dialog, document choices and all three rendered documents. JSDOM does not prove native modal focus trapping, browser layout, Escape handling or assistive-technology behavior.

This previews config-based pages and structured supplied sections. It does not load project MD/MDX files or custom components, activate consent tools, compile a retained release, establish deployment identity, change review declarations or certify legal content.
