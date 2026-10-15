<!--
WORKED EXAMPLE — not a blank to fill in and not a project to reuse.
Food Delivery System, the running example from Classes 8 to 11. It covers three requirements
only (REQ-07, REQ-12, REQ-13) so it stays readable. Your deliverable must cover YOUR whole
system and YOUR own project. Use this for level of detail and for how the sections connect.
-->

# Food Delivery System — Architectural & Detailed Design v1.0

| | |
|---|---|
| **Team** | Example Team |
| **Members** | (names) |
| **Status** | Ready for review |
| **Date** | 2026-10-12 |
| **Inputs** | `docs/requirements/REQ-07.md`, Architectural Hypothesis v0.1, Detailed Design v0.1 |

---

## 1. System Overview & Design Drivers

**System purpose**
> Let customers place food orders and follow them until delivery, reducing the uncertainty of waiting and avoiding wasted orders.

| Requirement / Use Case ID | Why it shapes the structure | Quality attribute, constraint or business rule involved |
|---|---|---|
| REQ-07 / Track Order | Needs data from a provider we do not control and must keep working when that data is missing | Constraint: integrate with the existing tracking provider. Quality: availability of the customer experience |
| REQ-12 / Cancel Order | Order state changes must be controlled in one place | Business Rule BR-01: an order can be cancelled only before preparation begins |
| REQ-13 / Cancel Order (rejection) | Same rule, opposite outcome, must stay consistent with REQ-12 | BR-01 |

---

## 2. Architectural Design

### 2.1 System Context & Boundary

| Outside the system | Type | How the system interacts with it |
|---|---|---|
| Customer | Actor | Opens order status, requests cancellation |
| Delivery Tracking Provider | External system | We request tracking data for an order. We do not control its availability or format |

### 2.2 Components, Responsibilities & Capabilities

```mermaid
flowchart LR
    Customer([Customer])
    subgraph SYS["Food Delivery System"]
        OSD["Order Status Display"]
        ER["Estimate Resolver"]
        TI["Tracking Integration"]
        OM["Order Management"]
        OR["Order Records"]
    end
    TP[("Delivery Tracking Provider")]

    Customer --> OSD
    OSD -->|"resolve estimate"| ER
    ER -->|"get estimated arrival"| TI
    TI -->|"request tracking data"| TP
    OSD -->|"cancel order / get status"| OM
    OM -->|"find / save order"| OR
```

| Component | Main responsibility | Requirements / use cases supported | Provided capabilities | Required capabilities | Main dependencies |
|---|---|---|---|---|---|
| Order Status Display | Presents order status and the estimate, and forwards customer actions | REQ-07, REQ-12, REQ-13 | Show status and estimate to the customer | Resolve estimate, cancel order, get order status | Estimate Resolver, Order Management |
| Estimate Resolver | Decides what estimate information the customer should see, including when no estimate exists | REQ-07 | Resolve estimate for an order | Get estimated arrival, get order status | Tracking Integration, Order Management |
| Tracking Integration | Isolates all communication with the tracking provider and returns an estimate or an explicit "unavailable" | REQ-07 | Get estimated arrival | Request tracking data (external) | Delivery Tracking Provider |
| Order Management | Applies the cancellation rules and controls order state changes | REQ-12, REQ-13 | Cancel order, get order status | Find order, save order | Order Records |
| Order Records | Persists and retrieves orders | REQ-12, REQ-13 | Find order, save order | none | none |

---

## 3. Detailed Design

### 3.1 Components selected

| Component | Why it was selected |
|---|---|
| Tracking Integration | Highest risk: depends on an external provider and must handle three outcomes (valid data, stale data, no response) |
| Order Management | Carries business rule BR-01. A mistake here breaks the cancellation behavior directly |

### 3.2 Class Diagram

```mermaid
classDiagram
    class EstimateResolver {
        +resolveEstimate(orderId : OrderId) DisplayEstimate
    }
    class TrackingIntegration {
        +getEstimatedArrival(orderId : OrderId) EtaResult
    }
    class RequestHandler {
        +fetch(orderId : OrderId) RawTrackingResponse
    }
    class ResponseParser {
        +parse(raw : RawTrackingResponse) TrackingData
    }
    class FallbackHandler {
        +unavailable(reason : String) EtaResult
    }
    class EtaResult {
        -available : Boolean
        -eta : Timestamp
        -reason : String
        +isAvailable() Boolean
    }
    class OrderManagement {
        +cancelOrder(orderId : OrderId) CancellationResult
    }
    class Order {
        -orderId : OrderId
        -status : OrderStatus
        +isCancellable() Boolean
        +cancel()
    }
    class OrderItem {
        -menuItemId : Integer
        -quantity : Integer
    }
    class OrderRepository {
        <<interface>>
        +findById(orderId : OrderId) Order
        +save(order : Order)
    }

    EstimateResolver --> TrackingIntegration : asks for estimate
    TrackingIntegration --> RequestHandler : uses
    TrackingIntegration --> ResponseParser : uses
    TrackingIntegration --> FallbackHandler : uses
    TrackingIntegration ..> EtaResult : returns
    OrderManagement --> Order : applies rule on
    OrderManagement ..> OrderRepository : depends on
    Order "1" *-- "1..*" OrderItem : contains
```

