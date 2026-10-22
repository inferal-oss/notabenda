// @requirements REQ-PRODUCT-CF-ROLLOUT
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-REMOTE-RECOVERY
// Generated worker/host/workspace files are imported unchanged by this maintainer-only wrapper.
import {DurableObject} from 'cloudflare:workers';
import generated,{EvidenceWorkspace} from './generated-worker.mjs';
import {authorizeHostRequest} from './authorize.mjs';
import {createRolloutHost,createRolloutControl,rolloutReply} from './starter-rollout.mjs';
import {data} from './fixture-data.mjs';
export {EvidenceWorkspace};
export class RolloutControl extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.control=createRolloutControl(ctx.storage,data,env.EVIDENCE.getByName('notabenda:'+data.siteId));}
 command(action){return this.ctx.blockConcurrencyWhile(()=>rolloutReply(()=>this.control.run(action)));}
}
export default createRolloutHost(generated.fetch,authorizeHostRequest,data);
