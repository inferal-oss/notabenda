// @requirements REQ-PRODUCT-EMBED-LOCALIZATION
import {localizedEmbedFiles} from './embeds-build.mjs';
// @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION
import {localizedIndirectFiles} from './indirect-build.mjs';
// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION
import {localizedServicesFiles} from './services-build.mjs';
// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
import {localizedProcessingFiles} from './processing-build.mjs';
// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
import {localizedRightsFiles} from './rights-build.mjs';
import {localizedCollectionFiles} from './collection-build.mjs';
import {localizedPermissionFiles} from './permission-build.mjs';
import {localizedAgreementFiles} from './agreement-build.mjs';
// @requirements REQ-BR-COOKIE-UI REQ-BR-COOKIE-RIGHTS-LINK REQ-BR-COOKIE-BROWSER-HELP
// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {readFile} from 'node:fs/promises';
import {build as bundle} from 'esbuild';
import {compileLegalDocuments,compileConsentRuntimeConfig} from '@notabenda/core/content';
import {renderLegalLinks} from '@notabenda/core';
import {localizedExampleConfig} from './config.mjs';
export async function localizationFiles(base){
 const config=localizedExampleConfig(base),build=compileLegalDocuments(config,{mode:'preview',stylesheetUrl:'/assets/notabenda.css'});
 const client=(await bundle({entryPoints:[new URL('./client.mjs',import.meta.url).pathname],bundle:true,minify:true,platform:'browser',format:'esm',target:'es2022',write:false})).outputFiles[0].text;
 const html=`<!doctype html><html lang="pt-BR" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Um espaço para ler · Juniper</title><link rel="stylesheet" href="/assets/notabenda.css"><link rel="stylesheet" href="/assets/consent.css"><link rel="stylesheet" href="/assets/localization-example.css"><script type="module" src="/assets/localization.mjs"></script></head><body class="nb-page nb-demo-page nb-demo-localization"><a class="nb-skip-link" href="#main">Ir para o conteúdo</a><header class="nb-site-header"><a href="/">juniper <span aria-hidden="true">/</span> notas</a><nav aria-label="Navegação do exemplo"><a href="/examples/integrations/">← Exemplos</a><a href="/guide/localization">Guia de integração ↗</a></nav></header><main id="main" class="locale-main"><section class="locale-intro"><p class="nb-eyebrow">LEITURA / 04</p><h1>Um pouco de espaço.<br>Uma boa leitura.</h1><p>Textos para acompanhar o seu ritmo. Escolha se quer sugestões e uma contagem de leitura nesta sessão.</p></section><section class="locale-reading" aria-labelledby="reading-title"><div><p class="nb-eyebrow">CADERNO ABERTO</p><h2 id="reading-title">O valor de uma pausa</h2><p>Há dias em que uma página basta. Um lugar tranquilo, uma ideia que fica e tempo para seguir por outro caminho.</p><p class="locale-byline">Juniper · 3 minutos de leitura</p></div><aside><span class="locale-number" aria-hidden="true">04</span><div class="locale-feature"><p>Sugestões de leitura</p><output id="reading-state">Desativadas</output></div><div class="locale-feature"><p>Contagem nesta sessão</p><output id="count-state">Desativada</output></div></aside></section><div class="locale-settings"><p>Você pode alterar sua escolha a qualquer momento.</p><div id="privacy-controls"></div></div><details class="locale-about"><summary>Sobre esta integração</summary><p>Os textos e as mensagens em português foram fornecidos pela configuração do site. Os documentos são rascunhos para revisão, não um conjunto de regras jurídicas aprovado.</p><a href="/guide/localization">Ver a configuração e o guia ↗</a> · <a href="/localization/agreement/">Experimentar a concordância com os termos ↗</a></details><noscript><p>Os dois recursos opcionais permanecem desativados sem JavaScript. Os documentos abaixo continuam disponíveis.</p></noscript></main><footer class="nb-site-footer">${renderLegalLinks(build.publicConfig)}</footer></body></html>`;
 return {...await localizedEmbedFiles(base),...localizedIndirectFiles(base),...await localizedServicesFiles(base),...await localizedProcessingFiles(base),...localizedRightsFiles(config),...await localizedCollectionFiles(config),...await localizedPermissionFiles(config),...await localizedAgreementFiles(config),...build.files,'localization/runtime.json':JSON.stringify(compileConsentRuntimeConfig(config,{mode:'preview',evidence:'local'})),'localization/index.html':html,'assets/localization.mjs':client,'assets/localization-example.css':await readFile(new URL('./style.css',import.meta.url),'utf8')};
}
