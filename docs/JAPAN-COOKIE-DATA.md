<!-- @requirements REQ-JP-RELATED-SCOPE REQ-JP-RECIPIENT-CONSENT REQ-JP-RELATED-FOREIGN -->
# Review cookie data and recipients in Japan

Start with the data and the recipient's actual use. A cookie label does not tell you whether information identifies someone, or whether a recipient will link it to a personal-data record.

This is a review inside the **Cookie choices** pack. Selecting **Japan** adds source-linked questions to setup and the agent reference. It does not install a country pack, select a legal basis or enable a service.

## Map the recipient and use

| Review | What to establish |
| --- | --- |
| Data and linkage | Distinguish personal information from personally referable information. Assess expected recipient acquisition as personal data; the selected Article 31 guidance is conditional. |
| Consent and confirmation | Identify the recipient, data and use, and who obtains and confirms the relevant consent before provision. Publishing a notice alone is insufficient. |
| Foreign recipient | Review the applicable information route, exceptions and safeguards. A location field is useful inventory, but does not establish qualification. |

The Japanese PPC [general guidelines](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/) cover these points in sections **2-8**, **3-7-1**, **3-7-2** and **3-7-3**. [FAQ 8-3](https://www.ppc.go.jp/all_faq_index/faq1-q8-3/) explains the conditional Article 31 scope. The selected guideline is labeled revised June 2026; access was checked on 22 October 2026 UTC.

## Use the existing mechanisms

Declare the actual provider and purposes in `services` and `purposes`. Put reviewed disclosures in the appropriate privacy/cookie documents and interface copy. For a consent-managed service, register its loader and cleanup before it can run through another path. The [cookie controls](CONSENT.md) keep draft choices separate from a saved choice.

The toolkit does not determine the APPI classification, confirm a recipient's consent, qualify a foreign-recipient route or produce the specialized provision/receipt records. Its ordinary cookie receipt is not a substitute for those assessments and records. Keep the reasoning and any external evidence in the operator's approved process.

Test the actual integration: fresh visit, refusal, deliberate choice, withdrawal and reload. Changing a declared recipient changes material scope and requires review of the earlier grant. Actual recipient behavior and downstream work need separate checks.

## Read the source-version limits

The [Japanese legal index](https://www.ppc.go.jp/personalinfo/legal/) and [English index](https://www.ppc.go.jp/en/legal/) serve different roles. PPC says only the Japanese texts have legal effect. Its English index points to an April 2023 consolidation; the linked page currently returns a maintenance notice. The e-Gov law-data fetch was blocked. Neither was treated as a retrieved current consolidation.

PPC's [17 July 2026 promulgation notice](https://www.ppc.go.jp/news/press/2026/260717/) describes later amendment work. Promulgation is not a blanket commencement date. Current consolidated text, provision-specific commencement, detailed exceptions, foreign-transfer rules/guidance, specialized records and legal review remain open.

## Give the review to an agent

```sh
notabenda describe cookie-consent --json
```

Read the Japan item under `cookieJurisdictionReviews.items`, including `checks`, `sourceIds`, `sourceStatus` and `limits`. `sourceStatus` records the unverified current consolidation and commencement. These are review facts, not runtime configuration fields. Private justifications and market selection do not change consent settings.
