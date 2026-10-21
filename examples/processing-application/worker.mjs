// @requirements REQ-PRODUCT-PROCESSING-CHOICES REQ-PRODUCT-PRIVACY-SIGNALS REQ-PRODUCT-CF-ADMIN
import {DurableObject} from 'cloudflare:workers';
import release from './.generated/release.mjs';
import {resolveVisitor,authorizeOperator} from './authorize.mjs';
import {createProcessingHost} from './host.mjs';
import {createProcessingWorkspace,createDeliverySink,processingReply} from './workspace.mjs';
export default {fetch:createProcessingHost({release,resolveVisitor,authorizeOperator})};
export class ProcessingWorkspace extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.workspace=createProcessingWorkspace(ctx.storage,release,{send:async input=>{const result=await env.DELIVERIES.getByName('processing:'+release.notice.siteId).receive(input);if(!result?.ok)throw Error();return result.value;}});}
  async read(streamId){return processingReply(()=>this.workspace.read(streamId));}
  async pending(streamId){return processingReply(()=>this.workspace.pending(streamId));}
  async record(streamId,input){return processingReply(()=>this.workspace.record(streamId,input));}
  async observe(streamId){return processingReply(()=>this.workspace.observe(streamId));}
  async produce(streamId,signal,channel){return processingReply(()=>this.workspace.produce(streamId,signal,channel));}
  async enqueue(streamId){return processingReply(()=>this.workspace.enqueue(streamId));}
  async dispatch(deliveryId){return processingReply(()=>this.workspace.dispatch(deliveryId));}
  async jobs(){return processingReply(()=>this.workspace.jobs());}
  async register(){return processingReply(()=>this.workspace.register());}
  async inspect(request){return this.workspace.inspect(request);}
}
export class DeliverySink extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.sink=createDeliverySink(ctx.storage);}
  async receive(input){return processingReply(()=>this.sink.receive(input));}
  async observations(){return processingReply(()=>this.sink.observations());}
}
