// @requirements REQ-PRODUCT-PACK-CAPABILITIES
/** Describes supplied components, not installation, legal readiness or complete jurisdiction coverage. */
export interface PackCapability {id:string;kind:'feature'|'tool'|'review';title:string;summary:string;guide:string;boundary:string;requirementIds:string[]}
const capabilities:Record<string,readonly PackCapability[]>={
  "privacy-pages": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Legal pages",
      "summary": "Start here when your site needs public information about personal data, browser storage and terms of use.",
      "guide": "package",
      "boundary": "A notice explains your practices. Reading it does not grant permission or accept terms.",
      "requirementIds": [
        "REQ-PRODUCT-DOCUMENTS"
      ]
    },
    {
      "id": "detail-1",
      "kind": "tool",
      "title": "Markdown and MDX",
      "summary": "Compile your own documents with YAML frontmatter and trusted components.",
      "guide": "authoring",
      "boundary": "Compilation runs at build time; sources and component code need review.",
      "requirementIds": [
        "REQ-PRODUCT-DOCUMENTS"
      ]
    },
    {
      "id": "detail-2",
      "kind": "tool",
      "title": "Compiled release preview",
      "summary": "Read and export the actual authored release before publishing.",
      "guide": "authored-preview",
      "boundary": "A configuration preview does not show custom MDX output.",
      "requirementIds": [
        "REQ-PRODUCT-AUTHORED-PREVIEW"
      ]
    },
    {
      "id": "detail-3",
      "kind": "tool",
      "title": "Publication check",
      "summary": "Compare the retained artifact and three pinned document files with the deployed copies.",
      "guide": "publication-check",
      "boundary": "Current routes and application behavior need separate checks.",
      "requirementIds": [
        "REQ-PRODUCT-PUBLICATION-CHECK"
      ]
    }
  ],
  "cookie-choices": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Cookie choices",
      "summary": "Use this when optional scripts or browser storage need visitor permission. It supplies the prompt, preferences and service controls.",
      "guide": "consent",
      "boundary": "The control and your loaders work together. Connect each optional tool so it stays off until permitted and stops after withdrawal.",
      "requirementIds": [
        "REQ-EU-DEVICE",
        "REQ-EU-FAIR-CHOICE"
      ]
    },
    {
      "id": "detail-1",
      "kind": "tool",
      "title": "Connection inspector",
      "summary": "Compare intended service scopes with the lifecycles registered on the actual controller.",
      "guide": "connection-inspection",
      "boundary": "Matching registration does not prove real requests or cleanup.",
      "requirementIds": [
        "REQ-PRODUCT-CONNECTION-INSPECTION"
      ]
    },
    {
      "id": "detail-2",
      "kind": "review",
      "title": "Singapore consent routes",
      "summary": "Review cookie data, collector roles, consent routes, withdrawal and accountability.",
      "guide": "singapore-cookies",
      "boundary": "Source-linked guidance; no deemed-consent runtime mode or complete Singapore coverage.",
      "requirementIds": [
        "REQ-SG-COOKIE-DATA",
        "REQ-SG-CONSENT-ROUTES"
      ]
    },
    {
      "id": "detail-3",
      "kind": "review",
      "title": "California choice design",
      "summary": "Review the actual choice paths, wording and defaults.",
      "guide": "consent",
      "boundary": "Paired cookie buttons alone do not implement California processing rights.",
      "requirementIds": [
        "REQ-US-CA-UI"
      ]
    },
    {
      "id": "detail-4",
      "kind": "review",
      "title": "Japan cookie data",
      "summary": "Review recipient and overseas-transfer questions alongside your actual data flows.",
      "guide": "japan-cookie-data",
      "boundary": "Cookie permission does not perform a recipient assessment.",
      "requirementIds": [
        "REQ-JP-RELATED-SCOPE"
      ]
    }
  ],
  "terms-agreement": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Terms agreement",
      "summary": "Use this for a signup or another action that needs explicit agreement to the displayed terms.",
      "guide": "terms",
      "boundary": "Publishing terms and recording agreement are separate jobs. Your application supplies the workflow, identity and recording transport.",
      "requirementIds": [
        "REQ-PRODUCT-TERMS-ACCEPTANCE"
      ]
    },
    {
      "id": "detail-1",
      "kind": "tool",
      "title": "Wording and rehearsal",
      "summary": "Prepare named agreement statements and try acceptance with a disposable recorder.",
      "guide": "terms-rehearsal",
      "boundary": "The rehearsal creates no production agreement or host connection.",
      "requirementIds": [
        "REQ-PRODUCT-TERMS-REHEARSAL"
      ]
    },
    {
      "id": "detail-2",
      "kind": "feature",
      "title": "Interrupted-request recovery",
      "summary": "Keep an exact pending agreement operation through reload for a deliberate retry.",
      "guide": "terms-recovery",
      "boundary": "Restores no checkbox or proof of agreement; host deduplication and retention remain necessary.",
      "requirementIds": [
        "REQ-PRODUCT-TERMS-RECOVERY"
      ]
    }
  ],
  "collection-notices": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Form notices",
      "summary": "Use this on a contact, signup or other form to explain why you collect its fields and where the fuller privacy notice is.",
      "guide": "collection",
      "boundary": "A form notice supplies information. It creates no permission, agreement or submission handler. Choose actual purposes, context wording and placement.",
      "requirementIds": [
        "REQ-PRODUCT-COLLECTION-NOTICE"
      ]
    },
    {
      "id": "detail-1",
      "kind": "tool",
      "title": "Form notice editor",
      "summary": "Prepare exact-release notice settings and ordinary separate permissions in one local editor.",
      "guide": "collection-workbench",
      "boundary": "Specialized marketing requests require their own builder.",
      "requirementIds": [
        "REQ-PRODUCT-COLLECTION-WORKBENCH"
      ]
    },
    {
      "id": "detail-2",
      "kind": "tool",
      "title": "Form-flow rehearsal",
      "summary": "Try ordinary submission and separate permission with temporary recording and failure scenarios.",
      "guide": "collection-workbench",
      "boundary": "No real submission, identity or production connection is supplied.",
      "requirementIds": [
        "REQ-PRODUCT-COLLECTION-REHEARSAL"
      ]
    }
  ],
  "indirect-collection": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Information from other sources",
      "summary": "Prepare the supported New Zealand IPP3A notice when personal information reaches you indirectly, after assessing its scope.",
      "guide": "indirect-collection",
      "boundary": "The supported nz-ipp3a profile needs its own assessment, category subsets and delivery plan. Rendering a notice does not establish notification or timing; no profile is enabled by selection.",
      "requirementIds": [
        "REQ-PRODUCT-INDIRECT-NOTICE",
        "REQ-NZ-INDIRECT"
      ]
    }
  ],
  "privacy-requests": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Privacy request page",
      "summary": "Use this when visitors need a clear route to your existing privacy team or request workflows.",
      "guide": "rights",
      "boundary": "These are entry points. Your application handles intake, identity, deadlines, appeals and fulfillment. A link is not a submitted or completed request.",
      "requirementIds": [
        "REQ-PRODUCT-RIGHTS-CENTER"
      ]
    }
  ],
  "technology-notices": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Profiling & location notices",
      "summary": "Use the supported Québec technology disclosure to explain what a feature does and how a person can activate or stop it.",
      "guide": "technology-collection",
      "boundary": "Assess the supported qc-private-technology-v1 scope. Keep the information before every activation opportunity, derive the service scope before compiling and retain the supplemental notice separately. Selection does not qualify the processing or activate the service.",
      "requirementIds": [
        "REQ-QC-PROFILING"
      ]
    }
  ],
  "form-permissions": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Form permissions",
      "summary": "Use this when a form has an optional permission, such as email updates, that must remain separate from the main task.",
      "guide": "form-permissions",
      "boundary": "Submitting an enquiry is not a marketing opt-in. Bind the optional choice to its own purpose, channel and record.",
      "requirementIds": [
        "REQ-PRODUCT-FORM-PERMISSIONS"
      ]
    },
    {
      "id": "detail-1",
      "kind": "feature",
      "title": "Explicit refusal",
      "summary": "Record a deliberate negative choice separately from withdrawal or an unchecked field.",
      "guide": "form-permissions",
      "boundary": "Requires pinned refusal copy and the matching backend; silence records nothing.",
      "requirementIds": [
        "REQ-PRODUCT-FORM-PERMISSIONS"
      ]
    },
    {
      "id": "detail-2",
      "kind": "tool",
      "title": "Connection inspector",
      "summary": "Inspect the intended offer, last locally observed state and historical action receipt.",
      "guide": "form-permissions",
      "boundary": "These observations do not establish identity or downstream sending permission.",
      "requirementIds": [
        "REQ-PRODUCT-FORM-PERMISSION-CONNECTION"
      ]
    },
    {
      "id": "detail-3",
      "kind": "tool",
      "title": "Ordinary permission editor",
      "summary": "Author purpose/channel wording and rehearse its independent form flow.",
      "guide": "collection-workbench",
      "boundary": "This editor cannot author the South African request profile.",
      "requirementIds": [
        "REQ-PRODUCT-COLLECTION-WORKBENCH"
      ]
    }
  ],
  "za-marketing-requests": [
    {
      "id": "detail-1",
      "kind": "feature",
      "title": "Explicit request particulars",
      "summary": "Retain goods/services, the future contact method, responsible-party facts and refusal copy.",
      "guide": "south-africa-marketing",
      "boundary": "Web collection for future email, SMS or WhatsApp marketing only; eligibility and prescribed-information review remain separate.",
      "requirementIds": [
        "REQ-ZA-MARKETING"
      ]
    },
    {
      "id": "detail-2",
      "kind": "feature",
      "title": "Refusal and withdrawal history",
      "summary": "Keep distinct actions and the exact request version in the existing permission ledger.",
      "guide": "form-permissions",
      "boundary": "The host must enforce current state and wider objections in actual sending systems.",
      "requirementIds": [
        "REQ-PRODUCT-FORM-PERMISSIONS"
      ]
    }
  ],
  "gated-media": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Gated media",
      "summary": "Use this for remote media that would otherwise contact a third party as soon as the page opens.",
      "guide": "embeds",
      "boundary": "Remove remote URLs and resource hints from initial markup. A visual placeholder alone does not stop a request.",
      "requirementIds": [
        "REQ-PRODUCT-EMBEDS"
      ]
    }
  ],
  "evidence-workspace": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Evidence workspace",
      "summary": "Use this when you need to investigate what was recorded, compare the wording behind it or supply a scoped evidence export.",
      "guide": "cloudflare",
      "boundary": "Browser preference memory and durable evidence have different jobs. You supply authorization, recording admission and retention policy.",
      "requirementIds": [
        "REQ-PRODUCT-CF-ADMIN",
        "REQ-PRODUCT-CF-HISTORY"
      ]
    },
    {
      "id": "detail-1",
      "kind": "tool",
      "title": "Recording inspector",
      "summary": "Check selected archived offers and notices using fixed host readers.",
      "guide": "recording-inspection",
      "boundary": "Read access and current visitor state are separate authorizations.",
      "requirementIds": [
        "REQ-PRODUCT-CONNECTION-INSPECTION"
      ]
    },
    {
      "id": "detail-2",
      "kind": "tool",
      "title": "Recovery rehearsals",
      "summary": "Exercise retained evidence and dispatch recovery with isolated fixtures.",
      "guide": "cloudflare-recovery",
      "boundary": "Adopters choose production recovery policies and whether to run checks in CI.",
      "requirementIds": [
        "REQ-PRODUCT-CF-HOST"
      ]
    }
  ],
  "processing-opt-outs": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Processing opt-outs",
      "summary": "Use this when an applicable processing restriction must survive a later cookie acceptance or browser visit.",
      "guide": "processing-choices",
      "boundary": "Classify every service, including an explicit empty activity list. Choose signal handling and recorded restrictions separately; enforce account and downstream effects in the host. Cookie acceptance cannot clear a restriction.",
      "requirementIds": [
        "REQ-PRODUCT-PROCESSING-CHOICES",
        "REQ-US-CA-GPC"
      ]
    },
    {
      "id": "detail-1",
      "kind": "tool",
      "title": "Processing notice editor",
      "summary": "Write the scope, covered activities and opt-out wording against an exact policy release.",
      "guide": "processing-workbench",
      "boundary": "Settings do not register a notice or connect a recorder.",
      "requirementIds": [
        "REQ-PRODUCT-PROCESSING-WORKBENCH"
      ]
    },
    {
      "id": "detail-2",
      "kind": "review",
      "title": "Browser signal requirements",
      "summary": "Review named state rules, dates and qualification questions before connecting signals.",
      "guide": "privacy-signals",
      "boundary": "A generic GPC reader is not a jurisdiction-approved mechanism for every law.",
      "requirementIds": [
        "REQ-US-TX-AGENT-SIGNALS"
      ]
    }
  ],
  "assessed-storage-settings": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Storage exceptions",
      "summary": "Use only after checking the supported UK exception conditions. The pack provides the explanation, objections and remembered settings.",
      "guide": "storage-exceptions",
      "boundary": "Establish every supported condition and actual technical separation. Exception services stay outside consent enrollment. Stable objections, atomic storage and usable controls remain required; a market or an analytics label cannot qualify a use.",
      "requirementIds": [
        "REQ-UK-EXCEPTIONS",
        "REQ-PRODUCT-STORAGE-EXCEPTIONS"
      ]
    }
  ],
  "google-basic": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Google Basic Consent Mode",
      "summary": "Use this for supported Google destinations that should remain unloaded until permission. Replace competing tag loaders first.",
      "guide": "google-basic",
      "boundary": "Use Basic gating with one Google owner per document. Remove competing snippets and map all four signals. Withdrawal after a load attempt requires a new document; stopping the adapter cannot promise post-load network silence or CMP certification.",
      "requirementIds": [
        "REQ-GOOGLE-MODE"
      ]
    }
  ],
  "contract-withdrawal": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Contract withdrawal",
      "summary": "Use a supported, reviewed withdrawal profile to collect the declaration and connect acknowledgment and contract handling.",
      "guide": "contract-actions",
      "boundary": "Assess one supported withdrawal profile and its language. The host admits and records the declaration, sends acknowledgment and handles the contract separately. A receipt does not perform a refund.",
      "requirementIds": [
        "REQ-PRODUCT-CONTRACT-ACTIONS",
        "REQ-EU-WITHDRAWAL",
        "REQ-DE-WITHDRAWAL",
        "REQ-BR-CONTRACT"
      ]
    }
  ],
  "subscription-cancellation": [
    {
      "id": "main",
      "kind": "feature",
      "title": "German contract cancellation",
      "summary": "Use this after assessing the German profile’s scope and exclusions. It records the customer’s requested ending and supplies a copy.",
      "guide": "contract-actions",
      "boundary": "The supported profile is de-cancellation. Keep this separate from contract withdrawal and cookie permission. Preserve the requested ending; the form does not calculate or confirm a termination date.",
      "requirementIds": [
        "REQ-PRODUCT-CONTRACT-ACTIONS",
        "REQ-DE-CANCEL"
      ]
    }
  ],
  "paid-order-review": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Paid order review",
      "summary": "Use this at the final order step. Your host supplies the product facts and current quote, and performs payment and fulfilment.",
      "guide": "paid-orders",
      "boundary": "Use a reviewed definition and a live host-owned quote. Definitions and prices are separate builder inputs, not SiteConfig fields. The host performs payment, contract formation and fulfillment.",
      "requirementIds": [
        "REQ-EU-ORDER-ACTION",
        "REQ-PRODUCT-PAID-ORDER-ARCHIVES"
      ]
    }
  ],
  "customer-confirmations": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Contract confirmation copies",
      "summary": "Use this after a contract is concluded, when you need a complete personally addressed copy. Supply your own email or other delivery service.",
      "guide": "order-confirmations",
      "boundary": "This path needs an existing received Cloudflare order admission and its retained review in the same checkout context. Inspect that foundation without automatically adding a checkout UI. Provider acceptance does not prove recipient delivery.",
      "requirementIds": [
        "REQ-PRODUCT-ORDER-CONFIRMATION"
      ]
    }
  ],
  "guarantee-information": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Guarantee notices & labels",
      "summary": "Use the shop notice for legal guarantee information, and assess each product separately for a producer durability label.",
      "guide": "guarantees",
      "boundary": "A shop-level legal guarantee notice and a producer commercial guarantee are different displays. Establish each product qualification; missing facts cannot mean no label is required. A valid image is not artwork or legal approval.",
      "requirementIds": [
        "REQ-PRODUCT-GUARANTEE-NOTICE",
        "REQ-EU-GUARANTEE-LABEL"
      ]
    }
  ],
  "ie-consent-duration": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Consent expiry · Ireland",
      "summary": "Use the supported Irish grant-expiry rule to stop remembered permission when its cap is reached.",
      "guide": "regional-prompts",
      "boundary": "Grant expiry is separate from refusal memory, asking again and evidence retention.",
      "requirementIds": [
        "REQ-IE-CONSENT-DURATION"
      ]
    }
  ],
  "it-repeat-prompts": [
    {
      "id": "main",
      "kind": "feature",
      "title": "Repeat prompts · Italy",
      "summary": "Use this to control when an unsolicited consent notice may reappear. It does not extend the lifetime of a grant.",
      "guide": "regional-prompts",
      "boundary": "This controls repeat solicitation. It does not extend a grant or establish a lawful reason to ask again.",
      "requirementIds": [
        "REQ-IT-REPROMPT"
      ]
    }
  ]
};
export function packCapabilities(id:string):PackCapability[]{const items=capabilities[id];if(!items)throw Error('Unknown installed pack.');return structuredClone([...items]);}
