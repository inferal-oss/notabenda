// @requirements REQ-PRODUCT-TERMS-CONNECTION
// @requirements REQ-PRODUCT-LOCALIZATION
import {normalizeTermsLocalization} from './terms-localization-policy.js';
import type {TermsLocalization} from './terms-localization-policy.js';
// @requirements REQ-PRODUCT-EVIDENCE-LIFECYCLE
import type { BuildMode } from './types.js';

export interface TermsOffer {
  schemaVersion: 1|2;
  localization?:TermsLocalization;
  offerId: string;
  siteId: string;
  scopeId: string;
  artifactId: string;
  mode: BuildMode;
  document: { title: string; url: string; version: string; effectiveDate: string; sha256: string; contentSha256: string; reviewStatus: 'draft' | 'reviewed' };
  statement: string;
  actionLabel: string;
}
export interface TermsAcceptanceRequest { schemaVersion: 1; offerId: string; requestId: string; accepted: true }
export interface TermsAcceptanceReceipt {
  schemaVersion: 1;
  id: string;
  offerId: string;
  requestId: string;
  operationId: string;
  artifactId: string;
  documentSha256: string;
  documentVersion: string;
  recordedAt: string;
}
export type TermsAcceptanceStatus = 'idle' | 'submitting' | 'recorded' | 'error' | 'stale' | 'retired' | 'destroyed';
export interface TermsAcceptanceSnapshot {
  checked: boolean;
  status: TermsAcceptanceStatus;
  requestId?: string;
  receipt?: TermsAcceptanceReceipt;
  error?: 'unavailable' | 'recording-failed' | 'invalid-receipt' | 'stale-offer' | 'context-retired';
}
export interface TermsAcceptanceOptions {
  /** Opaque workflow/order reference supplied by the host; the server independently binds the same operation. */
  operationId: string;
  submit(request: TermsAcceptanceRequest, context: { signal: AbortSignal }): Promise<unknown>;
  allowPreview?: boolean;
  /** Host-managed recovery of an uncertain attempt. This is an idempotency key, never an authorization credential. */
  requestId?: string;
}
export interface TermsAcceptanceController {
  getOffer(): TermsOffer;
  getSnapshot(): TermsAcceptanceSnapshot;
  /** Local comparison only; never authenticates the server binding or exposes the stored operation. */
  isForOperation?(expected: string): boolean;
  subscribe(listener: (state: TermsAcceptanceSnapshot) => void): () => void;
  setChecked(value: boolean): void;
  submit(): Promise<TermsAcceptanceReceipt>;
  destroy(): void;
}
export class TermsAcceptanceError extends Error {
  constructor(readonly code: 'not-checked' | 'unavailable' | 'recording-failed' | 'invalid-receipt' | 'stale-offer' | 'context-retired' | 'destroyed') { super(code); this.name = 'TermsAcceptanceError'; }
}
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const plain = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max && new TextEncoder().encode(value).length <= max && !/[\u0000-\u001f\u007f]/u.test(value);
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export const validTermsRequestId = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(value);
const date = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;

/** Interpolated references keep their own reading order inside translated sentences. */
function renderTermsMessage(element:HTMLElement,template:string,values:Record<string,string>):void{
  const doc=element.ownerDocument,nodes:Node[]=[];let start=0;
  for(const match of template.matchAll(/\{([a-zA-Z]+)\}/gu)){
    nodes.push(doc.createTextNode(template.slice(start,match.index)));
    const value=doc.createElement('bdi'),key=match[1]!;value.dir=key==='effectiveDate'?'ltr':'auto';value.textContent=values[key]!;
    if(key==='effectiveDate')value.className='nb-terms-date';
    nodes.push(value);start=match.index!+match[0].length;
  }
  nodes.push(doc.createTextNode(template.slice(start)));element.replaceChildren(...nodes);
}

