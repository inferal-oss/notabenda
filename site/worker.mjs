// @requirements REQ-PRODUCT-CONTRACT-ACTIONS
import {seedOrderConfirmations} from './order-confirmation-seed.mjs';
import {orderDemoAdmin} from './order-demo-admin.mjs';
import {serveOrderDemo,hasOrderDemoAttempt} from './order-demo.mjs';
import {registerContractActionDefinition,recordContractDeclaration,createContractDeclarationStore,ContractActionRecordError} from 'notabenda-cf';
import {contractContext} from './contract-context.mjs';
import {seedContractDeclarations} from './contract-seed.mjs';
// @requirements REQ-PRODUCT-FORM-PERMISSIONS
import {registerFormPermissionOffer,setActiveFormPermissionOffer,getFormPermissionState,recordFormPermission,createFormPermissionStore,FormPermissionRecordError} from 'notabenda-cf';
import {seedFormPermissionJourneys} from './permission-seed.mjs';
import {permissionContext} from './permission-context.mjs';
// @requirements REQ-PRODUCT-DEMO-WORKSPACE
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
// @requirements REQ-PRODUCT-CF-HOST
import { EvidenceLifecycleError, createAdminWorker, createDocumentHistory, createDurableObjectStore, createTermsAcceptanceStore, createConsentEvidenceStore, recordLegalRelease, registerTermsOffer, setActiveTermsOffer, recordTermsAcceptance, TermsRecordError } from 'notabenda-cf';
import {adminPresentation} from './admin-presentation.mjs';
import { seedConsentExample } from '../examples/consent-evidence.mjs';
import {seedEvidenceLifecycle,lifecycleDemoPrefix} from '../examples/lifecycle.mjs';
import data from './dist/server-data.json' with {type:'json'};
import {seedDemoWorkspace} from './demo-seed.mjs';
import {decorateDemoAdmin,demoHome} from './demo-presentation.mjs';
import { canonicalRequest, hostAuthorization, protectedResponse, readDemoRequest, serveHost } from './host.mjs';
import {registerProcessingNotice,recordProcessingRestriction,getProcessingHead,createProcessingRestrictionStore,ProcessingRecordError} from 'notabenda-cf';
import {registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead,ConsentRecordError} from 'notabenda-cf';

export default {fetch:serveHost};

