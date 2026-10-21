# claude - AI Decision Log — Team Record
**Class 15 · Software Engineering I · UNAL 2026-II**
Based on `input/Class15_AI_Decision_Log_Template.md`. This file tracks the whole interaction. It supersedes `claude-human-engineering-decision-log.md`, which is kept as an earlier snapshot.

## Submission metadata
- Team / project: Add Product to Cart (Part A, common case)
- Review date: 2026-10-20 to 2026-10-21 (in progress)
- AI tool and model: Claude Code, Claude Sonnet 5.5 (`claude-sonnet-5-5`). Comparison documents also from Codex and Cursor (model names not recorded).
- Baseline version / link: `input/Class15_AI_Challenge_Guide_v1.md` (v1.0)
- Selected artifact and version: `output/claude-design-doc-candidate-add-to-cart.md` (consolidated candidate; no "v0.2" file exists)
- Sanitization check (no sensitive data shared): Not applicable (fictional classroom case)

## AI Interaction Record
Exact prompt texts are in the conversation. The `prompts/` files (`1.md`, `2.md`, `2.1.md`) are empty. Prompts below are summarized.

| Step | Prompt or instruction | AI response excerpt or link | What changed / why |
|---|---|---|---|
| Initial | Role: Senior Engineer. Write a Technical Design Doc (sections A–K) for Add Product to Cart using FR-01, FR-02, BR-01..03, FC-01, INV-01, SEC-01/02. Treat stock, max quantity, expiration as open. Language English. | `output/claude - technical-design-doc-add-to-cart.md` | First proposal. Modular monolith with ports, Catalog consulted before mutation, price kept on the line. |
| Refinement 1 | "Deja también el modelo de datos, y los contratos de las APIs" | Sections L (data model) and M (API contracts) added to the same file | Added logical model, `POST /cart/items`, error table, port contracts. Introduced D-07/D-08 (HTTP + JSON, reject unknown fields). |
| Comparison | Facilitated review: compare Claude, Codex, Cursor docs against the baseline, one decision at a time, with a human decision log. | `output/codex-add-product-to-cart-design.md`, `output/cursor-add-product-to-cart-design.md`, plus the chat turns D-01..D-08 | Eight decisions taken by the human (below). Several claims in the Claude doc were corrected. |
| Consolidation | "Si continua con el design Doc." | `output/claude-design-doc-candidate-add-to-cart.md` | Consolidated candidate incorporating the eight decisions. |
| Independent review | Role: independent reviewer. Evaluate the consolidated doc and decision log, produce findings, then discuss one finding at a time. | `output/claude-independent-review-report.md` | 12 findings (2 MAJOR, none CRITICAL). Recommendation: REVISIONS REQUIRED. Interactive resolution in progress. |

## Part A — Common case: E-Commerce
| # | AI proposal / claim | Evidence checked (ID + artifact) | Decision (Accept / Modify / Reject / Clarify) | Engineering rationale | Residual risk / next action |
|---|---|---|---|---|---|
| A1 (D-01) | Consult Catalog on every `addItem`, including increments (all three agents). Claude and Cursor justified it with FC-01. | FC-01 (a conditional); baseline "Expected results" listed next to the P-17 scenario | **Accept A, rationale modified** | FC-01 literal does not require the call. The baseline pairs "Catalog unavailable → unchanged" with the scenario, and A is the only option that shows it there. Safe under either reading. | Costs availability coupling. Stakeholders must confirm. Unknown-product behaviour on increments undefined. |
| A2 (D-02) | Binary `save` result (Claude, Cursor) vs `OutcomeUnknown` (Codex). | FR-02, INV-01, BR-02. FC-01 does not cover persistence failures. | **Accept B** (tri-state, no `GET /cart`) | Avoids promising "unchanged" when commit confirmation is lost. | No supported reconciliation path. `GET /cart` DEFERRED. HTTP mapping not reviewed. |
| A3 (D-03) | Rules only in the aggregate (Cursor) vs plus persistence obligation (Codex). | INV-01 says "persisted"; BR-02; BR-03 | **Accept B** (aggregate + store obligation) | INV-01 concerns stored state. Obligation is technology-neutral. | BR-03 not a constraint. Legacy data not covered. |
| A4 (D-04) | Reject `userId`/`price` with 400 (all three). | SEC-01, SEC-02. Neither mandates rejection. | **Accept A** (reject any unknown field) | One closed-contract rule. Loosening later is compatible. | Existing clients may send extra fields. Versioning undecided. |
| A5 (D-05) | Money as integer (Claude, Cursor) vs exact decimal string (Codex). | BR-03; baseline gives only whole-number examples | **Accept B** (exact decimal + currency) | Does not assume scale 0 before the Catalog contract is known. | Scale, precision, rounding open. Single currency and non-negative amounts unconfirmed. |
| A6 (D-06) | No active cart: fail without creating (all three). Ambiguity: own code (Cursor) vs integrity failure (Codex). | Baseline (existing active cart), FR-01 | **Accept A** (fail; ambiguity = `PersistenceFailure`) | Creation is unapproved policy. Client cannot fix ambiguity. | Open question: should `addItem` create carts? |
| A7 (D-07) | Concurrency and retries out of scope (all three). | Baseline: no concurrent requests (covers concurrency, not sequential retries) | **Accept A** (out of scope + "no automatic replay" guidance in the contract) | No requirement for idempotency. An idempotency key adds state and lifecycle. | Blind retries duplicate quantity. |
| A8 (D-08) | Active cart as enum (Claude), boolean (Codex), none (Cursor). Extras: timestamps (Claude), numeric quantity cap (Codex). | FR-01, D-06 (needs to detect zero or many) | **Accept B** (`isActive` boolean; no timestamps, no cap) | Minimum that makes "active" explicit. Timestamps and cap have no requirement. | Expiration policy may add states. |