/** Shape validation does not authenticate the offer. Backend registration verifies the digests and archive. */
export function normalizeTermsOffer(input: unknown, options: { allowPreview?: boolean } = {}): TermsOffer {
  if (!object(input) || (input.schemaVersion !== 1&&input.schemaVersion!==2) || !hash(input.offerId) || !hash(input.artifactId) || !plain(input.siteId,120) || !/^[a-z][a-z0-9-]*$/u.test(input.siteId) || !plain(input.scopeId,120) || !/^[a-z][a-z0-9-]*$/u.test(input.scopeId) || (input.mode!=='production'&&input.mode!=='preview') || !plain(input.statement,2000) || !plain(input.actionLabel,120) || !object(input.document)) throw new Error('Invalid terms offer.');
  let localization:TermsLocalization|undefined;
  if(input.schemaVersion===2){const keys=['schemaVersion','offerId','siteId','scopeId','artifactId','mode','document','statement','actionLabel','localization'];if(Object.keys(input).length!==keys.length||keys.some(k=>!Object.hasOwn(input,k)))throw new Error('Invalid localized terms offer.');localization=normalizeTermsLocalization(input.localization,{allowPreview:options.allowPreview===true});if(new TextEncoder().encode(JSON.stringify(input)).length>16384)throw new Error('Terms offer exceeds its byte limit.');}else if(input.localization!==undefined)throw new Error('Terms localization requires offer schema version 2.');
  const d = input.document;
  if (!plain(d.title,300) || !plain(d.version,200) || !date(d.effectiveDate) || !hash(d.sha256) || !hash(d.contentSha256) || (d.reviewStatus!=='draft'&&d.reviewStatus!=='reviewed') || d.url !== `/artifacts/${input.artifactId}/terms.html`) throw new Error('Invalid terms document reference.');
  if (!options.allowPreview && (input.mode !== 'production' || d.reviewStatus !== 'reviewed')) throw new Error('Production acceptance requires a reviewed production release.');
  return { schemaVersion:input.schemaVersion,...(localization?{localization}:{}), offerId:input.offerId, artifactId:input.artifactId, siteId:input.siteId, scopeId:input.scopeId, mode:input.mode as BuildMode, statement:input.statement, actionLabel:input.actionLabel, document:{ title:d.title, url:d.url as string, version:d.version, effectiveDate:d.effectiveDate, sha256:d.sha256, contentSha256:d.contentSha256, reviewStatus:d.reviewStatus as 'draft'|'reviewed' } };
}

/** @requirements REQ-PRODUCT-TERMS-ACCEPTANCE
 * Explicit version-bound assertion with no optimistic success and no cookie/marketing side effects.
 */
