<!-- @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION -->
# Request-page localization verification

Requirement: `REQ-PRODUCT-RIGHTS-LOCALIZATION`.

Tests cover the complete five-field public dictionary, exact validation, UTF-8 bounds, rejected markup/control/placeholder/unknown fields and accessors. Non-English rendering and authoring require the dictionary without modifying the actual locale; missing page copy leaves other legal previews usable. The installed authoring schema and target assessment expose the exact `localization.rights` path.

The page and fragment checks cover every selected fixed label, reused skip/header messages, `lang`/`dir`, isolated ordinals, retained operator wording and safe destinations. React static rendering equals the shared fragment; Astro continues to delegate to that renderer. Synthetic RTL metadata checks exercise direction and language propagation, not the linguistic quality of an Arabic translation.

Authoring preserves the full dictionary and unrelated configuration, rejects stale dictionary changes, and returns page edits to draft. Supporting previews keep every outside destination inert and retain the three legal-document kinds. Public dictionaries survive immutable CF release storage; changed copy changes the release hash, while compiled consent configuration excludes request-page messages. Draft localization cannot pass production rendering.

The Portuguese example publishes a static request page, its legal pages and a separate explanatory no-submission destination. Browser and semantic accessibility checks complement the unit tests. The examples supply no intake, identity verification, deadline tracking, response, fulfillment or appeal process. Reviewed translation, legal applicability, working adopter destinations and physical-device/screen-reader acceptance remain separate work.
