// @requirements REQ-PRODUCT-CONFIG-SOURCES REQ-PRODUCT-CONFIG
import {extname} from 'node:path';
import {readCliText} from './cli-json.js';
import {SiteConfigError} from './config.js';
import {validateAuthoredConfig} from './config-authoring.js';
import type {SiteConfig,ValidationOptions} from './types.js';

export type ConfigSourceFormat='json'|'yaml'|'markdown';
export interface ConfigSource {config:unknown;format:ConfigSourceFormat;notes:string}
export const MAX_CONFIG_SOURCE_BYTES=512*1024;
const invalid=():never=>{throw Error('Configuration must be UTF-8 text no larger than 512 KiB, with one root object.');};

export function configSourceFormat(path:string):ConfigSourceFormat {
 switch(extname(path).toLowerCase()){
  case '.json':return 'json';
  case '.yaml':case '.yml':return 'yaml';
  case '.md':return 'markdown';
  default:throw Error('Use a .json, .yaml, .yml or .md configuration file. Configuration does not execute JavaScript or MDX.');
 }
}

/** Parse data only. Markdown notes are returned separately, never merged into config. */
export async function parseConfigSource(source:string,format:ConfigSourceFormat):Promise<ConfigSource> {
 if(typeof source!=='string'||!source.trim()||new TextEncoder().encode(source).length>MAX_CONFIG_SOURCE_BYTES||source.includes('\0'))return invalid();
 source=source.replace(/^\uFEFF/u,'');let notes='',data=source;
 if(format==='markdown'){
  const match=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/u.exec(source);
  if(!match)throw Error('Start the configuration document with YAML frontmatter between --- lines.');
  data=match[1]!;notes=match[2]!;
 }else if(format!=='json'&&format!=='yaml')throw Error('Unknown configuration source format.');
 let config:unknown;
 if(format==='json'){try{config=JSON.parse(data);}catch{throw Error('Invalid JSON configuration.');}}
 else config=(await import('./config-yaml.js')).parseConfigYaml(data);
 if(!config||typeof config!=='object'||Array.isArray(config))return invalid();
 return {config,format,notes};
}

/** Explicit ordinary files only; no includes, environment expansion, imports or discovery. */
export async function readConfigSource(path:string):Promise<ConfigSource> {
 const format=configSourceFormat(path);
 return parseConfigSource(await readCliText(path,MAX_CONFIG_SOURCE_BYTES,'Config must be an ordinary UTF-8 file no larger than 512 KiB.'),format);
}
export async function readConfigInput(path:string):Promise<unknown>{return (await readConfigSource(path)).config;}

/** Build API: validates the same SiteConfig as JSON, retaining explicitly private fields. */
export async function readSiteConfig(path:string,options:ValidationOptions={}):Promise<SiteConfig>{
 const input=await readConfigInput(path),result=validateAuthoredConfig(input,{mode:options.mode??'production'});
 if(!result.valid)throw new SiteConfigError(result.diagnostics);
 return input as SiteConfig;
}

/** Serialize a generated draft. Does not modify an existing source or preserve its comments. */
export async function formatConfigSource(config:SiteConfig,format:ConfigSourceFormat,notes=''):Promise<string>{
 const result=validateAuthoredConfig(config,{mode:'preview'});if(!result.valid)throw new SiteConfigError(result.diagnostics);
 if(typeof notes!=='string'||notes.includes('\0'))return invalid();
 let output:string;
 if(format==='json')output=JSON.stringify(config,null,2)+'\n';
 else if(format==='yaml'||format==='markdown'){
  const yaml=(await import('./config-yaml.js')).formatConfigYaml(config);
  output=format==='markdown'?'---\n'+yaml+'---\n'+notes:yaml;
 }else throw Error('Unknown configuration source format.');
 await parseConfigSource(output,format);return output;
}
