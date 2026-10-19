import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
const root=new URL('../',import.meta.url).pathname;
await mkdir(new URL('../.local/wrangler-logs',import.meta.url),{recursive:true});
const args=process.argv.slice(2);
// Host-only development shortcut. Never inject into deploy, dry-run, or remote development.
if(args[0]==='dev'&&!args.some(arg=>arg==='--remote'||arg==='--remote=true'))args.push('--var','NOTABENDA_LOCAL_DEV_AUTH:1');
const child=spawn(process.execPath,[new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url).pathname,...args],{cwd:root,stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:new URL('../.local/wrangler-logs',import.meta.url).pathname}});
child.on('exit',(code,signal)=>{if(signal) process.kill(process.pid,signal); else process.exitCode=code ?? 1;});
