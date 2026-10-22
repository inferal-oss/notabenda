// @requirements REQ-US-OR-GPC REQ-US-MN-GPC REQ-US-TX-AGENT-SIGNALS REQ-PRODUCT-AGENT-INTEGRATION
/** Research for setup and agent handoffs. This module selects no runtime policy. */
const reviews = {
  schemaVersion: 1,
  revision: '2026-10-22.1',
  advisoryOnly: true,
  determinesApplicability: false,
  activatesPolicy: false,
  legalReviewStatus: 'unreviewed',
  sources: [
    {id:'SRC-US-TX-CODE',url:'https://statutes.capitol.texas.gov/?artSec=541.055&chapter=BC.541&code=BC&tab=1',checkedOn:'2026-10-22',access:'read'},
    {id:'SRC-US-TX-HB4',url:'https://capitol.texas.gov/tlodocs/88R/billtext/html/HB00004F.htm',checkedOn:'2026-10-22',access:'read'},
    {id:'SRC-US-TX-AG',url:'https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights/texas-data-privacy-and-security-act',checkedOn:'2026-10-22',access:'read'},
    {id:'SRC-US-OR-FAQ',url:'https://www.doj.state.or.us/consumer-protection/for-businesses/privacy-law-faqs-for-businesses/',checkedOn:'2026-10-20',access:'read'},
    {id:'SRC-US-OR-UOOM',url:'https://www.doj.state.or.us/media-home/news-media-releases/oregon-doj-highlights-new-universal-opt-out-tool-on-data-privacy-day/',checkedOn:'2026-10-20',access:'read'},
    {id:'SRC-US-OR-STATUTE',url:'https://www.oregonlegislature.gov/bills_laws/ors/ors646a.html',checkedOn:'2026-10-20',access:'blocked'},
    {id:'SRC-US-MN-RIGHTS',url:'https://www.revisor.mn.gov/statutes/cite/325M.14',checkedOn:'2026-10-20',access:'read'},
    {id:'SRC-US-MN-STRUCTURAL',url:'https://www.ag.state.mn.us/Data-Privacy/Business/Controller/Structural-Obligations.asp',checkedOn:'2026-10-20',access:'read'},
  ],
  configPaths: ['privacySignals.globalPrivacyControl', 'services.processingActivities', 'privacy.choicesLink'],
  hostWorkRefs: ['host.processingRestrictions', 'host.privacyRequests'],
  mechanism: {
    dependencyScope: 'Toolkit execution dependencies only; these booleans do not determine a jurisdiction’s authentication, residency, agent authority or technology-qualification rules.',
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
    'Verify the public opt-out route and real browser, account and downstream effects. The configured GPC restriction path runs independently of login, cookie acceptance and receipts; host request qualification remains separate.',
  ],
  items: [
    {
      marketId: 'US-TX', label: 'Texas', checkedOn: '2026-10-22', effectiveFrom: '2025-01-01',
      requirementIds: ['REQ-US-TX-AGENT-SIGNALS'],
      sourceIds: ['SRC-US-TX-CODE', 'SRC-US-TX-HB4', 'SRC-US-TX-AG'],
      processingActivities: ['sale', 'targeted-advertising'],
      title: 'Review Texas authorized-agent opt-outs', guide:'privacy-signals#texas-agent-requests-through-technology',
      summary: 'Texas section 541.055(e) permits technology-designated agents for sale and targeted-advertising opt-outs. HB 4 gives that subsection a January 2025 start; the GPC reader does not establish request qualification.',
      applicabilityChecks: [
        'Assess sections 541.002–.003 scope and exemptions, including the SBA small-business rule and separate sensitive-data-sale exception; no universal volume threshold is supplied.',
        'Review section 541.055(e) commercially reasonable effort for identity and agent-authority verification and Texas residency; assess all four request exceptions: unclear request, residency not verifiable with commercially reasonable effort, inability to process, and no similar other-state request processing.',
        'Review section 541.055(f) non-default affirmative choice, fairness to other controllers and usability. A Sec-GPC value does not establish these technology facts.',
      ],
      limits: [
        'The January 2025 date is specific to subsection (e); the general Act began July 2024. Selected current text was browser-read, not the whole chapter or every amendment.',
        'Section 541.055(b) prohibits requiring a new account, but permits an existing account. Toolkit execution without login is not a Texas no-authentication rule.',
        'No Texas approval of GPC, agent verification, residency inference or new geolocation is supplied. Profiling rights, privacy/opt-out disclosures, request handling, appeals and downstream effects need separate review.',
      ],
    },
    {
      marketId: 'US-OR', label: 'Oregon', checkedOn: '2026-10-20', effectiveFrom: '2026-01-01',
      requirementIds: ['REQ-US-OR-GPC'],
      sourceIds: ['SRC-US-OR-FAQ', 'SRC-US-OR-UOOM'],
      processingActivities: ['sale', 'targeted-advertising'],
      title: 'Review Oregon universal opt-outs', guide:'privacy-signals',
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
      title: 'Review Minnesota universal opt-outs', guide:'privacy-signals',
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
