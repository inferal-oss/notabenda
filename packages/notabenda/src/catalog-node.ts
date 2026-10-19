/** @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION */
import {readCliJson} from './cli-json.js';
import {normalizeServiceCatalog} from './catalog.js';
import type {ServiceCatalog} from './catalog.js';
/** Node-only, lazy catalog loading. Never imports operator/project modules or follows input symlinks. */
export async function loadServiceCatalog(path?:string):Promise<ServiceCatalog>{
 return normalizeServiceCatalog(path===undefined?(await import('./catalog-seed.js')).serviceCatalogSeed:await readCliJson(path,8*1024*1024,'Catalog input must be an ordinary, bounded UTF-8 JSON file.'));
}
