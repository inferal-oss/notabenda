// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-ADMIN
import {DurableObject} from 'cloudflare:workers';
import {authorizeHostRequest} from './authorize.mjs';
import {createHost} from './host.mjs';
import {createWorkspace} from './workspace.mjs';

export default {fetch:createHost(authorizeHostRequest)};
export class EvidenceWorkspace extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.workspace=createWorkspace(ctx.storage);}
 // Accessible through the private EVIDENCE binding, after the host has authorized inspection.
 async inspect(request,access){return this.workspace.inspect(request,access);}
 // Trusted application/build code may call this via its private binding. No public write route.
 async recordRelease(artifact,metadata){return this.workspace.recordRelease(artifact,metadata);}
}
