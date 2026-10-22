// @requirements REQ-PRODUCT-CF-ROLLOUT
// @requirements REQ-PRODUCT-CF-STARTER
// Export added only at the deliberate lifecycle boundary in the disposable exercise.
import {DurableObject} from 'cloudflare:workers';
import {createRolloutCanary} from './starter-rollout.mjs';
import {data} from './fixture-data.mjs';
export class RolloutCanary extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.canary=createRolloutCanary(ctx.storage,data);}
 touch(){return this.ctx.blockConcurrencyWhile(()=>this.canary.touch());}
 read(){return this.ctx.blockConcurrencyWhile(()=>this.canary.read());}
}
