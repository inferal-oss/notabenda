# Packages and names

Notabenda uses the `@notabenda` npm scope. The organization is reserved; **no packages have been published**. Build and pack the workspace, then install its local tarballs for the developer preview.

| Package | Purpose | Local tarball at version 0.1.0 |
| --- | --- | --- |
| `@notabenda/core` | Configuration, legal pages, visitor controls, setup and the CLI | `notabenda-core-0.1.0.tgz` |
| `@notabenda/cloudflare` | Optional Cloudflare storage, backoffice, starter and local doctor | `notabenda-cloudflare-0.1.0.tgz` |
| `@notabenda/authoring` | Optional Markdown/MDX build tooling | `notabenda-authoring-0.1.0.tgz` |

The repository directories keep their existing names. Select npm workspaces by the scoped package name:

```sh
npm run build
npm pack --workspace @notabenda/core --ignore-scripts
npm pack --workspace @notabenda/cloudflare --ignore-scripts
npm pack --workspace @notabenda/authoring --ignore-scripts
```

Install the desired tarballs into a consuming project. Include core alongside authoring so its dependency resolves locally. For example:

```sh
npm install /path/to/notabenda-core-0.1.0.tgz \
  /path/to/notabenda-authoring-0.1.0.tgz
```

Imports use the scoped name and existing subpaths, such as `@notabenda/core/consent`, `@notabenda/core/react`, `@notabenda/core/packs` and `@notabenda/core/styles.css`. Backend imports use `@notabenda/cloudflare`; Markdown/MDX imports use `@notabenda/authoring`.

## Commands

The installed binaries remain `notabenda` and `notabenda-cf`. After local installation:

```sh
npx --no-install notabenda --help
npx --no-install notabenda-cf --help
```

The CLI stays in core. A separate `@notabenda/cli` can be considered if its dependencies or release schedule warrant a split. It is not a current package. Creating the npm organization, preparing tarballs and publishing packages are separate actions.

## Packs and compatibility

Packs are selectable jobs within the library, rather than one npm package each. They reuse shared configuration, questions, controls and evidence. Their current names and availability come from the installed registry.

This package rename does not change retained artifacts, content hashes, `notabenda-authoring@0.1.0` provenance identifiers, schema kinds, browser-storage keys or saved pack selections. Those are data contracts, not npm module names. The `cartridges` compatibility aliases remain available beneath the scoped core package.

There are no published unscoped consumers to migrate. This repository does not publish compatibility aliases under the old unscoped names. If adapting an earlier local checkout, update imports, dependencies and workspace commands, then rebuild. Do not rewrite archived releases to replace old identifiers.
