// @requirements REQ-PRODUCT-CONFIG REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-BUNDLE-BUDGET
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toPublicConfig,validateSiteConfig} from '@notabenda/core';
import {localizedExampleConfig} from '../../../examples/localization/config.mjs';
import {fixture} from './helpers.mjs';

async function configured(){
 const config=localizedExampleConfig(await fixture());
 config.localization.reviewStatus='reviewed';
 for(const document of Object.values(config.documents))document.review.status='reviewed';
 return config;
}

for(const mode of ['preview','production']){
 test(`${mode}: public projection rejects a replacement policy supplied after validation`,async()=>{
  const config=await configured(),valid=config.localization,invalid=structuredClone(valid);
  delete invalid.consent.title;
  let replaced=false;
  Object.defineProperty(config,'localization',{enumerable:true,get(){return replaced?invalid:valid;}});
  const document=config.documents.privacy,title=document.title;
  Object.defineProperty(document,'title',{enumerable:true,get(){replaced=true;return title;}});

  // Document checks happen after localization checks. A completed validation is
  // insufficient proof that a later read will return that same valid policy.
  assert.equal(validateSiteConfig(config,{mode}).valid,true);
  assert.equal(replaced,true);
  replaced=false;
  assert.throws(()=>toPublicConfig(config,{mode}),/Invalid localization/u);
  assert.equal(replaced,true);
 });

 test(`${mode}: public projection rejects later mutations even when policy identity is unchanged`,async()=>{
  const config=await configured(),policy=config.localization,wording=policy.consent.title;
  const document=config.documents.privacy,title=document.title;
  Object.defineProperty(document,'title',{enumerable:true,get(){delete policy.consent.title;return title;}});

  assert.equal(validateSiteConfig(config,{mode}).valid,true);
  assert.equal(config.localization,policy);
  assert.equal(Object.hasOwn(policy.consent,'title'),false);
  policy.consent.title=wording;
  assert.throws(()=>toPublicConfig(config,{mode}),/Invalid localization/u);
  assert.equal(config.localization,policy);
  assert.equal(Object.hasOwn(policy.consent,'title'),false);
 });
}
