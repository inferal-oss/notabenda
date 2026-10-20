// @requirements REQ-PRODUCT-ORDER-CONFIRMATION
// @requirements REQ-EU-ORDER-CONFIRMATION
// @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-PAID-ORDER-ARCHIVES REQ-EU-ORDER-ACTION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
test('packed CF-only consumer imports the order backend, admin and declarations without frontend or runtime dependencies',async()=>{
 const root=fileURLToPath(new URL('../../..',import.meta.url)),folder=await mkdtemp(join(tmpdir(),'notabenda-orders-package-')),env={...process.env,npm_config_cache:join(folder,'cache'),npm_config_update_notifier:'false'};
 try{
  const packed=spawnSync('npm',['pack','--workspace','@notabenda/cloudflare','--json','--ignore-scripts','--pack-destination',folder],{cwd:root,env,encoding:'utf8'});assert.equal(packed.status,0,packed.stderr);const manifest=JSON.parse(packed.stdout)[0];assert.ok(manifest.files.some(f=>f.path==='dist/orders.js'));assert.ok(manifest.files.some(f=>f.path==='dist/order-review-style.js'));
  await writeFile(join(folder,'package.json'),JSON.stringify({name:'isolated-order-consumer',private:true,type:'module'}));
  const install=spawnSync('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund',join(folder,manifest.filename)],{cwd:folder,env,encoding:'utf8'});assert.equal(install.status,0,install.stderr);const pkg=JSON.parse(await readFile(join(folder,'node_modules/@notabenda/cloudflare/package.json'),'utf8'));assert.equal(pkg.dependencies,undefined);assert.equal(pkg.peerDependencies,undefined);
  const runtime=spawnSync(process.execPath,['--input-type=module','-e',"import {createAdminWorker} from '@notabenda/cloudflare';import {preparePaidOrderConfirmation,dispatchPaidOrderConfirmation} from '@notabenda/cloudflare/order-confirmations';if(typeof preparePaidOrderConfirmation!=='function'||typeof dispatchPaidOrderConfirmation!=='function')process.exit(1);import {paidOrderCheckoutRef,getPaidOrderCheckoutState,createPaidOrderStore} from '@notabenda/cloudflare/orders';const ref=await paidOrderCheckoutRef({siteId:'shop',scopeId:'checkout',checkoutId:'host-intent'});if(!/^[a-f0-9]{64}$/.test(ref)||typeof getPaidOrderCheckoutState!=='function'||typeof createPaidOrderStore!=='function'||(await createAdminWorker({authorize:()=>null}).fetch(new Request('https://example.test/admin/notabenda'),{})).status!==403)process.exit(1);"],{cwd:folder,encoding:'utf8'});assert.equal(runtime.status,0,runtime.stderr);
  await writeFile(join(folder,'consumer.ts'),`
import {createAdminWorker,createEvidenceLifecycle,type HistoryStorage,type LifecycleStorage} from '@notabenda/cloudflare';
import {archivePaidOrderAsset,archivePaidOrderReview,activatePaidOrderReview,admitPaidOrder,getPaidOrderAttempt,getPaidOrderCheckoutState,createPaidOrderStore,type PaidOrderReview,type PaidOrderRequest,type PaidOrderOutcome} from '@notabenda/cloudflare/orders';
import {readPaidOrderConfirmation,dispatchPaidOrderConfirmation,type OrderConfirmationArchive} from '@notabenda/cloudflare/order-confirmations';
declare const storage:HistoryStorage;declare const lifecycleStorage:LifecycleStorage;declare const review:PaidOrderReview;declare const request:PaidOrderRequest;
const context={siteId:'shop',scopeId:'checkout',checkoutId:'host-intent'};
archivePaidOrderReview(storage,review,context);activatePaidOrderReview(storage,{reviewId:review.reviewId,expectedRevision:0},context);
const outcome:Promise<PaidOrderOutcome>=admitPaidOrder(storage,request,context,{hostPrefix:'shop/stock/',async decide({get}){const available=await get<number>('lamp');return available?{status:'admit',writes:[{key:'lamp',value:available-1}]}:{status:'reject',reason:'unavailable'};}});
const confirmation:Promise<OrderConfirmationArchive|undefined>=readPaidOrderConfirmation(storage,context);
dispatchPaidOrderConfirmation(storage,context,{async deliver({lease}){const bytes:Uint8Array=lease.files[0]!.bytes;return {providerRef:'accepted-'+bytes.length};}});
getPaidOrderAttempt(storage,request,context);getPaidOrderCheckoutState(storage,context);
createAdminWorker({authorize:()=>({store:createPaidOrderStore(storage,context),allowOrderArchive:true,allowExport:false})});
createEvidenceLifecycle(lifecycleStorage,{family:'orders',siteId:'shop',scopeId:'checkout',streamId:'host-intent'});
// @ts-expect-error admission always requires an explicit local host decision
admitPaidOrder(storage,request,context,{hostPrefix:'shop/stock/'});
// @ts-expect-error received admission is separate from a payment result
const invalidOutcome:PaidOrderOutcome={...request,status:'paid'};
void [archivePaidOrderAsset,outcome,invalidOutcome];
`);
  const types=spawnSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--module','nodenext','--moduleResolution','nodenext','--target','es2022',join(folder,'consumer.ts')],{cwd:folder,encoding:'utf8'});assert.equal(types.status,0,types.stdout+types.stderr);
 }finally{await rm(folder,{recursive:true,force:true});}
});
