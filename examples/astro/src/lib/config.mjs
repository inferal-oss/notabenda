// @requirements REQ-PRODUCT-ASTRO
import base from '../../../static/notabenda.config.json' with {type:'json'};
import {compileLegalDocuments} from '@notabenda/core/content';
import {exampleConsentConfig} from '../../../static/choices-build.mjs';

const config=exampleConsentConfig(base);config.site.id='juniper-astro';
for(const item of config.storage)if(item.serviceId==='privacy-choices')item.name=item.name.replace('juniper-choices',config.site.id);
for(const item of config.storage)if(config.consent.services.some(s=>s.id===item.serviceId))item.name=`astro-demo:${item.serviceId}`;
for(const [kind,doc] of Object.entries(config.documents))doc.route=`/astro/${kind}`;
export const release=compileLegalDocuments(config,{mode:'preview',stylesheetUrl:'/astro/site.css'});
export const publicConfig=release.publicConfig;
