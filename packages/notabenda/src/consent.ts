// @requirements REQ-US-COPPA-SCOPE
// @requirements REQ-US-VA-RIGHTS
// @requirements REQ-AU-PIXELS
// @requirements REQ-CA-OBA
// @requirements REQ-CH-PROFILING
// @requirements REQ-PRODUCT-SCOPE-GUARDS
import {evaluateScopeGuards,ScopeGuardError} from './scope-guards.js';
import type {ScopeGuardDecision} from './scope-guards.js';
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
import { toPublicConfig } from './config.js';
import { consentScopes } from './consent-notice.js';
import { createEvidenceSession } from './consent-evidence.js';
import type { ConsentEvidenceOptions, ConsentEvidenceSnapshot, SavedConsentCommand, ConsentChoiceRequest } from './consent-evidence.js';
import type { ConsentNotice } from './consent-notice.js';
import type { PublicSiteConfig } from './types.js';
import {browserGlobalPrivacyControl,evaluatePrivacySignals} from './privacy-signals.js';
import type {GlobalPrivacyControlStatus,PrivacySignalSnapshot} from './privacy-signals.js';
import {processingServiceScope} from './processing.js';
import type {ProcessingChoicesController,ProcessingChoicesSnapshot} from './processing-choices.js';
import {evaluatePromptPolicy,latestPromptPolicyMemory,parsePromptPolicyMemory} from './prompt-policy.js';
import type {PromptPolicyDecision,PromptPolicyMemory} from './prompt-policy.js';

export type ChoiceStatus = 'unknown' | 'granted' | 'denied' | 'withdrawn' | 'expired';
export type ServiceStatus = 'blocked' | 'starting' | 'active' | 'stopping' | 'reload-required';
export interface ConsentSnapshot {
  purposes: Record<string, ChoiceStatus>;
  /** @requirements REQ-PRODUCT-REACT Pure effective permission; saved grants may still await required evidence. */
  permissions: Record<string, boolean>;
  /** Cookie permission plus independent declared processing restrictions; runtime phase is separate. */
  servicePermissions: Record<string, boolean>;
  privacySignals?: PrivacySignalSnapshot;
  processingChoices?:ProcessingChoicesSnapshot;
  services: Record<string, ServiceStatus>;
  shouldPrompt: boolean;
  scopeGuards:ScopeGuardDecision;
  preferencesOpen: boolean;
  persistence: 'available' | 'unavailable';
  destroyed: boolean;
  evidence?: ConsentEvidenceSnapshot;
  /** @requirements REQ-IT-REPROMPT Solicitation only; independent of saved/effective permission. */
  promptDecision?: PromptPolicyDecision;
}
export interface ConsentOptions { evidence?:ConsentEvidenceOptions; globalPrivacyControl?:boolean;processingChoices?:ProcessingChoicesController }
export interface ChoiceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export interface ConsentEnvironment {
  /** Host test/platform adapter. Missing falls back to the browser reader; only boolean true is a signal. */
  globalPrivacyControl?:()=>unknown;
  storage?: ChoiceStorage;
  now?: () => number;
  /** Call on storage changes, pageshow, and resume from background. Return an unsubscribe function. */
  subscribe?: (key: string, refresh: () => void) => () => void;
  schedule?: (callback: () => void, delayMs: number) => () => void;
}
export interface ServiceLifecycle {
  purposes: readonly string[];
  start(context: { signal: AbortSignal }): (() => void | Promise<void>) | Promise<() => void | Promise<void>>;
}
export interface ConsentController {
  getSnapshot(): ConsentSnapshot;
  getConfig(): PublicSiteConfig;
  getNotice(): ConsentNotice|undefined;
  subscribe(listener: (state: ConsentSnapshot) => void): () => void;
  choose(choices: Record<string, boolean>): { persisted: boolean };
  acceptAll(): { persisted: boolean };
  rejectAll(): { persisted: boolean };
  dismiss(): void;
  openPreferences(): void;
  closePreferences(): void;
  isAllowed(purposeId: string): boolean;
  isServiceAllowed(serviceId:string):boolean;
  registerService(serviceId: string, lifecycle: ServiceLifecycle): () => void;
  refresh(): void;
  refreshEvidence(): Promise<void>;
  retryEvidence(): Promise<void>;
  settled(): Promise<void>;
  destroy(): void;
}

