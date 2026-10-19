/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-EU-NOTICE */
import {toPublicConfig} from './config.js';
import type {PublicSiteConfig,ValidationOptions} from './types.js';

export interface DeclaredService {
  id:string; name:string; provider:string; location:string; privacyUrl?:string;
  purposes:{id:string;name:string;description:string;dataCategories:string[];legalBasis:string;retention:string}[];
  storage:{id:string;name:string;type:string;duration:string;classification:'necessary'|'optional';necessityReason?:string}[];
}

/** Internal projection from already validated public configuration. No catalog or runtime scope fields. */
export function declaredServices(config:PublicSiteConfig):DeclaredService[] {
  return config.services.map(service=>({
    id:service.id,name:service.name,provider:service.provider,location:service.location,
    ...(service.privacyUrl===undefined?{}:{privacyUrl:service.privacyUrl}),
    purposes:service.purposeIds.map(id=>{
      const purpose=config.purposes.find(p=>p.id===id)!;
      return {id:purpose.id,name:purpose.name,description:purpose.description,dataCategories:[...purpose.dataCategories],legalBasis:purpose.legalBasis,retention:purpose.retention};
    }),
    storage:config.storage.filter(item=>item.serviceId===service.id).map(item=>({
      id:item.id,name:item.name,type:item.type,duration:item.duration,classification:item.classification,
      ...(item.necessityReason===undefined?{}:{necessityReason:item.necessityReason}),
    })),
  }));
}

/** Detached public display facts, including custom services. Declared use is never inferred from detection. */
export function createServiceInventory(input:unknown,options:ValidationOptions={}):DeclaredService[] {
  return declaredServices(toPublicConfig(input,{mode:options.mode??'production'}));
}