*(`Order` and `OrderItem` use composition: an item has no meaning outside its order. No generalization is used because nothing in this design is a specialized type of something else.)*

### 3.3 Class Responsibilities

| Class | Component | Responsibility | Key collaborators |
|---|---|---|---|
| EstimateResolver | Estimate Resolver | Turns an estimate result into what the customer should see | TrackingIntegration |
| TrackingIntegration | Tracking Integration | Coordinates the steps needed to produce an estimate or Unavailable | RequestHandler, ResponseParser, FallbackHandler |
| RequestHandler | Tracking Integration | Sends the request to the provider and returns the raw response | (provider) |
| ResponseParser | Tracking Integration | Validates the provider's response and converts it to data our system understands | none |
| FallbackHandler | Tracking Integration | Builds a consistent "unavailable" result with a reason | none |
| EtaResult | Tracking Integration | Carries either an ETA or an unavailable reason | none |
| OrderManagement | Order Management | Applies BR-01 and coordinates cancellation | Order, OrderRepository |
| Order | Order Management | Knows its status and whether it can still be cancelled | OrderItem |
| OrderItem | Order Management | Represents one menu item and quantity inside an order | none |
| OrderRepository | Order Records | Stores and retrieves orders (contract only, storage details hidden) | Order |

### 3.4 Behavior of one key operation

```text
getEstimatedArrival(orderId):
    raw = RequestHandler.fetch(orderId)
    IF raw is missing:
        RETURN FallbackHandler.unavailable("provider did not respond")
    data = ResponseParser.parse(raw)
    IF data is incomplete OR older than the freshness limit:
        RETURN FallbackHandler.unavailable("tracking data not usable")
    RETURN EtaResult(available, computeEta(data))
```

---

## 4. Design Quality — Cohesion, Coupling, Information Hiding

| Question | Your answer, with evidence from your design |
|---|---|
| **Cohesion** | `TrackingIntegration` only coordinates. Fetching, parsing and building the unavailable result each live in their own class. `Order` holds only status and eligibility. |
| **Coupling** | The strongest dependency is on the provider's response format, and it is contained in `ResponseParser`. `EstimateResolver` depends only on `EtaResult`. A provider change reaches one class. |
| **Information hiding** | The raw provider response, the freshness check and the storage details behind `OrderRepository` stay internal. Other components see only `EtaResult` and the repository contract. |

**Real findings and what we changed**
> The first draft had `EstimateResolver` reading the provider's timestamp format to decide whether data was stale (coupling). We moved parsing and freshness checks into `ResponseParser`. The first draft also had `Order` formatting the cancellation message for the customer (cohesion). We moved the wording to Order Status Display.

---

## 5. Design Decisions & Decision Record

### Decision A — Architectural

| | |
|---|---|
| **Context** | REQ-07 depends on an external provider we do not control (Constraint). Its availability and format can change. |
| **Decision** | All communication with the tracking provider goes through Tracking Integration. No other component calls the provider or sees its format. |
| **Rationale** | A provider failure or format change stays contained, and the customer can still see the order status when no estimate exists. |
| **Trade-off accepted** | One extra hop between the customer's screen and the provider, so slightly more latency. We rejected letting the display call the provider directly because every provider change would then reach the user interface. |

### Decision B — Detailed design

| | |
|---|---|
| **Context** | The provider can answer with usable, stale, incomplete data, or not answer at all. Those outcomes were being handled in different places. |
| **Decision** | `TrackingIntegration` always returns an `EtaResult`, and "unavailable" is a normal result with a reason, never an exception that propagates. |
| **Rationale** | Callers handle one result type. The unavailable path (REQ-07 alternative and exception flows) is designed instead of accidental. |
| **Trade-off accepted** | Callers must check `isAvailable()` explicitly, and a forgotten check shows an empty estimate instead of failing loudly. |

### ADR

**ADR file:** `docs/decisions/ADR-001-isolate-tracking-provider.md` — records Decision A.

---

## 6. Traceability

| Requirement ID | Use Case | Component(s) | Class(es) |
|---|---|---|---|
| REQ-07 | Track Order | Order Status Display, Estimate Resolver, Tracking Integration | EstimateResolver, TrackingIntegration, RequestHandler, ResponseParser, FallbackHandler, EtaResult |
| REQ-12 | Cancel Order | Order Status Display, Order Management, Order Records | OrderManagement, Order, OrderItem, OrderRepository |
| REQ-13 | Cancel Order | Order Status Display, Order Management | OrderManagement, Order |

---

## 7. Optional — AI-Assisted Design Reflection

> An AI assistant suggested adding a separate Notification component to tell customers when an estimate changes. We rejected it: no requirement in our set supports it, and it would add a component without a responsibility we can trace.

---

## 8. Consistency Checklist

- [x] Every component in the diagram appears in the responsibilities table, and the other way around.
- [x] Every class belongs to an identifiable component.
- [x] Components are named by responsibility, not technology.
- [x] Nothing inside the system boundary is something we do not control.
- [x] Provided and required capabilities match across components.
- [x] Both decisions name a real cost or limitation, and at least one has an ADR.
- [x] The traceability table has no empty rows and no orphan components or classes.
- [x] Diagrams render correctly on GitHub.
