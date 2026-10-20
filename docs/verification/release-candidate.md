<!-- @requirements REQ-PRODUCT-RELEASE-CANDIDATE -->
# Local release-candidate verification

The maintainer command packs three installed workspaces offline with lifecycle scripts disabled. It inspects the actual bounded archive bytes, compares package identities, expected source/build file paths, export/bin targets, license bytes and direct dependency policy, and emits file/archive hashes. It never extracts, installs or publishes the contents. Existing output directories remain untouched; failures retain an explicit partial/failed report.

Adversarial archive fixtures exercise traversal, duplicate entries, unsupported metadata and links, corrupted headers/trailers, excessive decompression, stale outputs, absent exports, license mismatch, install hooks, dependency widening, unexpected executables, mismatched metadata and unsafe source maps. An end-to-end test packs all three real packages and checks the complete report and overwrite refusal. Separate packed-consumer tests continue to establish import/type/CLI/framework behavior.

Migration checks use a real consent controller with legacy preference data, on-demand controls, a registered optional service and declared storage cleanup. They establish that an opaque old grant is not imported, opening the UI grants nothing, explicit withdrawal stops owned work and cleanup leaves unrelated and legacy storage intact. They cannot verify an adopter's legacy format, lawful prompting, server-side restrictions or operational migration.

The security reporting policy, migration/removal guide and candidate guide are public documentation. A green result is not npm publication approval, secret-absence proof, dependency vulnerability review, signed build provenance, legal review or a production-readiness verdict.
