// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {cartridgeLibrary} from '@notabenda/core/cartridges';
import {renderCartridgeConsole} from '@notabenda/core/cartridges/ui';
export const cartridgeOptions={exampleLinks:Object.fromEntries(cartridgeLibrary().map(c=>[c.id,c.preview])),mapUrl:'/guide/compliance-map/',guideUrl:'/guide/cartridges/',documentationBase:'/guide'};
export function cartridgePage(){return renderCartridgeConsole(cartridgeOptions).replace(/nb-packs-\d+-pack-/gu,'pack-');}
