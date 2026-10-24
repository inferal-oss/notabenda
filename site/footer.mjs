// @requirements REQ-PRODUCT-RELEASE-CANDIDATE
// @requirements REQ-PRODUCT-CF-HOST REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
const groups=[
 {title:'Explore',links:[['Packs','/start'],['Examples','/examples'],['Demo workspace','/demo/admin']]},
 {title:'Build',links:[['Documentation','/guide'],['Software & storage','/guide/architecture'],['Agent setup','/guide/agent-setup']]},
 {title:'Project',links:[['Requirements','/guide/requirements'],['Scope & limits','/guide/scope'],['Source on GitHub','https://github.com/inferal-oss/notabenda']]},
];
export function websiteFooter(){
 return `<footer class="website-footer"><div class="footer-main"><div class="footer-identity"><a class="brand" href="/" aria-label="Notabenda home"><img src="/docs/assets/mark.svg" alt="" width="28" height="28"><span>notabenda</span></a><p>Legal pages, privacy choices<br> and the records behind them.</p><span class="footer-preview"><span aria-hidden="true"></span>Developer preview</span></div><nav class="footer-directory" aria-label="Footer">${groups.map((group,index)=>`<div class="footer-group"><h2 id="footer-group-${index}">${group.title}</h2><ul aria-labelledby="footer-group-${index}">${group.links.map(([label,href])=>`<li><a href="${href}">${label}${href.startsWith('https:')?' <span aria-hidden="true">↗</span>':''}</a></li>`).join('')}</ul></div>`).join('')}</nav></div><div class="footer-bottom"><p class="footer-sponsor">Sponsored by <a href="https://inferal.com/"><img src="/assets/inferal-mark.svg" width="12" height="14" alt="">Inferal</a></p><div class="footer-legal"><a href="/website-privacy">Website privacy</a><a href="/license.txt">Apache 2.0 / MIT</a><a href="/assets/THIRD-PARTY-NOTICES.txt">Third-party notices</a></div></div></footer>`;
}
