<!-- @requirements REQ-PRODUCT-EMBED-LOCALIZATION -->
# Gated-media localization verification

Requirement: `REQ-PRODUCT-EMBED-LOCALIZATION`.

Core tests use actual consent controllers and media groups. They cover complete selected messages, explicit language/direction, escaped inert SSR, exact legacy English output, invalid fields/accessors, locale mismatch, explicit draft preview and failure before service registration. Preferences open without making a choice; media remains absent before permission. Permitted, withdrawn and error states use copied messages; errors do not automatically retry. Compiled controllers exclude media copy and require a separately selected dictionary.

Copy revisions change the public release and survive Cloudflare archive validation, while cookie notice scope and a saved grant remain unchanged. Existing media tests cover every-purpose gating, required receipts, withdrawal, expiry, detached mounts, stale errors, resource destinations and iframe privileges. Installed-consumer checks cover the public helper/types and complete message shape. Agent reference and type-derived configuration schema expose the actual dictionary path.

The Portuguese example has static localized fallbacks, a separate preference-storage site ID, same-origin media and the same controller/gates as English. Website tests inspect its SSR and route-specific CSP. Native layout, keyboard and media behavior checks supplement these tests. The checks do not establish translation quality, applicable law, vendor behavior or a production-supported locale pack.

Chromium checks found no media elements or live resource sources in the initial placeholders. Opening preferences made no choice; allowing media produced the frame and image with the selected permitted message. Reload preserved that choice. Withdrawal removed both elements, restored the selected waiting message and returned focus to the review action. At a 390 × 844 viewport, document and scroll widths both measured 375px. The image-error state is covered by the controlled DOM tests; broader browser and assistive-technology acceptance remains open.
