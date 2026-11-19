# Prompt para Claude Code — Levantar el Walking Skeleton

Ejecuta este prompt en una carpeta vacía (o en el repo del equipo recién clonado). Requiere Docker Desktop corriendo y Node 22 instalado.

---

Actúa como un ingeniero de software senior. Vas a construir y levantar un **Walking Skeleton** completo: la versión mínima de un sistema que atraviesa todas las capas (UI → API → base de datos), se levanta con un solo comando y no tiene lógica de negocio todavía. Es la primera iteración de un proyecto universitario de Ingeniería de Software I, así que el código debe ser **simple, legible y comentado en español** (comentarios cortos que expliquen el *por qué*, no el *qué*).

## Stack (obligatorio, no cambiar)
- Frontend: React 19 + Vite + TypeScript (strict)
- Backend: Node 22 + Express 5 + TypeScript (strict), ejecutado en desarrollo con `tsx watch`
- Base de datos: PostgreSQL 16 (`postgres:16-alpine`)
- Acceso a datos: driver `pg` con **patrón Repository** y SQL explícito parametrizado. **Sin ORM ni query builder.**
- Pruebas: Vitest + Supertest
- Orquestación: Docker Compose v2, **modo desarrollo con hot-reload** (código montado como volumen)
- TypeScript 5.9.x (no 7.x). Imágenes base `node:22-alpine`.

## Estructura exacta
```
.
├── docker-compose.yml
├── .env.example            # se versiona
├── .gitignore              # node_modules, dist, .env
├── README.md
├── db/init/01_schema.sql   # tabla items(id SERIAL PK, title VARCHAR(120) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())
├── db/init/02_seed.sql     # 2 filas de ejemplo
├── backend/
│   ├── Dockerfile, .dockerignore, package.json, package-lock.json, tsconfig.json
│   ├── src/server.ts                       # composition root: Pool -> Repository -> Service -> App; apagado ordenado con SIGTERM/SIGINT
│   ├── src/app.ts                          # createApp(deps): express.json, rutas, 404 JSON bajo /api, error handler (ValidationError->400, resto->500). NO abre puertos
│   ├── src/config/env.ts                   # lee PORT (default 3000) y DATABASE_URL (obligatoria, error claro si falta)
│   ├── src/db/pool.ts                      # createPool(url) y pingDatabase(pool) con SELECT 1
│   ├── src/modules/health/health.routes.ts # GET /api/health -> 200 {status:'ok',api:'up',database:'up',timestamp} o 503 con database:'down'
│   ├── src/modules/items/item.model.ts     # Item {id,title,createdAt ISO}, NewItem {title}
│   ├── src/modules/items/item.repository.ts# interface ItemRepository {findAll, create} + PgItemRepository; mapea created_at -> createdAt
│   ├── src/modules/items/item.service.ts   # ItemService: title obligatorio, trim, máx 120 -> ValidationError
│   ├── src/modules/items/item.routes.ts    # GET /api/items, POST /api/items (201)
│   └── test/items.test.ts                  # InMemoryItemRepository (misma interfaz); casos: health 200, health 503, crear+listar, título vacío 400
└── frontend/
    ├── Dockerfile, .dockerignore, package.json, package-lock.json, tsconfig.json, index.html
    ├── vite.config.ts      # proxy '/api' -> process.env.API_PROXY_TARGET ?? 'http://localhost:3000'; watch.usePolling si WATCH_POLLING==='true'
    └── src/main.tsx, App.tsx, api.ts, styles.css
```

## Reglas de diseño
- Capas estrictas: las rutas no contienen reglas ni SQL; el servicio no sabe de HTTP ni SQL; el repositorio no valida reglas de negocio.
- El servicio depende de la **interfaz** `ItemRepository`, no de la clase concreta (por eso los tests no necesitan Postgres).
- Consultas siempre parametrizadas (`$1`), nunca concatenación.
- Nada de credenciales en el código: todo por variables de entorno.
- El frontend solo habla con la API a través de `src/api.ts`, usando rutas relativas `/api/...` (el proxy de Vite evita CORS; **no instales `cors`**).
- `App.tsx`: muestra un panel con el estado de las 3 capas (Frontend siempre verde; API y Base de datos según `/api/health`, con estados verificando/conectado/sin conexión), una lista de items y un formulario para crear uno. Debe verse bien en móvil. Interfaz en español.

## Docker
**Dockerfiles (backend y frontend):** `FROM node:22-alpine`, `WORKDIR /app`, copiar primero `package.json` y `package-lock.json`, `RUN npm ci`, luego `COPY . .`. Backend: `EXPOSE 3000`, `CMD ["npm","run","dev"]`. Frontend: `EXPOSE 5173`, `CMD ["npm","run","dev","--","--host","0.0.0.0"]`. Comenta por qué se copian los manifiestos antes (cache de capas) y por qué `npm ci`.

