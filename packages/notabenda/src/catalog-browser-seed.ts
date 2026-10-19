/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION */
import data from './catalog-browser-data.json' with {type:'json'};
import type {BrowserRuleSet} from './catalog-browser-policy.js';
/** Original technical rules and a compact reference snapshot; no legal or deployment assertion. */
export const browserCatalogSeed:BrowserRuleSet=data as unknown as BrowserRuleSet;
