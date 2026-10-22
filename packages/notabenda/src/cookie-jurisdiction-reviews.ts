// @requirements REQ-SG-COOKIE-DATA REQ-SG-BROWSER-CHOICE REQ-SG-COOKIE-TARGETING
// @requirements REQ-SG-CONSENT-CONDITIONS REQ-SG-CONSENT-ROUTES REQ-SG-WITHDRAWAL REQ-SG-ACCOUNTABILITY
// @requirements REQ-JP-RELATED-SCOPE REQ-JP-RECIPIENT-CONSENT REQ-JP-RELATED-FOREIGN
// @requirements REQ-PRODUCT-AGENT-INTEGRATION
/** Source-backed setup advice. This module neither detects consent nor selects a runtime policy. */
const reviews={
 schemaVersion:1,revision:'2026-10-22.2',advisoryOnly:true,determinesApplicability:false,activatesPolicy:false,legalReviewStatus:'unreviewed',
 sources:[
  {id:'SRC-SG-PDPC',url:'https://www.pdpc.gov.sg/organisations/regulations-decisions/regulatory-guidance/advisory-guidelines-on-the-personal-data-protection-act-for-selected-topics',checkedOn:'2026-10-21',access:'read'},
  {id:'SRC-SG-SELECTED-2024',url:'https://www.pdpc.gov.sg/assets/d1fbaa47-1471-4208-bfad-9f4bf33453ad',checkedOn:'2026-10-21',access:'read'},
  {id:'SRC-SG-PDPA-CURRENT',url:'https://sso.agc.gov.sg/Act/PDPA2012',checkedOn:'2026-10-22',access:'read'},
  {id:'SRC-JP-PPC',url:'https://www.ppc.go.jp/en/legal/',checkedOn:'2026-10-22',access:'read'},
  {id:'SRC-JP-LEGAL-JA',url:'https://www.ppc.go.jp/personalinfo/legal/',checkedOn:'2026-10-22',access:'read'},
  {id:'SRC-JP-GENERAL-2026',url:'https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/',checkedOn:'2026-10-22',access:'read'},
  {id:'SRC-JP-FAQ-8-3',url:'https://www.ppc.go.jp/all_faq_index/faq1-q8-3/',checkedOn:'2026-10-22',access:'read'},
  {id:'SRC-JP-2026-PROMULGATION',url:'https://www.ppc.go.jp/news/press/2026/260717/',checkedOn:'2026-10-22',access:'read'},
 ],
 configPaths:['purposes','services','storage','consent','controller','privacy'],hostWorkRefs:['host.cookieAssessment','host.serviceLifecycles'],
 mechanism:{detectsBrowserConsent:false,declaresExemptions:false,importsBrowserPreferences:false,grantsFromMarketSelection:false},
 items:[{
  marketId:'SG',label:'Singapore',checkedOn:'2026-10-22',guidelineRevision:'2024-05-23',statuteAsAt:'2026-10-22',guide:'singapore-cookies',
  requirementIds:['REQ-SG-COOKIE-DATA','REQ-SG-BROWSER-CHOICE','REQ-SG-COOKIE-TARGETING','REQ-SG-CONSENT-CONDITIONS','REQ-SG-CONSENT-ROUTES','REQ-SG-WITHDRAWAL','REQ-SG-ACCOUNTABILITY'],sourceIds:['SRC-SG-SELECTED-2024','SRC-SG-PDPA-CURRENT'],
  title:'Review Singapore cookie use',
  summary:'Assess the data, purposes and collectors. Review the consent route, information given before collection, withdrawal and public contact. Browser defaults are not permission; selecting Singapore changes no settings.',
  checks:[
   {locator:'Chapter 7, paragraphs 7.1–7.10; pages 53–55',text:'Check what the cookie and linked data reveal. A session, analytics or first-party label does not establish that data is non-personal or that a requested-activity condition is met.'},
   {locator:'Paragraph 7.12; page 55',text:'Do not import a grant from cookies being enabled or unchanged browser settings. This toolkit uses explicit site choices; it does not detect or interpret deliberate browser exceptions.'},
   {locator:'Paragraphs 7.13–7.14; page 55',text:'Identify the organisation collecting personal data, including third-party collection. Assess consent for personal-data advertising cookies and make purpose preferences usable on the site.'},
   {locator:'PDPA sections 13, 14, 18 and 20',text:'For a consent-based flow, explain the actual purposes before collection and before an uninformed new use or disclosure. Review reasonableness, excessive conditions and misleading practices; a saved click is not proof of valid consent.'},
   {locator:'PDPA sections 15, 15A and 17',text:'Assess any deemed-consent or without-consent route separately. Deemed consent by notification requires a prior adverse-effect assessment, safeguards, notification, reasonable opt-out and prescribed conditions; a privacy page, elapsed timer or private justification does not implement it.'},
   {locator:'PDPA section 16',text:'Keep withdrawal available and explain its likely consequences. Stop the relevant future collection, use and disclosure, including intermediaries and agents, unless a reviewed legal route permits it. Local service teardown does not fulfill downstream withdrawal.'},
   {locator:'PDPA sections 11, 12 and 20',text:'Designate the responsible person, publish the required business contact and maintain policies, staff communication and a complaints process. Configure actual public contact facts; rendering a notice does not operate those processes.'},
  ],
  consentRoutes:[
   {id:'consent',mechanism:'Explicit current site choice',hostReview:'Review the stated purposes, notices, conditions and actual behavior under sections 13, 14, 18 and 20.',createsGrant:false},
   {id:'deemed-consent',mechanism:'Host assessment; no automatic runtime mode',hostReview:'Section 15 conduct/contract conditions and section 15A assessment, notice, opt-out and prescribed requirements are separate routes. Review the no-likely-adverse-effect condition and mitigation duties. No timer, silence or browser-default grant is provided.',createsGrant:false},
   {id:'without-consent',mechanism:'Host assessment; no automatic runtime mode',hostReview:'Section 13(b) also addresses collection, use or disclosure required or authorised under this Act or other written law. Section 17 refers to specified First/Second Schedule circumstances and conditions. This review has not assessed those schedules or qualified a particular use.',createsGrant:false},
  ],
  limits:['Selected online-activities guidance and statutory provisions have been read. Full applicability, the First/Second Schedules, prescribed regulations, chapter 12 guidance, other laws and legal review remain open.','A reviewed exception is not created by marking storage necessary, selecting this market or recording a private justification. Existing service gates and scope guards remain unchanged.'],
 },{
  marketId:'JP',label:'Japan',checkedOn:'2026-10-22',guidelineRevision:'2026-06',guide:'japan-cookie-data',
  requirementIds:['REQ-JP-RELATED-SCOPE','REQ-JP-RECIPIENT-CONSENT','REQ-JP-RELATED-FOREIGN'],sourceIds:['SRC-JP-GENERAL-2026','SRC-JP-FAQ-8-3','SRC-JP-2026-PROMULGATION','SRC-JP-PPC','SRC-JP-LEGAL-JA'],
  title:'Review Japan cookie data and recipients',
  summary:'Assess the data and how each recipient will use or link it. Review any required consent confirmation, foreign-recipient information and applicable legal version. A general cookie choice is not a completed recipient assessment.',
  checks:[
   {locator:'PPC general guidelines 2-8 and 3-7-1; FAQ 8-3',text:'Distinguish personal information from personally referable information. Assess whether the recipient is expected to acquire it as personal data; a cookie label or inability of the sender alone to identify someone does not settle the question.'},
   {locator:'PPC general guidelines 3-7-2 and 3-7-3-1',text:'Where applicable, identify the recipient, relevant data and use, and review who obtains and confirms consent before provision. Publishing a notice alone is insufficient. The toolkit does not perform recipient confirmation or maintain the specialized provision/receipt records.'},
   {locator:'PPC general guidelines 3-7-3-2',text:'Review the applicable foreign-recipient information route and exceptions separately, including country/system/protection-measure information and continuing safeguards where relevant. A service location or ordinary cookie receipt does not complete that assessment.'},
   {locator:'PPC Japanese/English legal indexes; promulgation notice dated 17 July 2026',text:'Use the controlling Japanese texts and check commencement provision by provision. The English index points to an April 2023 consolidation; the July 2026 amendment notice is not a blanket effective date or an automatic runtime transition.'},
  ],
  sourceStatus:{bindingLawLanguage:'ja',currentConsolidatedLawVerified:false,englishIndexConsolidation:'2023-04-01',linkedTranslationRetrieved:false,amendmentPromulgatedOn:'2026-07-17',amendmentCommencementVerified:false,autoActivatesAmendments:false},
  limits:['Selected Japanese regulator guidance only. The current e-Gov law fetch was blocked and the linked English translation returned a maintenance page; neither is treated as a retrieved current consolidation.','Full applicability, exceptions, foreign-transfer guidance/rules, provision/receipt records, 2026 amendment commencement and legal review remain open. Selecting Japan does not classify data, confirm recipient consent or activate a policy.'],
 }],
} as const;
export function getCookieJurisdictionReviews(){return structuredClone(reviews);}
