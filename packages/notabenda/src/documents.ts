// @requirements REQ-PRODUCT-RIGHTS-CENTER
import { documentKinds, isSafeLink, toPublicConfig } from './config.js';
import type { DocumentKind, LegalDocument, LegalSection, PublicSiteConfig, RequirementId, ValidationOptions } from './types.js';

export const documentRequirements: Record<DocumentKind, RequirementId[]> = {
  privacy: ['REQ-PRODUCT-DOCUMENTS', 'REQ-PRODUCT-SAFE-CONTENT', 'REQ-EU-NOTICE', 'REQ-NZ-NOTICE'],
  cookies: ['REQ-PRODUCT-DOCUMENTS', 'REQ-PRODUCT-SAFE-CONTENT'],
  terms: ['REQ-PRODUCT-DOCUMENTS', 'REQ-PRODUCT-SAFE-CONTENT', 'REQ-EU-TERMS'],
};

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/gu, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const link = (label: string, href: string): string => {
  if (!isSafeLink(href)) throw new Error('Unsafe document link.');
  return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
};
const sentence = (value: string): string => /[.!?…]$/u.test(value.trimEnd()) ? value : `${value}.`;

/** @requirements REQ-EU-NOTICE REQ-NZ-NOTICE: compile declared facts, not inferred legal assertions. */
function privacySections(config: PublicSiteConfig): LegalSection[] {
  const { controller, privacy } = config;
  const sections: LegalSection[] = [
    { id: 'controller', heading: 'Who is responsible', paragraphs: [controller.name, controller.address], links: [{ label: controller.email, href: `mailto:${controller.email}` }] },
  ];
  for (const [key, title] of [['representative', 'Representative'], ['dpo', 'Data protection contact']] as const) {
    const c = controller[key];
    if (c) sections.push({ id: key, heading: title, paragraphs: [c.name, ...(c.address ? [c.address] : [])], links: [{ label: c.email, href: `mailto:${c.email}` }] });
  }
  sections.push(
    { id: 'purposes', heading: 'What we collect and why', ...(config.purposes.length ? {} : { paragraphs: ['No processing purposes are declared in this configuration.'] }), items: config.purposes.map(p => `${p.name}: ${sentence(p.description)} Data: ${p.dataCategories.join(', ')}. Legal basis: ${sentence(p.legalBasis)} Source (${p.collection.source}): ${sentence(p.collection.description)} Providing this information is ${p.collection.required ? 'required' : 'optional'}. ${p.collection.consequences}`) },
    { id: 'retention', heading: 'How long information is kept', items: config.purposes.map(p => `${p.name}: ${p.retention}`), ...(config.purposes.length ? {} : { paragraphs: ['No purpose-specific retention periods are declared.'] }) },
    { id: 'providers', heading: 'Service providers and recipients', items: config.services.map(s => `${s.name} — ${s.provider}. Location: ${sentence(s.location)} Purposes: ${s.purposeIds.map(id => config.purposes.find(p => p.id === id)!.name).join(', ')}.`), ...(config.services.length ? {} : { paragraphs: ['No service providers are declared in this configuration.'] }), links: config.services.filter(s => s.privacyUrl).map(s => ({ label: `${s.name} privacy notice`, href: s.privacyUrl! })) },
    { id: 'transfers', heading: 'International transfers', paragraphs: [privacy.transfers] },
    { id: 'automated-decisions', heading: 'Automated decisions', paragraphs: [privacy.automatedDecisions] },
    { id: 'rights', heading: 'Your rights and choices', items: privacy.rights, links: [{ label: 'Contact us about your information', href: `mailto:${controller.email}` }, ...(privacy.rightsUrl ? [{ label: 'How to exercise your rights', href: privacy.rightsUrl }] : [])] },
    { id: 'complaints', heading: 'Questions and complaints', paragraphs: [privacy.complaints.description], ...(privacy.complaints.url ? { links: [{ label: 'Complaint information', href: privacy.complaints.url }] } : {}) },
  );
  // @requirements REQ-PRODUCT-PRIVACY-SIGNALS REQ-US-CO-GPC Host-supplied processing explanation, never inferred applicability.
  if(config.privacySignals)sections.push({id:'privacy-signals',heading:'Global Privacy Control',paragraphs:[config.privacySignals.globalPrivacyControl.explanation]});
  return sections;
}

function cookieSections(config: PublicSiteConfig): LegalSection[] {
  return [
    { id: 'about', heading: 'Cookies and similar storage', paragraphs: [`This page describes the browser storage declared for ${config.site.name}.`, 'Cookies, local storage, and similar technologies may support different purposes. The inventory below describes each declared item; publishing this page does not itself control those technologies.'] },
    { id: 'storage', heading: 'Declared storage', ...(config.storage.length ? { table: {
      caption: 'Storage inventory', columns: ['Name', 'Type', 'Provider / service', 'Purpose', 'Duration', 'Classification'],
      rows: config.storage.map(s => { const service = config.services.find(service => service.id === s.serviceId)!; return [s.name, s.type, `${service.provider} / ${service.name}`, service.purposeIds.map(id => config.purposes.find(p => p.id === id)!.name).join(', '), s.duration, `${s.classification}${s.necessityReason ? ` — ${s.necessityReason}` : ''}`]; }),
    } } : { paragraphs: ['No browser storage is declared in this configuration.'] }) },
    { id: 'purposes', heading: 'Purposes', items: config.purposes.map(p => `${p.name}: ${p.description}`), ...(config.purposes.length ? {} : { paragraphs: ['No processing purposes are declared.'] }) },
    { id: 'contact', heading: 'Questions about storage', links: [{ label: config.controller.email, href: `mailto:${config.controller.email}` }, { label: config.documents.privacy.title, href: config.documents.privacy.route }] },
  ];
}

