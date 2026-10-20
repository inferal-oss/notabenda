// @requirements REQ-PRODUCT-STORAGE-LOCALIZATION REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-STORAGE-EXCEPTIONS
/** Visitor-facing chrome only. Entry facts, profile eligibility and the preference journal remain separate. */
export const storageExceptionMessageFields={title:[],description:[],retryLabel:[],turnOffLabel:[],enabledReload:[],on:[],objected:[],stale:[],restricted:[],saving:[],checkingEntry:[],off:[],unconfirmed:[],unavailable:[],checking:[],browserScope:[],destroyed:[]} as const;
export type StorageExceptionMessages={[K in keyof typeof storageExceptionMessageFields]:string};
export function supportsStorageExceptionControls(config:{site:{locale:string};localization?:{storageExceptions?:StorageExceptionMessages}}):boolean {
 return /^en(?:-|$)/iu.test(config.site.locale)||config.localization?.storageExceptions!==undefined;
}
/** Complete configuration validation precedes selection. No per-field language fallback. */
export function selectStorageExceptionMessages(config:{site:{locale:string};localization?:{storageExceptions?:StorageExceptionMessages}}):StorageExceptionMessages|undefined {
 if(!supportsStorageExceptionControls(config))throw Error('Localized storage exception controls need complete localization.storageExceptions messages. Keep the site locale and supply the dictionary, or use a host-owned headless presentation.');
 return config.localization?.storageExceptions;
}
