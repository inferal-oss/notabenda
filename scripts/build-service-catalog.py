#!/usr/bin/env python3
"""Build an offline, reproducible seed from pinned public data and curated identities."""
# @requirements REQ-PRODUCT-SERVICE-CATALOG
import csv,hashlib,json,pathlib,re,sys
root=pathlib.Path(__file__).resolve().parents[1]
def stable(namespace,value):return namespace+'-'+hashlib.sha256(value.encode()).hexdigest()[:16]
def clean(s):return re.sub(r'[\x00-\x1f\x7f-\x9f]',' ',s).strip()
revision='81813835edc9682113a4d95989358da5256d30c1'
sources=[dict(id='open-cookie-database',url='https://github.com/jkwakman/Open-Cookie-Database/tree/'+revision,revision=revision,checkedOn='2026-10-19',access='read',license='Apache-2.0',note='Imported metadata, not independently verified vendor facts or legal classifications. One upstream row without platform/controller is omitted from identities. See bundled catalog notices.')]
providers={};products={}
source_dir=root/'catalog/sources/open-cookie-database'
pinned=json.loads((source_dir/'source.json').read_text())
if pinned['revision']!=revision or hashlib.sha256((source_dir/'data.csv').read_bytes()).hexdigest()!=pinned['dataSha256'] or hashlib.sha256((source_dir/'LICENSE').read_bytes()).hexdigest()!=pinned['licenseSha256']:raise ValueError('Pinned source metadata/hash mismatch')
rows=list(csv.DictReader((source_dir/'data.csv').open()))
for row in rows:
 name=clean(row['Platform']);owner=clean(row['Data Controller']) or name
 if not name or not owner:continue  # Empty upstream rows are preserved in data.csv, not invented as providers.
 provider_id=stable('ocdb-provider',owner);product_id=stable('ocdb-product',name+'\0'+owner)
 providers.setdefault(provider_id,dict(id=provider_id,revision=revision,name=owner,aliases=[],sourceIds=['open-cookie-database'],review='unreviewed'))
 product=products.setdefault(product_id,dict(id=product_id,revision=revision,providerId=provider_id,name=name,aliases=[],description='Imported cookie/storage reference for '+name+'. Confirm the actual product, settings and site use.',categories=['storage-reference'],delivery=['browser'],sourceIds=['open-cookie-database'],review='unreviewed',identifiers=[],storageHints=[]))
 product['storageHints'].append(dict(sourceRowId=clean(row['ID']),name=clean(row['Cookie / Data Key name']),wildcard=row['Wildcard match']=='1',description=clean(row['Description']),reportedCategory=clean(row['Category']),retentionHint=clean(row['Retention period']),domainHint=clean(row['Domain'])))
curated=json.loads((root/'catalog/backend-providers.json').read_text())
sources+=curated['sources']
for provider in curated['providers']:
 if provider['id'] in providers:raise ValueError('Identity collision')
 providers[provider['id']]=provider
for product in curated['products']:
 if product['id'] in products:raise ValueError('Product collision')
 products[product['id']]=product
result=dict(schemaVersion=1,kind='notabenda-service-catalog',id='notabenda-reference',revision='2026-10-19.1',sources=sources,providers=sorted(providers.values(),key=lambda p:p['id']),products=sorted(products.values(),key=lambda p:p['id']))
output=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n'
path=root/'packages/notabenda/src/catalog-data.json'
if '--check' in sys.argv:
 if path.read_text()!=output:raise ValueError('Catalog seed is stale; run scripts/build-service-catalog.py')
else:path.write_text(output)
print(f"Catalog seed: {len(providers)} providers, {len(products)} products, {sum(len(p['storageHints']) for p in products.values())} imported storage hints; imported facts remain unreviewed.")
