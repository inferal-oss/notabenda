// @requirements REQ-EU-INTERESTS-DISCLOSURE
// @requirements REQ-PRODUCT-BUNDLE-BUDGET
import {build as bundle} from 'esbuild';
import { readFile } from 'node:fs/promises';
import { compileLegalDocuments,createConsentNotice,compileConsentRuntimeConfig } from 'notabenda/content';
import {renderChoicesPage} from './choices-page.mjs';

export function exampleConsentConfig(base) {
  const config = structuredClone(base);
  config.site.id = 'juniper-choices';
  const template = config.purposes[0];
  config.purposes = [
    { ...structuredClone(template), id: 'measurement', name: 'Measurement', description: 'Understand which features are used, using a local measurement service.', dataCategories: ['Synthetic demo event'], legalBasis: 'Explicit choice for a fictional optional service.', retention: 'Removed when you withdraw or clear this local demo.' },
    { ...structuredClone(template), id: 'suggestions', name: 'Suggestions', description: 'Remember your preferences to tailor suggestions in this browser.', dataCategories: ['Synthetic demo preference'], legalBasis: 'Explicit choice for a fictional optional service.', retention: 'Removed when you withdraw or clear this local demo.' },
  ];
  config.services = [
    { id: 'sample-measurements', name: 'Sample measurements', provider: 'Juniper Notes', location: 'This local example only', purposeIds: ['measurement'] },
    { id: 'sample-suggestions', name: 'Sample suggestions', provider: 'Juniper Notes', location: 'This local example only', purposeIds: ['suggestions'] },
  ];
  config.storage = config.services.map(service => ({ id: service.id, name: service.id, serviceId: service.id, type: 'localStorage', duration: 'Until withdrawal or browser clearing', classification: 'optional' }));
  config.consent = { purposes: config.purposes.map(p => ({ id:p.id, scope:'sample-1' })), services: config.services.map(s => ({ id:s.id, scope:'sample-1' })), grantLifetimeDays: 30, refusalLifetimeDays: 180, dismissalMinutes: 60 };
  for (const purpose of config.purposes) purpose.collection = { source:'direct', description:'A choice made locally in this fictional demonstration.', required:false, consequences:'The sample optional service stays off if you decline.' };
  config.purposes.push({ ...structuredClone(template), id:'remember-choices', name:'Remembering privacy choices', description:'Remember the local choices made in this fictional example.', dataCategories:['Purpose choices', 'Choice scope', 'Choice and expiry times'], retention:'Grants: 30 days. Refusals: 180 days. Dismissal: 60 minutes. These are sample operator settings, not regional legal defaults.', legalBasis:'Review the basis and applicable preference-storage exception for an actual deployment.', collection:{ source:'direct', description:'Your explicit local choice or notice dismissal.', required:false, consequences:'Without storage, optional services stay off and preferences cannot be remembered.' } });
  config.services.push({ id:'privacy-choices', name:'Privacy choices', provider:'Juniper Notes', location:'This browser only', purposeIds:['remember-choices'] });
  for (const [suffix, duration] of [['','30 days for grants; 180 days for refusals'],[':prompt','60 minutes']]) config.storage.push({ id:suffix ? 'prompt-memory' : 'choice-memory', name:`notabenda:choices:v1:${config.site.id}${suffix}`, serviceId:'privacy-choices', type:'localStorage', duration, classification:'necessary', necessityReason:'Retains an explicit privacy preference or temporary dismissal in this synthetic example; review applicability for actual use.' });
  return config;
}

