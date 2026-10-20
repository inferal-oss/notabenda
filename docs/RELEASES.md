# Keep earlier document versions available

An old terms agreement or privacy-choice record points to the wording shown at the time. A new site deployment should keep that pinned URL available, even when its build starts from an empty directory.

`createRetainedReleaseFiles` adds explicitly selected public artifacts to your deployment. It preserves the exact historical HTML and emits only `artifacts/ID.json` and `artifacts/ID/{privacy,cookies,terms}.html`. Your ordinary document routes still come from your current build. It does not select which releases should be public or decide how long to retain them.

## Build from explicit inputs

```ts
import {readFile} from 'node:fs/promises';
import {compileLegalDocuments, createRetainedReleaseFiles} from '@notabenda/core/content';

const current = compileLegalDocuments(currentConfig);
const previous = JSON.parse(await readFile('./legal/releases/prior.json', 'utf8'));
const pinned = createRetainedReleaseFiles([previous, current.artifact], {
  siteId: current.publicConfig.site.id,
});
const files = {...current.files, ...pinned};
// Write these files through your normal deployment build.
```

Save `build.artifact`, or the public `artifacts/ID.json` emitted by the compiler, as an explicit retained build input. Keep a reviewed list in your project or another controlled release store and make it available to clean/CI builds. The helper does not discover files, fetch URLs, read a prior output directory or recover missing history. Adopters choose their own CI and publication workflow.

The JSON CLI supports the same path:

```sh
npx @notabenda/core build --config legal/current.json --out-dir public-legal \
  --retain-artifact legal/releases/previous.json \
  --retain-artifact legal/releases/earlier.json
```

The current artifact is always included by the normal compiler. Identical duplicates deduplicate. Every input is validated before the CLI writes outputs. Inputs from another site, private source envelopes, unsupported schemas, corrupt hashes and unknown/private fields fail with bounded errors. Production is the default; preview artifacts require `--preview` or `{mode: 'preview'}`. This is an explicit permission to include drafts, not a legal-review declaration.

Current limits are 256 retained artifacts per API call or CLI build, 128 KiB per artifact and 16 MiB combined normalized JSON input. The CLI bounds each retained file while reading it; these extra retention-input limits do not cap an ordinary current-document build. Malformed/non-JSON JavaScript values, cycles and accessors are rejected without evaluating them. Validate your own deployment's asset-count and size limits separately.

## Trust and content boundaries

Supply only **trusted compiler output you intend to publish**. Hashes check internal consistency; they do not authenticate the author or sanitize HTML. A person who can create a self-consistent artifact can put arbitrary bytes in its pages. Do not pass browser uploads, third-party archives or unreviewed artifacts into this publishing helper. Keep the static-content policy of the original compiler and your host's restrictive document CSP in place.

Retained pages are copied, never re-rendered through the current template or evaluated as MDX. Their HTML hashes remain unchanged. The schema-1 reader checks manifest, public config, document metadata, structured-content hashes, rich-body provenance and exact HTML bytes. Public config must already equal its public-only projection; private fields are rejected rather than silently removed from an allegedly released artifact.

For authored content, pass `build.artifact`. Keep `build.archive` and its `sourceAttachments` in the private backend history store. The public artifact includes rendered content and public hashes/revision labels, but no original Markdown/MDX source file, imports, component implementations or local filenames. See [authoring](AUTHORING.md) for the separate trusted MDX compilation boundary and [history](../packages/notabenda-cf/README.md) for authorized source inspection.

## Preserve the surrounding resources

Historical HTML keeps its original URLs. Contents links remain fragments within that page; footer/legal cross-links retain the routes encoded at build time. They do not automatically select the same historical release for every linked document. The host must preserve linked CSS/images/assets and maintain appropriate route redirects. An HTML digest does not freeze external CSS or the content of linked pages. Use versioned asset URLs when you need stable presentation.

This helper does not remove stale files, register backend history, activate a notice, publish a website, notify users or collect new agreement. Run it before output writes and keep backend archives, public pinned files and release metadata connected in your own deployment. Immutable backend registration remains separate from publication. A future-effective document is only a document until the host deliberately changes routing/activation under its reviewed workflow.

Removing a public artifact is also a host decision. Ensure notices, agreements and retained records still have the versions they need, and apply your reviewed retention/erasure and backup policies. Neither cookie expiry nor a newer policy automatically removes an older artifact.

Try the [current and prior terms example](http://127.0.0.1:4178/releases) after `npm run dev`. Both builds are explicit inputs, so the old URL survives a clean build. Its comparison opens the host-authorized document history workspace. See the [verification record](verification/retained-releases.md) and `REQ-PRODUCT-RETAINED-RELEASES` in the [catalog](requirements/README.md#req-product-retained-releases).
