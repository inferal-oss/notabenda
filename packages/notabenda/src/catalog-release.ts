// @requirements REQ-PRODUCT-TERMS-AUTHORING
/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-CF-HISTORY */
import {canonicalJson,sha256} from './content.js';
import type {LegalBuild,LegalSourceArchive} from './content.js';
import {normalizeSetupCatalogSelections} from './catalog-selection.js';
import {normalizeCatalogReleaseReview} from './catalog-release-policy.js';
import {createRetainedReleaseFiles} from './release-files.js';
export type {CatalogReleaseReview,CatalogReleaseSelection,CatalogReviewDescriptor} from './catalog-release-policy.js';
/** Finalize after static/MDX compilation and before creating any notice or offer. No reference refresh or publication. */
export function attachCatalogReview<T extends LegalBuild>(build:T,selections:unknown):T&{archive:LegalSourceArchive} {
 const publicArtifact=createRetainedReleaseFiles([build.artifact],{siteId:build.publicConfig.site.id,mode:build.manifest.mode,includeTermsOffers:false});
 if(build.manifest.catalogReview!==undefined||canonicalJson(build.manifest)!==canonicalJson(build.artifact.manifest)||canonicalJson(build.publicConfig)!==canonicalJson(build.artifact.publicConfig))throw Error('Attach catalog review to a fresh, intact compiler build before creating notices or offers.');
 for(const [path,value] of Object.entries(publicArtifact))if(build.files[path]!==value)throw Error('Compiler files no longer match this artifact.');
 const selected=normalizeSetupCatalogSelections(selections,build.publicConfig);
 const catalogReview=normalizeCatalogReleaseReview({schemaVersion:1,kind:'catalog-release-review',selections:selected.map(({reference,service,purposes,review})=>({reference,service,purposes,review}))},build.publicConfig);
 const {artifactId:previousId,...descriptor}=build.manifest;
 const nextDescriptor={...descriptor,requirementIds:[...new Set([...descriptor.requirementIds,'REQ-PRODUCT-SERVICE-CATALOG' as const])],catalogReview:{schemaVersion:1 as const,sha256:sha256(canonicalJson(catalogReview)),selectionCount:catalogReview.selections.length}};
 const manifest={...nextDescriptor,artifactId:sha256(canonicalJson(nextDescriptor))};
 const artifact={...structuredClone(build.artifact),manifest};
 const existing=(build as LegalBuild&{archive?:LegalSourceArchive}).archive;
 if(existing&&(canonicalJson(existing.artifact)!==canonicalJson(build.artifact)||existing.catalogReview!==undefined))throw Error('Private sources no longer match this compiler build.');
 const sources=existing?.sourceAttachments??{};
 const authored=build.manifest.documents.filter(d=>d.authoring!==undefined);
 if(Object.keys(sources).length!==authored.length||Object.keys(sources).some(k=>!authored.some(d=>d.kind===k)))throw Error('Private sources no longer match this compiler build.');
 for(const d of authored){const source=sources[d.kind],a=d.authoring!;if(!source||Object.keys(source).sort().join(',')!=='format,source'||source.format!==a.format||typeof source.source!=='string'||sha256(source.source)!==a.sourceSha256||new TextEncoder().encode(source.source).length!==a.sourceBytes)throw Error('Private sources no longer match this compiler build.');}
 const archive:LegalSourceArchive={schemaVersion:1,artifact,sourceAttachments:structuredClone(existing?.sourceAttachments??{}),catalogReview};
 if(new TextEncoder().encode(canonicalJson(archive)).length>124*1024)throw Error('Combined source and catalog archive exceeds 124 KiB. Reduce the review or use a reviewed larger-archive adapter.');
 const files={...build.files};delete files[`artifacts/${previousId}.json`];for(const d of build.manifest.documents)delete files[`artifacts/${previousId}/${d.kind}.html`];
 Object.assign(files,createRetainedReleaseFiles([artifact],{siteId:manifest.siteId,mode:manifest.mode,includeTermsOffers:false}),{'notabenda.manifest.json':canonicalJson(manifest)+'\n'});
 return {...build,manifest,artifact,archive,files};
}
