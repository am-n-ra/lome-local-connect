# Founder HQ Portability Protocol

Use this reference when starting a new venture, moving Founder HQ to another repository, workspace, tool, or team, or handing an operating system to a successor. The portable unit is an **index of truth and work**, not a dump of sensitive source records.

## Portable package boundary

Keep the portable layer in plain Markdown, YAML, and CSV so it can move through source control, documents, spreadsheets, issue trackers, wikis, or project-management tools without a proprietary dependency. Use stable identifiers; do not use a tool-specific URL as the only identifier.

| Package item | Include | Do not include |
|---|---|---|
| Ecosystem manifest | Venture ID, enabled companions, roles, current milestone, storage policy, review cadence. | Secrets, access tokens, account credentials. |
| Founder HQ Board | Current gate, proof IDs, owners, next actions, dependencies, and capacity. | Raw customer, personnel, legal, medical, or financial data. |
| Handoff register | Source-of-truth artifact ID, location class, owner, access level, freshness, and dependency. | Copies of restricted artifacts. |
| Lifecycle and opportunity indexes | Stage, status, next proof, deadline/time zone, and decision. | Confidential deal terms or third-party data without authority. |
| Learning index | Capability gap, response, transfer evidence, and review date. | Private reflections or sensitive performance notes. |

## Export protocol

1. Freeze the board at a stated **as-of date/time zone** and record the export owner.
2. Confirm every row has a stable ID, authority, access class, freshness date, and current owner.
3. Remove secrets, personal birth data, raw customer data, unrestricted financial/legal records, and confidential third-party content. Replace them with an ID and access-controlled location class.
4. Export the manifest, board, handoff register, lifecycle index, opportunity index, and learning index. Preserve the source-of-truth record outside the portable layer.
5. Add a transfer note stating unresolved gates, expired evidence, manual steps, external dependencies, and decisions that must be revisited.

## Import protocol

1. Create a new private workspace/repository and copy the starter kit.
2. Set a new venture ID, roles, tool locations, access classes, time zone, and review cadence in the manifest.
3. Reconnect each source-of-truth record only after access and confidentiality are approved; never assume the receiving team may see the prior workspace.
4. Run a Founder HQ review: verify the active milestone, validate stale evidence, reassign owners, and reopen decisions whose review triggers have passed.
5. Start with the smallest current gate. Do not import stale work as active merely because it existed in the previous system.

## Tool mapping

| Need | Portable form | Destination examples |
|---|---|---|
| Board and decisions | Markdown / YAML | Repository, wiki, document system, project workspace. |
| Tasks, owners, status | CSV | Spreadsheet, issue tracker, database, task tool. |
| Proof and sensitive evidence | ID plus access-class reference | Approved document store, database, secure data room. |
| Cadence | Markdown checklist / calendar event | Calendar, task system, recurring meeting note. |

The receiving tool may change, but the authority order, proof classes, stable IDs, access boundaries, and explicit next gate must remain unchanged.
