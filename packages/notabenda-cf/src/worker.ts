// @requirements REQ-PRODUCT-SERVICE-CATALOG
import {renderCatalogReview} from './catalog-render.js';
/** @requirements REQ-PRODUCT-EVIDENCE-EXPORT */
import {createEvidenceExportSegment, readRecordPage, recordQueryParams, MAX_EXPORT_BYTES} from './export.js';
import { boundedText, MAX_PAGE_SIZE, normalizeRecord, validId } from './records.js';
import { renderRecordDetail, renderRecordDiff, renderRecordList, renderDocumentSource, renderEvidenceExport } from './render.js';
import type { AdminWorker, AdminWorkerOptions, AuthorizationGrant, RecordQuery } from './types.js';
import {normalizeAdminPresentation} from './presentation.js';

const date = (value: string) => !value || /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
function headers(nonce?: string): Headers {
  return new Headers({
    'content-type': nonce ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
    'cache-control': 'no-store, private', 'pragma': 'no-cache',
    'content-security-policy': `default-src 'none'; ${nonce ? `style-src 'nonce-${nonce}'; ` : ''}base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'`,
    'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY',
    'x-robots-tag': 'noindex, nofollow', 'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'vary': 'Cookie, Authorization',
  });
}
function parseQuery(url: URL): RecordQuery {
  const params = url.searchParams;
  for (const key of params.keys()) if (!['q','kind','key','from','to','limit','after'].includes(key) || params.getAll(key).length !== 1) throw new Error('Invalid query.');
  const query = params.get('q') ?? ''; const kind = params.get('kind') ?? ''; const keyPrefix = params.get('key') ?? '';
  const from = params.get('from') ?? ''; const to = params.get('to') ?? ''; const after = params.get('after');
  const limitText = params.get('limit') ?? '25';
  if (!/^\d{1,2}$/u.test(limitText)) throw new Error('Invalid query.');
  const limit = Number(limitText);
  if (!boundedText(query, 256) || !boundedText(kind, 64) || !boundedText(keyPrefix, 128) || !date(from) || !date(to) || from && to && from > to || limit < 1 || limit > MAX_PAGE_SIZE || after !== null && (!validId(after) || !after.startsWith(keyPrefix))) throw new Error('Invalid query.');
  return { query, kind, keyPrefix, from, to, limit, ...(after === null ? {} : { after }) };
}

