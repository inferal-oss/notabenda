// @requirements REQ-PRODUCT-SCOPE-GUARDS
import type { SiteConfig } from './types.js';

/** Deliberately draft and visibly fictional; init never invents reviewed contractual clauses. */
export function createStarterConfig(): SiteConfig {
  return {
    schemaVersion: 1,
    site: { id: 'example-site', name: 'Example Site', url: 'https://example.test', locale: 'en', description: '{{site.description}}' },
    controller: { name: '{{controller.name}}', email: 'privacy@example.test', address: '{{controller.address}}' },
    scopeGuards:{version:1,revision:'initial-assessment',site:{children:'unknown',sensitiveData:'unknown',highRiskProfiling:'unknown',regulatedSector:'unknown'}},
    jurisdictions: [], purposes: [], services: [], storage: [],
    privacy: {
      rights: ['{{privacy.rights}}'],
      transfers: '{{privacy.transfers}}',
      automatedDecisions: '{{privacy.automatedDecisions}}',
      complaints: { description: '{{privacy.complaints}}' },
    },
    terms: { audience: 'business', serviceType: 'informational' },
    documents: {
      privacy: { title: 'Privacy policy', route: '/privacy', version: 'draft-1', effectiveDate: '2026-01-01', source: 'generated', review: { status: 'draft' } },
      cookies: { title: 'Cookie policy', route: '/cookies', version: 'draft-1', effectiveDate: '2026-01-01', source: 'generated', review: { status: 'draft' } },
      terms: { title: 'Terms of use', route: '/terms', version: 'draft-1', effectiveDate: '2026-01-01', source: 'supplied', review: { status: 'draft' }, sections: [{ id: 'your-terms', heading: 'Supply your reviewed terms', paragraphs: ['{{documents.terms.reviewedContent}}'] }] },
    },
  };
}
