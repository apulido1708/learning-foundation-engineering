# ADR-000X: Título corto de la decisión
 
<!--
Nombra el archivo con el número consecutivo y un slug corto, por ejemplo:
docs/adr/0001-usar-postgresql-como-base-de-datos-principal.md
Los ADR se numeran en orden y NUNCA se editan después de aceptados para
cambiar la decisión en sí (sí puedes corregir errores de redacción). Si la
decisión cambia, escribes un ADR nuevo y marcas este como reemplazado
(ver "Estado"). Así el repositorio queda como una bitácora histórica de
por qué el sistema es como es.
-->
 
Autores:
 - @githubusername
Fecha: AAAA-MM-DD
 
## Estado
 
<!--
Uno de: Propuesto | Aceptado | Rechazado | Reemplazado por ADR-000Y | Obsoleto
Un ADR "Propuesto" está en discusión. Una vez el equipo decide, pasa a
"Aceptado" (o "Rechazado" si se descarta la propuesta) y ya no se
modifica su contenido de fondo.
-->
 
Propuesto
 
## Contexto
 
<!--
¿Qué problema técnico, restricción o fuerza nos obliga a tomar esta
decisión ahora? Describe la situación de forma neutral y objetiva —
todavía no es el lugar para argumentar a favor de una opción.
Ejemplos de fuerzas en juego: requisitos no funcionales (rendimiento,
seguridad, escalabilidad), restricciones de equipo o de tiempo,
deuda técnica existente, compatibilidad con sistemas ya construidos.
-->
 
## Decisión
 
<!--
Qué vamos a hacer, en una o dos frases claras y en tiempo presente
("Vamos a usar X para Y"). Esta es la sección más corta del documento:
un ADR no es un RFC, no necesita convencer a nadie aquí — la
justificación ya quedó en "Contexto" y las alternativas descartadas
van abajo.
-->
 
## Alternativas consideradas
 
<!--
Qué otras opciones se evaluaron y por qué se descartaron. No hace
falta un análisis exhaustivo, basta con dejar constancia de que se
consideraron y el motivo del descarte (costo, madurez, curva de
aprendizaje, no cumple un requisito, etc.).
-->
 
## Consecuencias
 
<!--
¿Qué se vuelve más fácil o más difícil después de esta decisión?
Incluye efectos positivos y negativos por igual — un ADR honesto
también documenta el costo que se está aceptando (deuda técnica
introducida, dependencia nueva, curva de aprendizaje del equipo).
-->
 
---
 
### Diferencia con un RFC (referencia rápida)
 
<!--
Elimina esta sección en el ADR final; queda aquí solo como recordatorio
para quien usa la plantilla.
- Un RFC se escribe ANTES de decidir, para abrir discusión y llegar a
  consenso; es un documento "vivo" mientras dura la deliberación.
- Un ADR registra una decisión YA tomada (o que se está formalizando);
  una vez aceptado, es casi inmutable — si cambia, se escribe un ADR
  nuevo que reemplaza al anterior, no se edita el viejo.
- El RFC suele ser más largo (motivación, métricas, riesgos, preguntas
  abiertas); el ADR es deliberadamente corto: Contexto, Decisión,
  Consecuencias.
- En equipos que usan ambos: el RFC es el proceso de deliberación,
  y al cerrarlo se destila un ADR corto como registro histórico de lo
  que finalmente se decidió.
-->
