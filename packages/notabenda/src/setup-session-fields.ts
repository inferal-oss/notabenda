// @requirements REQ-PRODUCT-SETUP-SESSION
/** Plain, bounded values from trusted editor controls. No markup, selectors, file inputs or actions. */
export interface EditorFields {values:{tag:string;type:string;value:string;checked:boolean}[];details:boolean[]}
const controls=(root:HTMLElement)=>[...root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')].filter(e=>e.tagName!=='INPUT'||['text','search','url','number','checkbox'].includes((e as HTMLInputElement).type));
export function captureEditorFields(root:HTMLElement):EditorFields {
 return {values:controls(root).map(e=>({tag:e.tagName,type:e.type,value:e.value,checked:e.tagName==='INPUT'&&(e as HTMLInputElement).type==='checkbox'&&!e.hasAttribute('data-session-review')&&(e as HTMLInputElement).checked})),details:[...root.querySelectorAll('details')].map(e=>e.open)};
}
export function readEditorFields(value:unknown):EditorFields {
 const v=value as EditorFields;
 if(!v||typeof v!=='object'||Object.keys(v).sort().join(',')!=='details,values'||!Array.isArray(v.values)||v.values.length>2048||!Array.isArray(v.details)||v.details.length>512||v.details.some(b=>typeof b!=='boolean')||v.values.some(e=>!e||typeof e!=='object'||Object.keys(e).sort().join(',')!=='checked,tag,type,value'||!['INPUT','SELECT','TEXTAREA'].includes(e.tag)||!['text','search','url','number','checkbox','textarea','select-one'].includes(e.type)||typeof e.value!=='string'||e.value.length>30000||typeof e.checked!=='boolean'))throw Error('Incompatible editor draft.');
 return structuredClone(v);
}
/** Restore values into freshly constructed controls only. Review acknowledgments are always reset. */
export function restoreEditorFields(root:HTMLElement,value:unknown):void {
 const v=readEditorFields(value),fields=controls(root),details=[...root.querySelectorAll('details')];
 if(v.values.length!==fields.length||v.details.length!==details.length)throw Error('The saved editor structure changed.');
 fields.forEach((e,i)=>{const s=v.values[i]!;if(e.tagName!==s.tag||e.type!==s.type||e.tagName!=='SELECT'&&(e as HTMLInputElement).maxLength>=0&&s.value.length>(e as HTMLInputElement).maxLength||e.tagName==='SELECT'&&![...(e as HTMLSelectElement).options].some(o=>o.value===s.value)||'readOnly' in e&&e.readOnly&&e.value!==s.value)throw Error('The saved editor field changed.');});
 fields.forEach((e,i)=>{const s=v.values[i]!;e.value=s.value;if(e.tagName==='INPUT'&&e.type==='checkbox')(e as HTMLInputElement).checked=e.hasAttribute('data-session-review')?false:s.checked;});
 details.forEach((e,i)=>{e.open=v.details[i]!;});
}
export interface InventoryEditorDraft {open:boolean;proposal?:{id?:string;remove:boolean;fields:EditorFields;baseline:unknown}}