const DAY = 86400000;
const MAX_RECORD = 65536;
interface Choice { scope: string; status: 'granted' | 'denied' | 'withdrawn'; at: number; until: number }
interface ChoiceRecord { schemaVersion: 1; siteId: string; choices: Record<string, Choice>; dismissedUntil: number; evidence?:SavedConsentCommand; promptPolicy?:PromptPolicyMemory }
interface RunningService {
  lifecycle: ServiceLifecycle;
  controller?: AbortController;
  cleanup?: () => void | Promise<void>;
  phase: ServiceStatus;
  removed: boolean;
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Access browser capabilities only at construction, never on module import. */
function browserEnvironment(): ConsentEnvironment {
  if (typeof window === 'undefined') return {};
  let storage: Storage | undefined;
  try { storage = window.localStorage; } catch { /* A blocked storage getter must not break the page. */ }
  return {
    ...(storage ? { storage } : {}),
    subscribe(key, refresh) {
      const change = (event: StorageEvent) => { if ((event.key === key || event.key === `${key}:prompt` || event.key === null) && (!storage || event.storageArea === storage)) refresh(); };
      const visible = () => { if (document.visibilityState === 'visible') refresh(); };
      window.addEventListener('storage', change); window.addEventListener('pageshow', refresh); document.addEventListener('visibilitychange', visible);
      return () => { window.removeEventListener('storage', change); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', visible); };
    },
  };
}

/** @requirements REQ-EU-CONSENT REQ-EU-DEVICE REQ-EU-FAIR-CHOICE REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
 * Local state and cooperative service gating, with optional construction-time required-receipt delivery.
 */
export function createConsent(input: unknown, environment?: ConsentEnvironment, options:ConsentOptions = {}): ConsentController {
  const config = toPublicConfig(input);
  const policy = config.consent;
  const scopeGuards=evaluateScopeGuards(config);
  const scopeBlocked=(id:string)=>scopeGuards.blockedPurposeIds.includes(id);
  if (!policy) throw new Error('Declare consent purposes, services, scopes, and lifetimes in the site configuration.');
  // @requirements REQ-PRODUCT-PROCESSING-CHOICES Bind one immutable host context before any service can register.
  const processing=options.processingChoices;
  if(processing){const n=processing.getNotice();if(processing.getSnapshot().destroyed||n.siteId!==config.site.id||JSON.stringify(n.services)!==JSON.stringify(processingServiceScope(config.services))||n.document.version!==config.documents.privacy.version||n.document.effectiveDate!==config.documents.privacy.effectiveDate)throw new Error('Bind processing choices to this site, classified services and privacy version.');}
  const env = environment ?? browserEnvironment();
  if(options.globalPrivacyControl!==undefined&&typeof options.globalPrivacyControl!=='boolean')throw new Error('Provide a boolean host-observed Global Privacy Control value.');
  let gpcObserved=options.globalPrivacyControl===true;
  let gpcStatus:GlobalPrivacyControlStatus=gpcObserved?'observed':'not-observed';
  function sampleSignal():boolean {
    if(!config.privacySignals)return false;
    const before=gpcStatus;
    if(gpcObserved){gpcStatus='observed';return before!==gpcStatus;}
    try{const value=(env.globalPrivacyControl??browserGlobalPrivacyControl)();gpcObserved=value===true;gpcStatus=gpcObserved?'observed':value===false||value===undefined?'not-observed':'unavailable';}
    catch{gpcStatus='unavailable';}
    return before!==gpcStatus;
  }
  sampleSignal();
  const signalRestrictions=()=>evaluatePrivacySignals(config,gpcStatus);
  const now = env.now ?? Date.now;
  const schedule = env.schedule ?? ((callback, delay) => { const timer = setTimeout(callback, delay); if (typeof timer === 'object' && 'unref' in timer) timer.unref(); return () => clearTimeout(timer); });
  const storageKey = `notabenda:choices:v1:${config.site.id}`;
  const promptKey = `${storageKey}:prompt`;
  const listeners = new Set<(state: ConsentSnapshot) => void>();
  const services = new Map<string, RunningService>();
  const pending = new Set<Promise<void>>();
  let record: ChoiceRecord = { schemaVersion: 1, siteId: config.site.id, choices: {}, dismissedUntil: 0 };
  let readable = false; let writeFailed = false; let destroyed = false; let preferencesOpen = false;
  let cancelTimer: (() => void) | undefined;
  let unsubscribe: (() => void) | undefined;
  let savedRaw:string|null=null;
  let choicePromptMemory:PromptPolicyMemory|undefined;
  let dismissalPromptMemory:PromptPolicyMemory|undefined;
  let failedDismissalPromptMemory:PromptPolicyMemory|undefined;
  const scopes = new Map(Object.entries(consentScopes(config)));
  const largestRecord = { schemaVersion:1, siteId:config.site.id, dismissedUntil:0, choices:Object.fromEntries([...scopes].map(([id, scope]) => [id, { scope, status:'withdrawn', at:Number.MAX_SAFE_INTEGER, until:Number.MAX_SAFE_INTEGER }])),...(policy.promptPolicy?{promptPolicy:{profile:policy.promptPolicy.profile,processingRevision:policy.promptPolicy.processingRevision,at:Number.MAX_SAFE_INTEGER,outcome:'all-granted'}}:{}) };
  if (JSON.stringify(largestRecord).length > MAX_RECORD) throw new Error('Consent scope exceeds the 64K-character local record limit. Reduce the declared optional scope or use a different integration.');
  let evidence:ReturnType<typeof createEvidenceSession>|undefined;
  if(options.evidence) evidence=createEvidenceSession(config,options.evidence,{now,schedule},()=>{
    if(!destroyed&&!writeFailed&&readable&&!sharedMatches()) {refresh();return;}
    update();
  });
  const live = () => { if (destroyed) throw new Error('Consent controller has been destroyed.'); };
  function status(id: string): ChoiceStatus {
    const choice = Object.hasOwn(record.choices, id) ? record.choices[id] : undefined;
    if (!choice) return 'unknown';
    if (choice.until <= now()) return 'expired';
    if (choice.at > now()) return 'unknown';
    // Material changes cannot erase a still-current refusal or withdrawal.
    if (choice.status !== 'granted') return choice.status;
    return scopeBlocked(id) || !readable || writeFailed || choice.scope !== scopes.get(id) ? 'unknown' : 'granted';
  }
  function sharedMatches():boolean {
    if(!evidence) return true;
    try {return !!env.storage&&env.storage.getItem(storageKey)===savedRaw;} catch {return false;}
  }
  function allowed(id: string): boolean { return !destroyed && !scopeBlocked(id) && scopes.has(id) && status(id) === 'granted' && (!evidence || sharedMatches()&&evidence.allows(id,record.evidence)); }
  function serviceAllowed(id: string): boolean {
    const service = config.services.find(item => item.id === id)!;
    return service.purposeIds.every(allowed)&&!Object.hasOwn(signalRestrictions()?.restrictedServices??{},id)&&!(service.processingActivities??[]).some(activity=>processing?.getSnapshot().blockedActivities.includes(activity));
  }
  function promptDecision():PromptPolicyDecision|undefined {
    const rule=policy!.promptPolicy;
    return rule ? evaluatePromptPolicy(rule,latestPromptPolicyMemory(rule,[choicePromptMemory,dismissalPromptMemory,failedDismissalPromptMemory]),now(),readable) : undefined;
  }
  function snapshot(): ConsentSnapshot {
    const purposes = Object.fromEntries(policy!.purposes.map(p => [p.id, status(p.id)]));
    const receipt=evidence?.snapshot();
    if(receipt&&!record.evidence&&Object.values(purposes).includes('granted')) receipt.requiresChoice=true;
    const privacySignals=signalRestrictions();
    const processingChoices=processing?.getSnapshot();
    const promptable=(id:string)=>!scopeBlocked(id)&&policy!.services.some(s=>{const service=config.services.find(service=>service.id===s.id)!;return service.purposeIds.includes(id)&&!Object.hasOwn(privacySignals?.restrictedServices??{},s.id)&&!(service.processingActivities??[]).some(activity=>processingChoices?.blockedActivities.includes(activity));});
    const decision=promptDecision();
    return { purposes, scopeGuards:structuredClone(scopeGuards), permissions: Object.fromEntries(policy!.purposes.map(p => [p.id, allowed(p.id)])), servicePermissions:Object.fromEntries(policy!.services.map(s=>[s.id,serviceAllowed(s.id)])), services: Object.fromEntries(policy!.services.map(s => [s.id, services.get(s.id)?.phase ?? 'blocked'])), shouldPrompt: !destroyed && receipt?.status!=='retired' && now() >= record.dismissedUntil && decision?.allowsPrompt!==false && (Object.entries(purposes).some(([id,value]) => (value === 'unknown' || value === 'expired')&&promptable(id)) || (!!receipt?.requiresChoice||!!decision?.requiresChoice)&&policy!.purposes.some(p=>promptable(p.id))), preferencesOpen, persistence: readable && !writeFailed ? 'available' : 'unavailable', destroyed, ...(receipt?{evidence:receipt}:{}),...(privacySignals?{privacySignals}:{}),...(processingChoices?{processingChoices}:{}),...(decision?{promptDecision:decision}:{}) };
  }
  function emit(): void { for (const listener of [...listeners]) { try { listener(snapshot()); } catch { /* Observers cannot prevent withdrawal or corrupt the state engine. */ } } }
  function track(task: Promise<void>): void { pending.add(task); void task.finally(() => pending.delete(task)); }
  function reconcileService(id: string, entry: RunningService): void {
    const shouldRun = !entry.removed && serviceAllowed(id);
    if (!shouldRun && entry.controller && !entry.controller.signal.aborted) entry.controller.abort();
    if (entry.phase === 'reload-required' || entry.phase === 'stopping') return;
    if (entry.phase === 'starting') return; // Its permanently retired generation will clean up when it resolves.
    if (entry.phase === 'active' && !shouldRun) {
      entry.phase = 'stopping'; const cleanup = entry.cleanup!; delete entry.cleanup;
      const task = Promise.resolve().then(cleanup).then(() => { delete entry.controller; entry.phase = 'blocked'; reconcileService(id, entry); emit(); }, () => { entry.phase = 'reload-required'; emit(); });
      track(task); return;
    }
    if (entry.phase !== 'blocked' || !shouldRun || entry.controller) return;
    const generation = new AbortController(); entry.controller = generation; entry.phase = 'starting';
    const task = Promise.resolve().then(() => {
      // @requirements REQ-PRODUCT-PRIVACY-SIGNALS Sample immediately before invoking optional work.
      processing?.refreshLocal();
      if(sampleSignal())update();
      if (generation.signal.aborted || !serviceAllowed(id)) { generation.abort(); return () => {}; }
      return entry.lifecycle.start({ signal: generation.signal });
    }).then(async cleanup => {
      processing?.refreshLocal();
      if (typeof cleanup !== 'function') throw new Error('A service must return a cleanup function.');
      if (generation.signal.aborted || entry.removed || !serviceAllowed(id)) {
        entry.phase = 'stopping'; emit(); await cleanup(); delete entry.controller; entry.phase = 'blocked'; reconcileService(id, entry);
      } else { entry.cleanup = cleanup; entry.phase = 'active'; }
      emit();
    }).catch(() => { generation.abort(); entry.phase = 'reload-required'; emit(); });
    track(task);
  }
  function update(): void {
    processing?.refreshLocal();
    sampleSignal();
    try { cancelTimer?.(); } catch { /* An environment disposer cannot prevent withdrawal. */ } cancelTimer = undefined;
    for (const [id, service] of services) reconcileService(id, service);
    if (!destroyed) {
      const deadline=promptDecision()?.nextEligibleAt;
      const times = [...Object.values(record.choices).map(choice => choice.until), record.dismissedUntil,...(evidence?.expiries()??[]),...(deadline?[Date.parse(deadline)]:[])].filter(time => time > now());
      if (times.length) try { cancelTimer = schedule(update, Math.min(2147483647, Math.max(1, Math.min(...times) - now()))); } catch { /* Permission queries and resume still recheck expiry. */ }
    }
    emit();
  }
  function parse(raw: string | null): ChoiceRecord {
    const empty: ChoiceRecord = { schemaVersion: 1, siteId: config.site.id, choices: {}, dismissedUntil: 0 };
    if (!raw || raw.length > MAX_RECORD) return empty;
    try {
      const value: unknown = JSON.parse(raw);
      if (!object(value) || value.schemaVersion !== 1 || value.siteId !== config.site.id || !object(value.choices) || Object.keys(value.choices).length > 40 || !Number.isSafeInteger(value.dismissedUntil) || Number(value.dismissedUntil) < 0 || Number(value.dismissedUntil) > now() + policy!.dismissalMinutes * 60000) return empty;
      const choices: Record<string, Choice> = {};
      for (const [id, item] of Object.entries(value.choices)) {
        if (!scopes.has(id)) continue; // Removed purposes never obtain permission.
        if (!object(item) || typeof item.status!=='string' || !['granted','denied','withdrawn'].includes(item.status) || typeof item.scope !== 'string' || item.scope.length > MAX_RECORD || !Number.isSafeInteger(item.at) || !Number.isSafeInteger(item.until) || Number(item.at) < 0 || Number(item.at) > now() || Number(item.until) <= Number(item.at)) return empty;
        const lifetime = item.status === 'granted' ? policy!.grantLifetimeDays : policy!.refusalLifetimeDays;
        if (Number(item.until) - Number(item.at) > lifetime * DAY) return empty;
        choices[id] = { scope: item.scope, status: item.status as Choice['status'], at: Number(item.at), until: Number(item.until) };
      }
      const saved=evidence?.parseSaved(value.evidence);
      const coherent=saved&&Object.entries(saved.request.choices).every(([id,grant])=>{
        const choice=choices[id];return choice&&choice.scope===scopes.get(id)&&(choice.status==='granted')===grant&&choice.at===Date.parse(saved.request.clientAt)&&choice.until===choice.at+(grant?saved.release.grantLifetimeDays:saved.release.refusalLifetimeDays)*DAY;
      });
      return { schemaVersion: 1, siteId: config.site.id, choices, dismissedUntil: 0,...(coherent?{evidence:saved}:{}) };
    } catch { return empty; }
  }
  /** @requirements REQ-IT-REPROMPT Read withholding independently of current purposes, scope and lifetimes. */
  function readChoicePromptMemory(raw:string|null):PromptPolicyMemory|undefined {
    if(!policy!.promptPolicy||!raw||raw.length>MAX_RECORD)return undefined;
    try {
      const value:unknown=JSON.parse(raw);
      if(!object(value)||value.schemaVersion!==1||value.siteId!==config.site.id)return undefined;
      const explicit=parsePromptPolicyMemory(value.promptPolicy,now());
      if(explicit)return explicit;
      if(!object(value.choices)||Object.keys(value.choices).length>40)return undefined;
      const timestamps=Object.values(value.choices).filter(item=>object(item)&&typeof item.status==='string'&&['denied','withdrawn'].includes(item.status)&&typeof item.scope==='string'&&item.scope.length<=MAX_RECORD&&Number.isSafeInteger(item.at)&&Number(item.at)>=0&&Number(item.at)<=now()&&Number.isSafeInteger(item.until)&&Number(item.until)>Number(item.at)&&Number(item.until)-Number(item.at)<=730*DAY).map(item=>Number((item as Record<string,unknown>).at));
      return timestamps.length?{profile:'it-garante-2021',at:Math.max(...timestamps),outcome:'withheld'}:undefined;
    } catch{return undefined;}
  }
  function refresh(): void {
    if (destroyed) return;
    try {
      const raw = env.storage?.getItem(storageKey) ?? null; readable = !!env.storage; savedRaw=raw;
      if(!writeFailed)choicePromptMemory=readChoicePromptMemory(raw);
      if (!writeFailed) record = parse(raw); // A failed local withdrawal cannot revive an old persisted grant in this instance.
      const prompt = env.storage?.getItem(promptKey);
      try {
        const value: unknown = prompt && prompt.length < 1000 ? JSON.parse(prompt) : null;
        if(policy!.promptPolicy){
          const candidate=object(value)&&value.schemaVersion===1&&value.siteId===config.site.id?parsePromptPolicyMemory(value.regional,now()):undefined;
          dismissalPromptMemory=candidate?.outcome==='withheld'&&candidate.at===Number(object(value)?value.at:NaN)?candidate:undefined;
          // A valid older dismissal has no processing revision and cannot use a change exception.
          if(object(value)&&value.regional===undefined&&value.schemaVersion===1&&value.siteId===config.site.id&&Number.isSafeInteger(value.until)&&Number(value.until)>=Number(value.at)&&Number(value.until)-Number(value.at)<=43200*60000){
            dismissalPromptMemory=parsePromptPolicyMemory({profile:'it-garante-2021',at:value.at,outcome:'withheld'},now());
          }
        }
        const lastChoice = Math.max(-1, ...Object.values(record.choices).map(choice => choice.at));
        record.dismissedUntil = object(value) && value.schemaVersion === 1 && value.siteId === config.site.id && Number.isSafeInteger(value.at) && Number(value.at) >= 0 && Number(value.at) > lastChoice && Number(value.at) <= now() && Number.isSafeInteger(value.until) && Number(value.until) >= 0 && Number(value.until) <= Number(value.at) + policy!.dismissalMinutes * 60000 ? Number(value.until) : 0;
      } catch { record.dismissedUntil = 0; }
    } catch { readable = false; record = { ...record, choices: Object.fromEntries(Object.entries(record.choices).filter(([,choice]) => choice.status !== 'granted')) }; }
    if(evidence) void evidence.refresh(writeFailed&&Object.values(record.choices).some(c=>c.status==='granted')?undefined:record.evidence);
    update();
  }
  function persist(): boolean {
    try {
      if (!env.storage) throw new Error();
      const serialized = JSON.stringify({ ...record, dismissedUntil: 0 });
      if (serialized.length > MAX_RECORD) throw new Error();
      env.storage.setItem(storageKey, serialized); savedRaw=serialized; readable = true; writeFailed = false; return true;
    } catch {
      writeFailed = true;
      try { env.storage?.removeItem(storageKey); } catch { /* Remain denied in memory even if old storage cannot be removed. */ }
      return false;
    }
  }
  function choose(choices: Record<string, boolean>,action:ConsentChoiceRequest['action']='save'): { persisted: boolean } {
    live();
    if (!object(choices) || Object.keys(choices).length !== scopes.size || [...scopes.keys()].some(id => !Object.hasOwn(choices, id) || typeof choices[id] !== 'boolean')) throw new Error('Choose explicitly for every declared optional purpose.');
    const blocked=Object.keys(choices).filter(id=>choices[id]&&scopeBlocked(id));if(blocked.length)throw new ScopeGuardError(blocked);
    const at = now();
    const command=evidence?.prepare(choices,Object.values(choices).some(Boolean)?action:'revoke-all',at);
    const rule=policy!.promptPolicy;
    const available=[...scopes.keys()].filter(id=>!scopeBlocked(id));
    choicePromptMemory=rule?{profile:rule.profile,processingRevision:rule.processingRevision,at,outcome:action!=='revoke-all'&&available.length>0&&available.every(id=>choices[id])?'all-granted':'withheld'}:undefined;
    record = { schemaVersion: 1, siteId: config.site.id, dismissedUntil: 0, choices: Object.fromEntries([...scopes].map(([id, scope]) => {
      const granted = choices[id]!;
      const previous = Object.hasOwn(record.choices, id) ? record.choices[id] : undefined;
      return [id, { scope, status: granted ? 'granted' : previous?.status === 'granted' || previous?.status === 'withdrawn' ? 'withdrawn' : 'denied', at, until: at + (granted ? policy!.grantLifetimeDays : policy!.refusalLifetimeDays) * DAY }];
    })),...(command?{evidence:command}:{}),...(choicePromptMemory?{promptPolicy:choicePromptMemory}:{}) };
    const persisted = persist();
    // Regional entries are superseded by timestamps; deletion could erase another tab's newer dismissal.
    if (persisted&&!rule) try { env.storage?.removeItem(promptKey); } catch { /* Older prompt suppression is also ignored by its timestamp. */ }
    evidence?.commit(command,persisted);
    update(); return { persisted };
  }
  refresh();
  try { unsubscribe = env.subscribe?.(storageKey, refresh); } catch { /* Explicit refresh remains available. */ }
  const unsubscribeProcessing=processing?.subscribe(()=>{if(!destroyed)update();});
  return {
    getSnapshot: snapshot, getConfig: () => structuredClone(config),getNotice:()=>evidence?.notice(),
    subscribe(listener) { live(); listeners.add(listener); try { listener(snapshot()); } catch { /* Same isolation as later notifications. */ } return () => listeners.delete(listener); },
    choose, acceptAll: () => scopeGuards.blockedPurposeIds.length>0&&policy.purposes.every(p=>scopeBlocked(p.id))?{persisted:false}:choose(Object.fromEntries([...scopes.keys()].map(id => [id, !scopeBlocked(id)])),scopeGuards.blockedPurposeIds.length?'save':'accept-all'), rejectAll: () => choose(Object.fromEntries([...scopes.keys()].map(id => [id, false])),'revoke-all'),
    dismiss() {
      live(); refresh(); const at = now(); record.dismissedUntil = at + policy.dismissalMinutes * 60000;
      const rule=policy.promptPolicy;
      if(rule)dismissalPromptMemory={profile:rule.profile,processingRevision:rule.processingRevision,at,outcome:'withheld'};
      // Prompt suppression has its own key. Dismissal must never save a grant, clear a failed-write barrier, or overwrite a newer withdrawal.
      try {
        if(!env.storage)throw new Error();
        env.storage.setItem(promptKey, JSON.stringify({ schemaVersion: 1, siteId: config.site.id, at, until: record.dismissedUntil,...(rule?{regional:dismissalPromptMemory}:{}) }));
        failedDismissalPromptMemory=undefined;
      } catch { failedDismissalPromptMemory=rule?dismissalPromptMemory:undefined; /* Instance-only fallback. Permission does not change. */ }
      update();
    },
    openPreferences() { live(); preferencesOpen = true; emit(); }, closePreferences() { live(); preferencesOpen = false; emit(); },
    isAllowed(id) {if(!destroyed&&!writeFailed&&readable&&!sharedMatches())refresh();return allowed(id);},
    isServiceAllowed(id) {
      processing?.refreshLocal();
      if(!destroyed){if(!evidence||!writeFailed&&readable&&!sharedMatches())refresh();else if(sampleSignal())update();}
      return !!policy.services.some(service=>service.id===id)&&serviceAllowed(id);
    },
    registerService(id, lifecycle) {
      live();
      const service = config.services.find(item => item.id === id);
      if (!policy.services.some(item => item.id === id) || !service || services.has(id) || !lifecycle || typeof lifecycle.start !== 'function' || !Array.isArray(lifecycle.purposes) || [...lifecycle.purposes].sort().join('\0') !== [...service.purposeIds].sort().join('\0')) throw new Error('Register one lifecycle with exactly the declared purposes of a consent-managed service.');
      const entry: RunningService = { lifecycle: { purposes: [...lifecycle.purposes], start: lifecycle.start }, phase: 'blocked', removed: false };
      services.set(id, entry); update();
      return () => { entry.removed = true; reconcileService(id, entry); emit(); };
    },
    refresh,
    refreshEvidence() {refresh();return evidence?.settled()??Promise.resolve();},
    retryEvidence() {return evidence?.retry()??Promise.resolve();},
    async settled() {await evidence?.settled(); while (pending.size) await Promise.all([...pending]); },
    destroy() { if (destroyed) return; destroyed = true; evidence?.destroy(); preferencesOpen = false; for (const [id, service] of services) reconcileService(id, service); try { cancelTimer?.(); } catch {} try { unsubscribe?.(); } catch {} try { unsubscribeProcessing?.(); } catch {} emit(); listeners.clear(); },
  };
}
