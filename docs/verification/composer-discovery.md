<!-- @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG -->
# Composer discovery verification

Checked 22 October 2026 UTC. Static discovery supplies provider candidates for review; it does not verify installation, runtime traffic or legal classification.

The public scanner and CLI tests distinguish `require`, `require-dev`, `packages` and `packages-dev`. They exercise seven source-linked exact signatures; escaped names; identity, suggestion, metadata, PHP-source and lookalike confusers; duplicate decoded keys; malformed fields; duplicate locked entries; root repository/replacement/provision limits; nesting, key, entry and file-size bounds. Lock-only observations remain distinct from direct dependencies, and nested package requirements are not expanded.

Reports omit private constraints, versions, metadata, URLs, credentials and source text. Git-ignore-aware selection, secret directories, `vendor`, symlinks and Composer’s `auth.json` are excluded. Executable PHP/Composer shims and manifest scripts do not run. CLI exports retain private permissions and refuse existing output directories. A packed offline consumer exercises Composer candidates through the installed wizard while leaving services unselected. Runtime normalization and the public schema agree on exact package names and vendor-prefix boundaries. Old selected-reference snapshots remain readable and unchanged; adopting new references requires explicit renewal.

The parser uses Node’s JSON reader plus duplicate-key and structure checks, with no new dependency. The scanner remains outside ordinary consent browser graphs. Shared limits are 256 KiB per file, 32 MiB total data, 5,000 selected files and 20,000 distinct tokens; Composer additionally bounds nesting at 32 and object keys/extracted entries at 10,000. A hit reports limited coverage instead of a complete result.

The reader is not a complete Composer validator. It does not compare content hashes, resolve repository/replacement/provision or version rules, select an environment, inspect installed dependencies, read PHP semantics, execute project tools or contact providers. An unchanged lock can be stale, and a transitive or development candidate can be unused. Actual provider relationships, endpoints, settings, deployment and processing facts still need review. The broader discovery requirement stays partial.
