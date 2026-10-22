// @requirements REQ-PRODUCT-SYNTAX-HIGHLIGHTING REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y REQ-PRODUCT-SAFE-CONTENT
// Build-time only. Render escaped source and external CSS, without inline styles or browser scripts.
import {createHighlighter} from 'shiki';
import {createHash} from 'node:crypto';
const escape=value=>String(value).replace(/[&<>"']/gu,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const labels={typescript:'TypeScript',javascript:'JavaScript',tsx:'TSX',jsx:'JSX',json:'JSON',jsonc:'JSON with comments',css:'CSS',html:'HTML',xml:'XML',shellscript:'Shell',markdown:'Markdown',mdx:'MDX',astro:'Astro',python:'Python',yaml:'YAML',mermaid:'Mermaid',diff:'Diff',sql:'SQL',toml:'TOML',text:'Plain text'};
const aliases={ts:'typescript',js:'javascript',mjs:'javascript',cjs:'javascript',sh:'shellscript',bash:'shellscript',shell:'shellscript',md:'markdown',yml:'yaml',py:'python',plaintext:'text',plain:'text',console:'text'};
export const syntaxBackgrounds={light:'#f7f7f9',dark:'#202126'};
const rgb=hex=>[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16));
const luminance=hex=>rgb(hex).map(channel=>{const value=channel/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
export function contrastRatio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function color(value,mode){
 const background=syntaxBackgrounds[mode],channels=/^#[a-f0-9]{6}(?:[a-f0-9]{2})?$/iu.test(value??'')?rgb(value):rgb(mode==='dark'?'#e1e4e8':'#24292e');
 const alpha=value?.length===9?parseInt(value.slice(7,9),16)/255:1;
 const original=channels.map((channel,index)=>Math.round(channel*alpha+rgb(background)[index]*(1-alpha)));
 const hex=values=>'#'+values.map(v=>v.toString(16).padStart(2,'0')).join('');
 for(let step=0;step<=100;step++){const target=mode==='dark'?255:0,adjusted=hex(original.map(channel=>Math.round(channel+(target-channel)*step/100)));if(contrastRatio(adjusted,background)>=4.6)return adjusted;}
 throw Error('Syntax palette contrast could not be resolved.');
}
function style(token,mode){const font=token?.fontStyle??0;return {color:color(token?.color,mode),italic:!!(font&1),bold:!!(font&2),underline:!!(font&4)};}
export async function createCodeHighlighter(){
 const highlighter=await createHighlighter({themes:['github-light','github-dark'],langs:Object.keys(labels).filter(lang=>lang!=='text')});
 const styles=new Map();
 function language(info){const first=String(info??'').trim().split(/\s+/u)[0].toLowerCase(),name=aliases[first]??first;return Object.hasOwn(labels,name)?name:'text';}
 function renderBlock(source,info='',{dark=false}={}){
  if(typeof source!=='string')throw TypeError('Code examples must be text.');const lang=language(info);
  let body=escape(source);
  if(lang!=='text')body=highlighter.codeToTokensWithThemes(source,{lang,themes:{light:'github-light',dark:'github-dark'}}).map(line=>line.map(token=>{
   const variants={light:style(token.variants.light,'light'),dark:style(token.variants.dark,'dark')},serialized=JSON.stringify(variants),name='nb-token-'+createHash('sha256').update(serialized).digest('hex').slice(0,12);
   if(styles.has(name)&&JSON.stringify(styles.get(name))!==serialized)throw Error('Syntax style identity conflict.');styles.set(name,variants);return `<span class="nb-token ${name}">${escape(token.content)}</span>`;
  }).join('')).join('\n');
  return `<pre class="nb-code" role="group" tabindex="0" aria-label="${escape(labels[lang])} code example" data-code-language="${lang}"${dark?' data-code-theme="dark"':''}><code class="language-${lang}">${body}</code></pre>\n`;
 }
 function stylesheet(){
  const rules=[`/* Generated build-time syntax styles. */\n.nb-code{--nb-code-bg:${syntaxBackgrounds.light};--nb-code-ink:#24292e;color:var(--nb-code-ink);background:var(--nb-code-bg);max-width:100%;overflow:auto;tab-size:2}.nb-code code{font:inherit;background:none;padding:0;color:inherit}.nb-code .nb-token{color:var(--nb-token-light);font-style:var(--nb-token-light-style);font-weight:var(--nb-token-light-weight);text-decoration:var(--nb-token-light-decoration)}.nb-code:focus-visible{outline:3px solid var(--nb-focus,#6668e8);outline-offset:4px}\n:is(.nb-demo-midnight,.choices-midnight,.discovery-midnight,.code-panel,[data-theme=dark]) .nb-code,.nb-code[data-code-theme=dark]{--nb-code-bg:${syntaxBackgrounds.dark};--nb-code-ink:#e1e4e8}:is(.nb-demo-midnight,.choices-midnight,.discovery-midnight,.code-panel,[data-theme=dark]) .nb-code .nb-token,.nb-code[data-code-theme=dark] .nb-token{color:var(--nb-token-dark);font-style:var(--nb-token-dark-style);font-weight:var(--nb-token-dark-weight);text-decoration:var(--nb-token-dark-decoration)}`];
  for(const [name,variants] of [...styles].sort(([a],[b])=>a.localeCompare(b))){const declarations=Object.entries(variants).flatMap(([mode,s])=>[`--nb-token-${mode}:${s.color}`,`--nb-token-${mode}-style:${s.italic?'italic':'normal'}`,`--nb-token-${mode}-weight:${s.bold?'600':'400'}`,`--nb-token-${mode}-decoration:${s.underline?'underline':'none'}`]);rules.push(`.nb-code .${name}{${declarations.join(';')}}`);}
  rules.push('@media(forced-colors:active){.nb-code{background:Canvas!important;color:CanvasText!important;border:1px solid CanvasText}.nb-code .nb-token{color:CanvasText!important}}');return rules.join('\n')+'\n';
 }
 return {renderBlock,stylesheet,dispose:()=>highlighter.dispose()};
}
