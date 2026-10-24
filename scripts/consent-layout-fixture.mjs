// @requirements REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-LOCALIZATION
// Synthetic layout stress only: this is not a reviewed translation or legal notice.
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {localizedExampleConfig} from '../examples/localization/config.mjs';

export function consentLayoutFixture(base,direction){
 if(!['ltr','rtl'].includes(direction))throw Error('Use ltr or rtl for the layout fixture.');
 const config=localizedExampleConfig(base),m=config.localization.consent;
 config.localization.direction=direction;
 config.localization.revision='layout-'+direction;
 config.localization.reviewStatus='draft';
 if(direction==='rtl'){
  config.site.locale=config.localization.locale='ar-XB';
  // Mixed scripts deliberately test bidi layout; these are not Arabic translations.
  for(const key of Object.keys(m))m[key]='اختبار '+m[key];
 }else{
  m.title='Escolhas de privacidade e armazenamento neste navegador';
  m.summary=('Você decide se permite os recursos opcionais. Recusar mantém esses recursos desativados e não impede a leitura desta página. ').repeat(8).trim();
  m.preferencesTitle='Revisar todas as escolhas de privacidade e de armazenamento neste navegador';
  m.preferencesIntro=('Leia as finalidades e os serviços abaixo antes de decidir. Você pode alterar cada opção e salvar sua escolha. ').repeat(10).trim();
  m.acceptLabel='Permitir todos os recursos opcionais descritos nesta página';
  m.rejectLabel='Recusar todos os recursos opcionais descritos nesta página';
  m.saveLabel='Salvar somente as escolhas de privacidade selecionadas';
  m.closeLabel='Fechar estas configurações de privacidade';
  config.purposes[0].name='Finalidade'+ 'SemEspaços'.repeat(18);
  config.purposes[0].description+=' '+('Uma descrição adicional para conferir a leitura em uma tela estreita. ').repeat(12).trim();
 }
 return compileConsentRuntimeConfig(config,{mode:'preview',evidence:'local'});
}
