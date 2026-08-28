---
name: nature-way-opportunity-intelligence
description: Discover, verify, qualify, prioritize, track, and decline grants, accelerators, capital programs, partnerships, pilots, procurement paths, credits, and other venture-relevant opportunities for an active project. Use when founders or teams need an opportunity pipeline, grant search, partnership sourcing, programme-fit review, application calendar, or founder-HQ decision system alongside Nature Way and Nature Way Fundraising. Do not use it to promise eligibility, funding, acceptance, partnership outcomes, or to submit applications or commitments without user confirmation.
---

# Nature Way Opportunity Intelligence

## Resource loading and attestation

Treat every named `references/` or `templates/` resource as a required input when its stated trigger applies. Load the exact file or directory before performing the dependent work, then include a **Resource Receipt** in the phase output: `Loaded`, `Template instantiated`, and `Not loaded / reason`. Do not claim to have followed a resource that was not loaded. If a required resource is unavailable, state the gap and stop before the gate it controls.

## Intra-skill plan and task tree

Before substantive work inside this skill’s active gate, create or reconcile a local plan under the controlling Founder HQ Master Plan or specialist artifact. Use the structural path `HQ milestone > gate > specialist > slice > task > subtask`. Add a child only when it has its own objective, dependency, decision, state transition, failure mode, owner, or proof gate; stop at the smallest coherent unit that can be executed, reviewed, and proven without losing context.

Treat a **slice** as one end-to-end outcome or bounded evidence packet, a **task** as one coherent change or proof contribution with one owner, and a **subtask** as an atomic predecessor of that parent task. Keep dependencies, acceptance, expected proof, risk/debt boundary, owner, capacity impact, and re-plan trigger explicit. Use `todo → ready → in_progress → review → verified → done`, with `blocked`, `partial`, `manual`, or `deferred` when accurate. A child requires proof to close; a parent also requires its own acceptance and gate proof.

Re-plan when evidence contradicts an assumption, intent or a material decision changes, a dependency or capacity limit changes, a risk appears, or the gate condition fails. Preserve valid evidence, reopen only affected descendants, reconcile the controlling artifact first, and report added, removed, deferred, and reopened work. Every specialist return must include the active structural path, completed task/subtask IDs, proof IDs or links with an as-of time, residual gap or blocker, owner, next smallest action, capacity impact, re-plan trigger, and Resource Receipt. Read [references/intra-skill-planning-protocol.md](references/intra-skill-planning-protocol.md) when creating a nested plan, splitting a task, or preparing a handoff.

## Founder HQ integration

Use **Nature Way Founder HQ** whenever several opportunity tracks compete with product, fundraising, or operating work. Founder HQ holds the active milestone and capacity view; Opportunity Intelligence remains the authority for source verification, qualification, status, terms, and decline decisions.

Treat opportunities as branches competing for a venture’s scarce attention. The goal is not to find the largest possible list; it is to identify the small number of verified opportunities that genuinely advance the current product or capital milestone without creating hidden obligations, distraction, dilution, disclosure risk, or delivery debt.

## Founder-HQ role

This companion sits beside the existing Nature Way set:

| Companion | Authority |
|---|---|
| Nature Way | Decides whether the product, customer proof, release, data, security, and operating slice are ready. |
| Nature Way Fundraising | Decides whether capital claims, investor process, data room, and fundraising commitments are evidence-backed. |
| Nature Way Sidereal Reflection | Offers user-directed timing and journaling prompts only. |
| Opportunity Intelligence | Finds, verifies, qualifies, sequences, tracks, and declines external opportunities. |

An opportunity does not become a priority merely because it is prestigious, urgent, local, free, or introduced by a credible person. It must pass fit, eligibility, evidence, capacity, and obligation gates.

## Opportunity taxonomy

Use a category before research so the search and qualification criteria are explicit.

| Category | Typical outcome | Primary handoff |
|---|---|---|
| Grant, challenge, prize, or competition | Non-dilutive funding, validation, visibility, or network. | Capital thesis, readiness, and delivery plan. |
| Accelerator, incubator, or fellowship | Structure, capital, mentorship, distribution, or demo day. | Product trunk/branches and pitch-readiness packet. |
| Equity, debt, revenue-based, or blended-capital program | Capital with economic, reporting, or governance obligations. | Nature Way Fundraising capital-fit and counsel boundary. |
| Commercial partnership, channel, pilot, or procurement | Customer access, distribution, revenue, or operating leverage. | Nature Way Seed/Root/Trunk contracts and commercial proof. |
| Cloud, tooling, research, talent, or ecosystem credit | Reduced build cost, capability, research, or access. | Root System, security, delivery plan, and owner. |
| Regulatory, standards, or market-access path | Permission, compliance, trust, or expansion route. | Root System, qualified advice, and release constraints. |

