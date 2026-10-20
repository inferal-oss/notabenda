// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION REQ-PRODUCT-RIGHTS-CENTER REQ-PRODUCT-MOBILE
import {compileLegalDocuments} from '@notabenda/core/content';
import {renderLegalLinks} from '@notabenda/core';
/** Host-authored demonstration copy. It supplies no regional entitlement or request handling. */
export function localizedRightsConfig(base){
 const c=structuredClone(base);c.site.id='juniper-pt-rights';delete c.privacy.rightsUrl;
 for(const [kind,document] of Object.entries(c.documents))document.route='/localization/rights/'+kind;
 c.localization.rights={yourInformation:'Suas informações',requestOption:'OPÇÃO DE SOLICITAÇÃO',draft:'Informações sobre solicitações — rascunho para revisão.',contactHeading:'Fale com o responsável',nextStepsHeading:'Próximos passos'};
 c.rightsCenter={schemaVersion:1,revision:'requests-pt-1',route:'/localization/rights',title:'Solicitações de privacidade',intro:'Escolha uma opção ou fale com o responsável pelo tratamento das informações.',reviewStatus:'draft',contact:{label:'Enviar um e-mail',href:'mailto:privacy@example.test',description:'Use este contato se o caminho pela conta não atender à sua solicitação. O endereço deste exemplo não recebe mensagens.'},actions:[{id:'account-access',kind:'access',title:'Uma cópia das suas informações',description:'Veja como acessar o canal de solicitações.',scope:'Para informações relacionadas à sua conta. O aplicativo explica as verificações de identidade necessárias.',link:{label:'Ver o próximo passo',href:'/localization/rights/workflow'}}],nextSteps:['O canal indicado explica como apresentar sua solicitação e acompanhar a resposta.','Se o caminho pela conta não for adequado, use o contato público.']};
 return c;
}
export function localizedRightsFiles(base){
 const config=localizedRightsConfig(base),build=compileLegalDocuments(config,{mode:'preview',stylesheetUrl:'/assets/notabenda.css'});
 const html=`<!doctype html><html lang="pt-BR" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Próximo passo · Juniper</title><link rel="stylesheet" href="/assets/notabenda.css"></head><body class="nb-page"><a class="nb-skip-link" href="#main">Ir para o conteúdo</a><header class="nb-site-header"><a href="/localization/rights/">Juniper</a></header><main class="nb-document" id="main"><p class="nb-eyebrow">Canal de solicitações</p><h1>Próximo passo</h1><p>Este exemplo mostra onde o aplicativo recebe uma solicitação. Nenhuma solicitação foi enviada.</p><section><h2>No seu aplicativo</h2><p>Explique como apresentar a solicitação, quais verificações são necessárias e como acompanhar a resposta. Disponibilize um contato para quem não puder usar o caminho pela conta.</p><p><a href="/localization/rights/">Voltar às opções de privacidade</a></p></section></main><footer class="nb-site-footer">${renderLegalLinks(build.publicConfig)}</footer></body></html>`;
 return {...build.files,'localization/rights/workflow/index.html':html};
}
