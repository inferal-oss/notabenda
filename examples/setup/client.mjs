// @requirements REQ-PRODUCT-SETUP
import {mountSetup} from '/assets/runtime/setup-ui.js';
mountSetup(document.querySelector('[data-notabenda-setup]'),{documentationBase:'/guide',loadCatalog:()=>import('/assets/catalog-seed.mjs').then(module=>module.serviceCatalogSeed)});
