// @requirements REQ-SG-COOKIE-DATA REQ-SG-BROWSER-CHOICE REQ-SG-COOKIE-TARGETING
// @requirements REQ-PRODUCT-AGENT-INTEGRATION
/** Source-backed setup advice. This module neither detects consent nor selects a runtime policy. */
const reviews={
 schemaVersion:1,revision:'2026-10-21.1',advisoryOnly:true,determinesApplicability:false,activatesPolicy:false,legalReviewStatus:'unreviewed',
 sources:[
  {id:'SRC-SG-PDPC',url:'https://www.pdpc.gov.sg/organisations/regulations-decisions/regulatory-guidance/advisory-guidelines-on-the-personal-data-protection-act-for-selected-topics',checkedOn:'2026-10-21',access:'read'},
  {id:'SRC-SG-SELECTED-2024',url:'https://www.pdpc.gov.sg/assets/d1fbaa47-1471-4208-bfad-9f4bf33453ad',checkedOn:'2026-10-21',access:'read'},
 ],
 configPaths:['purposes','services','storage','consent'],hostWorkRefs:['host.cookieAssessment','host.serviceLifecycles'],
 mechanism:{detectsBrowserConsent:false,declaresExemptions:false,importsBrowserPreferences:false,grantsFromMarketSelection:false},
 items:[{
  marketId:'SG',label:'Singapore',checkedOn:'2026-10-21',guidelineRevision:'2024-05-23',guide:'singapore-cookies',
  requirementIds:['REQ-SG-COOKIE-DATA','REQ-SG-BROWSER-CHOICE','REQ-SG-COOKIE-TARGETING'],sourceIds:['SRC-SG-SELECTED-2024'],
  title:'Review Singapore cookie use',
  summary:'Assess personal-data collection and actual purposes, including identifier linkage and each collector. Browser defaults are not a consent decision. Review personal-data advertising cookies and provide clear purpose choices; Singapore selection changes no settings.',
  checks:[
   {locator:'Chapter 7, paragraphs 7.1–7.10; pages 53–55',text:'Check what the cookie and linked data reveal. A session, analytics or first-party label does not establish that data is non-personal or that a requested-activity condition is met.'},
   {locator:'Paragraph 7.12; page 55',text:'Do not import a grant from cookies being enabled or unchanged browser settings. This toolkit uses explicit site choices; it does not detect or interpret deliberate browser exceptions.'},
   {locator:'Paragraphs 7.13–7.14; page 55',text:'Identify the organisation collecting personal data, including third-party collection. Assess consent for personal-data advertising cookies and make purpose preferences usable on the site.'},
  ],
  limits:['Only the selected online-activities chapter has been reviewed. Current statutory applicability, consent exceptions, other laws and the rest of the PDPA need separate assessment.','A reviewed exception is not created by marking storage necessary, selecting this market or recording a private justification. Existing service gates and scope guards remain unchanged.'],
 }],
} as const;
export function getCookieJurisdictionReviews(){return structuredClone(reviews);}
