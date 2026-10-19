# Interface and documentation copy review

Reviewed the current homepage, example gallery, light/dark examples, setup, evidence workspace and guide introductions. Headings and browser-tab titles now name the operation or record. Descriptions explain the action and relevant limits instead of using slogans about clarity, control or thoughtfulness. The writing conventions are in [WRITING.md](../WRITING.md).

Setup includes a highlighted project-discovery command beside service selection, a guide link and an explanation of the dependency/infrastructure references the browser cannot inspect. Findings still require actual-use review. The command is advice; the browser does not run it or inspect project files. Private reports can reveal project paths. Installing the preview package is described in the linked guide; the package is not yet published on npm.

## Historical content

The rights example uses revision `rights-2`. Its two previous public artifacts are retained explicitly in `examples/rights/retained-artifacts.json`, including their original legal HTML. The current rights page uses direct request labels. The form-permission offer title changed under a new `product-news-4` revision; records keep the offer wording they received. Quoted source titles, legal documents, identifiers and historical verification evidence were not rewritten for style.

## Verification

- `npm run check`: package/site tests, requirement and service-catalog validation, site generation and Worker deployment dry run.
- Rights regression tests check the previous artifact URLs and exact legal HTML alongside the current revision.
- Setup tests check the command, highlighted flags, guide destination, keyboard focus and lack of executable controls or inferred service selections.
- A local comparison checked all 200 pre-existing public artifact JSON/HTML files against the rebuilt output; none were missing or changed.

Browser layout checks and screenshots cover the setup callout on desktop and narrow mobile widths. This review does not substitute for editorial or legal review of an adopter's policy content.
