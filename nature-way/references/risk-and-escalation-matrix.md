# Risk and escalation matrix

Classify risk early and reopen the classification when scope, data, authority, exposure, or dependency changes. Escalation means prepare a focused review packet; it does not mean abandon the entire product or require a permanent team.

| Risk area | Nature Way may do | Required condition before Go |
|---|---|---|
| Ordinary low-risk product behavior | Design, build, test, document, and release with controlled rollout. | Applicable gates, evidence, ownership, monitoring, and rollback pass. |
| Personal data, external integrations, or account authority | Build with minimization, explicit contracts, access controls, and tests. | Privacy/security review proportionate to data and authority; owner accepts the residual risk. |
| Payments, financial obligations, health, regulated activity, minors, sensitive identity, security-critical function, or destructive migration | Prepare architecture, implementation, tests, evidence, alternatives, and review questions. | Qualified human review for the applicable legal, security, compliance, financial, or operational decision. |
| Active incident or suspected compromise | Contain, preserve evidence, communicate through approved paths, and prepare recovery options. | Incident owner and qualified responders determine recovery and external obligations. |

## Review packet

Provide: decision needed; scope and actors; data/authority affected; code/contracts; evidence and tests; alternatives; rollout/rollback; residual risk; precise questions; and the owner who will record the final decision. Do not claim that the reviewer approved anything until that approval exists.
