# Consent control layout checks

Requirements: `REQ-PRODUCT-MOBILE`, `REQ-PRODUCT-A11Y`.

## Reproduce locally

```sh
npm run build
node scripts/build-controls-layout.mjs
python3 -m http.server 4191 --bind 127.0.0.1 --directory .local/controls-layout
```

Open `http://localhost:4191/index.html`. Select normal or deliberately long copy, LTR/RTL, 16px/32px root text, light/midnight tokens and available/unavailable resize observation. Dismiss the initial notice before using the fixture form if enlarged copy covers it. The fixture uses English text in both directions; it is not a translation pack. Its styles scope the fixture form and do not override the controls. Both the long and normal notices/configs pass the production package's preview normalizers.

The fixture wraps a local controller to supply build-validated notice wording. Choices are synthetic and held in memory; no evidence transport or service loader is registered. It is a layout check, not an example of trusted recording or a legal assessment. Generated fixture files are local and are not included in the website or npm browser entry.

## Changes verified on 19 October 2026

The original long-heading fixture produced a 3,001px horizontal scroll area inside a 388px drawer and pushed Close off-screen. Default header wrapping now keeps the title and Close in the available inline space. Action grids use a text-relative minimum width so enlarged long labels stack instead of becoming very narrow columns.

Whole-dialog scrolling is the safe default. When resize observation is available and the header/footer leave at least six times the computed body font size, plus its padding, the normal header and action footer stay fixed while the body scrolls. A small tolerance avoids rounding-driven mode changes. Small viewports, enlarged text and long headings can use a single whole-dialog scroll region. Focus stays on the same control, clipped focused controls are revealed, unsaved choices remain drafts, and teardown disconnects observation. Desktop side placement and corner rounding follow inline direction; notice offsets account for the corresponding safe-area edge.

Focused unit cases run through both compatibility and compiled controllers. They verify absent observation, threshold changes including larger text, revealing focus during an ordinary resize or scroll-mode change, preserved checked drafts without a grant, close semantics, and cleanup. A fixture build case validates accepted long content, local assets and matching descriptors. CSS extraction and bundle graph/budget tests run separately.

Real Chromium checks used the built package styles and controller. Normal light controls at 320/360/390/430px had matching horizontal scroll/client widths. Drawers fit their viewport bounds and both actions measured at least 47px high. At 760×360, the drawer used whole-dialog scrolling; Tab reached both footer actions visibly. A 1280×900 RTL midnight drawer opened at the left edge and used the normal fixed-action layout.

A lower checkbox kept focus and its checked draft when resizing from desktop to 320×260; the scroll mode changed and revealed that same control. Escape returned to the opener and the effective choices remained unknown. Long copy at 32px root text, including RTL midnight with resize observation unavailable, retained equal horizontal scroll/client widths at 320px. Tab reached Close, each purpose, policy links, Reject and Save. Stacked long actions fit individually in the visible drawer; the final Save action was about 309px tall within a 525px drawer, rather than the previous approximately 1,043px narrow-column action.

These are layout and keyboard checks. A 32px root font is not a browser-zoom test. Actual 200–400% browser zoom, screen readers, forced-color operation, full contrast review, physical safe areas/keyboards, WebKit/Firefox and iOS/Android remain open. No WCAG certification or complete platform acceptance is claimed.

The milestone passed 544 package tests and 64 site tests, regulatory/catalog validation and a Worker deployment dry run. One verified stale Astro JS bundle from the previous local asset manifest was removed before the site build; the unmanaged-output guard remains intact. The compiled local controls measure 12.52 KiB gzip and consent CSS 2.42 KiB. The fully validating compatibility entry is still 19.84 KiB against its 15 KiB target; no improvement to that separate remaining target is claimed.

Final computed-style checks confirmed `overflow-y: auto` on the normal body-scrolling layout and equal dialog scroll/client heights at all four phone widths. Focused policy links stayed above the fixed footer. The short landscape fallback used visible body overflow and a taller outer scroll range; its footer actions remained reachable by keyboard. This check caught and corrected a cascade-order error before deployment.