/** @requirements REQ-PRODUCT-CF-ADMIN: all access, including failures, is guarded by the host hook. */
export function createAdminWorker<Env = unknown>(options: AdminWorkerOptions<Env>): AdminWorker<Env> {
  if (!options || typeof options.authorize !== 'function') throw new Error('A host authorization hook is required.');
  const authorize = options.authorize;
  const basePath = options.basePath ?? '/admin/notabenda';
  const title = options.title ?? 'Privacy evidence';
  if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/u.test(basePath) || basePath.length > 200) throw new Error('Use a clean absolute base path.');
  if (!boundedText(title, 120) || !title.trim()) throw new Error('Use a short workspace title.');
  const presentation=normalizeAdminPresentation(options);
  return {
    async fetch(request, env, context) {
      const response = (body: string, status: number, custom?: Headers) => new Response(request.method === 'HEAD' ? null : body, { status, headers: custom ?? headers() });
      let grant: AuthorizationGrant | null;
      try {
        grant = await authorize(request, env, context);
        if (!grant || !grant.store || typeof grant.store.list !== 'function' || typeof grant.store.get !== 'function' || (grant.scopeLabel !== undefined && !boundedText(grant.scopeLabel, 200)) || (grant.allowExport !== undefined && typeof grant.allowExport !== 'boolean') || (grant.allowCatalogReview!==undefined&&typeof grant.allowCatalogReview!=='boolean')) return response('Access denied.', 403);
      } catch { return response('Access denied.', 403); }
      if (request.method !== 'GET' && request.method !== 'HEAD') { const h = headers(); h.set('allow', 'GET, HEAD'); return response('Method not allowed.', 405, h); }
      if (request.url.length > 4096) return response('Request is too long.', 414);
      let url: URL;
      try { url = new URL(request.url); } catch { return response('Invalid request.', 400); }
      if (![basePath, `${basePath}/`, `${basePath}/record`, `${basePath}/diff`, `${basePath}/source`, `${basePath}/source-diff`, `${basePath}/catalog-review`, `${basePath}/catalog-review-diff`, `${basePath}/export`, `${basePath}/export.json`].includes(url.pathname)) return response('Not found.', 404);
      const nonce = crypto.randomUUID().replaceAll('-', '');
      const view = { ...presentation, basePath, title, scopeLabel: grant.scopeLabel ?? 'Host-authorized records', nonce, exportEnabled:grant.allowExport===true, sourceEnabled:typeof grant.store.getSource==='function',catalogReviewEnabled:grant.allowCatalogReview===true&&typeof grant.store.getCatalogReview==='function' };
      if(url.pathname===`${basePath}/catalog-review`||url.pathname===`${basePath}/catalog-review-diff`){
        if(grant.allowCatalogReview!==true)return response('Catalog review inspection is not authorized.',403);
        if(!grant.store.getCatalogReview)return response('Catalog review inspection is unavailable.',404);
        const compare=url.pathname.endsWith('-diff'),allowed=compare?['before','after']:['id'];
        const ids=allowed.map(k=>url.searchParams.get(k));
        if(url.searchParams.size!==allowed.length||[...url.searchParams.keys()].some(k=>!allowed.includes(k))||ids.some(id=>!id||! /^[a-f0-9]{64}$/u.test(id)))return response('Invalid catalog review reference.',400);
        try{
          const records=await Promise.all(ids.map(async id=>{const raw=await grant.store.getCatalogReview!(id!);if(raw===undefined)return undefined;const record=normalizeRecord(raw);if(record.id!==id)throw Error('Invalid store response.');return record;}));
          if(records.some(r=>r===undefined))return response('Retained catalog review not found.',404);
          return response(renderCatalogReview(records[0]!,compare?records[1]:undefined,view),200,headers(nonce));
        }catch{return response('Catalog reviews could not be inspected.',500);}
      }
      if (url.pathname === `${basePath}/source` || url.pathname === `${basePath}/source-diff`) {
        const compare = url.pathname.endsWith('/source-diff');
        const kind = url.searchParams.get('kind');
        const first = url.searchParams.get(compare ? 'before' : 'id');
        const second = compare ? url.searchParams.get('after') : null;
        const allowed = compare ? ['before','after','kind'] : ['id','kind'];
        if (!kind || !['privacy','cookies','terms'].includes(kind) || !first || !/^[a-f0-9]{64}$/u.test(first) || compare && (!second || !/^[a-f0-9]{64}$/u.test(second)) || url.searchParams.size !== allowed.length || [...url.searchParams.keys()].some(key => !allowed.includes(key))) return response('Invalid source reference.', 400);
        if (!grant.store.getSource) return response('Source inspection is unavailable for this store.', 404);
        try {
          const fetchSource = async (id: string) => {
            const raw = await grant.store.getSource!(id, kind as 'privacy'|'cookies'|'terms');
            if (raw === undefined) return undefined;
            const record = normalizeRecord(raw);
            if (record.id !== `${id}/${kind}`) throw new Error('Invalid store response.');
            return record;
          };
          const before = await fetchSource(first);
          const after = second ? await fetchSource(second) : undefined;
          if (!before || compare && !after) return response('Authored source not found.', 404);
          return response(renderDocumentSource(before, after, view), 200, headers(nonce));
        } catch { return response('The source could not be inspected.', 500); }
      }
      if (url.pathname === `${basePath}/diff`) {
        const beforeId = url.searchParams.get('before'); const afterId = url.searchParams.get('after'); const kind = url.searchParams.get('kind') ?? 'privacy';
        if (!validId(beforeId) || !validId(afterId) || !['privacy','cookies','terms'].includes(kind) || [...url.searchParams.keys()].some(key => !['before','after','kind'].includes(key) || url.searchParams.getAll(key).length !== 1)) return response('Invalid release comparison.', 400);
        try {
          const [before, after] = await Promise.all([grant.store.get(beforeId), grant.store.get(afterId)]);
          if (!before || !after) return response('Release not found.', 404);
          if (before.id !== beforeId || after.id !== afterId) throw new Error('Invalid store response.');
          return response(renderRecordDiff(normalizeRecord(before), normalizeRecord(after), kind, view), 200, headers(nonce));
        } catch { return response('The releases could not be compared.', 500); }
      }
      if (url.pathname === `${basePath}/record`) {
        const id = url.searchParams.get('id');
        if (url.searchParams.size !== 1 || !validId(id)) return response('Invalid record key.', 400);
        try {
          const raw = await grant.store.get(id);
          if (raw === undefined) return response('Record not found.', 404);
          const record = normalizeRecord(raw);
          if (record.id !== id) throw new Error('Invalid store response.');
          return response(renderRecordDetail(record, view), 200, headers(nonce));
        } catch { return response('The record could not be inspected.', 500); }
      }
      const exporting=url.pathname===`${basePath}/export`||url.pathname===`${basePath}/export.json`;
      if(exporting&&grant.allowExport!==true)return response('Export is not authorized.',403);
      let query: RecordQuery;
      try { query = parseQuery(url); } catch { return response('Invalid search filters.', 400); }
      try {
        if(exporting){
          const segment=await createEvidenceExportSegment(grant.store,query,{scopeLabel:view.scopeLabel});
          if(url.pathname.endsWith('.json')){
            const next=segment.segment.nextAfter;
            const document={...segment,links:{review:`${basePath}/export?${recordQueryParams(query)}`,...(next===undefined?{}:{nextReview:`${basePath}/export?${recordQueryParams({...query,after:next})}`,nextDownload:`${basePath}/export.json?${recordQueryParams({...query,after:next})}`})}};
            const body=JSON.stringify(document);
            if(new TextEncoder().encode(body).length>MAX_EXPORT_BYTES)throw new Error('Export exceeds limits.');
            const h=headers();h.set('content-type','application/json; charset=utf-8');h.set('content-disposition','attachment; filename="notabenda-evidence.json"');
            return response(body,200,h);
          }
          return response(renderEvidenceExport(segment,view),200,headers(nonce));
        }
        const page=await readRecordPage(grant.store,query);
        return response(renderRecordList(page, query, view), 200, headers(nonce));
      } catch { return response(exporting?'Evidence could not be exported.':'Records could not be inspected.', 500); }
    },
  };
}
