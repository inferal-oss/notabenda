// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {cartridgeLibrary} from 'notabenda/cartridges';
import {renderCartridgeConsole} from 'notabenda/cartridges/ui';
export const cartridgeOptions={exampleLinks:Object.fromEntries(cartridgeLibrary().map(c=>[c.id,c.preview])),mapUrl:'/guide/compliance-map/',guideUrl:'/guide/cartridges/',documentationBase:'/guide'};
export function cartridgePage(){return renderCartridgeConsole(cartridgeOptions);}
