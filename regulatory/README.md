# Research and implementation traceability

[catalog.json](catalog.json) is the source of truth for individual researched requirements, planned features, sources, and verification scenarios. It contains public research and fictional/product-level examples only. The [readable requirements](../docs/requirements/README.md), [source index](../docs/requirements/SOURCES.md), and [feature index](../docs/FEATURES.md) are generated from it.

## How the pieces connect

```text
primary source + locator + discovery article
    -> REQ-* obligation + applicability + caveats + dates/review status
    -> FEAT-* implementation deliverables
    -> VERIFY-* observable acceptance scenario
    -> actual code/test file references once implemented
```

For example, `REQ-IT-REPROMPT` links the Italian regulator's repeated-banner guidance to `FEAT-CHOICES` and `FEAT-REGIONS`, then to `VERIFY-IT-REPROMPT`, which checks return visits and separate repeat-prompt conditions. Code and tests will carry that requirement ID when they exist. The catalog does not claim that the scenario already runs.

## Research workflow

1. Search the web and vendor articles to discover issues, country differences, changed rules, and terminology. iubenda's regional comparison, US guide, legal overview, and terms changelog are starting points, not legal authority.
2. Follow the underlying statute, regulation, regulator guidance/decision, or platform specification. Prefer the published final document to consultation drafts, administrative-process bundles, forum posts, or old translations. Record failed access and version ambiguity rather than guessing.
3. Add one concrete obligation per `REQ-*` item, with jurisdiction, applicability facts, source locator, rule type, timing, caveats, and research status. Distinguish a law from guidance, a recommendation, a platform condition, and a voluntary product standard.
4. Link it to a concrete feature and observable verification scenario. Explain what the toolkit does and what the operator/application still must do. Shared features can implement several requirements, but regional conditions stay explicit.
5. Complete current full-text, applicability, translation, and legal review before calling a pack supported. `initial-research`, `unreviewed`, and `planned` are independent statuses; finding an official page does not establish compliance.
6. During implementation, populate project-relative `implementationRefs` and `testRefs` and put the requirement ID next to the relevant rule or test, for example `@requirements REQ-IT-REPROMPT`. Do not invent file paths or mark planned scenarios automated.
7. At release and periodic maintenance reviews, check current sources, effective amendments, and national implementation. A changed source should produce a reviewed requirement diff identifying affected features, content, and scenarios. Keep superseded evidence references needed by retained records.

## Local tooling

```sh
# Validate references and regenerate readable indexes.
python3 scripts/regulatory.py

# Read-only check for broken references and stale generated pages.
python3 scripts/regulatory.py --check
```

This is project-maintainer tooling. Adopters decide whether to automate discovery, use CI, or gate their own releases. No customer CI workflow is required.

Source access values are explicit: `read` means retrieved content, `search-result` means a finding found through search that still needs full-text review, and `blocked` means access was unsuccessful. A source's `checkedOn` is not its effective date. Requirement `effectiveFrom` stays null where no precise legal commencement date has been established; `timingNote` records any known guidance/publication/compliance distinction.

Coverage is item-level. The catalog currently contains selected obligations across several legal scopes, plus separate platform and product standards. It is not a complete world-law database. Singapore/Japan access/version issues and the remaining US/EU jurisdictions are recorded as research gaps. Sector, health, child, direct-marketing, contractual, transfer, and organizational requirements need separate scope decisions and review.