export async function choiceFiles(base) {
  const config=exampleConsentConfig(base);
  const result = {};
  for (const prefix of ['', '/dark']) {
    const themed = structuredClone(config);
    for (const [kind, doc] of Object.entries(themed.documents)) doc.route = `${prefix}/choices/${kind}`;
    const build = compileLegalDocuments(themed, { mode: 'preview', stylesheetUrl: prefix ? '/assets/dark.css' : '/assets/notabenda.css' });
    Object.assign(result, Object.fromEntries(Object.entries(build.files).filter(([file]) => file.startsWith(`${prefix.slice(1)}${prefix ? '/' : ''}choices/`) || file.startsWith('artifacts/'))));
    result[`${prefix.slice(1)}${prefix ? '/' : ''}choices/site.json`] = JSON.stringify(compileConsentRuntimeConfig(themed,{mode:'preview',evidence:'local'}));
    result[`${prefix.slice(1)}${prefix ? '/' : ''}choices/index.html`] = renderChoicesPage(themed,{dark:!!prefix});
  }
  result['assets/choices-status.mjs']=await readFile(new URL('./choices-status.mjs',import.meta.url),'utf8');
  result['assets/choices-page.css']=await readFile(new URL('./choices-page.css',import.meta.url),'utf8');
  result['assets/consent.mjs'] = (await bundle({entryPoints:[new URL('./consent.mjs',import.meta.url).pathname],bundle:true,platform:'browser',format:'esm',target:'es2022',minify:true,write:false})).outputFiles[0].text;
  const recorded=structuredClone(config);recorded.site.id='juniper-recorded-choices';
  for(const item of recorded.storage)if(item.serviceId==='privacy-choices')item.name=item.name.replace('juniper-choices',recorded.site.id);
  const memory=recorded.purposes.find(p=>p.id==='remember-choices');memory.description='Remember the fictional choice and its server recording reference in this demonstration.';memory.dataCategories.push('Opaque host stream digest','Choice request identifier');recorded.services.find(s=>s.id==='privacy-choices').location='This browser and host-owned demonstration storage; locality depends on deployment.';memory.collection.description='An explicit choice in the protected fictional demonstration.';memory.retention='Local preference lifetimes as declared above. Server demonstration records have no automated deletion; production requires a reviewed retention policy.';
  const archive=compileLegalDocuments(recorded,{mode:'preview'});const notice=createConsentNotice(archive.artifact,{scopeId:'sample-recorded-choices'},{mode:'preview'});
  Object.assign(result,Object.fromEntries(Object.entries(archive.files).filter(([file])=>file.startsWith('artifacts/'))));
  result['recorded-choices/site.json']=JSON.stringify(archive.publicConfig);result['recorded-choices/notice.json']=JSON.stringify(notice);
  result['recorded-choices/index.html']=renderChoicesPage(archive.publicConfig,{notice});
  result['assets/demo-session.mjs']=await readFile(new URL('./demo-session.mjs',import.meta.url),'utf8');
  result['assets/recorded-consent.mjs']=await readFile(new URL('./recorded-consent.mjs',import.meta.url),'utf8');
  for (const file of ['purpose-disclosures.js','consent-information.js','grant-expiry-policy.js','terms-localization-policy.js','form-permission-localization-policy.js','collection-localization-policy.js','localization-policy.js','document-localization.js','localized-documents.js','service-runner.js','storage-exception-policy.js','paid-order.js','paid-order-policy.js','paid-order-action.js','paid-order-ui.js','guarantee-label.js','guarantee-notice-json.js','consent-engine.js','privacy-signal-policy.js','safe-links.js','contract-action.js','contract-action-policy.js','rights.js','rights-policy.js','discovery.js','discovery-capture.js','catalog-plain.js','catalog-reference.js','catalog-profile.js','catalog.js','catalog-browser.js','catalog-browser-policy.js','catalog-browser-capture.js','catalog-browser-ui.js','discovery-ui.js','index.js','config.js','google-basic-policy.js','google-basic.js','scope-guard-policy.js','scope-guards.js','prompt-policy.js','documents.js','service-inventory.js','consent.js','controls.js','terms.js','consent-notice.js','consent-evidence.js','embeds.js','privacy-signals.js','processing.js','processing-choices.js','storage-cleanup.js','collection.js','form-permission.js','form-permission-journal.js']) result[`assets/runtime/${file}`] = await readFile(new URL(`../../packages/notabenda/dist/${file}`, import.meta.url), 'utf8');
  for (const id of ['sample-measurements','sample-suggestions']) result[`demo/${id}.svg`] = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><title>Synthetic optional request</title></svg>';
  return result;
}