export function createTermsAcceptance(input: unknown, options: TermsAcceptanceOptions): TermsAcceptanceController {
  const offer = normalizeTermsOffer(input, options);
  if (!plain(options.operationId,200) || typeof options.submit !== 'function' || options.requestId !== undefined && !validTermsRequestId(options.requestId)) throw new Error('Provide a host operation, submit transport, and valid recovery request ID.');
  const operationId = options.operationId; const transport = options.submit;
  let state: TermsAcceptanceSnapshot = { checked:false, status:'idle', ...(options.requestId ? { requestId:options.requestId } : {}) };
  let pending: Promise<TermsAcceptanceReceipt> | undefined; let abort: AbortController | undefined;
  const listeners = new Set<(state: TermsAcceptanceSnapshot) => void>();
  const snapshot = () => structuredClone(state);
  const emit = () => { for (const listener of [...listeners]) try { listener(snapshot()); } catch {} };
  function receipt(input: unknown): TermsAcceptanceReceipt {
    if (!object(input) || input.schemaVersion !== 1 || !hash(input.id) || input.offerId !== offer.offerId || input.requestId !== state.requestId || input.operationId !== operationId || input.artifactId !== offer.artifactId || input.documentSha256 !== offer.document.sha256 || input.documentVersion !== offer.document.version || typeof input.recordedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(input.recordedAt) || !Number.isFinite(Date.parse(input.recordedAt)) || new Date(input.recordedAt).toISOString() !== input.recordedAt) throw new TermsAcceptanceError('invalid-receipt');
    return { schemaVersion:1, id:input.id, offerId:offer.offerId, requestId:state.requestId!, operationId, artifactId:offer.artifactId, documentSha256:offer.document.sha256, documentVersion:offer.document.version, recordedAt:input.recordedAt };
  }
  function submit(): Promise<TermsAcceptanceReceipt> {
    if (state.status === 'destroyed') return Promise.reject(new TermsAcceptanceError('destroyed'));
    if (state.status === 'retired') return Promise.reject(new TermsAcceptanceError('context-retired'));
    if (pending) return pending;
    if (state.receipt) return Promise.resolve(structuredClone(state.receipt));
    if (!state.checked) return Promise.reject(new TermsAcceptanceError('not-checked'));
    if (state.status === 'stale') return Promise.reject(new TermsAcceptanceError('stale-offer'));
    let requestId = state.requestId;
    try { requestId ??= crypto.randomUUID(); } catch {}
    if (!validTermsRequestId(requestId)) {
      state = { checked:true, status:'error', error:'unavailable' }; emit();
      return Promise.reject(new TermsAcceptanceError('unavailable'));
    }
    const request: TermsAcceptanceRequest = { schemaVersion:1, offerId:offer.offerId, requestId, accepted:true };
    abort = new AbortController(); const signal = abort.signal;
    state = { checked:true, status:'submitting', requestId };
    pending = Promise.resolve().then(() => { if (signal.aborted) throw new TermsAcceptanceError('destroyed'); return transport(structuredClone(request), { signal }); }).then(value => {
      if (signal.aborted) throw new TermsAcceptanceError('destroyed');
      const result = receipt(value); state = { checked:true, status:'recorded', requestId, receipt:result }; emit(); return structuredClone(result);
    }).catch(error => {
      if (state.status === 'destroyed') throw new TermsAcceptanceError('destroyed');
      const code = error instanceof TermsAcceptanceError && ['invalid-receipt','stale-offer','context-retired'].includes(error.code) ? error.code as 'invalid-receipt'|'stale-offer'|'context-retired' : 'recording-failed';
      state = { checked:true, status:code === 'context-retired' ? 'retired' : code === 'stale-offer' ? 'stale' : 'error', requestId, error:code }; emit(); throw new TermsAcceptanceError(code);
    }).finally(() => { pending = undefined; });
    emit();
    return pending;
  }
  return {
    getOffer:()=>structuredClone(offer), getSnapshot:snapshot,
    isForOperation(expected) { if(!plain(expected,200))throw Error('Provide a bounded host operation reference.');return expected===operationId; },
    subscribe(listener) { listeners.add(listener); try { listener(snapshot()); } catch {} return ()=>listeners.delete(listener); },
    setChecked(value) { if (typeof value !== 'boolean' || !['idle','error'].includes(state.status)) throw new Error('The current acceptance attempt cannot be edited.'); state = { checked:value, status:'idle', ...(state.requestId ? { requestId:state.requestId } : {}) }; emit(); },
    submit,
    destroy() { if (state.status === 'destroyed') return; state = { ...state, status:'destroyed' }; abort?.abort(); emit(); listeners.clear(); },
  };
}

