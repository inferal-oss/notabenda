// @requirements REQ-PRODUCT-ASTRO REQ-PRODUCT-FORM-PERMISSIONS
import base from '../../../static/notabenda.config.json' with {type:'json'};
import {formPermissionExample} from '../../../form-permissions/example.mjs';
export const permissionExample=formPermissionExample(base);
