// @requirements REQ-PRODUCT-CF-HOST REQ-PRODUCT-RELEASE-CANDIDATE
// Original screenshot bytes are JPEG; retain old public PNG-named URLs.
export const legacyScreenshotNames=Object.freeze([
  "accessibility-diff-mobile",
  "browser-delivery-light-mobile",
  "browser-delivery-midnight-mobile",
  "compiled-consent-granular-desktop",
  "consent-current",
  "consent-focus-retry",
  "consent-performance-desktop",
  "contract-action-review-mobile",
  "contract-actions-operator-filter",
  "contract-dispatch-guide-desktop",
  "react-compiled-drawer",
  "setup-grid-desktop",
  "setup-grid-mobile",
  "syntax-highlighted-guide-desktop",
  "website-demo-storage-note-mobile"
]);
const targets=new Map(legacyScreenshotNames.map(name=>["/docs/assets/screenshots/"+name+".png","/docs/assets/screenshots/"+name+".jpg"]));
export const legacyScreenshotTarget=path=>targets.get(path);
