// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {mountCartridgeConsole as mountConsole} from '@notabenda/core/cartridges/ui';
import {cartridgeOptions} from './cartridge-page.mjs';
export const mountCartridgeConsole=root=>mountConsole(root,{...cartridgeOptions,loadCatalog:()=>import('/assets/catalog-seed.mjs').then(module=>module.serviceCatalogSeed)});
const root=typeof document==='undefined'?null:document.querySelector('[data-cartridge-console]');if(root)mountCartridgeConsole(root);
