// @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION
import {localizedIndirectScenario} from '../../../examples/localization/indirect-build.mjs';
// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION
import {localizedServicesConfig} from '../../../examples/localization/services-build.mjs';
// @requirements REQ-PRODUCT-TERMS-ADAPTERS
// @requirements REQ-EU-ORDER-ACTION
// @requirements REQ-EU-GUARANTEE-LABEL
// @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE
// @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE
// @requirements REQ-PRODUCT-SERVICE-CATALOG
// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-COLLECTION-NOTICE
// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-PACKAGE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rm,symlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {compileLegalDocuments,createCollectionNotice,createIndirectCollectionNotice} from '@notabenda/core/content';
import {fixture} from './helpers.mjs';
import {paidOrderFiles} from '../../../examples/orders/build.mjs';
import {buildDurabilityGuaranteeLabel} from '@notabenda/authoring/guarantees';
import {buildLegalGuaranteeNotice} from '@notabenda/core/guarantees/content';

test('packed Astro components compile in an isolated consumer, escape supplied content and enforce explicit draft preview',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'notabenda-astro-package-'));const root=fileURLToPath(new URL('../../..',import.meta.url));
  const env={...process.env,...(existsSync(join(root,'.local/npm-cache'))?{npm_config_cache:join(root,'.local/npm-cache')}:{ }),ASTRO_TELEMETRY_DISABLED:'1'};
  try {
    const packed=spawnSync('npm',['pack','--workspace','@notabenda/core','--json','--ignore-scripts','--pack-destination',cwd],{cwd:root,encoding:'utf8',env});assert.equal(packed.status,0,packed.stderr);const manifest=JSON.parse(packed.stdout)[0];
    for(const path of ['dist/astro/ServiceDirectory.astro','dist/astro/FormPermissionField.astro','dist/astro/CollectionNotice.astro','dist/astro/LegalDocument.astro','dist/astro/LegalLinks.astro','dist/astro/ConsentControls.astro','dist/astro/PreferencesButton.astro','dist/astro-client.d.ts'])assert.ok(manifest.files.some(f=>f.path===path),path);
    await writeFile(join(cwd,'package.json'),'{"private":true,"type":"module"}');
    const installed=spawnSync('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund',join(cwd,manifest.filename)],{cwd,encoding:'utf8',env});assert.equal(installed.status,0,installed.stderr);
    await assert.rejects(readFile(join(cwd,'node_modules/react/package.json')),error=>error.code==='ENOENT');
    await assert.rejects(readFile(join(cwd,'node_modules/astro/package.json')),error=>error.code==='ENOENT');
    // Reuse the pinned framework toolchain, as consumer type tests reuse TypeScript. Core comes only from the tarball.
    await symlink(join(root,'node_modules/astro'),join(cwd,'node_modules/astro'),'dir');
    await mkdir(join(cwd,'src/pages'),{recursive:true});
    const config=await fixture({reviewed:true});config.documents.terms.sections[0].paragraphs=['Literal <script>alert("fictional")</script> content.'];
    await writeFile(join(cwd,'src/site.json'),JSON.stringify(config));
    const pt=localizedServicesConfig(config);pt.localization.reviewStatus='reviewed';for(const d of Object.values(pt.documents))d.review.status='reviewed';await writeFile(join(cwd,'src/services-pt.json'),JSON.stringify(pt));await writeFile(join(cwd,'src/pages/services-pt.astro'),"---\nimport ServiceDirectory from '@notabenda/core/astro/ServiceDirectory.astro';\nimport config from '../services-pt.json';\n---\n<html lang=\"pt-BR\"><body><ServiceDirectory config={config} idPrefix=\"services-pt\" /></body></html>");
    const notice=createCollectionNotice(compileLegalDocuments(config).artifact,{scopeId:'contact',purposeIds:['enquiries'],reviewStatus:'reviewed',wording:{title:'About your enquiry',intro:'A fictional form context.'}});await writeFile(join(cwd,'src/notice.json'),JSON.stringify(notice));
    const indirectConfig=structuredClone(config);indirectConfig.purposes[0].collection.source='indirect';
    const indirect=createIndirectCollectionNotice(compileLegalDocuments(indirectConfig).artifact,{profile:'nz-ipp3a',scopeId:'referral',phase:'advance',reviewStatus:'reviewed',wording:{title:'Partner referral',intro:'Before a partner refers an enquiry.'},collections:[{purposeId:'enquiries',dataCategories:[indirectConfig.purposes[0].dataCategories[0]],sourceDescription:'A partner studio.',authority:{kind:'not-relied-on'}}],recipientStatement:'Our enquiries team.',accessCorrection:{statement:'You can request access or correction.',url:'mailto:privacy@example.test'}});await writeFile(join(cwd,'src/indirect.json'),JSON.stringify(indirect));
    const ptIndirect=localizedIndirectScenario(config);ptIndirect.config.localization.reviewStatus='reviewed';for(const d of Object.values(ptIndirect.config.documents))d.review.status='reviewed';ptIndirect.settings.reviewStatus='reviewed';const ptIndirectNotice=createIndirectCollectionNotice(compileLegalDocuments(ptIndirect.config).artifact,ptIndirect.settings);await writeFile(join(cwd,'src/indirect-pt.json'),JSON.stringify(ptIndirectNotice));await writeFile(join(cwd,'src/pages/indirect-pt.astro'),"---\nimport IndirectCollectionNotice from '@notabenda/core/astro/IndirectCollectionNotice.astro';\nimport notice from '../indirect-pt.json';\n---\n<html lang=\"pt-BR\"><body><IndirectCollectionNotice notice={notice} idPrefix=\"referral-pt\" /></body></html>");
    const guarantee=await buildLegalGuaranteeNotice({language:'en',reviewStatus:'reviewed'});await writeFile(join(cwd,'src/guarantee.json'),JSON.stringify(guarantee.notice));
    const label=buildDurabilityGuaranteeLabel({product:{id:'one',name:'Literal <script>product</script>'},producer:{brand:'Example brand',model:'One'},durationYears:5,qualification:{offeredByProducer:true,noAdditionalCost:true,coversEntireGood:true,informationProvidedToTrader:true},reviewStatus:'reviewed',locale:'en'},Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#ffffff" width="100" height="100"/></svg>')).label;await writeFile(join(cwd,'src/label.json'),JSON.stringify(label));
    const orderFiles=await paidOrderFiles(),orderTemplate=JSON.parse(orderFiles['orders/conditional/template.json']),{createPaidOrderReview}=await import('@notabenda/authoring/orders');const orderReview=createPaidOrderReview(orderTemplate.definition,{quoteId:'packed',revision:'1',contextRef:'a'.repeat(64),definitionId:orderTemplate.definition.definitionId,issuedAt:'2026-10-19T00:00:00.000Z',expiresAt:'2026-10-19T00:15:00.000Z',lines:orderTemplate.lines,pricing:orderTemplate.pricing},{},{allowPreview:true});await writeFile(join(cwd,'src/order.json'),JSON.stringify(orderReview));
    const page=`---\nimport PaidOrderReview from '@notabenda/core/astro/PaidOrderReview.astro';\nimport orderReview from '../order.json';\nimport TermsAcceptance from '@notabenda/core/astro/TermsAcceptance.astro';\nimport FormPermissionField from '@notabenda/core/astro/FormPermissionField.astro';\nimport CollectionNotice from '@notabenda/core/astro/CollectionNotice.astro';\nimport IndirectCollectionNotice from '@notabenda/core/astro/IndirectCollectionNotice.astro';\nimport indirect from '../indirect.json';\nimport LegalGuaranteeNotice from '@notabenda/core/astro/LegalGuaranteeNotice.astro';\nimport guarantee from '../guarantee.json';\nimport DurabilityGuaranteeLabel from '@notabenda/core/astro/DurabilityGuaranteeLabel.astro';\nimport label from '../label.json';\nimport notice from '../notice.json';\nimport LegalDocument from '@notabenda/core/astro/LegalDocument.astro';\nimport LegalLinks from '@notabenda/core/astro/LegalLinks.astro';\nimport ServiceDirectory from '@notabenda/core/astro/ServiceDirectory.astro';\nimport ConsentControls from '@notabenda/core/astro/ConsentControls.astro';\nimport PreferencesButton from '@notabenda/core/astro/PreferencesButton.astro';\nimport config from '../site.json';\n---\n<html><body><PaidOrderReview review={orderReview} idPrefix="order" allowPreview={true}/><DurabilityGuaranteeLabel label={label} idPrefix="producer"/><LegalGuaranteeNotice notice={guarantee} idPrefix="guarantee"/><IndirectCollectionNotice notice={indirect} idPrefix="referral"/><TermsAcceptance id="signup" offerId={notice.noticeId} contextKey="operation-one"><p>Read the terms below.</p></TermsAcceptance><FormPermissionField id="email-updates" offerId={notice.noticeId}><p>Contact our privacy team for help.</p></FormPermissionField><CollectionNotice notice={notice} idPrefix="contact-privacy"/><LegalDocument config={config} kind="terms" /><LegalLinks config={config}/><ServiceDirectory config={config} idPrefix="services"/><ConsentControls/><PreferencesButton/></body></html>`;
    await writeFile(join(cwd,'src/pages/index.astro'),page);
    const build=()=>spawnSync(process.execPath,[join(cwd,'node_modules/astro/bin/astro.mjs'),'build','--root',cwd],{cwd,encoding:'utf8',env});
    const first=build();assert.equal(first.status,0,first.stdout+first.stderr);
    const ptIndirectHtml=await readFile(join(cwd,'dist/indirect-pt/index.html'),'utf8');assert.match(ptIndirectHtml,/lang="pt-BR" dir="ltr"/u);assert.match(ptIndirectHtml,/Destinatários previstos/u);assert.match(ptIndirectHtml,/Coletamos informações sobre você de outra fonte/u);assert.doesNotMatch(ptIndirectHtml,/Intended recipients|We have collected|<script/u);
    const ptHtml=await readFile(join(cwd,'dist/services-pt/index.html'),'utf8');assert.match(ptHtml,/lang="pt-BR" dir="ltr"/u);assert.match(ptHtml,/Os serviços por trás deste site/u);assert.match(ptHtml,/Dados e armazenamento/u);assert.doesNotMatch(ptHtml,/Processing location|Data &amp; storage details|<script/u);
    const html=await readFile(join(cwd,'dist/index.html'),'utf8');assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script/);assert.match(html,/data-collection-notice-id=/);assert.match(html,/data-indirect-notice-id=/);assert.match(html,/data-guarantee-notice-id=/);assert.match(html,/data-order-review=/);assert.match(html,/€0.00/);assert.match(html,/data-guarantee-label-id=/);assert.match(html,/data-product-id="one"/);assert.match(html,/We plan to collect/);assert.match(html,/data-service-directory="services"/);assert.match(html,/id="contact-privacy-summary"/);assert.match(html,/data-notabenda-terms="signup"/);assert.match(html,/data-notabenda-terms-context="operation-one"/);assert.match(html,/Read the terms below/);assert.match(html,/data-notabenda-form-permission="email-updates"/);assert.match(html,/data-notabenda-permission-fallback/);assert.match(html,/Contact our privacy team/);assert.doesNotMatch(html,/type="checkbox"/);assert.match(html,/data-notabenda-controls/);assert.match(html,/data-notabenda-preferences[^>]*hidden/);
    const imported=spawnSync(process.execPath,['--input-type=module','-e',"import {mountAstroFormPermission,mountAstroTermsAcceptance} from '@notabenda/core/astro/client';if(typeof mountAstroFormPermission!=='function'||typeof mountAstroTermsAcceptance!=='function')process.exit(1)"],{cwd,encoding:'utf8'});assert.equal(imported.status,0,imported.stderr);
    config.documents.terms.review.status='draft';await writeFile(join(cwd,'src/site.json'),JSON.stringify(config));const rejected=build();assert.notEqual(rejected.status,0);assert.match(rejected.stdout+rejected.stderr,/reviewed-content declaration/);
    await writeFile(join(cwd,'src/pages/index.astro'),page.replace('kind="terms"','kind="terms" mode="preview"').replace('idPrefix="services"','idPrefix="services" mode="preview"'));const preview=build();assert.equal(preview.status,0,preview.stdout+preview.stderr);assert.match(await readFile(join(cwd,'dist/index.html'),'utf8'),/Draft — for review/);
  }finally{await rm(cwd,{recursive:true,force:true});}
});
