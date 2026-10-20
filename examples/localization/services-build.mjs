// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-MOBILE
import {readFile} from 'node:fs/promises';
import {build as bundle} from 'esbuild';
import {toPublicConfig} from '@notabenda/core';
import {compileLegalDocuments} from '@notabenda/core/content';
import {renderServiceDirectoryPage} from '@notabenda/core/services';
import {localizedExampleConfig} from './config.mjs';
import {serviceExampleConfig} from '../services/build.mjs';
const messages=JSON.parse(await readFile(new URL('./service-messages.json',import.meta.url),'utf8'));
/** One language for both declared facts and interface copy; no provider is activated. */
export function localizedServicesConfig(base){
 const c=serviceExampleConfig(localizedExampleConfig(base));c.site.id='juniper-services-pt';c.localization.serviceDirectory=structuredClone(messages);c.localization.revision='services-copy-1';
 const use=[
  ['Entregar o site','Servir páginas e proteger o site contra solicitações abusivas.',['Metadados da solicitação','Endereço IP'],'Registros de acesso: 7 dias neste exemplo.'],
  ['Responder a mensagens','Entregar sua mensagem ao estúdio e permitir uma resposta.',['Nome','Endereço de e-mail','Mensagem'],'Até a resolução, mais 90 dias neste exemplo.'],
  ['Lembrar preferências','Manter a configuração de exibição que você escolheu.',['Configuração de exibição'],'30 dias neste exemplo.'],
  ['Entender a leitura','Medir quais páginas são úteis, quando você permite a medição opcional.',['Página visitada','Região aproximada'],'Relatórios agregados: 30 dias neste exemplo.'],
 ];
 for(const [i,p] of c.purposes.entries()){const [name,description,data,retention]=use[i];Object.assign(p,{name,description,dataCategories:data,retention,legalBasis:'Base ilustrativa; avalie o tratamento real antes de usar.',collection:{source:'direct',description:'Informações fornecidas pela pessoa ou pelo navegador.',required:false,consequences:'O recurso relacionado pode ficar indisponível.'}});}
 const names=['Hospedagem do site','Entrega de mensagens','Preferências de exibição','Medição de leitura'],locations=['Irlanda','Alemanha','Seu navegador','Países Baixos'];for(const [i,s] of c.services.entries()){s.name=names[i];s.location=locations[i];}
 c.storage[0].duration=c.storage[1].duration='30 dias';c.storage[0].necessityReason='Lembrar a exibição solicitada pela pessoa. A necessidade precisa ser avaliada para o uso real.';
 c.privacy.transfers='Os locais indicados são declarações de exemplo. Confira os destinatários, locais e condições de transferência do serviço real.';
 for(const [kind,document] of Object.entries(c.documents))document.route='/localization/services/'+kind;
 return c;
}
export async function localizedServicesFiles(base){
 const c=localizedServicesConfig(base),release=compileLegalDocuments(c,{mode:'preview',stylesheetUrl:'/assets/notabenda.css'});
 const client=await bundle({stdin:{contents:"import {mountServiceDirectory} from '@notabenda/core/services';const root=document.querySelector('[data-directory-root]');if(root)fetch('/localization/services/site.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(config=>mountServiceDirectory(root,config,{idPrefix:'services-pt',mode:'preview'})).catch(()=>{});",resolveDir:new URL('../../',import.meta.url).pathname},bundle:true,write:false,platform:'browser',format:'esm',target:'es2022',minify:true});
 const html=renderServiceDirectoryPage(c,{idPrefix:'services-pt',mode:'preview',stylesheetUrl:'/assets/localized-services.css'})
  .replace('class="nb-page nb-service-page"','class="nb-page nb-service-page nb-demo-page nb-demo-services"')
  .replace('</head>','<link rel="stylesheet" href="/assets/example-pages.css"><link rel="stylesheet" href="/assets/example-theme.css"></head>')
  .replace(/<header class="nb-site-header nb-service-sitebar">[\s\S]*?<\/header>/u,'<header class="nb-site-header nb-service-sitebar"><a class="demo-brand" href="/"><span>juniper<span class="demo-brand-separator">/</span>notas</span></a><nav aria-label="Navegação do exemplo"><a href="/examples/privacy-information/">← Exemplos</a><a href="/guide/services">Guia de integração ↗</a></nav></header>')
  .replace('<main id="main">','<main id="main"><div data-directory-root>')
  .replace('</main>','</div><aside class="nb-service-example-guide"><h2>Como ler este diretório</h2><p>Busque um fornecedor ou escolha uma finalidade. Abra os detalhes para ver os dados, o prazo e os itens de armazenamento associados. Os fatos deste exemplo são ilustrativos e não descrevem os fornecedores deste site.</p><p>O diretório lê o inventário declarado. Ele não descobre serviços nem os ativa; ler ou buscar não registra uma escolha.</p><a href="/guide/services">Guia de integração ↗</a> · <a href="/examples/privacy-information/">Voltar aos exemplos</a></aside></main>')
  .replace('</body>','<script type="module" src="/assets/localized-services.mjs"></script></body>');
 return {...release.files,'localization/services/index.html':html,'localization/services/site.json':JSON.stringify(toPublicConfig(c,{mode:'preview'})),'assets/localized-services.mjs':client.outputFiles[0].text,'assets/localized-services.css':await readFile(new URL('../../packages/notabenda/dist/services.css',import.meta.url),'utf8')+await readFile(new URL('./services.css',import.meta.url),'utf8')};
}
