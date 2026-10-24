<!-- @requirements REQ-PRODUCT-RELEASE-CANDIDATE -->
# Local release-candidate verification

The maintainer command packs three installed workspaces offline with lifecycle scripts disabled. It inspects the actual bounded archive bytes, compares package identities, expected source/build file paths, export/bin targets, license bytes and direct dependency policy, and emits file/archive hashes. It never extracts, installs or publishes the contents. Existing output directories remain untouched; failures retain an explicit partial/failed report.

Adversarial archive fixtures exercise traversal, duplicate entries, unsupported metadata and links, corrupted headers/trailers, excessive decompression, stale outputs, absent exports, license mismatch, install hooks, dependency widening, unexpected executables, mismatched metadata and unsafe source maps. An end-to-end test packs all three real packages and checks the complete report and overwrite refusal. Separate packed-consumer tests continue to establish import/type/CLI/framework behavior.

Migration checks use a real consent controller with legacy preference data, on-demand controls, a registered optional service and declared storage cleanup. They establish that an opaque old grant is not imported, opening the UI grants nothing, explicit withdrawal stops owned work and cleanup leaves unrelated and legacy storage intact. They cannot verify an adopter's legacy format, lawful prompting, server-side restrictions or operational migration.

The security reporting policy, migration/removal guide and candidate guide are public documentation. A green result is not npm publication approval, secret-absence proof, dependency vulnerability review, signed build provenance, legal review or a production-readiness verdict.

## 23 October: candidate attribution review

The three exact-source archives for commit `1d0a40133386bce5377126b7bd8f6c50ed59bceb` were read without extraction or execution and matched their recorded SHA-256 digests. All three contain the matching dual-license selection and full Apache/MIT texts. The core archive also contains the expected parser licenses, imported catalog notice/license and separate artwork notices, byte-for-byte equal to the maintained inputs. All 24 packaged EU notice SVGs match the individual sizes and hashes in their provenance manifest. These checks retain the artwork's separate terms; the code's dual-license choice does not replace them.

The YAML, TOML and NuGet scanner bundles were rebuilt in memory using the workspace build options. Their bytes matched the actual candidate archives. Build input graphs identified `yaml`, `smol-toml`, `saxes` and `xmlchars`, each with its corresponding license file in the archive. The generated shape validator's Ajv license was also present. This is a check of those bundles, not an inventory of every generated or copied asset.

The authoring package's regular dependency closure in the committed lockfile contained 154 external package entries: 149 declaring MIT, two ISC, one BSD-2-Clause and two BSD-3-Clause. No entry in that closure lacked a license declaration. This inventory excludes optional peer installations and does not establish the accuracy of upstream declarations or satisfy a full review of copyright origins, redistribution duties, artwork reuse, security or private content. The detailed archive hashes, file comparisons and dependency inventory remain in ignored local release evidence. Repeat the review if the candidate changes.
