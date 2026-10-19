# React integration example

Run `npm run dev` at the repository root and open `/react` or `/dark/react`. The example server renders a conservative page, hydrates with the same initial snapshot, then reads the browser's actual choices. Optional local requests and storage use `registerService`.

`client.mjs` owns one controller outside React render. `view.mjs` uses `ConsentProvider`, read-only hooks, native controls and legal links. The build bundles React only for this optional example; the core's default browser imports remain framework-independent.

See [the React guide](../../docs/REACT.md) for ownership, server rendering, component APIs and integration limits.
