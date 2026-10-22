<!-- @requirements REQ-PRODUCT-TERMS-REHEARSAL REQ-PRODUCT-TERMS-ACCEPTANCE -->
# Try a configured terms agreement

Use the rehearsal to check how your saved agreement statement and button read together, and what a visitor sees when recording fails. It runs the ordinary agreement controller against a temporary in-memory recorder.

In setup, open **Terms agreements** under your site facts. Add or edit a named workflow, save its draft wording, then choose **Try agreement** on that scope. You can also reach this editor from **Review terms agreements** in the prepared pack’s connection steps.

1. Open the terms title to read the local configuration preview. It contains your declared document facts and placeholders; outside links are disabled.
2. Return to the rehearsal. The agreement starts unchecked. Checking its statement makes the action available and sends nothing.
3. Submit to receive a simulated receipt. The observer shows one attempt and one receipt in this run.
4. Choose **Start fresh**, turn on **Simulate a recording failure**, check the statement and submit. No receipt is returned. Turn failure off and submit again; the actual controller reuses its request key.

**Start fresh** clears the simulated receipts and starts unchecked. Closing the rehearsal discards its controller and memory; reopening starts a new run. No localStorage, sessionStorage, IndexedDB, recorder endpoint or host workflow callback is used. The saved configuration, wording review and private setup report are unchanged. Editing or refreshing the scope list invalidates its open rehearsal.

The native agreement uses the configured statement, action and selected interface messages. Operator instructions and the local-reader link metadata remain English. A non-English agreement needs the existing complete `localization.terms` dictionary; the rehearsal does not invent translations.

## Use it in your own setup screen

```ts
import {mountTermsRehearsal} from '@notabenda/core/setup/terms-rehearsal';

const rehearsal = mountTermsRehearsal(container, {
  config: yourSavedDraft,
  scopeId: 'account-terms',
});

// Call from a deliberate user action.
await rehearsal.open();

// When the draft changes or the setup screen unmounts:
rehearsal.destroy();
```

Use `@notabenda/core/styles.css` for the rehearsal and `@notabenda/core/packs.css` for its configuration reader. Both accept the existing theme variables; hosts can supply their own styles. Configuration is captured as a detached public snapshot at mounting. Opening requires Web Crypto in a secure browser context. Its document hashes describe the local rendering; its rehearsal-specific identifiers are separate from a final compiled release. Choose an explicitly declared `terms.agreements` scope; a missing scope fails before creating the dialog. Unsaved editor text is not a confirmed configuration change. Custom host-authored offers remain supported by the normal terms APIs.

The project website and new Cloudflare starters load this module only when requested. Starter assets retain the host’s configure authorization, independently of evidence-read access. Existing starters must rebuild their setup assets and authorize the new same-origin rehearsal module; the local doctor reports it if missing.

## After the rehearsal

A simulated receipt is no real agreement or evidence of an installed integration. Build and retain the final reviewed release; select its exact offer on the backend; bind the authenticated subject and operation; connect the actual recorder; then test failure, retry, reload, stale wording, retention and authorization in that application. The rehearsal does not run account creation or another host action.

It previews configuration-generated documents. Markdown/MDX output has a separate [compiled-release reader](AUTHORING.md); this rehearsal does not claim to read a separately authored policy build. See [verification](verification/terms-rehearsal.md) for the tested boundary.
