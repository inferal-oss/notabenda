// @requirements REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-ASTRO
import base from '../../../static/notabenda.config.json' with {type:'json'};
import {agreementExample} from '../../../agreements/example.mjs';
export const agreement=agreementExample(base);
