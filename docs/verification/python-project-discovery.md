<!-- @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG -->
# Python project discovery verification

Checked 22 October 2026 UTC. This is static candidate discovery, with no installed-environment or provider-use claim.

`catalog-python-project.test.mjs` exercises project dependencies, extras, groups/includes and build requirements through the public scanner and CLI. Cases cover normalized/escaped names, direct references, multiline/dotted TOML, comments/prose/identity confusers, missing/cyclic/colliding groups, dynamic/tool-specific selection, malformed fields and parser/graph bounds. Reports omit dependency values, URLs, versions, markers, group names, parser diagnostics and source text. Ignore-aware selection, secret/symlink exclusions, private file permissions and exclusive exports retain their existing boundaries.

The package installation test runs the installed wizard against a Python manifest in an offline packed consumer. It verifies the discovered candidate and unchanged empty service configuration without a separately installed TOML parser; the parser's license is packaged. The ordinary browser graph checks keep the scanner/parser out of visitor delivery.

The pinned parser is smol-toml 1.9.1, bundled into the Node-only scanner. Files remain bounded to 256 KiB; inline nesting is capped at 32, dependency entries at 10,000, groups at 256 and include traversal at 64 levels. Limit hits produce limited coverage. The existing total-read/token/evidence limits also apply.

The reader extracts named candidates, rather than fully validating PEP 508 or resolving markers, extras, selected groups, dependency versions, Poetry/PDM/uv environments, local sources or lockfiles. It does not run Python, build backends or installers, or contact providers. Actual use, destinations and legal classification need operator review; the broader discovery requirement stays partial.
