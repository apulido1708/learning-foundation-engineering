# Human Engineering Decision Log

Revisión interactiva de Add Product to Cart. El ingeniero humano conserva la autoridad sobre las decisiones. Las propuestas originales no se modifican automáticamente.

Baseline: [Approved classroom baseline](../input/Class15_AI_Challenge_Guide_v1.md). Propuestas: [Claude](claude%20-%20technical-design-doc-add-to-cart.md), [Codex](codex-add-product-to-cart-design.md) y [Cursor](cursor-add-product-to-cart-design.md).

## D-01 — Dependencia de Catalog en cada addItem

| Campo | Registro |
|---|---|
| Fecha | 2026-10-20 |
| Alternativas | A: consultar Catalog en cada adición antes de mutar. B: consultar solo al crear líneas, previa aclaración del escenario de indisponibilidad. |
| Decisión humana | «Apruebo A». Consultar Catalog siempre; si falla, no modificar el carrito. |
| Evidencia | FC-01 y escenario obligatorio de CatalogUnavailable; BR-03 exige conservar el precio de la línea existente. |
| Rationale | Una secuencia uniforme demuestra directamente el escenario solicitado. La consulta universal se acepta como design decision, no como obligación deducida únicamente de FC-01. |
| Trade-off aceptado | Los incrementos dependen de la disponibilidad y latencia de Catalog aunque no utilicen su precio actual. |
| Riesgo residual | Caídas de Catalog bloquean incrementos; timeout y retry policy siguen pendientes. La aprobación no decide el tratamiento de productos desconocidos ni de quotes inválidas. |
| Estado | ACCEPTED |

## D-02 — Atomicidad y resultado incierto de persistencia

| Campo | Registro |
|---|---|
| Fecha | 2026-10-20 |
| Alternativas | A: Committed, NotCommitted y OutcomeUnknown. B: contrato binario condicionado a demostrar que el adapter resuelve toda incertidumbre de commit. |
| Decisión humana | «A». Lectura sin efectos secundarios, guardado atómico y tres resultados explícitos. Éxito solo tras commit confirmado; sin reintento automático ante incertidumbre. |
| Evidencia | FR-02, BR-02 e INV-01. FC-01 no promete rollback ante fallos de almacenamiento. La ausencia de concurrencia no elimina confirmaciones perdidas. |
| Rationale | Atomicidad garantiza todo o nada, pero no conocimiento del resultado. NotCommitted exige evidencia de ausencia de escritura o rollback; OutcomeUnknown no puede presentarse como carrito sin cambios. |
| Trade-off aceptado | Servicio y cliente deben manejar un tercer resultado en lugar de un éxito/fallo binario. |
| Riesgo residual | Hace falta demostrar atomicidad en el adapter. La reconciliación no proporciona idempotencia y una respuesta perdida puede ocultar un commit exitoso. Motor de almacenamiento y mecanismos de idempotencia no seleccionados. |
| Estado | ACCEPTED |

## D-03 — Campos inesperados en la API pública

| Campo | Registro |
|---|---|
| Fecha | 2026-10-20 |
| Alternativas | A: rechazar cualquier campo no definido. B: ignorar explícitamente campos adicionales y extraer solo los permitidos. |
| Decisión humana | «A». Rechazar campos adicionales, incluidos userId y price, mediante validación antes de ejecutar el caso de uso. |
| Evidencia | SEC-01 y SEC-02 establecen las fuentes de autoridad. No obligan a rechazar campos adicionales; el rechazo estricto es una decisión de contrato. |
| Rationale | Detectar errores de integración y evitar que el cliente crea que su identidad o precio enviados fueron aplicados. No existe un requisito de compatibilidad que justifique tolerarlos. |
| Trade-off aceptado | Los clientes deben ajustarse al esquema; un campo extra causa rechazo aunque pudiera ignorarse de forma segura. |
| Riesgo residual | Validar el esquema no sustituye autenticación ni autorización. Los nombres definitivos de campos y códigos de error siguen pendientes. |
| Estado | ACCEPTED |

## D-04 — Ubicación de las reglas del carrito

| Campo | Registro |
|---|---|
| Fecha | 2026-10-20 |
| Alternativas | A: reglas encapsuladas en Cart con protección en persistence. B: reglas centralizadas en el application service con protección en persistence. |
| Decisión humana | «Approve A». Cart decide crear o incrementar líneas y preserva el agreed unit price; el application service coordina. Persistence refuerza unicidad y cantidades positivas mediante constraints o garantías equivalentes. |
| Evidencia | BR-01, BR-02, BR-03 e INV-01 fijan los resultados. El uso de un aggregate es una decisión de diseño, no un requisito explícito. |
| Rationale | Encapsular la transición permite reutilizar las reglas sin duplicarlas entre puntos de entrada. Cart permanece pequeño y sin acceso directo a Catalog ni almacenamiento. |
| Trade-off aceptado | Un modelo con comportamiento añade estructura frente a entidades de datos operadas por un servicio. La protección en persistence complementa las reglas sin duplicar toda la operación. |
| Riesgo residual | Se debe verificar que ningún punto de entrada evada el comportamiento de Cart y que persistence haga efectivas las invariantes. La tecnología concreta sigue pendiente. |
| Estado | ACCEPTED |

## D-05 — Representación de Money

| Campo | Registro |
|---|---|
| Fecha | 2026-10-20 |
| Alternativas | A: decimal exacto más moneda, con string decimal en JSON. B: entero en unidades menores, con escala explícita y transmisión como string. |
| Decisión humana | «Aprobado», en respuesta a la recomendación A. Usar decimal exacto con moneda y string decimal en JSON, sin redondeo silencioso. |
| Evidencia | BR-03 exige conservar el agreed unit price; SEC-02 fija la autoridad del precio. Los valores enteros del escenario no establecen precisión ni escala generales. |
| Rationale | Conservar directamente el valor decimal evita imponer que Catalog solo entregue precios en pesos completos. |
| Trade-off aceptado | Usar tipos decimales exactos y validación en las fronteras; los consumidores deben interpretar el string como decimal. |
| Riesgo residual | Acordar precisión y escala con Catalog antes de implementar el esquema físico. No se aprueban conversión monetaria ni carritos con monedas mezcladas. |
| Estado | ACCEPTED |

Las decisiones posteriores se registrarán cuando el ingeniero responda; no hay otras decisiones aprobadas en esta revisión.
