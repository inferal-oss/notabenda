// @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import postcss from 'postcss';
// Derive the opt-in consent profile from the canonical stylesheet. Preserve its cascade,
// declarations and media conditions; do not maintain a second copy of component styling.
const related=/\.nb-(?:page|skip-link|legal-links|controls|consent-notice|choice-(?:actions|button|secondary)|text-button|preferences(?:-(?:trigger|header|body|footer))?|essential-note|purpose(?:-description)?|control-status)(?![\w-])/u;
const otherComponent=/\.nb-(?:terms|setup|discovery|collection|form-permission|rights|contract|processing-choices|embed|authored|release)(?![\w])/u;
export function createConsentStyles(source){
 const root=postcss.parse(source);
 root.walkComments(node=>node.remove());
 root.walkRules(rule=>{if((!related.test(rule.selector)&&rule.selector!==':root')||otherComponent.test(rule.selector))rule.remove();});
 const prune=node=>{if(!node.nodes)return;for(const child of [...node.nodes]){prune(child);if(child.type==='atrule'&&child.nodes&&!child.nodes.length)child.remove();}};prune(root);
 return '/* Consent profile generated from styles.css. Same tokens, cascade and accessibility rules. */\n'+root.toString().trim()+'\n';
}
