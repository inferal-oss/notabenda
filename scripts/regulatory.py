#!/usr/bin/env python3
"""Validate the research catalog and render its local Markdown indexes.

@requirements REQ-PRODUCT-AGENT-INTEGRATION
"""

import argparse
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]


def indexed(items, label):
    result = {}
    for item in items:
        key = item['id']
        if key in result:
            raise ValueError(f'Duplicate {label}: {key}')
        result[key] = item
    return result


def validate(catalog):
    features = indexed(catalog['features'], 'feature')
    sources = indexed(catalog['sources'], 'source')
    requirements = indexed(catalog['requirements'], 'requirement')
    verification = indexed(catalog['verification'], 'verification')
    jurisdictions = indexed(catalog['jurisdictions'], 'jurisdiction')
    indexed(catalog['researchBacklog'], 'research gap')

    def references(owner, values, target):
        for value in values:
            if value not in target:
                raise ValueError(f'{owner}: unknown reference {value}')

    def files(owner, values):
        for value in values:
            relative = Path(value.split('#', 1)[0])
            resolved = (ROOT / relative).resolve()
            if relative.is_absolute() or not resolved.is_relative_to(ROOT) or not resolved.is_file():
                raise ValueError(f'{owner}: missing or non-project file reference {value}')

    for source in sources.values():
        if not source['url'].startswith('https://'):
            raise ValueError(f"{source['id']}: source URL must use HTTPS")
        if source['access'] not in {'read', 'search-result', 'blocked'}:
            raise ValueError(f"{source['id']}: unknown access status")

    for feature in features.values():
        if feature['priority'] not in {'P0', 'P1', 'P2', 'P3', 'P4'}:
            raise ValueError(f"{feature['id']}: unknown priority")
        files(feature['id'], feature['implementationRefs'])
        if feature['status'] not in {'planned', 'partial', 'implemented'}:
            raise ValueError(f"{feature['id']}: unknown implementation status")

    for requirement in requirements.values():
        key = requirement['id']
        references(key, [requirement['jurisdiction']], jurisdictions)
        references(key, requirement['featureIds'], features)
        references(key, requirement['verificationIds'], verification)
        references(key, requirement['discoverySourceIds'], sources)
        references(key, [s['sourceId'] for s in requirement['sourceRefs']], sources)
        if not requirement['featureIds'] or not requirement['verificationIds']:
            raise ValueError(f'{key}: feature and verification links are required')
        if requirement['kind'] != 'product-standard' and not requirement['sourceRefs']:
            raise ValueError(f'{key}: a substantive source is required')
        for ref in requirement['sourceRefs']:
            source = sources[ref['sourceId']]
            if source['kind'] == 'secondary-explainer' or source['access'] == 'blocked':
                raise ValueError(f'{key}: primary requirement cannot rely on {source["id"]}')
            if not ref['locator']:
                raise ValueError(f'{key}: source locator is required')
        if key not in jurisdictions[requirement['jurisdiction']]['requirementIds']:
            raise ValueError(f'{key}: missing reciprocal jurisdiction link')
        for verify_id in requirement['verificationIds']:
            if key not in verification[verify_id]['requirementIds']:
                raise ValueError(f'{key}: missing reciprocal verification link')
        files(key, requirement['implementationRefs'] + requirement['testRefs'])
        if requirement['implementationStatus'] not in {'planned', 'partial', 'implemented'}:
            raise ValueError(f'{key}: unknown implementation status')
        if requirement['implementationStatus'] == 'implemented' and (not requirement['implementationRefs'] or not requirement['testRefs']):
            raise ValueError(f'{key}: implemented status requires real implementation and test references')
        for reference in requirement['implementationRefs'] + requirement['testRefs']:
            path = ROOT / reference.split('#', 1)[0]
            if path.suffix in {'.ts', '.mjs', '.js', '.css', '.py', '.astro'} and key not in path.read_text():
                raise ValueError(f'{key}: linked source/test must cite the requirement: {reference}')

    for item in verification.values():
        if item['status'] not in {'planned', 'partial', 'automated'}:
            raise ValueError(f'{item["id"]}: unknown verification status')
        references(item['id'], item['requirementIds'], requirements)
        for req_id in item['requirementIds']:
            if item['id'] not in requirements[req_id]['verificationIds']:
                raise ValueError(f'{item["id"]}: missing reciprocal requirement link')
        files(item['id'], item['testRefs'])
        if item['status'] == 'automated' and not item['testRefs']:
            raise ValueError(f'{item["id"]}: automated status requires real test files')

    for jurisdiction in jurisdictions.values():
        references(jurisdiction['id'], jurisdiction['requirementIds'], requirements)
        for req_id in jurisdiction['requirementIds']:
            if requirements[req_id]['jurisdiction'] != jurisdiction['id']:
                raise ValueError(f'{req_id}: jurisdiction mismatch')
    for gap in catalog['researchBacklog']:
        references(gap['id'], gap['sourceIds'], sources)
        references(gap['id'], gap['featureIds'], features)
    return features, sources, requirements, verification


