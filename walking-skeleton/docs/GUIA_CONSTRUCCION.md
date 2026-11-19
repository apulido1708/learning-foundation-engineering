# Guía de construcción — Walking Skeleton con Docker

**Ingeniería de Software I · UNAL 2026-II**
Stack recomendado: **React (frontend) · Node.js/Express (backend) · PostgreSQL (base de datos)**, todo en TypeScript y levantado con **Docker Compose**.

> Esta guía explica *cómo se construyó* la plantilla, capa por capa. Pueden leerla con el repositorio abierto al lado: cada paso termina en un **checkpoint** verificable.

---

## 0. ¿Qué es un Walking Skeleton y por qué empezar así?

Un **walking skeleton** (Alistair Cockburn; popularizado por Freeman & Pryce en *Growing Object-Oriented Software, Guided by Tests*) es una implementación mínima que:

1. **Atraviesa todas las capas** de la arquitectura que diseñaron (UI → API → persistencia).
2. **Se construye, despliega y prueba de forma automática** (aquí: un solo `docker compose up`).
3. **No tiene casi lógica de negocio**: su valor es probar que la arquitectura *camina*.

¿Por qué como primera iteración? Porque los riesgos más caros de un proyecto suelen ser de **integración** (“funciona en mi máquina”, el frontend no llega a la API, la API no conecta con la base). El walking skeleton los ataca el primer día, cuando arreglarlos es barato. Después, cada historia de usuario se “cuelga” del esqueleto.

**Conexión con el curso:** el esqueleto materializa la *Architectural Hypothesis* (Clase 11) y el diseño detallado (Clases 12–13): las capas que dibujaron ahora existen como carpetas y archivos. La arquitectura en capas (Clase 20) y el patrón Repository (Clase 21) aparecen aquí en su forma más simple.

**Definición de “hecho” para esta iteración:**
- [ ] Cualquier integrante clona el repo y con `docker compose up --build` tiene todo corriendo.
- [ ] El navegador muestra datos que vienen de PostgreSQL pasando por la API.
- [ ] Se puede escribir un dato desde la UI y queda guardado en la base.
- [ ] Existe al menos una prueba automática que pasa.

---

## 1. La arquitectura que vamos a levantar

```
  Tu máquina (host)                         Red interna de Docker Compose
 ┌──────────────────┐        ┌───────────────────────────────────────────────────┐
 │                  │ :5173  │  web (Vite + React)                               │
 │   Navegador  ────┼────────┼─▶  sirve la app y reenvía /api/* ──┐               │
 │                  │        │                                    │ http://api:3000│
 │                  │ :3000  │  api (Node + Express)  ◀───────────┘               │
 │   curl/Postman ──┼────────┼─▶  routes → service → repository ──┐               │
 │                  │        │                                    │ db:5432        │
 │                  │ :5432  │  db (PostgreSQL 16)  ◀─────────────┘               │
 │   DBeaver     ───┼────────┼─▶  volumen db-data (los datos persisten)           │
 └──────────────────┘        └───────────────────────────────────────────────────┘
```

Ideas clave:
- Dentro de la red de Compose **cada servicio se llama por su nombre**: la API se conecta a `db`, no a `localhost`.
- El navegador **solo habla con Vite**. Vite actúa de *proxy* hacia la API → no hay problemas de CORS y el frontend no conoce direcciones internas.
- Los puertos publicados (`5173`, `3000`, `5432`) son solo para que *ustedes* puedan entrar desde su máquina.

---

## 2. Docker en 5 minutos (lo mínimo necesario)

