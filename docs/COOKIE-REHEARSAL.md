<!-- @requirements REQ-PRODUCT-CONSENT-REHEARSAL -->
# Try your cookie controls

After preparing the **Cookie choices** pack, choose **Try cookie controls** beside its control settings. The rehearsal uses your draft’s service names, purposes, wording, scope restrictions and timing policies. You can see which simulated services would run before connecting any provider code.

1. Reject optional purposes. Both the prompt and service list update.
2. Choose **Simulate return visit**. A new controller reads the rehearsal’s temporary memory, as it would read a saved choice on another visit.
3. Reopen preferences and allow one purpose. A service that needs several purposes waits for all of them.
4. Reopen preferences and reject again. Simulated services stop.
5. Choose **Start fresh** to discard this rehearsal’s memory and begin again.

If control settings are missing, use **Configure cookie controls** first. Nothing is enabled just by choosing the pack. Unknown or present scope restrictions stay restrictive. Where the draft declares a Global Privacy Control policy, its explicit simulation switch tests that restriction independently of cookie choices. It does not inspect or change the browser’s real signal.

## What runs

The real consent engine and native controls run in a separate frame inside a deliberately opened dialog. Package-owned callbacks count starts and stops; they load no provider, tag, image, embed or declared storage. Choices use a private in-memory map, not localStorage, cookies, IndexedDB or the setup draft. Expiry timers are cancellable. Returning recreates the controller with the same temporary memory; closing discards it. Reopening or editing the draft starts a new rehearsal.

The frame loads only same-origin widget styles. Child scripts, forms, network connections and navigation links are inactive. The trusted parent mounts the controls; this frame isolates layout and resources, not the same-origin parent application. Preferences stay within the frame. Escape closes preferences first; a subsequent Escape closes the rehearsal and returns focus. A visible close button is always available.

This is a **local-choice model**, not a test of an installed integration. Required receipt admission, archived notice wording overrides, account processing restrictions, real loaders, vendor cleanup, published legal pages and backend behavior are untested. Those can change the production outcome. A simulated active service is neither an acknowledged grant nor proof of legal eligibility. Reviewers still need the [actual connection inspection](CONNECTION-INSPECTION.md), [publication check](PUBLICATION-CHECK.md) and application tests.

The selected localized visitor wording stays intact; rehearsal instructions use the operator interface’s language. Original facts, review declarations, private reports and pending setup answers remain unchanged. The rehearsal does not test revised material scopes across draft edits: old preview memory is discarded when the draft changes. Test real revision migration in the host application.

## Reuse the rehearsal

```ts
import {mountConsentRehearsal} from '@notabenda/core/setup/consent-rehearsal';
import '@notabenda/core/styles.css';

const rehearsal = mountConsentRehearsal(container, {
  config: preparedDraft,
  stylesheetUrls: ['/assets/notabenda.css'],
});

// From a deliberate user action:
await rehearsal.open();
// On unmount or a draft change:
rehearsal.destroy();
```

The configuration is validated in preview mode and detached into the public consent projection before DOM is created. The optional entry is import-safe during SSR; mounting needs a browser window and native dialogs. A missing/invalid consent configuration fails instead of inventing settings.

`stylesheetUrls` accepts up to eight same-origin CSS URLs without query strings or fragments. If omitted, the component uses eligible stylesheet links on the host page. Supply the widget’s actual stylesheet when your app bundles CSS differently. Controls become usable only after styles load; failure keeps the rehearsal unavailable. The host must allow same-origin frames and styles in its CSP. The package supplies no cross-origin proxy or permissive CSP override.

The project site and new Cloudflare starters load the module only after a deliberate request. The starter protects its module and styles with the existing host configuration permission. Hosts choose their own bundling and authorization; the package adds no authentication system.

See [verification](verification/consent-rehearsal.md).
