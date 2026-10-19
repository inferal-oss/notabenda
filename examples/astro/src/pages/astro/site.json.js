// @requirements REQ-PRODUCT-ASTRO
import {publicConfig} from '../../lib/config.mjs';
export const GET=()=>Response.json(publicConfig);