## The opportunity intelligence cycle

### 1. Set the opportunity thesis

State the active Nature Way or fundraising milestone, the gap that external help may close, the desired category, the time/capacity budget, non-negotiable terms, and the evidence the venture can already show. Start from an active project need, not a generic search for “funding” or “exposure.”

### 2. Scan and verify

Discover from official program pages, the issuing institution, recognised ecosystem sources, direct partnership contacts, or reputable primary announcements. Record the URL, publisher, as-of date, application/engagement method, deadline/time zone, eligibility, benefit, obligation, and source confidence. Do not report an opportunity as open, current, funded, or relevant until the official source supports that claim.

Read [references/source-verification.md](references/source-verification.md) before collecting or sharing an opportunity list.

### 3. Qualify before pursuing

Use the qualification card to judge strategic fit, explicit eligibility, evidence readiness, milestone value, time/capacity, terms/conflicts, and source confidence. A weighted score can help sequence candidates, but a veto condition always wins. Do not use a score to hide an unverified assumption or a harmful obligation.

Read [references/qualification-and-tracker.md](references/qualification-and-tracker.md) before ranking, recommending, or preparing an opportunity.

### 4. Choose one status and an owner

Use exactly one status: `watch`, `verify`, `qualified`, `pursue`, `applied`, `engaged`, `paused`, `declined`, `closed`, or `not a fit`. Give every `pursue`, `applied`, or `engaged` opportunity one owner, one next action, one deadline/time zone, and one evidence or deliverable requirement. Set a work-in-progress limit agreed by the team so opportunity work cannot crowd out the active product or revenue milestone.

Use `watch` only when a concrete event, deadline, or review date could change the qualification. If no such trigger exists, decline or close the item rather than keeping it as false optionality.

### 5. Execute through the correct Nature Way gate

Do not prepare an application, commercial proposal, pilot, grant budget, or investor response from aspiration alone. Use the appropriate product proof, capital-proof packet, data room, claim ledger, confidentiality tier, launch envelope, and counsel review. Ask the user to confirm before sending applications, accepting terms, signing, sharing sensitive data, or making commitments.

### 6. Learn, decline, and renew

Record the result, feedback, cost, evidence gap, relationship outcome, and next action. Decline opportunities that fail a veto rule; a documented decline is a founder-HQ win because it protects focus. Review the pipeline at a practical cadence and delete or close stale records rather than treating them as future optionality.

## Veto rules

Decline or pause an opportunity when eligibility cannot be verified; the source is unreliable; the deadline or terms are unclear; it conflicts with the capital thesis, customer commitments, privacy, security, or ethics; it requires unsupported claims; its time cost threatens the active trunk or core revenue work; it creates unacceptable exclusivity, dilution, repayment, IP, disclosure, or reporting obligations; or it depends on a decision that requires qualified legal, tax, regulatory, or financial advice that has not been obtained.

## Operating rules

| Rule | Required behaviour |
|---|---|
| Official-source first | Verify opportunity facts against the issuer or an authoritative primary source. |
| Fit before prestige | Prioritise milestone value, eligibility, evidence readiness, and cost over brand recognition. |
| Capacity is a hard constraint | Use a team-agreed work-in-progress limit and name the displaced work before pursuing a new track. |
| Claims inherit proof | Reuse only evidence already supported by Nature Way or Fundraising artifacts; label gaps. |
| Terms are real work | Treat reporting, dilution, repayment, IP, exclusivity, confidentiality, and data access as qualification factors. |
| Decline is progress | Close unfit, expired, or unsupported opportunities with a reason rather than keeping false optionality. |
| No autonomous commitments | Obtain user confirmation before applications, submissions, data sharing, meetings that create commitments, term acceptance, or signing. |

## Required artifacts

| Artifact | Purpose |
|---|---|
| Opportunity thesis | Active milestone, need, category, boundaries, capacity, and evidence basis. |
| Source-verified opportunity record | Primary source, as-of date, eligibility, benefit, obligation, deadline, and confidence. |
| Qualification card | Fit criteria, veto results, scoring rationale, owner, and decision. |
| Opportunity tracker | Status, next action, deadline/time zone, dependencies, capacity cost, and learning. |
| Opportunity decision log | Pursue, pause, decline, or close rationale with the affected Nature Way or fundraising artifact. |

## Definition of done

Call an opportunity action complete only when the source is verified, facts are dated, fit and veto rules are explicit, the active product or capital milestone remains protected, required evidence is linked, terms and confidentiality are understood to the appropriate level, the status/owner/next action are recorded, and any submission or commitment has the user’s explicit confirmation. Never claim that an opportunity will fund, accept, partner with, or otherwise benefit a venture until an official outcome is confirmed.
