// @requirements REQ-PRODUCT-DEMO-WORKSPACE
// Both development entry points use the same isolated-session host; no second, shared-memory admin.
import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['scripts/site-wrangler.mjs','dev','--config','site/wrangler.jsonc','--ip','127.0.0.1','--port','4178','--persist-to','.local/example-site-state'],{stdio:'inherit',env:process.env});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',error=>{console.error(error.message);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
