# Workspace overview verification

Requirements: `REQ-PRODUCT-WORKSPACE-OVERVIEW`, `REQ-PRODUCT-CF-ADMIN`, `REQ-PRODUCT-CARTRIDGES`.

The overview tests exercise the real worker with host-supplied stores: authorization before access, invalid/duplicate grants, bounded text/routes, three primary jobs, folded additional areas, separate setup permission, no record reads on ordinary overview requests, native GET search, exactly one three-record segment per authorized area, preserved detail/cursor links, complete-empty versus incomplete scans, malformed pages, sanitized read failures, escaping, and no private-source/get/write traversal. Search uses the existing validated record-page reader and existing record presentation.

The generated-starter tests check the root request's host identity and configuration grant, and search an actually retained release through the generated workspace. The website's session-isolation test finds a newly recorded choice in its own demo overview and confirms that a second session cannot find it. Existing admin list/detail tests cover the extracted shared record renderer.

These checks establish bounded inspection behavior. They do not establish complete history, live processing permission, host adapter latency/capacity, backup recovery, legal compliance or assistive-technology acceptance.

The combined order adapter uses a shared continuation frontier across current and legacy stores. A regression mixes a real current admission with 201 legacy records, finds a match beyond the former cap, traverses all 202 records without duplicates or gaps, and preserves key-prefix filtering. Each segment reads bounded source windows and never declares completion while either source is unfinished.
