#!/usr/bin/env python3
"""REQ-EU-GUARANTEE-LABEL: inspect the committed fixture using the Python standard library only."""
import json
import xml.etree.ElementTree as ET
from prepare import HERE, SVG, FIELDS, FONT_MEMBERS, FONT_PROPERTIES, sha, canonical, flatten, fixed_tree


def verify():
    if not __debug__:
        raise RuntimeError('Run fixture verification without Python optimization.')
    manifest = json.loads((HERE / 'manifest.json').read_text())
    config = json.loads((HERE / 'config.json').read_text())
    source = (HERE / 'source/garan-colour.svg').read_bytes()
    output = (HERE / manifest['output']['file']).read_bytes()
    assert sha(source) == manifest['source']['sha256'] == '3414c8366823db39702d2557e614f882b530487ce589e903afdc98b7225e1ab1'
    assert len(source) == manifest['source']['bytes']
    assert sha(output) == manifest['output']['sha256'] and len(output) == manifest['output']['bytes']
    original, finished = flatten(ET.fromstring(source)), ET.fromstring(output)
    assert sha(canonical(fixed_tree(original))) == sha(canonical(fixed_tree(finished))) == manifest['fixedArtwork']['sha256']
    assert manifest['fixedArtwork']['algorithm'] == 'resolved-presentation-tree-v1'
    assert not list(finished.iter('{' + SVG + '}text'))
    assert not list(finished.iter('{' + SVG + '}style'))
    source_fields = list(original.iter('{' + SVG + '}text'))
    groups = {n.get('id'): n for n in finished.iter() if n.get('id', '').startswith('example-field-')}
    assert len(groups) == len(FIELDS) == len(manifest['fields'])
    assert [config['producer']['brand'], config['producer']['model'], str(config['durationYears'])] == [f[2] for f in FIELDS]
    for original_field, recorded, (key, _, value, face, size, transform) in zip(source_fields, manifest['fields'], FIELDS):
        group = groups['example-field-' + key]
        assert recorded['field'] == key and recorded['value'] == value
        assert group.get('transform') == recorded['transform'] == transform
        expected = {k: v for k, v in original_field.attrib.items() if k not in FONT_PROPERTIES}
        expected['id'] = 'example-field-' + key
        assert group.attrib == expected
        assert recorded['fontMember'] == FONT_MEMBERS[face][0] and recorded['fontSha256'] == FONT_MEMBERS[face][1]
        assert recorded['fontSize'] == size and recorded['fontWeight'] == (400 if face == 'regular' else 800)
        assert len(group) == 1 and group[0].tag == '{' + SVG + '}path'
        assert set(group[0].attrib) == {'d'}
        assert sha(group[0].get('d').encode()) == recorded['outlineSha256']
    assert config['reviewStatus'] == manifest['reviewStatus'] == 'draft' and config['allowPreview'] is True
    assert all(v is True for v in config['qualification'].values())
    assert sha((HERE / 'source/Inter-OFL.txt').read_bytes()) == manifest['fonts']['licenseSha256']
    print('Verified complete fixture hashes, fixed presentation tree, field/config bindings and font provenance. Visual and legal review remain separate.')


if __name__ == '__main__':
    verify()
