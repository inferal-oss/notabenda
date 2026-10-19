# Astro integration example

Run `npm run dev` at the repository root, then open `/astro/`. Or use `npm run example:astro` to compile this project alone into `examples/astro/dist`.

This is a real Astro 7.4 static build. Node.js 22.22+ is required for the example tooling. The reusable core's default imports do not depend on Astro.

- Static privacy/cookie/terms pages use packaged `.astro` components and contain no scripts.
- Two interactive pages share one host-owned browser controller through Astro navigation. Optional services use the existing registration/cleanup contract.
- `mountAstroConsent` remounts the native controls after swaps and closes unsaved drafts without changing a choice.
- The builder emits only explicit public files and compiled framework assets, with telemetry disabled and no source maps.

Read [docs/ASTRO.md](../../docs/ASTRO.md) for APIs, ownership, client navigation and scope limits. All operator facts, optional services and document text in this example are fictional drafts.
