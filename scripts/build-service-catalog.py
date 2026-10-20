#!/usr/bin/env python3
# @requirements REQ-PRODUCT-SERVICE-PROFILES
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
browser=json.loads((root/'catalog/browser-providers.json').read_text())
sources+=browser['sources']
for product in browser['products']:
 if product['id'] in products:raise ValueError('Browser product collision')
 products[product['id']]=product
for product_id,source_ids in browser['productSourceAdditions'].items():
 products[product_id]['revision']='2026-10-19.2'
 for source_id in source_ids:
  if source_id not in products[product_id]['sourceIds']:products[product_id]['sourceIds'].append(source_id)
profiles=json.loads((root/'catalog/product-profiles.json').read_text())
if profiles['schemaVersion']!=1 or set(profiles['productRevisions'])!=set(profiles['profiles']):raise ValueError('Every profile needs an explicit product revision')
sources+=profiles['sources']
requirements={r['id'] for r in json.loads((root/'regulatory/catalog.json').read_text())['requirements']}
for product_id,profile in profiles['profiles'].items():
 if product_id not in products:raise ValueError('Unknown profile product')
 for prompt in profile['reviewPrompts']:
  if not set(prompt['requirementIds'])<=requirements:raise ValueError('Unknown profile review requirement')
 product=products[product_id];product['profile']=profile;product['revision']=profiles['productRevisions'][product_id]
 for source_id in [s for group in ('facts','links','reviewPrompts') for item in profile[group] for s in item['sourceIds']]:
  if source_id not in product['sourceIds']:product['sourceIds'].append(source_id)
result=dict(schemaVersion=1,kind='notabenda-service-catalog',id='notabenda-reference',revision=profiles['revision'],sources=sources,providers=sorted(providers.values(),key=lambda p:p['id']),products=sorted(products.values(),key=lambda p:p['id']))
output=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n'
path=root/'packages/notabenda/src/catalog-data.json'
def emit(path,output):
 if '--check' in sys.argv:
  if path.read_text()!=output:raise ValueError('Catalog seed is stale; run scripts/build-service-catalog.py')
 else:path.write_text(output)
emit(path,output)
# Browser rules retain a compact exact reference snapshot, not the full imported database.
rule_set=json.loads((root/'catalog/browser-rules.json').read_text())
product_ids={r['productId'] for r in rule_set['rules']}
selected=[dict(p,identifiers=[],storageHints=[]) for p in result['products'] if p['id'] in product_ids]
provider_ids={p['providerId'] for p in selected}
selected_providers=[p for p in result['providers'] if p['id'] in provider_ids]
source_ids={i for r in rule_set['rules'] for i in r['sourceIds']}|{i for p in selected+selected_providers for i in p['sourceIds']}
rule_set['catalog']=dict(result,products=selected,providers=selected_providers,sources=[s for s in sources if s['id'] in source_ids])
emit(root/'packages/notabenda/src/catalog-browser-data.json',json.dumps(rule_set,ensure_ascii=False,separators=(',',':'))+'\n')
print(f"Catalog seed: {len(providers)} providers, {len(products)} products, {sum(len(p['storageHints']) for p in products.values())} imported storage hints; imported facts remain unreviewed.")
