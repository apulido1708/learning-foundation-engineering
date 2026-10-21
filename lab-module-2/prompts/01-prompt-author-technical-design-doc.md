ROLE

Act as a Senior Software Engineer preparing a technical
design proposal for review by an experienced engineering team.

Use the design documentation and collaborative review
principles described in:

- Software Engineering at Google, Chapter 10.
- SWEBOK Guide v4, Software Design Knowledge Area.
- Established software engineering principles:
  abstraction, modularity, information hiding,
  cohesion, coupling and design rationale.

Your task is to prepare a concise, reviewable
Technical Design Doc.

Do not produce a collection of disconnected diagrams.

The document must explain the problem, propose a solution,
evaluate alternatives and make engineering decisions
explicit.

The goal is to support engineering discussion
and reach a defensible technical decision.

────────────────────────────────────────
1. BUSINESS CONTEXT
────────────────────────────────────────

We are designing the Add Product to Cart capability
for an E-Commerce system.

An authenticated customer has an active shopping cart.

The cart already contains:

Product: P-17
Quantity: 1
Agreed unit price: COP 20,000

The customer adds two additional units.

Catalog currently reports:

Product: P-17
Current price: COP 22,000

The expected result is:

Product: P-17
Quantity: 3
Agreed unit price: COP 20,000

There must be exactly one cart line for P-17.

Assume no concurrent requests for this scenario.

────────────────────────────────────────
2. APPROVED REQUIREMENTS
────────────────────────────────────────

FR-01:
Customers can add products to an active shopping cart.

FR-02:
After a successful operation, return the updated cart state.

BR-01:
Adding an existing product increases its quantity.

BR-02:
A product can have at most one cart line
within the same shopping cart.

BR-03:
Increasing an existing cart line's quantity
preserves its agreed unit price.

FC-01:
If Catalog is unavailable before mutation,
the cart must remain unchanged.

INV-01:
Every persisted CartItem must have quantity > 0.

SEC-01:
The authenticated identity determines
which customer's cart can be modified.

A caller-provided userId is not sufficient authorization.

SEC-02:
Client-provided prices are not authoritative.

They must not be trusted without
server-side verification.

────────────────────────────────────────
3. UNRESOLVED BUSINESS QUESTIONS
────────────────────────────────────────

The following decisions are not approved:

- Whether stock availability must be checked.
- When availability should be checked.
- Maximum permitted quantity.
- Cart expiration policy.

Do not silently turn these questions
into approved requirements.

Identify alternatives where useful.

────────────────────────────────────────
4. DESIGN TASK
────────────────────────────────────────

Prepare a Technical Design Doc suitable
for peer review.

Use the following structure.

A. CONTEXT AND PROBLEM

Explain the business capability,
the current scenario and the engineering problem.

Distinguish business requirements
from proposed technical decisions.

B. GOALS

Identify the outcomes the design must achieve.

Reference approved requirement IDs.

C. NON-GOALS

Clarify what is outside the scope
of this design proposal.

Do not invent additional business policies.

D. DESIGN CONSIDERATIONS

Identify the requirements, constraints,
quality concerns and important assumptions
that influence the solution.

E. PROPOSED DESIGN

Explain the proposed approach.

Describe:

- Major component responsibilities.
- Important interactions.
- Data ownership.
- State management.
- Interface boundaries.
- Failure handling.
- Security considerations.

Use a small number of diagrams
only when they improve understanding.

Prefer Mermaid for diagrams.

Include a component diagram
to explain architectural responsibilities.

Include a sequence diagram
to explain the successful scenario
and CatalogUnavailable behavior.

Include a focused class diagram
only where internal structure
is necessary to justify the design.

F. INTERFACE CONTRACT

Specify the addItem operation.

Include:

- Inputs and outputs.
- Preconditions.
- Postconditions.
- Relevant invariants.
- Failure outcomes.

Ensure consistency with the proposed interactions.

G. ALTERNATIVES CONSIDERED

Identify at least two meaningful
technical alternatives.

For each alternative explain:

- How it would work.
- Advantages.
- Disadvantages.
- Relevant constraints.
- Why it was selected or rejected.

Do not invent performance measurements.

H. TRADE-OFFS

Explain what the proposed design gains
and what consequences it accepts.

Consider maintainability, consistency,
complexity and operational risk
where relevant.

I. SECURITY AND PRIVACY

Explain how the design respects SEC-01 and SEC-02.

Identify any security assumptions
that require confirmation.

J. RISKS AND OPEN QUESTIONS

Identify unresolved issues,
their potential consequences
and the decisions needed.

K. DESIGN REVIEW CHECKLIST

Evaluate the proposal against
the approved requirements.

Identify any contradictions,
missing evidence or unsupported assumptions.

────────────────────────────────────────
5. ENGINEERING PRINCIPLES
────────────────────────────────────────

Follow these principles:

- Keep the design as simple as possible.
- Separate responsibilities clearly.
- Avoid unnecessary dependencies.
- Preserve information hiding.
- Define explicit interfaces.
- Justify important decisions.
- Document meaningful alternatives.
- Make assumptions visible.
- Maintain traceability to requirements.

Do not assume microservices are necessary.

Do not introduce frameworks,
database engines or infrastructure
without a justified requirement.

Do not generate implementation code.

────────────────────────────────────────
6. REVIEW EXPECTATIONS
────────────────────────────────────────

The document must be reviewable
by another engineer.

Prioritize engineering reasoning
over document length.

Every major design decision should answer:

Why this approach?

What alternatives were considered?

What trade-off is accepted?

Which requirement or constraint
supports the decision?

What evidence would cause us
to reconsider it?

────────────────────────────────────────
7. REQUIRED VALIDATION
────────────────────────────────────────

Before presenting the final document,
walk through the following scenario.

Initial state:

P-17
quantity = 1
unitPrice = COP 20,000

Request:

addItem(P-17, 2)

Expected result:

P-17
quantity = 3
unitPrice = COP 20,000

Exactly one P-17 cart line.

Then evaluate:

CatalogUnavailable before mutation.

Expected result:

The cart remains unchanged.

If any guarantee cannot be demonstrated
from the proposed design,
identify the gap explicitly.

Do not claim the design has been
implemented or tested.

────────────────────────────────────────
8. OUTPUT
────────────────────────────────────────

Produce a professional Technical Design Doc.

Language: English.

Use clear headings and concise explanations.

Use Mermaid where diagrams add value.

Do not include unnecessary UML diagrams.

Distinguish:

APPROVED REQUIREMENTS
PROPOSED DESIGN DECISIONS
ASSUMPTIONS
OPEN QUESTIONS

Finish with:

- Design decisions requiring review.
- Open questions requiring stakeholder input.
- A concise engineering self-review.

The document is a proposal,
not an approved implementation.