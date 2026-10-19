// @requirements REQ-PRODUCT-A11Y
// @requirements REQ-PRODUCT-MOBILE
// @requirements REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-DEMO-WORKSPACE REQ-PRODUCT-SETUP
export function adminPresentation(basePath){
 const demo=basePath==='/demo/admin';
 return {
  workspaceLabel:demo?'Your demo workspace':'Evidence studio',
  workspaceNote:demo?'Your session workspace. Cleared after a day without use.':'Protected evidence. Your host controls access, scope and permissions.',
  navigation:[{label:demo?'Workspace overview':'All sample evidence',href:demo?basePath:basePath+'/evidence'},...[
   ['history','Document revisions'],['choices','Cookie choices'],['agreements','Terms agreements'],['processing','Processing opt-outs'],['permissions','Form permissions'],['contracts','Contract declarations'],['recorded','Sandbox activity'],['lifecycle','Retention & holds'],['setup','Guided setup']
  ].map(([path,label])=>({label,href:basePath+'/'+path})),{label:'Back to examples',href:'/examples'},{label:'Website privacy',href:'/website-privacy'}],
 };
}
