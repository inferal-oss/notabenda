# How the compliance components fit together

Start with the job each component does. A privacy notice explains data use; a permission control asks for a particular choice; terms describe a service or contract. They can appear in the same journey while serving different purposes.

## Compliance responsibilities

<!-- notabenda:diagram compliance -->

Read this as a map of responsibilities. A site does not automatically need every component, and processing personal data does not automatically mean consent is the appropriate basis. Establish the actual practices, audience, service and applicable requirements before choosing an integration.

The distinction between information and an affirmative choice is reflected in [GDPR Articles 7 and 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng). The map describes the library's component roles; use the [individual requirements](requirements/README.md) for applicability, sources, implementation limits and review status.

## Keep separate actions separate

| Component | What the person does | What the host must carry out |
| --- | --- | --- |
| Collection notice | Reads information beside a collection surface. | Handle the actual submission and disclosed processing. |
| Optional-service control | Allows, refuses or withdraws a declared optional purpose. | Gate the actual loaders and stop owned work on restriction. |
| Purpose/channel permission | Makes a separate optional choice, such as email updates. | Bind the contact context and evaluate current permission before downstream use. |
| Terms agreement | Takes an explicit action tied to a particular terms version. | Bind the real workflow and retain an acknowledged record when configured. |
| Order action | Deliberately submits the reviewed payment-obligation action. | Admit the request, handle payment and determine the actual contract state. |
| Processing opt-out | Restricts a declared processing activity. | Apply the restriction to relevant browser, account and downstream work. |
| Privacy request route | Starts an applicable privacy request. | Resolve identity/context as needed, respond and complete the actual operation. |
| Contract declaration route | Submits an applicable withdrawal or cancellation declaration. | Provide the acknowledgement and carry out the required contract handling. |

Cookie acceptance does not lift a separate processing opt-out. Submitting a contact form does not grant marketing permission. Reading a privacy policy does not create a terms agreement. The controls keep these actions separate; the surrounding application must preserve that separation.

Assessed [storage-exception settings](STORAGE-EXCEPTIONS.md) use a separate objection workflow and explicit supported profiles. Do not treat an exception as a consent grant or infer eligibility from a country setting.

## Product and purchase journeys

The [producer-label example](GUARANTEE-PRODUCER-EXAMPLE.md#where-this-component-fits) has a focused map of product information, guarantee disclosure, final order review, customer confirmation and later contract routes. These duties depend on the actual transaction and applicable rules; the example does not certify a product or complete a sale.

## Records and storage

The software stores different things for different reasons: browser preferences support the current interface; released documents identify the wording; backend records retain particular actions. Retention, access and erasure need their own policy. A historic receipt alone is not a decision that processing remains allowed.

See the separate [software and storage diagram](ARCHITECTURE.md) for build outputs, browser storage, optional Cloudflare Durable Objects and operator access. To choose exact fields and host tasks, continue with [agent setup](AGENT-SETUP.md) or [guided setup](SETUP.md).
