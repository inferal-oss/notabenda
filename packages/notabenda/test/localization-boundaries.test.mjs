// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-BUNDLE-BUDGET
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeSiteLocalization} from '../dist/document-localization.js';
import {normalizeTermsLocalization} from '../dist/terms-localization-policy.js';
import {normalizeFormPermissionLocalization} from '../dist/form-permission-localization-policy.js';
import {normalizeCollectionLocalization} from '../dist/collection-localization-policy.js';
import {normalizeTermsLocalization as cfTerms} from '../../notabenda-cf/dist/terms-localization-policy.js';
import {normalizeFormPermissionLocalization as cfPermission} from '../../notabenda-cf/dist/form-permission-localization-policy.js';

const load=async name=>JSON.parse(await readFile(new URL('../../../examples/localization/'+name,import.meta.url),'utf8'));
const site=await load('messages.json');site.reviewStatus='reviewed';
site.formPermission=await load('form-messages.json');site.collection=await load('collection-messages.json');
const metadata={schemaVersion:1,locale:site.locale,direction:site.direction,revision:site.revision,reviewStatus:'reviewed'};
const shortFields=['withdrawalHelp','checkSaved','checkAvailability','retryPermission','retryWithdrawal'];
const surfaces=[
 {key:'terms',limit:8192,parsers:[normalizeTermsLocalization,cfTerms]},
 {key:'formPermission',limit:16384,parsers:[normalizeFormPermissionLocalization,cfPermission]},
 {key:'collection',limit:16384,parsers:[normalizeCollectionLocalization]},
];
const bytes=value=>Buffer.byteLength(typeof value==='string'?value:JSON.stringify(value),'utf8');
const fieldsWithRoom=(key,body)=>Object.keys(body).filter(field=>!field.endsWith('Label')&&!(key==='formPermission'&&shortFields.includes(field)));
/** Construct a payload at a public wire-size boundary, including JSON escaping. */
function atLimit(key,limit){
 const value={...metadata,[key]:structuredClone(site[key])};
 for(const field of fieldsWithRoom(key,value[key])){
  while(bytes(value)+6<=limit&&bytes(value[key][field])+4<=2000)value[key][field]+='é"\\';
  value[key][field]+='x'.repeat(Math.min(limit-bytes(value),2000-bytes(value[key][field])));
  if(bytes(value)===limit)break;
 }
 assert.equal(bytes(value),limit,'fixture reaches the serialized byte limit');
 assert.ok(JSON.stringify(value).includes('é\\"\\\\'),'fixture includes multibyte and escaped text');
 return value;
}
for(const {key,limit,parsers} of surfaces){
 test(`${key}: exact serialized boundary matches standalone, site and backend validation`,()=>{
  const value=atLimit(key,limit),before=JSON.stringify(value);
  for(const parse of parsers){
   const result=parse(value);assert.equal(bytes(result),limit);
   assert.deepEqual(Object.keys(result),['schemaVersion','locale','direction','revision','reviewStatus',key]);
   assert.deepEqual(result[key],value[key]);
  }
  assert.deepEqual(normalizeSiteLocalization({...site,[key]:value[key]})[key],value[key]);
  assert.equal(JSON.stringify(value),before,'validation does not mutate supplied copy');
  const over=structuredClone(value),field=fieldsWithRoom(key,over[key]).find(field=>bytes(over[key][field])<2000);
  assert.ok(field);over[key][field]+='x';assert.equal(bytes(over),limit+1);
  for(const parse of parsers)assert.throws(()=>parse(over),/Invalid (terms|form permission|collection) localization/u);
  assert.throws(()=>normalizeSiteLocalization({...site,[key]:over[key]}),/Invalid (terms|form permission|collection) localization/u);
 });

 test(`${key}: metadata and body accept only own data fields, without reading getters`,()=>{
  const valid={...metadata,[key]:structuredClone(site[key])};
  for(const parse of parsers){
   for(const extra of [Symbol('extra'),'extra']){
    const value=structuredClone(valid);Object.defineProperty(value,extra,{value:true});assert.throws(()=>parse(value));
   }
   for(const target of ['outer','body']){
    let reads=0;const value=structuredClone(valid),record=target==='outer'?value:value[key],field=Object.keys(record)[0];
    Object.defineProperty(record,field,{enumerable:true,get(){reads++;throw Error('Must not read');}});
    assert.throws(()=>parse(value));assert.equal(reads,0);
   }
   assert.throws(()=>parse(Object.create(valid)));
   assert.throws(()=>parse({...valid,locale:'pt-br'}));
   assert.throws(()=>parse(valid,{locale:'en'}));
   const draft={...valid,reviewStatus:'draft'};assert.throws(()=>parse(draft));assert.equal(parse(draft,{allowPreview:true}).reviewStatus,'draft');
  }
 });
}
test('form action copy has a 120-byte UTF-8 boundary, independently of the descriptor cap',()=>{
 for(const field of shortFields){
  const value={...metadata,formPermission:{...site.formPermission,[field]:'é'.repeat(60)}};
  for(const parse of [normalizeFormPermissionLocalization,cfPermission])assert.equal(parse(value).formPermission[field],value.formPermission[field]);
  assert.equal(normalizeSiteLocalization({...site,formPermission:value.formPermission}).formPermission[field],value.formPermission[field]);
  value.formPermission[field]+='x';
  for(const parse of [normalizeFormPermissionLocalization,cfPermission])assert.throws(()=>parse(value),/Invalid form permission localization/u);
  assert.throws(()=>normalizeSiteLocalization({...site,formPermission:value.formPermission}),/Invalid form permission localization/u);
 }
});
test('full-site missing-body diagnostics retain each selected interface context',()=>{
 const errors={terms:'Localized acceptance needs localization.terms messages.',formPermission:'Localized form permissions need localization.formPermission messages.',collection:'Localized collection notices need localization.collection messages.'};
 for(const [key,message] of Object.entries(errors))for(const value of [null,false,0,''])assert.throws(()=>normalizeSiteLocalization({...site,[key]:value}),{message});
});

// Optional dictionaries must remain own data fields even when dispatch is shared.
test('full-site optional dictionary dispatch rejects accessors, inherited bodies and undeclared fields',()=>{
 const keys=['generatedDocuments','contractActions','embeds','indirectCollection','serviceDirectory','processingChoices','storageExceptions','rights','collection','formPermission','terms'];
 for(const key of keys){
  let reads=0;const input=structuredClone(site);
  Object.defineProperty(input,key,{enumerable:true,get(){reads++;throw Error('Do not read dictionary getters');}});
  assert.throws(()=>normalizeSiteLocalization(input),/Invalid site localization fields/u);assert.equal(reads,0,key);
 }
 for(const key of [Symbol('unknown'),'unknown']){
  const input=structuredClone(site);Object.defineProperty(input,key,{value:{},enumerable:false});
  assert.throws(()=>normalizeSiteLocalization(input),/Invalid site localization fields/u);
 }
 const inherited=Object.create(site);assert.throws(()=>normalizeSiteLocalization(inherited),/Invalid site localization fields/u);
 for(const key of keys){
  const input=structuredClone(site);input[key]={};assert.throws(()=>normalizeSiteLocalization(input),undefined,key);
 }
});
