// @requirements REQ-PRODUCT-CONFIG-SOURCES REQ-PRODUCT-CONFIG
import {readCliText} from './cli-json.js';
import {SiteConfigError} from './config.js';
import {validateAuthoredConfig} from './config-authoring.js';
import type {SiteConfig,ValidationOptions} from './types.js';
import {configSourceFormat,parseConfigSource,MAX_CONFIG_SOURCE_BYTES} from './config-document.js';
import type {ConfigSource} from './config-document.js';
export {configSourceFormat,parseConfigSource,formatConfigSource,MAX_CONFIG_SOURCE_BYTES} from './config-document.js';
export type {ConfigSourceFormat,ConfigSource} from './config-document.js';

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
