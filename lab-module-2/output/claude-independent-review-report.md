# claude - Independent Review Report: Add Product to Cart (Design Doc Candidate)

Review type: design-level. No executable tests were run or are claimed.

## 0. Documents reviewed
| Role | File |
|---|---|
| A. Requirements Baseline | `input/Class15_AI_Challenge_Guide_v1.md` |
| B. Consolidated Design Doc | `output/claude-design-doc-candidate-add-to-cart.md` (no file is named "v0.2"; this is the only consolidated doc) |
| C. Decision Log | `output/claude-human-engineering-decision-log.md` |
| Supporting | Original Claude, Codex, Cursor docs. `codex-human-engineering-decision-log.md` exists but belongs to another session and was not used. |

**Independence caveat.** B and C were drafted in this same session by the same assistant now acting as reviewer, and the log rationale was written by the assistant from the human's choices. This reduces independence. A human-run second pass is recommended before approval (finding F-12).

## 1. Executive Review Summary
The design is coherent and traceable. It meets all nine approved requirements on paper, adds no unapproved business policy, and keeps open questions as open. No CRITICAL finding. Two MAJOR gaps remain, both cheap to close but both sitting on approved guarantees: FC-01 relies on a side-effect-free read that the port contract never states (F-01), and the Failed/Unknown distinction behind D2 has no classification rule (F-02). Recommendation: **REVISIONS REQUIRED** (targeted).

## 2. Requirements Compliance (Doc A vs Doc B)
| Req | Assessment |
|---|---|
| FR-01, FR-02 | Met. FR-02 is stricter than needed (confirmed commit). |
| BR-01, BR-02 | Met by `Cart.add` (B §E.4) and the key `(cartId, productId)` (B §G). |
| BR-03 | Met by `Cart.add` ignoring `currentPrice`. The extra evidence "write path touches quantity only" conflicts with whole-aggregate `save` (F-03). |
| FC-01 | Met by ordering, but demonstrable only if `findActiveCartFor` has no side effects. That is not in the contract (F-01). |
| INV-01 | Met in the aggregate and by the D3 store obligation. |
| SEC-01, SEC-02 | Met structurally: no identifier or price input. |
Unapproved policies introduced: none. `ProductNotFound` and the closed-contract 400 are design choices, not business policy, and are labelled PROVISIONAL / D4.

## 3. Architectural Assessment
Modular monolith with two ports is proportionate. Responsibilities are cleanly separated (API / CartService ordering / aggregate rules / ports). Data ownership is stated (Catalog owns current price, cart owns agreed price). No unnecessary complexity found. Minor: `Cart.add` receives `currentPrice` it ignores in the main case, which is a consequence of D1, not a defect.

## 4. Detailed Design Assessment
Aggregate shape is cohesive: one place enforces BR-01/02/03 and INV-01. `CartItem` has no price setter. The data model permits a different currency per line while A-04 assumes one currency, with no invariant (F-04). "Overflow" is listed under `InvalidQuantity` with no defined threshold (F-06).

## 5. Interaction and Contract Assessment
Sequence (B §E.3), operation contract (B §F) and ports (B §H.2) agree on order and outcomes, including the three-way `save` result. Inconsistencies: `findActiveCartFor` obligations (F-01); BR-03 write-path claim (F-03); Catalog responses that are malformed or name a different product are not in the failure table (F-11); Catalog timeout budget undefined (F-10).

## 6. Data and Persistence Assessment
Logical model is minimal and technology-neutral. D3 gives INV-01 and BR-02 store-level guards. But "exactly one active cart" (A-02/D6) is detected on read, not guarded, unlike the other invariants (F-05). Atomicity and `Unknown` classification are not specified enough to be testable (F-02). Decimal money is sound in principle; scale and rounding depend on an unconfirmed Catalog contract (D5).

## 7. Security Assessment
SEC-01 and SEC-02 are satisfied by interface shape. Closed contract (D4) is sound. Assumptions A-01 (identity not spoofable) and A-02 (Catalog is a trusted server-side source) are stated and unverified. Responses do not expose customer identity (PROVISIONAL). No security defect found.

## 8. Human Decision Assessment
| Decision | Class | Note |
|---|---|---|
| D1 Catalog on every `addItem` | SUPPORTED | Satisfies both the literal FC-01 and the scenario reading, so it is safe under either. Cost is availability coupling. Rests on an interpretation recorded as stakeholder question 4. |
| D2 `OutcomeUnknown` | INSUFFICIENT EVIDENCE | Sound idea. No rule says when an adapter may return `Failed` vs `Unknown` (F-02). Dead-end with D7 (F-07). |
| D3 Aggregate + store obligation | SUPPORTED | Matches INV-01 wording. See F-03 for the save semantics it depends on. |
| D4 Closed contract | SUPPORTED | Loosening later is compatible. |
| D5 Exact decimal money | INSUFFICIENT EVIDENCE | Decision defensible. Scale, precision, rounding unspecified. |
| D6 No cart: fail; ambiguity → `PersistenceFailure` | SUPPORTED | Residual risk F-05. |
| D7 Concurrency/retries out of scope | SUPPORTED | Baseline covers concurrency, not sequential retries; guidance in contract compensates. |
| D8 `isActive` boolean | SUPPORTED | Minimum to detect zero/many. |
No decision is CONTRADICTED.

