<!-- @requirements REQ-TR-BASIS REQ-PRODUCT-COLLECTION-FLOW -->
# Review notices and consent in Türkiye

Start with the actual purpose, data and processing condition. Law No. 6698 distinguishes explicit consent from other specified conditions. The controller's duty to inform is separate. A privacy-page link or a checked acknowledgement is not a processing condition. [KVKK processing conditions](https://www.kvkk.gov.tr/Icerik/6607/Conditions-for-Processing-Personal-Data-), [selected English law text, Articles 3, 5 and 10](https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law).

## Keep information and permission separate

The KVKK's decision announcement **2026/347, dated 18 February 2026**, addresses combined notice/consent text and requests to approve disclosure. It calls for independent notices, distinct headings/texts where consent is needed, and context-specific, understandable information. A different applicable processing condition should not result in an additional explicit-consent request for that same activity. Review the announcement's same-page and separate-declaration details for the complete host flow. [Official announcement](https://www.kvkk.gov.tr/Icerik/8710/veri-sorumlulari-tarafindan-acik-riza-ve-aydinlatma-metinlerinin-ayri-ayri-duzenlenmesi-gerektigi-hakkinda-kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-ilke-kararina-iliskin-kamuoyu-duyurusu).

Use reviewed purpose explanations in `purposes[].legalBasis`. The [collection-flow composer](COLLECTION-FLOW.md) then requires an explicit `notice-only` or `separate-permission` presentation decision for each selected ordinary direct-collection purpose. It always includes the notice and creates permission offers only for the second route. These instructions organize the interface; they do not classify the processing condition or decide applicability.

The composer rejects unresolved decisions and a stale reviewed release ID. It produces no approval checkbox for the notice. The surrounding form can complete its own job without saving a separate permission. The [combined example](/collection-flow/) demonstrates those mechanics with a local message draft and an independently recorded updates choice.

## Assess cookies and transfers separately

The current regulator-linked cookie guide identifies itself as **KVKK publication 69, July 2025**. Selected sections 6, 7 and 9 discuss tracking uses, active choices and accessible information; Annex 5 shows presentation problems. Cookie categories and processing conditions still require assessment. The composer does not select a cookie exemption or bypass [service gates](CONSENT.md). [Cookie guide](https://www.kvkk.gov.tr/Icerik/7353/Cerez-Uygulamalari-Hakkinda-Rehber).

The **10 March 2022 decision 2022/229** remains a case-specific source. Its historical transfer analysis must not be used as the current cross-border-transfer rule. The retrieved July 2025 guide reflects later transfer changes, but this review does not implement or qualify a transfer route. [2022 case summary](https://www.kvkk.gov.tr/Icerik/7408/Summary-of-the-Board-Decision-on-the-processing-of-personal-data-by-the-data-controller-operating-in-e-commerce-sector-through-cookies-used-by-the-websites-mobile-applications-).

## Setup and limits

Selecting Türkiye in setup, or importing an assessed `TR` jurisdiction, adds source-linked review tasks. It does not change a basis, consent enrollment, storage classification or existing answer. Agents can read the same checks under `cookieJurisdictionReviews` in `notabenda describe cookie-consent collection-notice form-permissions --json`.

Sources were retrieved on **22 October 2026 UTC**. The guide's imprint was visually checked and its downloaded bytes pinned in the catalog. The English law page was read for selected provisions; a current controlling Turkish-law consolidation and the original Gazette publication of decision 2026/347 were not verified. Full applicability, exceptions, sensitive/child-data flows, actual notice delivery and proof, transfers, wording sufficiency and legal review remain open. This is partial coverage, not a production-supported Türkiye pack.
