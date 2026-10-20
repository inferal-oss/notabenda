// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-AGENT-INTEGRATION
import {packGroups,cartridgeLibrary,selectCartridges,planCartridges,formatCartridgeBrief} from './cartridges.js';
export async function runCartridgesCli(args:string[]):Promise<void>{
 let json=false,brief=false;const ids:string[]=[],seen=new Set<string>();
 for(const arg of args){if(arg.startsWith('-')){if(seen.has(arg)||!['--json','--brief'].includes(arg))throw Error('Use packs [ID ...] with one --json or --brief.');seen.add(arg);if(arg==='--json')json=true;else brief=true;}else ids.push(arg);}
 if(json&&brief||brief&&!ids.length)throw Error('Choose packs before requesting --brief; it cannot be combined with --json.');
 if(!ids.length){const library=cartridgeLibrary();console.log(json?JSON.stringify({schemaVersion:1,kind:'notabenda-cartridge-library',cartridges:library,groups:packGroups()},null,2):'Choose a pack\n\n'+packGroups().map(g=>g.title+'\n'+library.filter(c=>c.shelf===g.id).map(c=>`${c.id} · ${c.title}\n  ${c.outcome}`).join('\n\n')).join('\n\n')+'\n\nPrepare a plan: notabenda packs ID [ID ...] --json\nStart a draft: notabenda wizard --packs ID,ID');return;}
 const selection=selectCartridges(ids),plan=planCartridges(selection);
 console.log(brief?formatCartridgeBrief(selection):json?JSON.stringify(plan,null,2):plan.cartridges.map(c=>`${c.title}\n${c.outcome}\n${c.lesson}`).join('\n\n')+'\n\nNext: notabenda wizard --packs '+ids.join(',')+'\nSupporting work: '+(plan.supportingWork.map(s=>s.title+' (check existing)').join(', ')||'none')+'\nNo site changes made. Use --json for the selected facts and integration checks.');
}
