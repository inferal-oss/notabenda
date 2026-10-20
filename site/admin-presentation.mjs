// @requirements REQ-PRODUCT-WORKSPACE-OVERVIEW
// @requirements REQ-PRODUCT-A11Y
// @requirements REQ-PRODUCT-MOBILE
// @requirements REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-SETUP
export function adminPresentation(basePath){
 const demo=basePath==='/demo/admin';
 return {
  workspaceLabel:demo?'Your demo workspace':'Evidence workspace',
  workspaceNote:demo?'Your session workspace. Cleared after a day without use.':'Your host controls access to these records.',
  navigation:[{label:'Workspace overview',href:basePath},...[
   ...(demo?[['orders','Order requests']]:[]),['history','Document revisions'],['choices','Cookie choices'],['agreements','Terms agreements'],['processing','Processing opt-outs'],['permissions','Form permissions'],['contracts','Contract declarations'],...(!demo?[['recorded','Sandbox activity']]:[]),['lifecycle','Retention & holds'],['setup','Guided setup']
  ].map(([path,label])=>({label,href:basePath+'/'+path})),{label:'Back to examples',href:'/examples'},{label:'Website privacy',href:'/website-privacy'}],
 };
}
