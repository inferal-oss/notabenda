// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-RIGHTS-CENTER
/** Public page chrome only. Destinations, scope and entitlement remain operator facts. */
export const rightsMessageFields={yourInformation:[],requestOption:[],draft:[],contactHeading:[],nextStepsHeading:[]} as const;
export type RightsMessages={[K in keyof typeof rightsMessageFields]:string};
export function supportsRightsPage(config:{site:{locale:string};localization?:{rights?:RightsMessages}}):boolean {
 return /^en(?:-|$)/iu.test(config.site.locale)||config.localization?.rights!==undefined;
}
/** Called only after the complete public configuration and messages have been validated. */
export function selectRightsMessages(config:{site:{locale:string};localization?:{rights?:RightsMessages}}):RightsMessages|undefined {
 if(!supportsRightsPage(config))throw Error('Localized privacy request pages need complete localization.rights messages. Keep the site locale and supply the page dictionary; collection messages do not translate it.');
 return config.localization?.rights;
}