| Concepto | Qué es | Dónde aparece |
|---|---|---|
| **Imagen** | Plantilla inmutable con SO + runtime + dependencias | `postgres:16-alpine`, la que construye cada `Dockerfile` |
| **Contenedor** | Una imagen en ejecución | `db`, `api`, `web` |
| **Dockerfile** | Receta para construir una imagen | `backend/Dockerfile`, `frontend/Dockerfile` |
| **Volumen** | Almacenamiento que sobrevive al contenedor, o carpeta compartida con el host | `db-data`, `./backend:/app` |
| **Red** | Compose crea una red donde los servicios se ven por nombre | `db`, `api` como hostnames |
| **Compose** | Archivo que declara todos los servicios y cómo se relacionan | `docker-compose.yml` |
| **Healthcheck** | Comando que dice si un servicio está *listo* (no solo encendido) | `pg_isready`, `wget /api/health` |

Verifiquen la instalación:

```bash
docker --version
docker compose version     # debe ser v2 ("docker compose", sin guion)
```

---

## 3. Paso 1 — Estructura del repositorio

Una carpeta por servicio y la orquestación en la raíz:

```
walking-skeleton/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── db/init/
├── backend/
└── frontend/
```

Dos reglas desde el día uno:
- **`.env` nunca va a GitHub** (está en `.gitignore`). Se versiona `.env.example` con valores de ejemplo.
- **`node_modules` nunca va a GitHub ni a la imagen** (`.gitignore` y `.dockerignore`).

---

## 4. Paso 2 — La base de datos

### 4.1 Esquema y datos semilla

`db/init/01_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS items (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(120) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

`db/init/02_seed.sql` inserta dos filas de ejemplo.

La imagen oficial de Postgres ejecuta, en orden alfabético, todo archivo `.sql` que encuentre en `/docker-entrypoint-initdb.d/` — **pero solo cuando el volumen de datos está vacío** (primer arranque). Por eso los archivos llevan prefijo numérico.

### 4.2 El servicio `db` en Compose

Empiecen con un `docker-compose.yml` que tenga **solo** la base de datos:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-app_password}
      POSTGRES_DB: ${POSTGRES_DB:-walking_skeleton}
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d:ro
    ports:
      - "${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  db-data:
```

Detalles que vale la pena entender:
- `${POSTGRES_USER:-app}` lee la variable de `.env` y, si no existe, usa `app`.
- `$${POSTGRES_USER}` (doble `$`) le dice a Compose “no lo reemplaces tú”; lo resuelve el shell **dentro** del contenedor.
- `:ro` monta los scripts como solo-lectura.

### ✅ Checkpoint 2

```bash
cp .env.example .env
docker compose up -d db
docker compose ps                     # db debe aparecer como "healthy"
docker compose exec db psql -U app -d walking_skeleton -c "SELECT * FROM items;"
```

Deben ver las dos filas semilla.

---

## 5. Paso 3 — La API (Node + Express + TypeScript)

### 5.1 Capas y responsabilidades

```
HTTP ──▶ item.routes.ts ──▶ item.service.ts ──▶ item.repository.ts ──▶ PostgreSQL
         (presentación)      (reglas de negocio)   (persistencia / SQL)
```

| Archivo | Responsabilidad | Lo que **no** debe hacer |
|---|---|---|
| `item.model.ts` | Define qué es un `Item` para la aplicación | — |
| `item.repository.ts` | Interfaz `ItemRepository` + implementación `PgItemRepository` con SQL | Validar reglas de negocio |
| `item.service.ts` | Reglas: título obligatorio, máx. 120 caracteres | Saber de HTTP o de SQL |
| `item.routes.ts` | Traduce HTTP ↔ llamadas al servicio | Contener reglas o SQL |
| `app.ts` | Ensambla Express: rutas, JSON, manejo de errores | Abrir puertos o conexiones |
| `server.ts` | **Composition root**: crea Pool → Repository → Service → App y escucha | Lógica de cualquier tipo |

### 5.2 El Repository: interfaz + implementación

```ts
export interface ItemRepository {
  findAll(): Promise<Item[]>;
  create(data: NewItem): Promise<Item>;
}

export class PgItemRepository implements ItemRepository {
  constructor(private readonly pool: pg.Pool) {}

  async create(data: NewItem): Promise<Item> {
    const result = await this.pool.query<ItemRow>(
      'INSERT INTO items (title) VALUES ($1) RETURNING id, title, created_at',
      [data.title],
    );
    return toItem(result.rows[0]);
  }
  // ...
}
```

