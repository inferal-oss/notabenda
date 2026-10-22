<!-- @requirements REQ-PRODUCT-DOCUMENT-EXPLANATION REQ-PRODUCT-DOCUMENTS -->
# Document input review verification

The report describes current configuration inputs. It neither changes a release nor verifies legal applicability, fact accuracy, approval or publication.

`document-explanation.test.mjs` compares report sections with actual generated/supplied documents, resolves every reported pointer against the public configuration, and checks unchanged inputs and complete release output before and after reporting. Cases cover appended/replaced sections, empty inventories, optional contacts/signals, linked storage exceptions and host-localized generation. Reports are detached; private reasons and Markdown notes remain absent.

CLI cases cover JSON/YAML/Markdown parity, explicit files/document kinds, duplicate and unrelated flags, no writes, authoring typos, accessor rejection and production draft refusal. The packed-consumer test invokes the installed command and type-checks the build-time API.

Paths describe declaration dependencies, with the whole selected localization dictionary identified as one dependency. They do not prove minimal byte-level dependencies, historical source attribution or actual notification. Supplied content remains supplied; MDX sources/components require their separate compiled preview and trust review. Generated section IDs without a registered explanation fail rather than silently losing attribution.