## 9. Findings Register
| ID | Class | Sev | Affects | Design Doc ref | Evidence | Consequence | Action | Closure evidence |
|---|---|---|---|---|---|---|---|---|
| F-01 | GAP | MAJOR | FC-01, D1 | §H.2 `findActiveCartFor`; §M gaps | B's own gap note says the guarantee needs a side-effect-free read "not shown", yet the port contract omits it | "Persisted cart unchanged" cannot be derived from the contract | State that `findActiveCartFor` is read-only and persists nothing; or reorder to call Catalog before any store access | Contract text updated; store review or test shows no write on the unavailable path |
| F-02 | GAP | MAJOR | D2, FR-02 | §H.2 `save`; §E.5 | `Failed` is "definite no-write" with no criterion | A mislabelled `Failed` invites a retry that duplicates the quantity | Rule: report `Failed` only when rollback is certain; any doubt is `Unknown` | Rule in contract; adapter review confirms |
| F-03 | DEFECT (doc) | MINOR | BR-03, D3 | §G "increment write path touches quantity only" vs §H.2 "saves the whole aggregate" | The two statements describe different write semantics | BR-03 evidence is overstated; store obligation ambiguous | Choose one save semantics and align both sections | Aligned text |
| F-04 | GAP | MINOR | A-04 | §G model, `currency` per line | Model allows mixed currencies in one cart | Undefined totals later | Invariant or explicit open question | Decision recorded |
| F-05 | RISK | MINOR | D6, D3 | §E.5, §G | Two active carts → `PersistenceFailure` forever for that customer; no store guard unlike D3's others | Customer blocked until manual repair | Consider a store uniqueness obligation, or name a repair path | Decision recorded |
| F-06 | GAP | MINOR | INV-01, Q2 | §E.5 `InvalidQuantity` | "Overflow" undefined; D8 removed the cap | Untestable rule; a technical limit may become a de facto maximum | Define overflow as arithmetic overflow only, or defer to Q2 | Contract text |
| F-07 | QUESTION | MINOR | D2, D7 | §F retry guidance, §L | After `OutcomeUnknown` clients may not replay and have no supported read | Dead end for the customer | Is there an existing cart-read capability elsewhere? | Answer recorded |
| F-08 | QUESTION | none | D1 | §D | D1 rests on a reading of the baseline | Reopens if stakeholders answer question 4 differently | Escalate to stakeholders | Answer |
| F-09 | IMPROVEMENT | MINOR | Traceability | §G, §H.1 | Baseline says `unitPrice`; B says `agreedUnitPrice`/`agreedUnitAmount`; log uses D-01, doc uses D1 | Harder trace | Add a naming map; unify IDs | Map added |
| F-10 | GAP | MINOR | FC-01 | §H.2 | Timeout/retry budget for Catalog undefined | "Unavailable" is not testable | State that the budget is an implementation parameter to be defined | Parameter named |
| F-11 | GAP | MINOR | D1 | §E.5 | Wrong product id or malformed Catalog reply has no outcome | Undefined behaviour | Map to an outcome or fold into `CatalogUnavailable` | Table updated |
| F-12 | QUESTION | MINOR | Process | Doc C | Log rationale was authored by the assistant | Weakens the log as human evidence | Human confirms or edits rationale; second human reviewer | Confirmation |

## 10. Defensible Decisions to preserve
- **Modular monolith with two ports.** Supported by the absence of any distribution requirement. Reconsider if independent deployment is required.
- **Closed contract, no identity or price input (D4).** Supported by SEC-01/02. Accepts stricter clients.
- **Agreed price owned by the line, set only at creation.** Supported by BR-03.
- **Consult Catalog before mutating (D1).** Satisfies FC-01 under either reading. Reconsider if increments must survive an outage.
- **Three-way `save` outcome (D2).** Avoids promising "unchanged" when unknown. Reconsider if the chosen store always resolves commits.
- **Open questions kept open.** No stock, cap, expiry or cart-creation policy was invented.

## 11. Scenario Walkthrough
**Success.** Identity → API (closed contract accepts `productId`, `quantity`) → CartService → `findActiveCartFor` returns P-17 ×1 @ 20,000 → Catalog returns 22,000 → `Cart.add`: one line exists, quantity 1+2=3, price not assigned → `save` → `Saved(snapshot)` → response P-17 ×3 @ 20,000, one line. Invariants hold (BR-01/02/03, INV-01). Missing guarantee: store atomicity and constraints are obligations, not shown (D3, F-02).
**Failure.** Same start → Catalog returns `Unavailable` → CartService stops, `add` and `save` never run → `CatalogUnavailable`, cartState unchanged. Missing guarantee: the read before Catalog must have no side effects (F-01).

## 12. Approval Readiness
**REVISIONS REQUIRED.** No blocking requirement contradiction, but F-01 and F-02 are MAJOR gaps on approved guarantees (FC-01) and on the integrity of D2. Both are small. After closing them with contract text, the likely outcome is APPROVAL WITH CONDITIONS (conditions: F-03..F-12). The design is not approved. Only the human engineering team can approve it.
