// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-FORM-PERMISSIONS
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {build} from 'esbuild';
import {createFormPermission} from 'notabenda';
import {ReactPermissionApp} from './react-view.mjs';
export async function reactPermissionFiles(offer,frames){
 const files={};for(const dark of [false,true]){const path=(dark?'dark/':'')+'form-permissions',controller=createFormPermission(offer,{allowPreview:true,streamRef:'0'.repeat(64),read:async()=>{throw Error('No transport during SSR');},submit:async()=>{throw Error('No transport during SSR');}});let html;try{html=renderToString(createElement(ReactPermissionApp,{controller,offer,dark}));}finally{controller.destroy();}
  files[path+'/react/index.html']=frames[path+'/index.html'].replace('<title>Email permissions · Juniper Notes</title>','<title>Email permissions with React · Juniper Notes</title>').replace('src="/assets/form-permissions.mjs"','src="/assets/react-form-permissions.mjs"').replace(/<main\b[\s\S]*?<\/main>/u,'<div id="react-permission-root">'+html+'</div>');
 }
 const bundled=await build({entryPoints:[new URL('./react-client.mjs',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true,external:['/assets/demo-session.mjs'],define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});files['assets/react-form-permissions.mjs']=bundled.outputFiles[0].text;return files;
}