Fíjense en dos decisiones:
- **`$1` y no concatenación de strings**: el driver `pg` envía el valor como parámetro → evita SQL injection.
- **`toItem()`** traduce `created_at` (convención SQL) a `createdAt` (convención TypeScript). La base y el dominio no tienen que hablar igual.

El servicio recibe un `ItemRepository` (la interfaz), no un `PgItemRepository`. Gracias a eso, en las pruebas le pasamos un repositorio **en memoria** y no necesitamos Postgres (ver Paso 6).

### 5.3 El endpoint de salud

`GET /api/health` hace `SELECT 1` contra la base y responde:

```json
{ "status": "ok", "api": "up", "database": "up", "timestamp": "..." }
```

Si la base no responde, devuelve **503** con `"database": "down"`. Es el endpoint más importante del esqueleto: demuestra la conexión API ↔ DB y lo usa Docker como healthcheck.

### 5.4 Configuración por variables de entorno

`config/env.ts` lee `PORT` y `DATABASE_URL`. La aplicación **no tiene contraseñas ni hosts escritos en el código**: Compose se los inyecta. Así el mismo código corre en su portátil, en CI o en un servidor.

### 5.5 El Dockerfile de la API, línea por línea

```dockerfile
FROM node:22-alpine                 # Imagen base: Node 22 LTS sobre Alpine (liviana)
WORKDIR /app                        # Carpeta de trabajo dentro del contenedor
COPY package.json package-lock.json ./
RUN npm ci                          # Instala EXACTAMENTE lo del lockfile
COPY . .                            # Copia el código
EXPOSE 3000                         # Documenta el puerto
CMD ["npm", "run", "dev"]           # tsx watch src/server.ts
```

¿Por qué copiar `package.json` **antes** que el código? Docker cachea cada instrucción como una capa. Si solo cambiaron archivos `.ts`, la capa de `npm ci` se reutiliza y el build tarda segundos en vez de minutos.

¿Por qué `npm ci` y no `npm install`? `ci` respeta el `package-lock.json` al pie de la letra → todo el equipo tiene las mismas versiones.

### 5.6 Agregar `api` al Compose

```yaml
  api:
    build: ./backend
    environment:
      PORT: 3000
      DATABASE_URL: postgres://${POSTGRES_USER:-app}:${POSTGRES_PASSWORD:-app_password}@db:5432/${POSTGRES_DB:-walking_skeleton}
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
```

Las tres líneas que más preguntas generan:
- **`@db:5432`** en la URL: `db` es el nombre del servicio. Dentro de Docker, `localhost` sería el propio contenedor de la API.
- **`./backend:/app`** monta su código dentro del contenedor → `tsx watch` detecta cambios → **hot-reload**.
- **`/app/node_modules`** (volumen anónimo) evita que su carpeta local *tape* los `node_modules` instalados en la imagen (que pueden estar compilados para Linux).
- **`condition: service_healthy`**: la API no arranca hasta que Postgres esté *listo*, no solo encendido.

### ✅ Checkpoint 3

```bash
docker compose up -d --build api
curl http://localhost:3000/api/health
curl http://localhost:3000/api/items
curl -X POST http://localhost:3000/api/items \
     -H "Content-Type: application/json" -d '{"title":"Desde curl"}'
```

---

## 6. Paso 4 — El frontend (React + Vite + TypeScript)

### 6.1 Un solo punto de contacto con la API

`src/api.ts` es el **único** archivo que sabe que existe un backend. Usa rutas relativas (`/api/items`), sin `http://localhost:3000`. Los componentes (`App.tsx`) llaman a `api.listItems()` o `api.createItem()` y no saben nada de `fetch`.

### 6.2 El proxy de Vite

```ts
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    watch: { usePolling: process.env.WATCH_POLLING === 'true' },
  },
});
```

