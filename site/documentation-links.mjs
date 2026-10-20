// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {posix} from 'node:path';

/** Resolve repository links only to explicitly published docs, assets or source views. */
export function createDocumentationLinkResolver({docs,assets,sources}){
 const documents=new Map(docs),published=new Set(assets),sourceViews=new Map(sources);
 function rewrite(href,source){
  if(href.startsWith('#'))return href;
  if(/^\/backoffice(?:\/|$)/u.test(href))return href.replace(/^\/backoffice/u,'/demo/admin');
  if(/^http:\/\/(?:127\.0\.0\.1|localhost):417[89](?:\/|$)/u.test(href)){
   const url=new URL(href);return rewrite(url.pathname+url.search+url.hash,source);
  }
  if(/^[a-z][a-z0-9+.-]*:/iu.test(href)||href.startsWith('/'))return href;
  const hash=href.indexOf('#'),path=hash<0?href:href.slice(0,hash),fragment=hash<0?'':href.slice(hash);
  const resolved=posix.normalize(posix.join(posix.dirname(source),path));
  if(documents.has(resolved))return documents.get(resolved)+fragment;
  if(sourceViews.has(resolved))return sourceViews.get(resolved)+fragment;
  const asset=resolved==='LICENSE'?'license.txt':resolved;
  if(published.has(asset))return '/'+asset+fragment;
  throw Error(`Unpublished documentation link in ${source}: ${href} (${resolved}). Correct the reference or add an explicit public target.`);
 }
 return rewrite;
}