// One host-owned SQLite DO. No browser-supplied namespace, object or tenant selectors.
export class EvidenceWorkspace {
  get adminBasePath(){return '/backoffice';}
  authorize(request){return hostAuthorization(request,this.env);}
  contextId(value){return value;}
  constructor(state, env) { this.state=state; this.env=env; }
  async initialize() {
    if(this.ready) return this.ready;
    this.ready = this.state.blockConcurrencyWhile(async()=>{
      for(const release of data.releases) await recordLegalRelease(this.state.storage,release.artifact,release.metadata);
      for(const {offer} of data.agreements) await registerTermsOffer(this.state.storage,offer,{siteId:offer.siteId,allowPreview:true});
      await recordLegalRelease(this.state.storage,data.processing.artifact);
      await registerProcessingNotice(this.state.storage,data.processing.notice,{siteId:data.processing.notice.siteId,allowPreview:true});
      await recordLegalRelease(this.state.storage,data.formPermissions.artifact);
      await registerFormPermissionOffer(this.state.storage,data.formPermissions.offer,{siteId:data.formPermissions.offer.siteId,allowPreview:true});
      await recordLegalRelease(this.state.storage,data.localizedFormPermissions.artifact);
      await registerFormPermissionOffer(this.state.storage,data.localizedFormPermissions.offer,{siteId:data.localizedFormPermissions.offer.siteId,allowPreview:true});
      await recordLegalRelease(this.state.storage,data.contractActions.artifact);
      for(const definition of Object.values(data.contractActions.definitions))await registerContractActionDefinition(this.state.storage,definition,{siteId:definition.siteId,allowPreview:true});
      const marker = 'host/demo-bootstrap/' + data.version;
      if(!await this.state.storage.get(marker)) {
        for(const {offer} of data.agreements) await setActiveTermsOffer(this.state.storage,offer.offerId,{siteId:offer.siteId,scopeId:offer.scopeId,allowPreview:true});
        await setActiveFormPermissionOffer(this.state.storage,data.formPermissions.offer.offerId,{siteId:data.formPermissions.offer.siteId,permissionId:data.formPermissions.offer.permissionId,allowPreview:true});
        await setActiveFormPermissionOffer(this.state.storage,data.localizedFormPermissions.offer.offerId,{siteId:data.localizedFormPermissions.offer.siteId,permissionId:data.localizedFormPermissions.offer.permissionId,allowPreview:true});
        // These are explicitly synthetic examples, never visitor reports.
        for(const record of data.evidence) await this.state.storage.put('host/synthetic-evidence/'+record.id,record.data);
        await seedConsentExample(this.state.storage,data.consent);
        await recordLegalRelease(this.state.storage,data.recordedConsent.artifact);
        await registerConsentNotice(this.state.storage,data.recordedConsent.notice,{siteId:data.recordedConsent.notice.siteId,allowPreview:true});
        await setActiveConsentNotice(this.state.storage,data.recordedConsent.notice.noticeId,{siteId:data.recordedConsent.notice.siteId,scopeId:data.recordedConsent.notice.scopeId,allowPreview:true});
        await this.state.storage.put(marker,{version:data.version});
      }
      await seedEvidenceLifecycle(this.state.storage,data);
    });
    try { await this.ready; } catch(error) { this.ready=undefined; throw error; }
  }
  async fetch(input) {
    const request = canonicalRequest(input); if(!request) return protectedResponse(new Response('Invalid path.',{status:400}));
    const denied=await this.authorize(request); if(denied) return denied;
    try {
      const path = new URL(request.url).pathname;
      const contractRoute=/^\/demo\/contracts\/(withdrawal|cancellation)$/u.exec(path)?.[1];
      if(contractRoute){
        const body=await readDemoRequest(request);
        // Demo admission only: no live delivery service or arbitrary real email recipient.
        if(typeof body?.fields?.email!=='string'||!/@[^@\s]+\.test$/u.test(body.fields.email))return protectedResponse(Response.json({code:'invalid-request'},{status:400}));
        await this.initialize();const definition=data.contractActions.definitions[contractRoute];
        return protectedResponse(Response.json(await recordContractDeclaration(this.state.storage,body,contractContext(definition,this.generation))));
      }
      if(/^\/demo\/permissions\/(?:pt\/)?(?:state|record)$/u.test(path)) {
        const body=path.endsWith('/record')?await readDemoRequest(request):undefined;
        if(path.endsWith('/state')&&!['GET','HEAD'].includes(request.method))return protectedResponse(new Response('Method not allowed.',{status:405}));
        await this.initialize();const offer=path.startsWith('/demo/permissions/pt/')?data.localizedFormPermissions.offer:data.formPermissions.offer;
        const context=permissionContext(offer,this.generation);
        const result=path.endsWith('/state')?await getFormPermissionState(this.state.storage,context):await recordFormPermission(this.state.storage,body,context);
        return protectedResponse(Response.json(result));
      }
      if(path==='/demo/processing/head'||path==='/demo/processing/record') {
        const body=path.endsWith('/record')?await readDemoRequest(request):undefined;
        if(path.endsWith('/head')&&!['GET','HEAD'].includes(request.method))return protectedResponse(new Response('Method not allowed.',{status:405}));
        await this.initialize();const notice=data.processing.notice;
        const context={siteId:notice.siteId,scopeId:notice.scopeId,streamId:this.contextId('synthetic-admin-processing-demo'),provenance:'explicit-opt-out',allowPreview:true};
        const result=path.endsWith('/head')?await getProcessingHead(this.state.storage,context):await recordProcessingRestriction(this.state.storage,body,context);
        return protectedResponse(Response.json(result));
      }
      if(path==='/demo/choices/head'||path==='/demo/choices/record') {
        const body=path.endsWith('/record')?await readDemoRequest(request):undefined;
        if(path.endsWith('/head')&&!['GET','HEAD'].includes(request.method))return protectedResponse(new Response('Method not allowed.',{status:405}));
        await this.initialize();
        const notice=data.recordedConsent.notice;const scope={siteId:notice.siteId,scopeId:notice.scopeId,streamId:this.contextId('synthetic-admin-cookie-demo'),allowPreview:true};
        const result=path.endsWith('/head')?await getConsentHead(this.state.storage,scope):await recordConsentChoice(this.state.storage,body,scope);
        return protectedResponse(Response.json(result));
      }
      if(/^\/demo\/agreements\/(?:light|dark|pt)$/u.test(path)) {
        const body = await readDemoRequest(request); // Validate origin/size before storage initialization.
        await this.initialize();
        const theme = path.split('/').at(-1); const {offer} = data.agreements.find(entry=>entry.theme === theme);
        const receipt=await recordTermsAcceptance(this.state.storage,body,{siteId:offer.siteId,scopeId:offer.scopeId,subjectId:this.contextId('synthetic-admin-demo'),operationId:this.contextId(`synthetic-${theme}-operation`),allowPreview:true});
        return protectedResponse(Response.json(receipt));
      }
      if(!['GET','HEAD'].includes(request.method)) return protectedResponse(new Response('Method not allowed.',{status:405,headers:{Allow:'GET, HEAD'}}));
      const sections = {
        history:()=>createDocumentHistory(this.state.storage),
        evidence:()=>createDurableObjectStore(this.state.storage,{prefix:'host/synthetic-evidence/'}),
        contracts:()=>createContractDeclarationStore(this.state.storage,{siteId:data.contractActions.artifact.manifest.siteId,allowPreview:true}),
        permissions:()=>createFormPermissionStore(this.state.storage,{siteId:data.formPermissions.offer.siteId,allowPreview:true}),
        agreements:()=>createTermsAcceptanceStore(this.state.storage,{siteId:'juniper-agreement',allowPreview:true}),
        choices:()=>createConsentEvidenceStore(this.state.storage,{siteId:data.consent.notice.siteId,allowPreview:true}),
        processing:()=>createProcessingRestrictionStore(this.state.storage,{siteId:data.processing.notice.siteId,allowPreview:true}),
        recorded:()=>createConsentEvidenceStore(this.state.storage,{siteId:data.recordedConsent.notice.siteId,allowPreview:true}),
        lifecycle:()=>createDurableObjectStore(this.state.storage,{prefix:lifecycleDemoPrefix+'lifecycle/'}),
      };
      const section = new RegExp('^'+this.adminBasePath+'/(history|evidence|agreements|choices|recorded|processing|permissions|contracts|lifecycle)(?:/|$)','u').exec(path)?.[1];
      if(section) {
        await this.initialize();
        return protectedResponse(await createAdminWorker({...adminPresentation(this.adminBasePath),basePath:`${this.adminBasePath}/${section}`,title:{history:'Document revisions',evidence:'Sample evidence',agreements:'Terms agreements',choices:'Cookie choices',recorded:'Sandbox activity',processing:'Processing opt-outs',permissions:'Form permissions',contracts:'Contract declarations',lifecycle:'Retention & holds'}[section],authorize:()=>({store:sections[section](),scopeLabel:this.adminBasePath==='/backoffice'?'Evidence workspace':'Your demo workspace',allowExport:true,allowCatalogReview:true})}).fetch(request,this.env));
      }
      if(path === this.adminBasePath || path === this.adminBasePath+'/') return protectedResponse(new Response(null,{status:303,headers:{Location:this.adminBasePath+'/history'}}));
      return protectedResponse(new Response('Not found.',{status:404}));
    } catch(error) {
      if(error instanceof EvidenceLifecycleError&&error.code==='context-retired')return protectedResponse(Response.json({code:'context-retired'},{status:410}));
      if(error instanceof ContractActionRecordError)return protectedResponse(Response.json({code:'recording-failed'},{status:400}));
      if(error instanceof FormPermissionRecordError)return protectedResponse(Response.json({code:error.code},{status:['revision-conflict','stale-offer','expired-command','scope-mismatch'].includes(error.code)?409:400}));
      if(error instanceof ProcessingRecordError)return protectedResponse(Response.json({code:error.code},{status:400}));
      if(error instanceof ConsentRecordError)return protectedResponse(Response.json({code:error.code},{status:['revision-conflict','stale-notice','expired-command'].includes(error.code)?409:400}));
      const stale=error instanceof TermsRecordError && error.code === 'stale-offer';
      return protectedResponse(Response.json({code:stale ? 'stale-offer' : 'recording-failed'},{status:stale ? 409 : 400}));
    }
  }
}

