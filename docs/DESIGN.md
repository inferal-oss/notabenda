# Product design standard

Default design is part of the product. Apply the same care to public pages, examples, documents, controls, forms and admin workflows. A functional screen is ready for review only when its typography, layout, spacing, states and responsive behavior have also been inspected.

Each surface needs a clear purpose and hierarchy: a useful entry point, a deliberate reading order, well-grouped information and actions that make sense in context. Use layout and composition to explain the content. Keep real behavior visible; example status cards reflect the actual controller and do not fabricate activity or imply permission.

The project website uses crisp typography, quiet neutral surfaces and restrained violet accents. Fictional examples can demonstrate a different coherent identity, with their own palette while sharing the same hierarchy and interaction quality. Shared package components inherit host typography and semantic tokens; every theme covers surfaces, muted text, borders, focus, action contrast, disabled controls and error/pending states. Keep fonts/assets self-hosted and CSS optional.

Review these together:

- Full pages: header, main content, navigation, supporting information and footer.
- Working controls: initial, hover, focus, selected, disabled, pending, success, unavailable and error states where applicable.
- Responsive composition at narrow mobile, common mobile and desktop widths, including long content, large text, short heights and keyboard visibility.
- Native keyboard interaction, visible focus, meaningful labels and headings, target sizes and predictable focus restoration.
- Light/dark themes, reduced motion and forced colors. Keep optional accept/reject actions equally available through styling changes.
- Actual requests, storage and receipt state after design changes. A visual representation must match the behavior it describes.

The examples gallery is a visual guide to working integrations, organized by essentials, collection/permission surfaces, frameworks and evidence. It connects public examples to a separate password-free demo workspace, never the operational admin. Its illustrative miniatures are noninteractive decoration inside actual example links.

The choices example gives the fictional site its own composition and presents service state and request counts from the real consent lifecycle. The native notice and preferences drawer remain separate components, restyled through tokens. Reopening changes no permission until an explicit action is taken.

A default notice remains compact and nonmodal on mobile. Form information stays beside the relevant fields. Evidence views organize history, context and differences around operator questions. Screenshots and verification notes should show the resulting interface and real states; they are part of review, alongside automated checks.

This is an ongoing acceptance standard, not a claim of completed cross-platform accessibility certification. Track actual inspected surfaces and remaining coverage in [design verification](verification/design-pass.md).

All demonstration entry pages share a maintained Juniper example frame: typography, navigation, responsive content/workflow panels, live-output context, light/dark tokens and footer integration links. Framework-owned hydrated trees remain unchanged by build framing; Astro ships the frame in its own native layout. Static legal pages and pinned releases remain outside entry-page transformation. Inspect each example family and its real states, rather than treating a styled gallery card as acceptance of the example itself.

All interactive examples share `examples/static/example-theme.css`: the main site’s neutral ink/violet palette, common typography and a matching midnight variant. Framework hydration roots and immutable pinned legal documents remain unchanged by the example frame.

Admin uses one application frame across evidence, document comparisons, lifecycle, exports, the demo overview and guided setup. A quiet navigation rail replaces stacked headers; narrow layouts use an explicit workspace menu. Search starts with one useful field and reveals advanced filters on demand. Counts describe the actual returned segment. Agreement cards lead with the recorded subject reference, and detailed wording remains separate from technical references. Setup has six navigable stages and expandable practice assessments; editing invalidates exports while stage navigation preserves private notes. Review the complete flows at mobile widths as well as their first screens.

Guided setup receives the same composition standard as evidence inspection: a compact functional introduction, a six-section navigator, clear section titles, paired local-import panels, expandable assessments with text statuses, and separate review/export cards. Mobile uses a three-column, two-row guide and stacked fields. Stage changes bring the guide and active section into view; generating a review focuses its heading. A step number indicates location, never legal completion.

Demo status belongs in a quiet contextual label. Public examples and admin explain workflows, decisions and evidence; repeated fictional/synthetic-data warnings are not a design feature. Keep operational limitations where they affect an actual action, while avoiding repeated disclaimers in page headings, cards, rails and footers.

## Source code examples

Fenced examples in website guides and the homepage command panel use build-time syntax highlighting. TypeScript, JavaScript, JSX/TSX, MD/MDX, Astro, JSON/JSONC, YAML, CSS, HTML, shell, Python, SQL, TOML, diffs and Mermaid source have named grammars. Unknown fences remain escaped plain text. Inline identifiers retain the surrounding text style.

Source stays selectable and copyable as text. Each code block is keyboard focusable and scrolls within its own width on mobile. Token colors are adjusted to meet 4.5:1 text contrast on the actual light and dark code backgrounds; forced colors use system text colors. Highlighting ships only static escaped markup and an external stylesheet, with no browser highlighter, inline styles or weaker CSP. Compiled legal documents and archived source bytes are unaffected. See [verification](verification/syntax-highlighting.md).


## Current interface direction

Use restrained product UI throughout: content leads; navigation and supporting chrome recede. Neutral surfaces, subtle separators, consistent 6–8px corners and one restrained accent replace large tinted containers and excessive shadow. Operator screens use readable metadata, concise headings, compact desktop controls and contextual record rows; mobile retains explicit menus and at least 44px primary action targets. Setup sections use a quiet six-part navigator without implying that progress establishes legal readiness. Public notices keep balanced accept/reject actions and a deliberately opened sheet.

The current reference is [Linear’s March 2026 design refresh](https://linear.app/now/behind-the-latest-design-refresh), particularly its hierarchy, calmer navigation, restrained separators and less saturated surfaces. This is visual direction for Notabenda’s own components, not a dependency or copied asset system. The homepage product image is captured from the actual Notabenda workspace. Keep screenshots current with the default UI.