def render(catalog, indexes):
    features, sources, requirements, verification = indexes
    feature_link = lambda key: f'[{key}](../FEATURES.md#{key.lower()})'
    req_link = lambda key: f'[{key}](requirements/README.md#{key.lower()})'
    source_link = lambda key: f'[{key}](SOURCES.md#{key.lower()})'

    lines = [
        '# Requirements catalog', '',
        'Generated from [regulatory/catalog.json](../../regulatory/catalog.json). '
        'Edit the catalog and run `python3 scripts/regulatory.py` to refresh these pages.', '',
        f"Research baseline: **{catalog['baseline']}**. Implementation and verification status are recorded per item. "
        'Legal research is initial and legally unreviewed; no jurisdiction pack is production-supported. '
        'Search-result evidence is labeled separately from a retrieved full source.', '',
        '[Feature index](../FEATURES.md) · [Source index](SOURCES.md) · '
        '[Research workflow](../../regulatory/README.md)', '',
        '## Scope index', '',
        '| Scope | Requirements | Coverage |', '| --- | --- | --- |',
    ]
    for jurisdiction in catalog['jurisdictions']:
        links = ', '.join(f'[{key}](#{key.lower()})' for key in jurisdiction['requirementIds'])
        statuses = sorted({requirements[key]['implementationStatus'] for key in jurisdiction['requirementIds']})
        lines.append(f"| {jurisdiction['id']} | {links} | Selected items: {', '.join(statuses)} |")
    lines.extend(['', '## Individual requirements', ''])
    for item in requirements.values():
        lines.extend([
            f'<a id="{item["id"].lower()}"></a>', '',
            f'### {item["id"]} — {item["title"]}', '', item['summary'], '',
            f"**Applies when:** {item['appliesWhen']}", '',
            f"**Type:** {item['kind']}. **Research:** {item['researchStatus']}. "
            f"**Legal review:** {item['legalReviewStatus']}. **Implementation:** {item['implementationStatus']}.", '',
        ])
        if item['sourceRefs']:
            links = []
            for ref in item['sourceRefs']:
                source = sources[ref['sourceId']]
                links.append(f'[{source["title"]}]({source["url"]}) — {ref["locator"]} '
                             f'({source["access"]}; {source_link(source["id"])})')
            lines.extend(['**Sources:** ' + '; '.join(links) + '.', ''])
        if item['discoverySourceIds']:
            lines.extend(['**Discovery articles:** ' + ', '.join(source_link(key) for key in item['discoverySourceIds']) + '.', ''])
        lines.extend(['**Features:** ' + ', '.join(feature_link(key) for key in item['featureIds']) + '.', ''])
        for key in item['verificationIds']:
            scenario = verification[key]
            lines.extend([f'<a id="{key.lower()}"></a>', '',
                          f'**{key} ({scenario["status"]}):** {scenario["expected"]}', ''])
        if item['timingNote']:
            lines.extend([f'**Timing:** {item["timingNote"]}', ''])
        if item.get('implementationNote'):
            lines.extend([f'**Implementation boundary:** {item["implementationNote"]}', ''])
        refs = item['implementationRefs'] + item['testRefs']
        lines.extend([f'**Limits/open review:** {item["caveats"]}', '',
                      '**Code/test references:** ' + (', '.join(f'[{ref}](../../{ref})' for ref in refs) if refs else 'None yet; nothing implemented.') , ''])
    lines.extend(['## Research gaps', ''])
    for gap in catalog['researchBacklog']:
        lines.extend([f'### {gap["id"]} — {gap["jurisdiction"]}', '',
                      f'**{gap["status"]}:** {gap["question"]}', '',
                      '**Planned features:** ' + ', '.join(feature_link(key) for key in gap['featureIds']) + '.', ''])
        if gap['sourceIds']:
            lines.extend(['**Starting sources:** ' + ', '.join(source_link(key) for key in gap['sourceIds']) + '.', ''])

    feature_lines = ['# Build areas and feature traceability', '',
                     'Generated from [the catalog](../regulatory/catalog.json). '
                     'P0 is the foundation, P1 adds browser consent, P2 adds records and applicable regional/contract controls, '
                     'P3 adds discovery/integrations, and P4 is deferred. Status is recorded per feature.', '',
                     'Features link to individual obligations, implementation files and verification scenarios with their current status. '
                     'A shared mechanism can satisfy several requirements without duplicating its implementation.', '']
    for feature in sorted(features.values(), key=lambda item: item['priority']):
        feature_lines.extend([f'<a id="{feature["id"].lower()}"></a>', '',
                              f'## {feature["priority"]} · {feature["id"]} — {feature["title"]}', '',
                              f'**Status:** {feature["status"]}.', '',
                              '**Deliverables:**', ''])
        feature_lines.extend('- ' + text for text in feature['deliverables'])
        linked = [item for item in requirements.values() if feature['id'] in item['featureIds']]
        feature_lines.extend(['', '**Requirement links:** ' + (', '.join(req_link(item['id']) for item in linked)
                              if linked else 'Product foundation; see deliverables and milestone acceptance criteria.') + '.', '',
                              '**Code references:** ' + (', '.join(f'[{ref}](../{ref})' for ref in feature['implementationRefs']) if feature['implementationRefs'] else 'None yet.') , ''])

    source_lines = ['# Regulatory and platform sources', '',
                    'Generated from [the catalog](../../regulatory/catalog.json). '
                    'Dates below record retrieval/search, not legal effective dates. '
                    '`read` means source content was retrieved; `search-result` means the recorded finding '
                    'was found in search output and needs full-text review; `blocked` is an unresolved gap. '
                    'Neither retrieval nor search is a legal review.', '']
    for source in sources.values():
        source_lines.extend([f'<a id="{source["id"].lower()}"></a>', '',
                             f'## {source["id"]}', '', f'[{source["title"]}]({source["url"]})', '',
                             f'**Type:** {source["kind"]}. **Checked:** {source["checkedOn"]}. '
                             f'**Access:** {source["access"]}.', ''])
        if source['note']:
            source_lines.extend([source['note'], ''])
    return {
        ROOT / 'docs/requirements/README.md': '\n'.join(lines).rstrip() + '\n',
        ROOT / 'docs/requirements/SOURCES.md': '\n'.join(source_lines).rstrip() + '\n',
        ROOT / 'docs/FEATURES.md': '\n'.join(feature_lines).rstrip() + '\n',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='validate and check rendered indexes without writing')
    parser.add_argument('--catalog', type=Path, default=ROOT / 'regulatory/catalog.json')
    args = parser.parse_args()
    try:
        catalog = json.loads(args.catalog.read_text())
        outputs = render(catalog, validate(catalog))
        for path, content in outputs.items():
            if args.check:
                if not path.exists() or path.read_text() != content:
                    raise ValueError(f'Stale index: {path.relative_to(ROOT)}; run python3 scripts/regulatory.py')
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
    except (ValueError, KeyError, OSError) as error:
        print(f'Catalog error: {error}', file=sys.stderr)
        return 1
    automated = sum(item['status'] == 'automated' for item in catalog['verification'])
    print(f"Validated {len(catalog['requirements'])} requirements, {len(catalog['features'])} features, "
          f"{len(catalog['sources'])} sources, and {len(catalog['verification'])} verification scenarios ({automated} automated).")
    return 0


if __name__ == '__main__':
    sys.exit(main())
