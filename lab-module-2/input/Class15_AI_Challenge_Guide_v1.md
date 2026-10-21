# Class 15 — AI-Assisted Engineering Challenge
**Software Engineering I · Universidad Nacional de Colombia · 2026-II**  
**Student handout · Version 1.0**

## Purpose
Work with a generative AI assistant to develop and critically evaluate a software design proposal. The team—not the assistant—owns all accepted requirements and design decisions.

**Learning goals**
1. Construct an AI request grounded in approved evidence and constraints.
2. Distinguish confirmed requirements from suggestions and unresolved questions.
3. Check AI proposals against requirements, architectural responsibilities, data ownership, interface contracts, and failure behavior.
4. Document decisions with traceable evidence and acknowledge remaining uncertainty.

## Part A — Common case: Add Product to Cart
### Approved classroom baseline
The scenario concerns an authenticated customer and an existing active cart. Product **P-17** already has **quantity 1** at an agreed cart-line **unitPrice of COP 20,000**. The customer adds **2** units. Catalog currently reports **COP 22,000**. This exercise assumes no concurrent requests.

| ID | Approved rule or constraint |
|---|---|
| FR-01 | The customer can add a product to an active shopping cart. |
| FR-02 | On success, the system returns the updated cart state. |
| BR-01 | Adding an existing product increases the existing cart-line quantity. |
| BR-02 | Within this cart, a product has at most one cart line. |
| BR-03 | Increasing the quantity of an existing line preserves that line's agreed unitPrice. |
| FC-01 | If Catalog is unavailable before cart mutation, the cart remains unchanged. |
| INV-01 | A persisted CartItem must have quantity greater than zero. |
| SEC-01 | The authenticated identity determines which customer's cart can be modified; a caller-supplied userId alone is not authorization. |
| SEC-02 | A client-supplied price is not authoritative and cannot be trusted without server-side verification. |

**Expected successful result:** one P-17 cart line with quantity **3** and unitPrice **COP 20,000**. **Catalog unavailable before mutation:** the existing cart remains unchanged.

**Not yet decided:** when and whether Inventory must validate availability; maximum permitted quantity; cart expiration policy. Treat these as open questions, not approved requirements. The AI may suggest options but may not silently approve them.

### Part A workflow — 35 minutes
**A1 · Frame (8 min).** Read the baseline and identify what is known, constrained, and unresolved. Write a first prompt in your own words. It must specify the scenario, evidence IDs, desired design outputs, and how uncertainty should be handled.

**A2 · Generate (7 min).** Ask an AI assistant for a **candidate design** including: (i) major component responsibilities; (ii) an interface contract for addItem, including inputs, outcomes and failure behavior; (iii) a simple sequence representation (Mermaid is allowed); (iv) a short rationale with alternatives and trade-offs. Ask it to distinguish confirmed facts, assumptions and open questions.

**A3 · Challenge (10 min).** Compare its proposal with the baseline. Check quantity, price, identity, data ownership, failure guarantees, contract/sequence consistency and unapproved rules. Do **not** assume there must be an error. Record at least three substantive recommendations or claims, including one that you consider defensible when supported by evidence.

**A4 · Refine (5 min).** Write a follow-up prompt that challenges one unsupported or inconsistent proposal. Preserve the original response and the revised response.

**A5 · Decide (5 min).** Record the team's decisions and evidence in the AI Decision Log. A decision can be **Accept**, **Modify**, **Reject** or **Clarify**. If the AI makes no demonstrable mistake, do not invent one; challenge assumptions or missing evidence instead.

### Prompt construction guide (not a finished prompt)
Your prompt should answer:
- **Context:** What problem and scenario are being designed?
- **Evidence:** Which baseline IDs are binding?
- **Task:** What decisions or artifacts should be proposed?
- **Constraints:** Which outcomes and security rules must remain true?
- **Uncertainty:** How must unknown information be identified rather than invented?
- **Reviewability:** How should the AI explain alternatives, evidence and trade-offs?

**Example of a useful challenge question:** “Show which approved rule supports each proposed change. Separate any new business policy into an open question requiring stakeholder approval.”

## Part B — Apply the method to your own project
### Project workflow — 25 minutes
1. Select **one existing reviewed artifact**: use case, component design, sequence diagram, data model, or interface contract.
2. **Sanitize** it before sharing externally: remove personal data, real customer or company information, credentials, tokens, internal endpoints and other confidential details. If it cannot be sanitized safely, use a fictional equivalent or the instructor-provided case instead.
3. Ask AI for a focused review or alternative—not a complete replacement of your project's design.
4. Challenge its recommendations against the team's approved requirements and design baseline.
5. Record at least **three decisions or unresolved recommendations**, with supporting evidence and residual risk. Update the actual project design **only when the team has justified and accepted a change**.

### Equity and reproducibility
No paid AI account is required. Teams may work in pairs or use a pre-generated classroom alternative when access is unavailable. Record the tool/model name when known, date, prompts and relevant outputs; different groups are not expected to obtain identical responses.

## What to submit — one team submission
1. **Part A:** first prompt, relevant first response, refined prompt, revised response, and Decision Log.
2. **Part B:** sanitized artifact, relevant AI interaction, and Decision Log with at least three entries.
3. **Reflection (150–250 words):** What did AI help with? Which assumptions or risks required human verification? Which design decisions remained the team's responsibility?
4. **Optional project update:** link to any changed artifact, its previous version, and the evidence supporting the change.

Use the companion file `Class15_AI_Decision_Log_Template.md`.

## Evaluation guide (for feedback; not a change to official course grading)
| Criterion | Weight |
|---|---:|
| Grounding in approved context and evidence | 20% |
| Effective AI instructions and refinement | 15% |
| Identification of gaps, contradictions and risks | 30% |
| Evidence-based decisions and rationale | 25% |
| Reflection, transparency and responsible data handling | 10% |

**Principle:** A fluent AI answer is a proposal, not approval. Do not penalize teams for accepting a defensible AI recommendation or for recording a genuinely unresolved question.
