# Localization verification

Requirement: `REQ-PRODUCT-LOCALIZATION`. This verifies a selected host-supplied text contract, not the correctness of a translation or a jurisdiction’s legal wording.

Automated checks cover complete/exact message dictionaries; canonical matching locale and explicit direction; review status; UTF-8 limits; fixed placeholders; rejection of markup, control characters and accessor fields; required generated templates or supplied-only documents; localized full-page and embedded document chrome; React/native parity; escaped declared facts; all consent receipt states, storage errors, signal/processing restrictions, accessible names and changed-choice messages; cosmetic vs material scope revisions; retained refusals; independent CF registration against canonical retained archives; archived selected text; and rejection of mismatched notice copy.

The consent runtime includes only selected consent messages. Generated templates and document bodies stay in the build layer. The backend's dependency-free localization validator is generated from the same contract and remains installable separately.

Further checks and limitations: host linguistic/legal review, screen-reader review across platforms, all target fonts/writing systems, advanced plural rules and localization of the remaining interfaces. The Portuguese example is draft wording, not a reviewed Brazilian legal pack. Locale does not select applicability or legal defaults.

Browser checks used the real Portuguese page and a separate synthetic long-text RTL fixture. Accept/reload/withdraw worked; the drawer and policy stayed within narrow mobile viewports. The RTL drawer retained keyboard access to the checkbox while its long body scrolled, with action buttons remaining available. This was a layout stress test, not an Arabic translation review.

A hash comparison preserved all 324 pre-existing retained artifact files. The selected compiled-local consent entry measured below its 15 KiB gzip target; the larger full-configuration compatibility entry still exceeds that target and remains a separate open optimization item. Packaging checks cover the exported localization types and a standalone Cloudflare installation.
