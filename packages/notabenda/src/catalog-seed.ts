// @requirements REQ-PRODUCT-SERVICE-CATALOG
import raw from './catalog-data.json' with {type:'json'};
import type {ServiceCatalog} from './catalog.js';
/** Optional full reference data. Import only in discovery/operator/build tooling. */
export const serviceCatalogSeed:ServiceCatalog=raw as ServiceCatalog;