## Review Resolution Log (independent review of the consolidated candidate)
| Finding | Original observation | Evidence | Human response | Disposition | Required correction | Residual risk | Closure criterion |
|---|---|---|---|---|---|---|---|
| F-01 (MAJOR, GAP) | FC-01 depends on a side-effect-free `findActiveCartFor`, absent from the port contract. | Candidate §E.3, §H.2, §M | "A" | **ACCEPT** | In §H.2, state that `findActiveCartFor` is read-only and persists nothing. | Depends on a store not yet chosen. Reordering (option B) stays available. | Contract text updated; store review/test shows the unavailable path does not write. |
| F-02 (MAJOR, GAP) | No criterion for returning `Failed` vs `Unknown` from `save`. | Candidate §H.2, §E.5, §F | Pending (options A/B/C offered; AI recommends A) | **PENDING** | — | A mislabelled `Failed` invites a duplicating retry. | Rule written in the contract; adapter review confirms. |
| F-03..F-12 | Not yet discussed (BR-03 write-path wording, mixed currency, multiple active carts, overflow threshold, reconcile read, D1 interpretation, naming map, Catalog timeout, malformed Catalog reply, log authorship). | `output/claude-independent-review-report.md` §9 | — | **NOT YET REVIEWED** | — | — | — |

## Change record (only if a recommendation was accepted)
| Affected artifact | Previous version | Updated version | Linked decision ID | Reviewer / approval |
|---|---|---|---|---|
| `claude - technical-design-doc-add-to-cart.md` | Initial proposal | Superseded by consolidated candidate | A1–A8 | Human engineer (chat approval) |
| `claude-design-doc-candidate-add-to-cart.md` | First consolidated candidate | **Not yet updated** for F-01 (§H.2 edit pending; the AI was instructed not to rewrite the doc unprompted) | F-01 | Human engineer approved the finding; edit application pending |

## Reflection (150–250 words) — DRAFT for the team to edit
**What did AI contribute?** The AI produced the first design, compared three independent proposals, surfaced differences (uncertain commits, money, active cart) and framed each decision with alternatives and trade-offs.

**What required independent verification?** The justification that FC-01 requires a Catalog call on increments was shared by two agents and was not supported by the literal requirement. The claim that a failed save leaves the cart unchanged was unproven without a store. Agreement between agents was not treated as evidence. The AI also authored both the design and its decision log, so a human check of the log wording is needed.

**What would your team do differently next time?** Ask for explicit evidence per decision earlier, keep the log in human words, and confirm the baseline's ambiguous points (FC-01 scope) with stakeholders before designing around them.

## Final checks
- [ ] Every accepted change is supported by approved requirements or an explicitly approved new decision. (A1–A8 and F-01 are; F-01's edit is not yet applied.)
- [x] Unconfirmed business rules are recorded as open questions, not approved requirements.
- [ ] Interface contracts, sequence diagrams and data models are consistent where they overlap. (Open: F-02, F-03, F-11.)
- [ ] Relevant preconditions, postconditions, failure behavior and invariants are considered. (Open: F-02.)
- [x] No confidential or personal information was sent to an unauthorized external AI service.
- [ ] The team can explain and defend every accepted design decision. (Team to confirm.)