// Public examples use a disjoint DO class and binding. It never reads the operational workspace.
export class DemoWorkspace extends EvidenceWorkspace {
  get adminBasePath(){return '/demo/admin';}
  authorize(){return null;} // Capability resolved by the host; DOs have no public URL.
  async initialize(){
    await super.initialize();
    if(!this.demoReady)this.demoReady=seedDemoWorkspace(this.state.storage,data).catch(error=>{this.demoReady=undefined;throw error;});
    await this.demoReady;
    await seedFormPermissionJourneys(this.state.storage,data);
    await seedContractDeclarations(this.state.storage,data);
    await seedOrderConfirmations(this.state.storage,data);
  }
  contextId(value){return value+'-'+this.generation;}
  serialize(callback){const result=(this.pending??Promise.resolve()).then(callback);this.pending=result.catch(()=>{});return result;}
  fetch(request){return this.serialize(()=>this.handle(request));}
  async handle(request){
    const path=new URL(request.url).pathname,storage=this.state.storage;
    const header=request.headers.get('X-Notabenda-Demo-Generation');
    if(!/^[a-f0-9]{64}$/u.test(header??''))return protectedResponse(new Response('Invalid demo context.',{status:400}));
    const expired=await storage.get('demo/expired');let metadata=await storage.get('demo/session');
    if(path==='/demo/provision'&&request.method==='POST'&&!expired&&!metadata){
      await this.state.blockConcurrencyWhile(async()=>{
        if(!await storage.get('demo/session')&&!await storage.get('demo/expired')){
          metadata={generation:header,createdAt:Date.now(),lastUsedAt:Date.now(),expiresAt:Date.now()+86400000};await storage.put('demo/session',metadata);await storage.setAlarm(metadata.expiresAt);
        }
      });metadata=await storage.get('demo/session');
    }
    if(expired||!metadata||Date.now()>=metadata.expiresAt){if(metadata)await this.expire();return protectedResponse(Response.json({code:'demo-expired'},{status:410}));}
    if(header!==metadata.generation)return protectedResponse(Response.json({code:'demo-generation-changed'},{status:409}));
    this.generation=metadata.generation;
    const usedAt=Date.now();metadata={...metadata,lastUsedAt:usedAt,expiresAt:usedAt+86400000};await storage.put('demo/session',metadata);await storage.setAlarm(metadata.expiresAt);
    if(path==='/demo/session'&&request.method==='GET')return protectedResponse(new Response(null,{status:204}));
    if(path==='/demo/provision'&&request.method==='POST'){await this.initialize();return protectedResponse(new Response(null,{status:204}));}
    if(!/^\/demo\/(?:admin|agreements|choices|processing|permissions|contracts|orders)(?:\/|$)/u.test(path))return protectedResponse(new Response('Not found.',{status:404}));
    if(path==='/demo/admin'||path==='/demo/admin/'){await this.initialize();return protectedResponse(demoHome());}
    let commandKey;
    if(request.method==='POST'&&/^\/demo\/(?:agreements|choices|processing|permissions|contracts|orders)\//u.test(path)){
      let body;try{body=await request.clone().json();}catch{return protectedResponse(new Response('Invalid request.',{status:400}));}
      if(typeof body.requestId==='string'&&/^[a-f0-9-]{36}$/u.test(body.requestId))commandKey='demo/commands/'+path+'/'+body.requestId;
      const count=await storage.get('demo/command-count')??0;
      if(count>=200&&(!commandKey||!await storage.get(commandKey))&&!(path.startsWith('/demo/orders/')&&await hasOrderDemoAttempt(storage,path.split('/')[3],body,this.generation)))return protectedResponse(Response.json({code:'demo-limit-reached'},{status:429}));
    }
    if(/^\/demo\/admin\/orders(?:\/|$)/u.test(path))return decorateDemoAdmin(protectedResponse(await orderDemoAdmin(request,storage)),path);
    const response=path.startsWith('/demo/orders/')?protectedResponse(await serveOrderDemo(request,{storage,generation:this.generation,templates:data.paidOrders,readBody:readDemoRequest,readAsset:async asset=>{const response=await this.env.ASSETS.fetch(new Request(new URL(asset.url,request.url)));if(!response.ok)throw Error('Original file unavailable.');return new Uint8Array(await response.arrayBuffer());}})):await super.fetch(request);
    if(commandKey&&response.ok&&!await storage.get(commandKey))await storage.transaction(async tx=>{await tx.put(commandKey,true);await tx.put('demo/command-count',(await tx.get('demo/command-count')??0)+1);});
    return decorateDemoAdmin(response,path);
  }
  alarm(){return this.serialize(async()=>{const metadata=await this.state.storage.get('demo/session');if(metadata&&metadata.expiresAt>Date.now()){await this.state.storage.setAlarm(metadata.expiresAt);return;}await this.expire();});}
  async expire(){await this.state.storage.deleteAll();await this.state.storage.put('demo/expired',true);this.ready=undefined;this.demoReady=undefined;}
}
