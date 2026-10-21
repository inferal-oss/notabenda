// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-CONSENT-NOTICE-FILES
import {DurableObject} from 'cloudflare:workers';
import release from './.generated/release.mjs';
import {authorizeVisitor,authorizeOperator} from './authorize.mjs';
import {createCookieHost} from './host.mjs';
import {createCookieWorkspace,cookieReply} from './workspace.mjs';
export default {fetch:createCookieHost({release,authorizeVisitor,authorizeOperator})};
export class CookieWorkspace extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.workspace=createCookieWorkspace(ctx.storage,release);}
  // Private binding only. Never forward browser-selected operations/grants into generic RPC.
  async read(streamId){return cookieReply(()=>this.workspace.read(streamId));}
  async record(streamId,command){return cookieReply(()=>this.workspace.record(streamId,command));}
  async register(){return cookieReply(()=>this.workspace.register());}
  async activate(){return cookieReply(()=>this.workspace.activate());}
  async inspect(request){return this.workspace.inspect(request);}
}
