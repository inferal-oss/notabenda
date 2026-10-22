<!-- @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG -->
# NuGet discovery checks

Checked 22 October 2026 UTC. This verifies static named-package candidates, not MSBuild evaluation, installed code, active services or legal classifications.

The package suite passes 1,363 tests, including ten NuGet scenarios. Coverage includes C#/F#/VB project files; case-varied conventional names; direct, conditional, update, central, global and legacy evidence; literal item lists; namespace handling; comments/CDATA; malformed, duplicate-attribute, DTD and NUL input; nested legacy scope spoofing; byte/depth/node limits; unresolved SDKs/imports/source settings; ignored/generated files, symlinks and credential-bearing NuGet configuration; private metadata omission and non-execution of tool shims.

All twelve identifiers match their nine intended existing SDK families. The frontend normalizer, standalone backend and catalog JSON Schema agree on canonical lowercase ASCII names, the 100-character bound and namespace-prefix boundaries. Synthetic earlier selection pins remain unchanged and require an explicit reference review. The passive browser reference snapshot remains independent of these backend-only additions.

The packed tarball installs offline with no runtime dependency on `saxes`, `xmlchars` or a .NET toolchain. Its actual wizard discovers a NuGet fixture and excludes the private version from its report. TypeScript consumers can use the new catalog ecosystem. The release checker verifies both bundled parser license notices against their source bytes, with no package publication.

The pinned Saxes 6.0.0 parser is bundled only into the optional Node scanner. The wrapper rejects DTDs and malformed documents and emits no source text or values. Its original ISC notice and xmlchars notice are distributed; upstream maintenance, vulnerability review and wider parser/platform acceptance remain release concerns. This does not establish a complete MSBuild or NuGet validator.

Measured compiled-local consent (15,288 bytes gzip), required-evidence consent (19,200), compatibility controls (28,449), consent CSS (2,840) and the service-directory browser entry (18,527) are unchanged from the previous measurement report. No XML parser enters those browser graphs. The compatibility entry remains over its 15 KiB target.

Discovery reports stay private, create no service configuration and grant no permission. Empty or limited output does not establish absence of third parties. Actual build selection, parent/user settings, private feeds, implicit SDK dependencies, lock freshness, deployment, provider identity, data use and applicability remain separate review.
