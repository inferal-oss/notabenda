<!-- @requirements REQ-PRODUCT-RELEASE-CANDIDATE -->
# Report a security issue

Send suspected vulnerabilities privately to **contact@inferal.com** with “Notabenda security” in the subject. Include the package version or Git commit, affected component, impact and a minimal reproduction using synthetic data. If you have a proposed fix, include it.

Do not send customer records, private policy sources, credentials or production exports. A small example of the failure is usually enough to start an investigation. Discuss a safe way to share additional evidence if it is needed.

Please allow investigation before posting exploit details publicly. Public issues are suitable for ordinary bugs and questions; use the private contact for a suspected access-control failure, data exposure, unsafe content execution or similar vulnerability.

## Version status

Notabenda is a developer preview. There are no published npm releases or supported release branches yet. Reports against the current main branch receive best-effort triage. Reporting an older preview is still useful; include its exact commit so the behavior can be reproduced. There is no guaranteed response time or security certification.

The host application supplies authentication, authorization, context binding, secrets, retention decisions and deployment access. Explain whether a report concerns a package boundary or the host integration. A successful package-content check or automated test suite does not establish that a particular deployment is secure.