**docker-compose.yml** con tres servicios y un volumen con nombre `db-data`:
- `db`: variables `POSTGRES_USER/PASSWORD/DB` desde `.env` con defaults (`${POSTGRES_USER:-app}`…); volúmenes `db-data:/var/lib/postgresql/data` y `./db/init:/docker-entrypoint-initdb.d:ro`; puerto `${DB_PORT:-5432}:5432`; healthcheck `pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}`.
- `api`: `build: ./backend`; `DATABASE_URL=postgres://USER:PASS@db:5432/DB` (host **`db`**, no localhost); volúmenes `./backend:/app` y `/app/node_modules`; puerto `${API_PORT:-3000}:3000`; `depends_on: db: condition: service_healthy`; healthcheck con `wget -qO- http://localhost:3000/api/health`, `start_period: 10s`.
- `web`: `build: ./frontend`; `API_PROXY_TARGET=http://api:3000`, `WATCH_POLLING=${WATCH_POLLING:-false}`; volúmenes `./frontend:/app` y `/app/node_modules`; puerto `${WEB_PORT:-5173}:5173`; `depends_on: api: condition: service_healthy`.
- Comentarios en el archivo explicando: orden de arranque por healthchecks, por qué `db` es un hostname, el truco del volumen anónimo de `node_modules`, y que `db/init` solo corre con el volumen vacío.

`.env.example`: `POSTGRES_USER=app`, `POSTGRES_PASSWORD=app_password`, `POSTGRES_DB=walking_skeleton`, `DB_PORT=5432`, `API_PORT=3000`, `WEB_PORT=5173`, `WATCH_POLLING=false`, con comentarios.

## Forma de trabajo (incremental, con checkpoints)
Construye en este orden y **no avances hasta que el checkpoint pase**. Si algo falla, diagnostica con `docker compose logs <servicio>` y corrige antes de seguir.

1. **Estructura + DB.** Crea `.gitignore`, `.env.example`, `db/init/*.sql` y un compose solo con `db`. `cp .env.example .env`, `docker compose up -d db`.
   ✅ `docker compose ps` muestra db *healthy* y `docker compose exec db psql -U app -d walking_skeleton -c "SELECT * FROM items;"` devuelve 2 filas.
2. **Backend.** Genera `package.json` con scripts `dev`, `build`, `start`, `typecheck`, `test` y `"type":"module"`; instala dependencias con npm (genera el `package-lock.json`). Escribe el código y los tests.
   ✅ `npm run typecheck` y `npm test` pasan localmente (4 tests).
   Agrega `api` al compose: `docker compose up -d --build api`.
   ✅ `curl localhost:3000/api/health` → `"database":"up"`; `curl localhost:3000/api/items` lista 2 items; un POST con `{"title":"Desde curl"}` responde 201; un POST con título vacío responde 400.
3. **Frontend.** Genera el proyecto (sin plantillas sobrantes de Vite: nada de logos ni contador), instala dependencias, escribe el código.
   ✅ `npm run build` pasa sin errores de tipos.
   Agrega `web` al compose: `docker compose up -d --build`.
   ✅ `curl localhost:5173/api/health` responde OK (prueba el proxy) y `http://localhost:5173` carga la app.
4. **Pruebas de comportamiento del esqueleto:**
   - `docker compose stop db` → `curl localhost:3000/api/health` responde 503 con `database:"down"`; `docker compose start db` → vuelve a 200 **sin reiniciar la API**.
   - Modifica temporalmente un texto en `App.tsx` y en `item.service.ts` y confirma en logs que ambos recargan solos; revierte el cambio.
   - `docker compose down && docker compose up -d` → los items creados siguen ahí.
   - `docker compose exec api npm test` pasa dentro del contenedor.
5. **README.md** en español: qué es un walking skeleton, requisitos, arranque rápido (`cp .env.example .env && docker compose up --build`), tabla de URLs, árbol de estructura, comandos útiles (`logs -f`, `ps`, `exec db psql`, `exec api npm test`, `down`, `down -v`), nota de reconstruir tras agregar dependencias, y una sección "Cómo adaptarlo a tu proyecto" (renombrar el módulo `items` por la entidad de la primera historia de usuario; mantener `/api/health`; registrar un ADR del stack).

## Restricciones
- No agregues nada fuera de este alcance: ni autenticación, ni ORM, ni Nginx/build de producción, ni CI, ni linters, ni librerías de UI o de estado.
- No hagas commits ni push salvo que te lo pida.
- No subas `.env`.

## Definición de terminado
Al final, ejecuta desde cero `docker compose down -v && docker compose up -d --build`, espera a que los tres servicios estén *healthy/running* y repite los checks de los pasos 2–3. Luego entrégame un resumen corto con: la salida de `docker compose ps`, la respuesta de `/api/health`, el resultado de los tests y cualquier desviación respecto a este prompt (y por qué).
