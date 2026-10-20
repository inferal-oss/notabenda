// @requirements REQ-PRODUCT-RECORDING-INSPECTION
import type {JsonValue} from './types.js';
export type RecordingFamily='consent'|'terms'|'form-permission';
export interface RecordingDocument {title:string;version:string;effectiveDate:string;url:string;sha256:string}
export interface RecordingTarget {id:string;artifactId:string;mode:'preview'|'production';document:RecordingDocument}
/** A backend selection only. It says nothing about browser publication, identity or current permission. */
export interface RecordingSelection {schemaVersion:1;family:RecordingFamily;siteId:string;scopeId:string;status:'unconfigured'|'inactive'|'selected';selected:RecordingTarget|null;activationRevision?:number}
/** Inputs have already passed their family validator and archive verification. */
export function recordingTarget(value:Record<string,JsonValue>,id:string,document:Record<string,JsonValue>):RecordingTarget {
 return {id,artifactId:String(value.artifactId),mode:value.mode as 'preview'|'production',document:{title:String(document.title),version:String(document.version),effectiveDate:String(document.effectiveDate),url:String(document.url),sha256:String(document.sha256)}};
}
