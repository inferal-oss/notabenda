// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-SETUP
import {mountCartridgeConsole} from '/assets/runtime/cartridges-ui.js';
mountCartridgeConsole(document.querySelector('[data-notabenda-setup]'),{documentationBase:'/guide',mapUrl:'/guide/compliance-map/',guideUrl:'/guide/cartridges/',loadCatalog:()=>import('/assets/catalog-seed.mjs').then(module=>module.serviceCatalogSeed)});