- En Docker, Compose define `API_PROXY_TARGET=http://api:3000`.
- Sin Docker (`npm run dev` local) usa `localhost:3000`.
- `usePolling` es el “plan B” si el hot-reload no detecta cambios (Windows sin WSL, algunas VMs).

### 6.3 Dockerfile y servicio `web`

El Dockerfile es casi idéntico al de la API; la diferencia es el comando:

```dockerfile
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

`--host 0.0.0.0` hace que Vite escuche en todas las interfaces del contenedor; sin eso, solo aceptaría conexiones desde *dentro* del contenedor y el navegador no llegaría.

```yaml
  web:
    build: ./frontend
    environment:
      API_PROXY_TARGET: http://api:3000
      WATCH_POLLING: ${WATCH_POLLING:-false}
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "${WEB_PORT:-5173}:5173"
    depends_on:
      api:
        condition: service_healthy
```

### ✅ Checkpoint 4

```bash
docker compose up --build
```

Abran http://localhost:5173: las **tres capas en verde** y la lista de items de la base. Escriban un item y presionen *Guardar*.

---

## 7. Paso 5 — Comprobar que el esqueleto “camina” (experimentos en clase)

Hagan estos experimentos; cada uno enseña algo distinto:

| # | Experimento | Qué deberían observar | Concepto |
|---|---|---|---|
| 1 | `docker compose stop db` y recargar la página | Base de datos en rojo; `/api/health` responde 503 | Health checks, degradación controlada |
| 2 | `docker compose start db` y recargar | Todo vuelve a verde **sin reiniciar la API** | El *pool* reconecta solo |
| 3 | Cambiar el texto del `<h1>` en `App.tsx` y guardar | El navegador se actualiza solo | Volúmenes + hot-reload |
| 4 | Cambiar el mensaje de error en `item.service.ts` | `docker compose logs -f api` muestra el reinicio | `tsx watch` en contenedor |
| 5 | `docker compose down` y luego `up` | Los items creados **siguen ahí** | Volumen con nombre `db-data` |
| 6 | `docker compose down -v` y luego `up` | Solo quedan las 2 filas semilla | El volumen se borró → `db/init` se re-ejecuta |
| 7 | Otro integrante clona el repo y hace `up --build` | Mismo resultado en su máquina | Reproducibilidad: el objetivo de todo esto |

---

## 8. Paso 6 — Pruebas automáticas

`backend/test/items.test.ts` usa **Vitest** + **Supertest** y un `InMemoryItemRepository` que implementa la misma interfaz que el repositorio real:

```ts
class InMemoryItemRepository implements ItemRepository {
  private items: Item[] = [];
  async findAll() { return [...this.items].reverse(); }
  async create(data: NewItem) { /* guarda en el arreglo */ }
}
```

Las pruebas verifican: health OK/503, crear y listar, y rechazo (400) de un título vacío.

```bash
docker compose exec api npm test
# o, con Node instalado localmente:
cd backend && npm install && npm test
```

Esta es la recompensa concreta de separar capas: **la lógica y la API se prueban en milisegundos, sin levantar Postgres**.

---

## 9. Paso 7 — Convertir la plantilla en *su* proyecto

El esqueleto usa `items` como entidad genérica. Su primera tarea es reemplazarla por la entidad de **su primera historia de usuario** (la más pequeña que cruce todas las capas).

Ejemplo — Food Delivery, historia *“Como cliente quiero ver los restaurantes disponibles”*:

| Capa | Archivo plantilla | En su proyecto |
|---|---|---|
| Base de datos | `01_schema.sql` → tabla `items` | tabla `restaurants (id, name, is_open, ...)` |
| Modelo | `item.model.ts` | `restaurant.model.ts` |
| Persistencia | `item.repository.ts` | `restaurant.repository.ts` (`findOpen()`) |
| Negocio | `item.service.ts` | `restaurant.service.ts` |
| API | `item.routes.ts` → `/api/items` | `restaurant.routes.ts` → `/api/restaurants` |
| Composición | `server.ts` | registrar el nuevo módulo |
| Frontend | `api.ts` + `App.tsx` | `listRestaurants()` + componente de lista |
| Pruebas | `items.test.ts` | `restaurants.test.ts` |

Checklist del equipo:
- [ ] Renombrar el módulo `items` a la entidad de su dominio (o agregar uno nuevo y dejar `items` como referencia temporal).
- [ ] Mantener `/api/health` — no se borra nunca.
- [ ] Verificar que la estructura de carpetas corresponde a los componentes de su diseño (`docs/design/`). Si no corresponde, uno de los dos debe cambiar: **díganlo explícitamente**.
- [ ] Registrar un **ADR** (`Plantilla_ADR_Nygard.md`) con la decisión de stack y de arquitectura del esqueleto: contexto, decisión, alternativas, consecuencias.
- [ ] Actualizar el `README.md` con el nombre del proyecto y cómo levantarlo.
- [ ] Cada integrante levanta el proyecto desde un clon limpio al menos una vez.

---

## 10. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `port is already allocated` | Ya tienen algo en 5432/3000/5173 (p. ej. un Postgres local) | Cambien `DB_PORT`, `API_PORT` o `WEB_PORT` en `.env` |
| Cambié `01_schema.sql` y no pasa nada | Los scripts de `db/init` solo corren con volumen vacío | `docker compose down -v` y `up` (borra los datos) |
| `Cannot find module 'X'` tras `npm install X` | La imagen tiene los `node_modules` viejos | `docker compose up --build` |
| El hot-reload no detecta cambios (Windows) | El código está en el disco de Windows, no en WSL | Clonen dentro de WSL 2 (`\\wsl$\...`) o pongan `WATCH_POLLING=true` (afecta al frontend) |
| `ECONNREFUSED 127.0.0.1:5432` en la API | Usaron `localhost` en vez de `db` en `DATABASE_URL` | Dentro de Docker, el host es el nombre del servicio |
| La página carga pero la API aparece en rojo | La API falló al arrancar | `docker compose logs api` |
| `api` queda en *unhealthy* | `/api/health` no responde 200 (DB caída o error) | `docker compose logs api db` |
| En Mac M1/M2/M3 algo raro con imágenes | — | Las imágenes usadas (`node:22-alpine`, `postgres:16-alpine`) son multi-arquitectura; no requieren ajustes |

Comando de diagnóstico universal:

```bash
docker compose ps && docker compose logs --tail=50
```

---

## 11. Criterios de aceptación de la iteración “Walking Skeleton”

| Criterio | Evidencia |
|---|---|
| Arranque en un comando | Video corto o captura de `docker compose up --build` desde un clon limpio |
| Recorrido de punta a punta | La UI muestra datos de Postgres y permite crear uno nuevo |
| Arquitectura trazable | Las carpetas/módulos del backend corresponden a los componentes del diseño |
| Configuración externa | Sin credenciales en el código; `.env.example` versionado, `.env` ignorado |
| Prueba automática | Al menos una prueba que pasa con `npm test` |
| Decisión documentada | ADR del stack/arquitectura en el repositorio |

---

## Anexo — Para el docente: secuencia sugerida (110 min)

| Tiempo | Bloque | Actividad |
|---|---|---|
| 10 min | Qué es un walking skeleton | Riesgo de integración; conexión con Architectural Hypothesis y Delivery 2 |
| 10 min | Docker mínimo | Tabla de la sección 2; diagrama de la sección 1 |
| 15 min | Demo en vivo: `db` | Checkpoint 2 en proyector |
| 20 min | Demo en vivo: `api` | Capas, Dockerfile línea por línea, Checkpoint 3 |
| 15 min | Demo en vivo: `web` | Proxy de Vite, Checkpoint 4 |
| 25 min | Equipos | Clonan la plantilla, la levantan y hacen los experimentos 1–6 |
| 10 min | Cierre | Cada equipo nombra la primera historia que colgará del esqueleto (sección 9) |
| 5 min | Tarea | Checklist de la sección 9 + ADR del stack |
