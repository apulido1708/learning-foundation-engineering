# claude - Human Engineering Decision Log: Add Product to Cart

Review date: 2026-10-20. Baseline: `input/Class15_AI_Challenge_Guide_v1.md`. Documents reviewed: Claude, Codex, Cursor. Every status below was explicitly approved by the human engineer.

| ID | Topic | Alternatives | Human decision | Supporting requirement | Rationale | Accepted trade-off | Residual risk | Status |
|---|---|---|---|---|---|---|---|---|
| D-01 | Catalog consulted on every `addItem` | A always; B only new line; C tolerate outage (discarded) | A | Baseline scenario-level reading (P-17 + "Catalog unavailable → unchanged"). Not FC-01 literal, which is conditional. | Makes the second expected result demonstrable on the P-17 scenario. Cheap to reverse. | Increment availability depends on Catalog. | Stakeholders must confirm. Behaviour for "unknown product" on an increment is undefined. | ACCEPTED (rationale rewritten) |
| D-02 | `save` guarantees and uncertain commit | A binary; B tri-state with `OutcomeUnknown`; C B + `GET /cart` | B | FR-02, INV-01, BR-02 | Removes a false "unchanged" promise when commit confirmation is lost. | Extra state and `cartState` field. No dedicated reconcile endpoint. | Client cannot resolve `OutcomeUnknown` by a supported path. HTTP mapping open. | ACCEPTED |
| D-02a | `GET /cart` for reconciliation | include / exclude | Not required by FR-01/FR-02 | n/a | Additive later. | n/a | See D-02. | DEFERRED |
| D-03 | Where quantity, uniqueness, price rules are enforced | A aggregate only; B aggregate + persistence obligation; C service | B | INV-01 (persisted state), BR-02, BR-03 | INV-01 is about stored state, so the store must also guarantee it, technology-neutral. | Restricts acceptable storage. Two verification layers. | BR-03 not expressible as a constraint. Legacy data not covered. | ACCEPTED |
| D-04 | Unknown fields (`userId`, `price`) in public API | A reject any extra field; B reject known sensitive; C ignore | A | SEC-01, SEC-02 (neither mandates rejection) | One closed-contract rule. Loosening later is backward compatible. | Strict clients get 400. | Existing clients sending extra fields. API versioning undecided. | ACCEPTED |
| D-05 | Money representation | A integer; B exact decimal; C minor units + exponent | B (string in API) | BR-03 | Does not assume scale 0 before the Catalog contract is known. | Precision, scale and rounding must be defined. | Scale depends on Catalog contract (A-04). Single currency and non-negative amounts are unconfirmed assumptions. | ACCEPTED |
| D-06 | No active cart / ambiguous active cart | A fail, ambiguity as `PersistenceFailure`; B own ambiguity code; C create cart | A | Baseline (existing active cart), FR-01 | Respects scope. Client cannot fix ambiguity. | Ambiguity not distinguishable externally. | Cart creation is an open business question. | ACCEPTED |
| D-07 | Concurrency and retries | A out of scope + client guidance; B + version field; C idempotency key | A | Baseline: no concurrent requests. Sequential retries are not covered by it. | No requirement for idempotency. C adds state and lifecycle. | Duplicate-on-retry is documented, not prevented. | Clients ignoring "no automatic replay" duplicate quantity. | ACCEPTED |
| D-08 | Logical data model, "active" representation | A none; B `isActive` boolean; C `status` enum | B. No timestamps, no numeric quantity cap in the model. | FR-01, D-06 | Minimum needed to detect zero or many active carts. | May need migration if expiration adds states. | Expiration policy undefined. | ACCEPTED |

## Not yet reviewed (not decided)
- Unknown product on an increment (`PRODUCT_NOT_FOUND` / `CatalogQuoteRejected` / `InvalidCatalogResponse`).
- Whether the response exposes `customerId` (Cursor does; Claude and Codex do not).
- HTTP status mapping, `/api/v1` versioning, `Cache-Control: no-store`.
- Non-negative amount validation (Codex only).