/** @requirements REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-A11Y */
export function mountTermsAcceptance(container: HTMLElement, options: { acceptance: TermsAcceptanceController }): { destroy(): void } {
  const { acceptance } = options; const offer = acceptance.getOffer(); const doc = container.ownerDocument;
  const l=offer.localization,m=l?.terms;
  const root = doc.createElement('section'); root.className = 'nb-terms-acceptance'; root.setAttribute('aria-label',m?.regionLabel??'Terms agreement');if(l){root.lang=l.locale;root.dir=l.direction;}
  const heading = doc.createElement('h2'); heading.textContent = m?.heading??'Review the terms';
  const documentRow=doc.createElement('div');documentRow.className='nb-terms-document';
  const documentIcon=doc.createElement('span');documentIcon.className='nb-terms-document-icon';documentIcon.setAttribute('aria-hidden','true');documentIcon.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/></svg>';
  const documentCopy=doc.createElement('div');documentCopy.className='nb-terms-document-copy';
  const link = doc.createElement('a'); link.href = offer.document.url; link.textContent = offer.document.title;const external=doc.createElement('span');external.textContent='↗';external.setAttribute('aria-hidden','true');link.append(external); link.target = '_blank'; link.rel = 'noopener';
  const metadata = doc.createElement('p'); metadata.className = 'nb-document-meta';renderTermsMessage(metadata,m?.metadata??'Version {version} · effective {effectiveDate} · opens in a new tab',{version:offer.document.version,effectiveDate:offer.document.effectiveDate});link.setAttribute('aria-description',metadata.textContent??'');
  const label = doc.createElement('label'); label.className = 'nb-terms-statement';
  const checkbox = doc.createElement('input'); checkbox.type = 'checkbox';
  const statement = doc.createElement('span'); statement.textContent = offer.statement; label.append(checkbox,statement);
  const action = doc.createElement('button'); action.type = 'button'; action.className = 'nb-choice-button'; action.textContent = offer.actionLabel;
  const message = doc.createElement('p'); message.className = 'nb-control-status'; message.setAttribute('role','status'); message.tabIndex=-1;
  documentCopy.append(link,metadata);documentRow.append(documentIcon,documentCopy);root.append(heading,documentRow);
  if (offer.mode === 'preview' || offer.document.reviewStatus !== 'reviewed') { const draft = doc.createElement('p'); draft.className = 'nb-draft'; draft.textContent = m?.draft??'Preview · Draft terms'; root.append(draft); }
  const footer=doc.createElement('div');footer.className='nb-terms-footer';footer.append(action,message);root.append(label,footer); container.append(root);
  let disposed=false;
  const change=()=>{if(!disposed)acceptance.setChecked(checkbox.checked);};
  const submit=()=>{if(!disposed)void acceptance.submit().catch(()=>{});};
  checkbox.addEventListener('change',change);
  action.addEventListener('click',submit);
  const unsubscribe = acceptance.subscribe(state=>{
    if(disposed)return;
    const focused=doc.activeElement;const ownedFocus=focused===checkbox||focused===action;
    checkbox.checked = state.checked; checkbox.disabled = !['idle','error'].includes(state.status);
    action.disabled = !state.checked || !['idle','error'].includes(state.status);
    root.dataset.status=state.status;
    root.setAttribute('aria-busy',String(state.status === 'submitting'));
    if(state.status==='recorded')renderTermsMessage(message,m?.recorded??'Agreement recorded for version {version}.',{version:offer.document.version});
    else message.textContent = state.status === 'submitting' ? m?.submitting??'Recording your agreement…' : state.status === 'stale' ? m?.stale??'The terms have changed. Reload to review the current version.' : state.status === 'retired' ? m?.retired??'This agreement context has closed. Contact the site operator to start a new workflow.' : state.error === 'unavailable' ? m?.unavailable??'This browser cannot start a secure agreement request. Try a supported browser over HTTPS.' : state.status === 'error' ? m?.error??"We couldn't confirm your agreement was saved. Please try again." : '';
    if(ownedFocus&&message.textContent&&(focused===checkbox?checkbox.disabled:action.disabled)&&(doc.activeElement===focused||doc.activeElement===doc.body))message.focus({preventScroll:true});
  });
  return { destroy() { if(disposed)return;disposed=true;checkbox.removeEventListener('change',change);action.removeEventListener('click',submit);unsubscribe();root.remove(); } };
}
