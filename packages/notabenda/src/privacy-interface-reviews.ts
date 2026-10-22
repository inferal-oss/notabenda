// @requirements REQ-US-CA-UI REQ-PRODUCT-AGENT-INTEGRATION
/** Source-backed setup review. No applicability decision, UI approval or runtime policy. */
const reviews={
 schemaVersion:1,revision:'2026-10-22.1',advisoryOnly:true,determinesApplicability:false,activatesPolicy:false,legalReviewStatus:'unreviewed',
 sources:[
  {id:'SRC-US-CA-REGS-2026',url:'https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf',checkedOn:'2026-10-22',access:'read'},
  {id:'SRC-US-CA-UI-ADVISORY',url:'https://cppa.ca.gov/pdf/enfadvisory202402.pdf',checkedOn:'2026-10-22',access:'read'},
  {id:'SRC-US-CA-UI',url:'https://www.cppa.ca.gov/announcements/2024/20240904.html',checkedOn:'2026-10-22',access:'read'},
 ],
 configPaths:['consent','privacy.choicesLink','localization.consent','localization.processingChoices'],
 hostWorkRefs:['host.privacyRequests','host.processingRestrictions','host.choicePresentation'],
 mechanism:{cookieRejectOnFirstNotice:true,dismissalGrantsNothing:true,implementsSaleSharingReOptIn:false,approvesCustomPresentation:false},
 items:[{
  marketId:'US-CA',label:'California',checkedOn:'2026-10-22',regulationEffectiveFrom:'2026-01-01',guide:'consent',requirementIds:['REQ-US-CA-UI'],sourceIds:['SRC-US-CA-REGS-2026','SRC-US-CA-UI-ADVISORY','SRC-US-CA-UI'],
  title:'Review California privacy-choice paths',
  summary:'Check the complete path to decline, opt out or withdraw, including wording, prominence and actual effects. Paired cookie buttons alone do not implement California sale/sharing or sensitive-information rights.',
  checks:[
   {locator:'Section 7004(a)(2), pages 17–18',text:'Keep the more protective path no longer, harder or slower. Show a direct decline beside acceptance; review size, color and emphasis after theming, translation and mobile layout.'},
   {locator:'Section 7004(a)(1), (3) and section 7003(a)–(b)',text:'Use understandable action labels and explain each control. Avoid double negatives, unexplained on/off labels, misleading urgency and surprise changes in button order. Closing, leaving or silence must grant nothing.'},
   {locator:'Section 7004(a)(4), page 19',text:'Keep incompatible processing purposes separate from requested services and general terms. A terms agreement or cookie grant cannot substitute for the relevant privacy choice or lift an independent opt-out.'},
   {locator:'Section 7004(a)(5), pages 19–20; advisory page 4',text:'Test the actual route through completion: working links, reachable controls and real effects. Do not bury opt-out in policy prose or add unnecessary forms, waits or persuasion screens. Review the whole service-provider flow.'},
  ],
  limits:['Assess CCPA applicability and each request/consent context separately. The agency advisory is illustrative and provides no safe harbor or legal approval.','Default native cookie mechanics are tested separately. Custom wording/styles, headless interfaces, sale/sharing opt-in, sensitive-information limits, financial incentives, accessibility and actual host/downstream outcomes still need their own review.'],
 }],
} as const;
export function getPrivacyInterfaceReviews(){return structuredClone(reviews);}
