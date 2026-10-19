#!/usr/bin/env python3
"""REQ-EU-GUARANTEE-LABEL: reproduce this fixed example; not a public label generator.

Supply the two pinned upstream archives locally. This script makes no network requests.
Only the brand, model and duration fields are replaced. Fixed artwork is compared
before writing; fonts and archives are not copied into the repository.
"""
import argparse
import hashlib
import importlib.metadata
import io
import json
import pathlib
import re
import xml.etree.ElementTree as ET
import zipfile

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
HERE = pathlib.Path(__file__).resolve().parent
GARAN_URL = 'https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en'
INTER_URL = 'https://github.com/rsms/inter/releases/tag/v4.1'
ARCHIVES = {
    'garan': ('fb38533adc243094a7bfcf3d0545037c681aa5d5210b6d0c7327744921923e93', 3_000_000),
    'inter': ('9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e', 40_000_000),
}
FONT_MEMBERS = {
    'regular': ('extras/ttf/Inter-Regular.ttf', '40d692fce188e4471e2b3cba937be967878f631ad3ebbbdcd587687c7ebe0c82'),
    'extraBold': ('extras/ttf/Inter-ExtraBold.ttf', 'e6756ad5690b77606aa62249a7b420d9902d45cae4b0048a24911fd4324b0a22'),
}
FIELDS = [
    ('brand', 'Brand/Trademark', 'Juniper Works', 'regular', 9, 'translate(6.32 74.52)'),
    ('model', 'Model identifier', 'JW-01', 'regular', 9, 'translate(196.75 74.52)'),
    ('duration', 'XX', '5', 'extraBold', 80, 'translate(5.07 150.57)'),
]
FONT_PROPERTIES = {'font-family', 'font-size', 'font-variation-settings', 'font-weight', 'letter-spacing'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def archive(path, kind):
    expected, limit = ARCHIVES[kind]
    if path.stat().st_size > limit:
        raise ValueError('Archive exceeds its pinned input limit.')
    data = path.read_bytes()
    if sha(data) != expected:
        raise ValueError('Archive differs from the reviewed upstream file: ' + kind)
    return zipfile.ZipFile(io.BytesIO(data))


def member(z, name, limit=1_000_000):
    # Fixed entry names only; no filesystem extraction or path supplied by archive metadata.
    info = z.getinfo(name)
    if info.file_size > limit or info.is_dir():
        raise ValueError('Unexpected archive entry.')
    return z.read(info)


def flatten(root):
    """Resolve the pinned source's simple class rules in stylesheet order."""
    rules = []
    for style in root.iter('{' + SVG + '}style'):
        css = style.text or ''
        cursor = 0
        for match in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
            if css[cursor:match.start()].strip():
                raise ValueError('Unexpected source stylesheet.')
            selectors = [s.strip() for s in match[1].split(',')]
            if not all(re.fullmatch(r'\.[a-zA-Z0-9_-]+', s) for s in selectors):
                raise ValueError('Unexpected source selector.')
            properties = {}
            for declaration in match[2].split(';'):
                if declaration.strip():
                    key, value = declaration.split(':', 1)
                    properties[key.strip()] = value.strip()
            rules.append(({s[1:] for s in selectors}, properties))
            cursor = match.end()
        if css[cursor:].strip():
            raise ValueError('Unexpected source stylesheet suffix.')
    for parent in list(root.iter()):
        for child in list(parent):
            if child.tag == '{' + SVG + '}style':
                parent.remove(child)
    for node in root.iter():
        classes = set(node.attrib.pop('class', '').split())
        for selectors, properties in rules:
            if selectors & classes:
                node.attrib.update(properties)
        node.attrib.pop('data-name', None)
        width = node.get('stroke-width')
        if width and re.fullmatch(r'[0-9.]+px', width):
            node.set('stroke-width', width[:-2])
    return root


def fixed_tree(node):
    if node.tag == '{' + SVG + '}text' or node.get('id', '').startswith('example-field-'):
        return None
    return [node.tag, sorted(node.attrib.items()), (node.text or '').strip(),
            [tree for child in node if (tree := fixed_tree(child)) is not None]]


def outline(value, data, size):
    import uharfbuzz as hb
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    font = TTFont(io.BytesIO(data), lazy=False)
    face = hb.Face(data)
    shaping_font = hb.Font(face)
    shaping_font.scale = (face.upem, face.upem)
    hb.ot_font_set_funcs(shaping_font)
    buffer = hb.Buffer()
    buffer.add_str(value)
    buffer.direction, buffer.script, buffer.language = 'ltr', 'Latn', 'en'
    hb.shape(shaping_font, buffer)
    glyphs, order = font.getGlyphSet(), font.getGlyphOrder()
    pen = SVGPathPen(glyphs)
    x = y = 0
    scale = size / face.upem
    for info, position in zip(buffer.glyph_infos, buffer.glyph_positions):
        if info.codepoint == 0:
            raise ValueError('A field contains a missing glyph.')
        glyphs[order[info.codepoint]].draw(TransformPen(pen, (
            scale, 0, 0, -scale, (x + position.x_offset) * scale, -(y + position.y_offset) * scale)))
        x += position.x_advance
        y += position.y_advance
    result = (pen.getCommands(), round(x * scale, 8), font['OS/2'].usWeightClass)
    font.close()
    return result


def prepare(garan_path, inter_path):
    versions = {name: importlib.metadata.version(name) for name in ['fonttools', 'uharfbuzz']}
    if versions != {'fonttools': '4.67.0', 'uharfbuzz': '0.56.3'}:
        raise ValueError('Use the exact maintainer requirements.txt versions.')
    with archive(garan_path, 'garan') as z:
        source = member(z, 'GARAN Label_colour.svg')
    if sha(source) != '3414c8366823db39702d2557e614f882b530487ce589e903afdc98b7225e1ab1':
        raise ValueError('Unexpected source SVG.')
    fonts = {}
    with archive(inter_path, 'inter') as z:
        license_text = member(z, 'LICENSE.txt')
        if sha(license_text) != '262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a':
            raise ValueError('Unexpected Inter license.')
        for key, (name, digest) in FONT_MEMBERS.items():
            fonts[key] = member(z, name)
            if sha(fonts[key]) != digest:
                raise ValueError('Unexpected font member.')
    root = flatten(ET.fromstring(source))
    fixed_hash = sha(canonical(fixed_tree(root)))
    text_nodes = [n for n in root.iter() if n.tag == '{' + SVG + '}text']
    if len(text_nodes) != len(FIELDS):
        raise ValueError('The source editable fields changed.')
    fields = []
    for node, (key, placeholder, value, face, size, transform) in zip(text_nodes, FIELDS):
        if ''.join(node.itertext()) != placeholder or node.get('transform') != transform:
            raise ValueError('Source field text or placement changed.')
        if node.get('font-family') != ('Inter-Regular, Inter' if face == 'regular' else 'Inter-ExtraBold, Inter') or node.get('font-size') != str(size) + 'px':
            raise ValueError('Source field typeface or size changed.')
        path, advance, weight = outline(value, fonts[face], size)
        attributes = {k: v for k, v in node.attrib.items() if k not in FONT_PROPERTIES}
        attributes['id'] = 'example-field-' + key
        group = ET.Element('{' + SVG + '}g', attributes)
        ET.SubElement(group, '{' + SVG + '}path', {'d': path})
        group.tail = node.tail
        parent = next(p for p in root.iter() if node in list(p))
        position = list(parent).index(node)
        parent.remove(node)
        parent.insert(position, group)
        fields.append({'field': key, 'value': value, 'fontMember': FONT_MEMBERS[face][0],
                       'fontSha256': sha(fonts[face]), 'fontWeight': weight, 'fontSize': size,
                       'transform': transform, 'advance': advance, 'outlineSha256': sha(path.encode())})
    if sha(canonical(fixed_tree(root))) != fixed_hash:
        raise ValueError('Fixed artwork changed.')
    if any(FONT_PROPERTIES & set(n.attrib) for n in root.iter()):
        raise ValueError('Unoutlined font properties remain.')
    output = ET.tostring(root, encoding='utf-8', xml_declaration=True) + b'\n'
    manifest = {'schemaVersion': 1, 'requirementIds': ['REQ-EU-GUARANTEE-LABEL'],
                'source': {'page': GARAN_URL, 'archiveSha256': ARCHIVES['garan'][0],
                           'member': 'GARAN Label_colour.svg', 'sha256': sha(source), 'bytes': len(source)},
                'fonts': {'release': INTER_URL, 'archiveSha256': ARCHIVES['inter'][0],
                          'licenseSha256': sha(license_text)},
                'tools': versions, 'fields': fields,
                'fixedArtwork': {'algorithm': 'resolved-presentation-tree-v1', 'sha256': fixed_hash,
                                 'qrPayload': 'https://europa.eu/youreurope/commercial-guarantee-durability'},
                'output': {'file': 'juniper-jw-01.svg', 'sha256': sha(output), 'bytes': len(output)},
                'reviewStatus': 'draft'}
    return {'source/garan-colour.svg': source, 'source/Inter-OFL.txt': license_text,
            'juniper-jw-01.svg': output, 'manifest.json': json.dumps(manifest, indent=2, ensure_ascii=False).encode() + b'\n'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--garan-archive', required=True, type=pathlib.Path)
    parser.add_argument('--inter-archive', required=True, type=pathlib.Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for path, data in prepare(args.garan_archive, args.inter_archive).items():
        target = HERE / path
        if args.check:
            if target.read_bytes() != data:
                raise ValueError('Prepared fixture differs: ' + path)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
    print('Verified producer example.' if args.check else 'Prepared producer example. Review remains required.')


if __name__ == '__main__':
    main()
