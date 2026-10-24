// @requirements REQ-ZA-MARKETING REQ-PRODUCT-AGENT-INTEGRATION
/** Selected research for setup. No invitation admission, history store or sending authority. */
const reviews = {
  schemaVersion: 1,
  revision: '2026-10-22.1',
  advisoryOnly: true,
  determinesApplicability: false,
  authorizesApproach: false,
  legalReviewStatus: 'unreviewed',
  sources: [
    {id:'SRC-ZA-POPIA-ACT',url:'https://www.gov.za/sites/default/files/gcis_document/201409/3706726-11act4of2013protectionofpersonalinforcorrect.pdf',checkedOn:'2026-10-22',access:'read'},
    {id:'SRC-ZA-DM',url:'https://inforegulator.org.za/wp-content/uploads/2020/07/GUIDANCE-NOTE-ON-DIRECT-MARKETING-IN-TERMS-OF-THE-PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013-POPIA.pdf',checkedOn:'2026-10-22',access:'read'},
    {id:'SRC-ZA-REG6-2025',url:'https://inforegulator.org.za/wp-content/uploads/2025/04/POPIA-2021-Regulations-FINAL-21-Jan-2025.pdf',checkedOn:'2026-10-22',access:'read'},
    {id:'SRC-ZA-REGS-GAZETTE-2025',url:'https://www.gov.za/sites/default/files/gcis_document/202504/52523gon6126.pdf',checkedOn:'2026-10-22',access:'read'},
  ],
  screenedSources: [{
    id:'SRC-ZA-HEALTH-REGS-2026',url:'https://www.gov.za/sites/default/files/gcis_document/202603/54268gon7198.pdf',checkedOn:'2026-10-22',access:'read',
    result:'different-subject',locator:'Regulations 2, 3 and 7.1',
    note:'Gazette 54268 notice 7198 concerns health information by certain responsible parties. It is not a replacement for marketing regulation 6. Health-sector compliance is not supplied.',
  }],
  configPaths: ['purposes', 'scopeGuards', 'localization.formPermission'],
  hostWorkRefs: ['host.marketingApproachHistory', 'host.marketingSuppression'],
  mechanism: {
    profile: 'za-popia-web-request',
    recordsPurposeChannelChoice: true,
    recordsExplicitRefusal: true,
    maintainsResponsiblePartySubjectHistory: false,
    admitsInvitations: false,
    implementsCustomerException: false,
    sendsMessages: false,
  },
  items: [{
    marketId:'ZA',label:'South Africa',checkedOn:'2026-10-22',
    requirementIds:['REQ-ZA-MARKETING'],
    sourceIds:['SRC-ZA-POPIA-ACT','SRC-ZA-DM','SRC-ZA-REG6-2025','SRC-ZA-REGS-GAZETTE-2025'],
    title:'Review whether you may ask for marketing consent',guide:'south-africa-marketing#invitation-history-review',
    summary:'The web request records a choice. Before presenting or sending a request, review prior approaches and withholding for the responsible party and person. A new channel or address must not reset that history.',
    checks:[
      {sourceId:'SRC-ZA-POPIA-ACT',locator:'Section 69(2)(a)',text:'Establish whether consent is required, whether it was previously withheld and whether an approach already occurred. An empty package permission stream does not answer these questions.'},
      {sourceId:'SRC-ZA-DM',locator:'Sections 7.2.2 and 7.3.5',text:'Review approach and withholding records across relevant sites, channels and contact changes. Import earlier history; missing history must remain unresolved.'},
      {sourceId:'SRC-ZA-REG6-2025',locator:'Regulation 6.1–6.4',text:'Review the actual request medium and accessible response route. The method chosen for future marketing is a different fact. Telephone or automatic-call requests need separate recording/access handling; opt-out is not consent.'},
      {sourceId:'SRC-ZA-POPIA-ACT',locator:'Section 69(3)–(4)',text:'Assess any existing-customer route separately. Check sender details, cessation routes and the actual sending systems; a retained grant receipt does not establish current permission to send.'},
    ],
    engineeringChecks:[
      'Use a stable responsible-party/person binding across sites and contact generations. A matching prefix in separate Durable Objects does not share history.',
      'Serialize competing approaches and refusals together. A historical retry receipt must not recreate a cancelled send job. Preserve uncertain delivery for reconciliation instead of retrying blindly.',
      'Test identity changes, imports, old backups and erasure. Restore all consumed-approach and withholding state before allowing new requests; deleting detailed evidence must not silently create a new opportunity.',
    ],
    limits:[
      'The Act source is its original publication, not a reviewed current consolidation. The 17 April 2025 Gazette publishes the selected amendment; it does not establish original section 69 commencement.',
      'The existing purpose/channel permission ledger is not the wider history described here. Setup creates no history store, invitation counter, sending job, prescribed-form approval or legal eligibility verdict.',
      'Engineering checks are conservative integration advice, not statutory wording. The proposed shared approach ledger remains planned; existing-customer assessment, identity, suppression and actual delivery remain host work.',
    ],
  }],
} as const;

/** Detached metadata keeps callers from rewriting later setup guidance. */
export function getMarketingRequestReviews() { return structuredClone(reviews); }
