// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY
// Synthetic maintainer host only; this file is not copied into published packages or starters.
import {DurableObject} from 'cloudflare:workers';
import {createRemoteRecoveryControl,createRemoteRecoveryEvidence,fixtureReply,createRemoteRecoveryHandler} from './remote-recovery.mjs';
import {createDeliverySink} from '../../examples/processing-application/workspace.mjs';
import {createTransactionProvider} from './transaction-recovery.mjs';
import {data} from './data.mjs';
export class RecoveryControl extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.control=createRemoteRecoveryControl(ctx.storage,data);}
 command(action,payload){return this.ctx.blockConcurrencyWhile(()=>fixtureReply(()=>this.control.run(action,payload)));}
}
export class RecoveryEvidence extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.evidence=createRemoteRecoveryEvidence(ctx,env.CONTROL.getByName('control:'+data.runId),data,env.SINK.getByName('sink:'+data.runId),env.SINK.getByName('transaction-provider:'+data.runId));}
 command(action){return this.evidence.command(action);}
}
export class RecoverySink extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.sink=createDeliverySink(ctx.storage);this.provider=createTransactionProvider(ctx.storage);}
 receive(input){return fixtureReply(()=>this.sink.receive(input));}
 observations(){return fixtureReply(()=>this.sink.observations());}
 transactionReceive(input){return fixtureReply(()=>this.provider.receive(input));}
 transactionObservations(){return fixtureReply(()=>this.provider.observations());}
}
export default createRemoteRecoveryHandler(data);
