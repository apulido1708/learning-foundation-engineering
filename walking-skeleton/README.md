# Walking Skeleton

Primera iteración de un proyecto de Ingeniería de Software I: un sistema mínimo que atraviesa
**todas las capas** (UI → API → base de datos), se levanta con **un solo comando** y todavía
**no tiene lógica de negocio**.

## ¿Qué es un walking skeleton?

Es la implementación más pequeña posible de la arquitectura completa, funcionando de punta a
punta. No resuelve el problema del usuario todavía; su objetivo es **eliminar riesgo técnico
temprano**: demostrar que el frontend habla con la API, que la API habla con la base de datos,
que todo se levanta igual en cualquier máquina y que hay pruebas automáticas desde el día uno.
Sobre este esqueleto se van agregando, historia por historia, los "músculos" (la funcionalidad).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + TypeScript (strict) |
| Backend | Node 22 + Express 5 + TypeScript (strict), `tsx watch` en desarrollo |
| Base de datos | PostgreSQL 16 (`postgres:16-alpine`) |
| Acceso a datos | Driver `pg` + patrón Repository, SQL parametrizado (sin ORM) |
| Pruebas | Vitest + Supertest |
| Orquestación | Docker Compose v2 (modo desarrollo con hot-reload) |

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine + Compose v2).
- Git.
- Opcional: Node 22 si quieres correr `npm test` o `npm run build` fuera de Docker.

## Arranque rápido

```bash
cp .env.example .env && docker compose up --build
```

La primera vez tarda un poco (descarga imágenes e instala dependencias). Cuando veas
`VITE ready`, abre <http://localhost:5173>. Para dejarlo corriendo en segundo plano usa
`docker compose up -d --build`.

> ¿Un puerto ya está ocupado (por ejemplo, tienes Postgres instalado en tu máquina)?
> Cambia `DB_PORT`, `API_PORT` o `WEB_PORT` en tu `.env`.

## URLs

| Servicio | URL | Descripción |
|---|---|---|
| Frontend | <http://localhost:5173> | App React (Vite con hot-reload) |
| API | <http://localhost:3000/api/health> | Estado de la API y de la base de datos |
| API | <http://localhost:3000/api/items> | `GET` lista, `POST {"title": "..."}` crea |
| Proxy | <http://localhost:5173/api/health> | La misma API vista a través del proxy de Vite |
| PostgreSQL | `localhost:5432` | Usuario/clave/base según tu `.env` |

## Estructura

```
.
├── docker-compose.yml          # db + api + web, orden por healthchecks
├── .env.example                # plantilla de variables (el .env real no se versiona)
├── db/init/                    # SQL que corre solo la primera vez (volumen vacío)
│   ├── 01_schema.sql
│   └── 02_seed.sql
├── backend/
│   ├── src/
│   │   ├── server.ts           # composition root: Pool -> Repository -> Service -> App
│   │   ├── app.ts              # createApp(deps): rutas y manejo de errores, sin abrir puertos
│   │   ├── config/env.ts       # lectura y validación de variables de entorno
│   │   ├── db/pool.ts          # Pool de conexiones y ping a la base
│   │   └── modules/
│   │       ├── health/health.routes.ts
│   │       └── items/          # model -> repository -> service -> routes
│   └── test/items.test.ts      # pruebas con un repositorio en memoria (sin Postgres)
└── frontend/
    ├── vite.config.ts          # proxy /api -> backend
    └── src/
        ├── api.ts              # único módulo que habla con la API
        ├── App.tsx             # panel de estado + lista + formulario
        ├── main.tsx
        └── styles.css
```

### Capas del backend

```
HTTP ──> routes ──> service ──> ItemRepository (interfaz) <── PgItemRepository ──> PostgreSQL
                                                          <── InMemoryItemRepository (tests)
```

- **routes**: traducen HTTP ↔ servicio. Sin reglas ni SQL.
- **service**: reglas de negocio (p. ej. título obligatorio, máx. 120). No sabe de HTTP ni SQL.
- **repository**: SQL parametrizado (`$1`) y mapeo de columnas (`created_at` → `createdAt`).
- El servicio depende de la **interfaz**, por eso las pruebas no necesitan base de datos.

## Comandos útiles

```bash
docker compose logs -f                 # ver logs de todos los servicios (o: logs -f api)
docker compose ps                      # estado y salud de los contenedores
docker compose exec db psql -U app -d walking_skeleton   # consola SQL
docker compose exec api npm test       # correr las pruebas del backend
docker compose down                    # detener (los datos se conservan)
docker compose down -v                 # detener y BORRAR los datos (vuelve a correr db/init)
```

### Después de agregar una dependencia

`node_modules` vive dentro de la imagen (no en tu carpeta), así que tras cambiar
`package.json` hay que reconstruir:

```bash
docker compose exec api npm install <paquete>   # instala con Node 22 y actualiza el lockfile
docker compose up -d --build api                # reconstruye la imagen con la nueva dependencia
```

(Igual para `web`.) Instalar desde el contenedor garantiza que `package-lock.json` lo genera la
misma versión de Node/npm que usa la imagen; si lo generas con otra versión, `npm ci` puede
fallar con *"package.json and package-lock.json are not in sync"*.

### Si el hot-reload no detecta cambios

En algunos entornos (Docker en Windows/WSL, ciertas configuraciones de macOS) los eventos de
archivos no llegan al contenedor. Pon `WATCH_POLLING=true` en tu `.env` y ejecuta
`docker compose up -d`: activa el *polling* tanto en Vite como en `tsx watch`.

## Cómo adaptarlo a tu proyecto

1. **Renombra el módulo `items`** por la entidad de tu primera historia de usuario
   (p. ej. `orders`, `restaurants`): tabla en `db/init/01_schema.sql`, carpeta
   `backend/src/modules/<entidad>/`, rutas `/api/<entidad>`, `frontend/src/api.ts` y `App.tsx`.
   Luego `docker compose down -v && docker compose up -d --build` para recrear la base.
2. **Mantén `/api/health`**: lo usan el healthcheck de Docker y el panel de estado de la UI.
3. **Respeta las capas**: reglas en el servicio, SQL solo en el repositorio, rutas delgadas.
   Cada regla nueva viene con su prueba en `backend/test/`.
4. **Registra un ADR del stack** (por qué React/Express/PostgreSQL, por qué Repository sin ORM,
   por qué Docker Compose) en la carpeta de decisiones de tu equipo.