/** @requirements REQ-PRODUCT-DOCUMENTS REQ-EU-TERMS */
export function createLegalDocument(input: unknown, kind: DocumentKind, options: ValidationOptions = {}): LegalDocument {
  if (!documentKinds.includes(kind)) throw new Error('Unknown document kind.');
  const config = toPublicConfig(input, options);
  const document = config.documents[kind];
  const supplied = document.sections ?? [];
  const generated = kind === 'privacy' ? privacySections(config) : kind === 'cookies' ? cookieSections(config) : [];
  return {
    kind, title: document.title, route: document.route, version: document.version,
    effectiveDate: document.effectiveDate, reviewStatus: document.review.status,
    sections: document.source === 'supplied' ? supplied : [...generated, ...supplied.map(s => ({ ...s, id: `additional-${s.id}` }))],
    requirementIds: [...documentRequirements[kind]],
  };
}

function renderSection(section: LegalSection, kind: DocumentKind): string {
  const table = section.table;
  const tableHtml = table ? `<div class="nb-table-scroll" role="region" aria-label="${escapeHtml(table.caption)}" tabindex="0"><table><caption>${escapeHtml(table.caption)}</caption><thead><tr>${table.columns.map(c => `<th scope="col">${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
  return `<section id="nb-${kind}-section-${escapeHtml(section.id)}"><h2>${escapeHtml(section.heading)}</h2>${(section.paragraphs ?? []).map(p => `<p>${escapeHtml(p)}</p>`).join('')}${section.items?.length ? `<ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}${section.links?.length ? `<ul class="nb-document-links">${section.links.map(item => `<li>${link(item.label, item.href)}</li>`).join('')}</ul>` : ''}${tableHtml}</section>`;
}

/** @requirements REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-A11Y */
export function renderLegalDocument(input: unknown, kind: DocumentKind, options: ValidationOptions = {}): string {
  const config = toPublicConfig(input, options);
  const doc = createLegalDocument(config, kind, options);
  const titleId = `nb-${kind}-title`;
  const contents = doc.sections.map(s => `<li><a href="#nb-${kind}-section-${escapeHtml(s.id)}">${escapeHtml(s.heading)}</a></li>`).join('');
  let html = `<article class="nb-document" aria-labelledby="${titleId}" data-document-kind="${kind}" data-document-version="${escapeHtml(doc.version)}"><header><p class="nb-eyebrow">${escapeHtml(config.site.name)} · Legal</p><h1 id="${titleId}">${escapeHtml(doc.title)}</h1><p class="nb-document-meta">Version ${escapeHtml(doc.version)} <span aria-hidden="true">·</span> Effective <time datetime="${escapeHtml(doc.effectiveDate)}">${escapeHtml(doc.effectiveDate)}</time></p>${doc.reviewStatus === 'draft' ? '<p class="nb-draft" role="note">Draft — for review. This document is not approved for production use.</p>' : ''}</header><nav class="nb-contents" aria-label="On this page"><p>On this page</p><ol>${contents}</ol></nav>`;
  for (const section of doc.sections) {
    html += renderSection(section, kind);
  }
  return html + '</article>';
}

/** Optional footer fragment; never includes consent or acceptance checkboxes. */
export function renderLegalLinks(input: unknown): string {
  const config = toPublicConfig(input);
  return `<nav class="nb-legal-links" aria-label="Legal">${documentKinds.map(kind => link(config.documents[kind].title, config.documents[kind].route)).join('')}${config.rightsCenter?link('Privacy requests',config.rightsCenter.route):''}</nav>`;
}

/** A no-JS full page, or use renderLegalDocument inside a host framework layout. */
export function renderLegalPage(input: unknown, kind: DocumentKind, options: ValidationOptions & { stylesheetUrl?: string } = {}): string {
  const config = toPublicConfig(input, options);
  const stylesheet = options.stylesheetUrl;
  if (stylesheet !== undefined && !isSafeLink(stylesheet)) throw new Error('Unsafe stylesheet URL.');
  return `<!doctype html><html lang="${escapeHtml(config.site.locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(config.documents[kind].title)} · ${escapeHtml(config.site.name)}</title>${stylesheet ? `<link rel="stylesheet" href="${escapeHtml(stylesheet)}">` : ''}</head><body class="nb-page"><a class="nb-skip-link" href="#main">Skip to content</a><header class="nb-site-header">${link(config.site.name, config.site.url)}<span>Legal information</span></header><main id="main">${renderLegalDocument(config, kind, options)}</main><footer class="nb-site-footer">${renderLegalLinks(config)}<p>© ${escapeHtml(config.site.name)}</p></footer></body></html>`;
}
