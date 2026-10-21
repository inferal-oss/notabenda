// @requirements REQ-US-OR-GPC REQ-US-MN-GPC REQ-PRODUCT-AGENT-INTEGRATION
/** Research for setup and agent handoffs. This module selects no runtime policy. */
const reviews = {
  schemaVersion: 1,
  revision: '2026-10-20.1',
  advisoryOnly: true,
  determinesApplicability: false,
  activatesPolicy: false,
  legalReviewStatus: 'unreviewed',
  sources: [
    {id:'SRC-US-OR-FAQ',url:'https://www.doj.state.or.us/consumer-protection/for-businesses/privacy-law-faqs-for-businesses/',checkedOn:'2026-10-20',access:'read'},
    {id:'SRC-US-OR-UOOM',url:'https://www.doj.state.or.us/media-home/news-media-releases/oregon-doj-highlights-new-universal-opt-out-tool-on-data-privacy-day/',checkedOn:'2026-10-20',access:'read'},
    {id:'SRC-US-OR-STATUTE',url:'https://www.oregonlegislature.gov/bills_laws/ors/ors646a.html',checkedOn:'2026-10-20',access:'blocked'},
    {id:'SRC-US-MN-RIGHTS',url:'https://www.revisor.mn.gov/statutes/cite/325M.14',checkedOn:'2026-10-20',access:'read'},
    {id:'SRC-US-MN-STRUCTURAL',url:'https://www.ag.state.mn.us/Data-Privacy/Business/Controller/Structural-Obligations.asp',checkedOn:'2026-10-20',access:'read'},
  ],
  configPaths: ['privacySignals.globalPrivacyControl', 'services.processingActivities', 'privacy.choicesLink'],
  hostWorkRefs: ['host.processingRestrictions', 'host.privacyRequests'],
  mechanism: {
    browser: 'navigator.globalPrivacyControl via createConsent',
    server: 'hasGlobalPrivacyControl(request) and getPrivacySignalRestrictions(config, {globalPrivacyControl: observed}) from @notabenda/core',
    requiresLogin: false,
    requiresReceiptStorage: false,
    grantsCookiePermission: false,
    implementsReOptIn: false,
  },
  hostChecks: [
    'Classify actual processing and explicitly choose policy activities after assessing scope; a provider name does not establish sale or targeted advertising.',
    'Read Sec-GPC before server tracking, exports or provider calls. Apply existing independent restrictions as well; signal absence is not permission.',
    'Verify the public opt-out route and real browser, account and downstream effects. Do not wait for login, cookie acceptance or receipt acknowledgement to honor a signal.',
  ],
  items: [
    {
      marketId: 'US-OR', label: 'Oregon', checkedOn: '2026-10-20', effectiveFrom: '2026-01-01',
      requirementIds: ['REQ-US-OR-GPC'],
      sourceIds: ['SRC-US-OR-FAQ', 'SRC-US-OR-UOOM'],
      processingActivities: ['sale', 'targeted-advertising'],
      title: 'Review Oregon universal opt-outs',
      summary: 'Oregon DOJ identifies mandatory universal opt-outs from January 2026. Review sale and targeted-advertising flows, signal handling and a clear public opt-out route; cookie controls alone may be insufficient.',
      applicabilityChecks: [
        'Assess current territorial scope, thresholds and exemptions, including the special motor-vehicle manufacturer/affiliate rule; ordinary thresholds alone are insufficient.',
      ],
      limits: [
        'The current consolidated Oregon statute was not retrieved. These selected DOJ sources do not complete statutory or legal review.',
        'Separate under-16 and precise-geolocation prohibitions need review. Removing a signal or obtaining cookie consent cannot authorize prohibited processing.',
      ],
    },
    {
      marketId: 'US-MN', label: 'Minnesota', checkedOn: '2026-10-20', effectiveFrom: '2025-07-31',
      requirementIds: ['REQ-US-MN-GPC'],
      sourceIds: ['SRC-US-MN-RIGHTS', 'SRC-US-MN-STRUCTURAL'],
      processingActivities: ['sale', 'targeted-advertising'],
      title: 'Review Minnesota universal opt-outs',
      summary: 'Minnesota requires qualifying sale and targeted-advertising signals to prevail over conflicting settings. Ordinary cookie acceptance is not a re-opt-in workflow. Keep opt-outs independent of authentication.',
      applicabilityChecks: [
        'Assess statutory scope and exemptions; the section notes a July 2029 compliance date for specified postsecondary institutions.',
        'Review mechanism criteria and the other-state recognition route in section 325M.14, subdivision 3. Its IP residency provision is not a controller-applicability test or a reason to enable geolocation by default.',
      ],
      limits: [
        'Universal signals and authorized-agent requests are distinct paths. Subdivision 4(h) addresses opt-out authentication and the documented-fraud exception.',
        'The broader profiling right, request response/appeal duties and any separate confirmation of conflicting settings remain outside this signal mechanism.',
      ],
    },
  ],
} as const;

/** Each caller receives detached research metadata, never mutable shared policy. */
export function getPrivacySignalReviews() { return structuredClone(reviews); }
