import express, { type ErrorRequestHandler, type Express } from 'express';
import { createHealthRouter, type DatabaseCheck } from './modules/health/health.routes.js';
import { createItemRouter } from './modules/items/item.routes.js';
import { ValidationError, type ItemService } from './modules/items/item.service.js';

// Dependencias explícitas: quien crea la app decide qué implementaciones usar
// (Postgres en server.ts, memoria en los tests).
export interface AppDeps {
  itemService: ItemService;
  checkDatabase: DatabaseCheck;
}

// Construye la app pero NO abre puertos: así Supertest puede probarla sin red.
export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(express.json());

  app.use('/api/health', createHealthRouter(deps.checkDatabase));
  app.use('/api/items', createItemRouter(deps.itemService));

  // Cualquier otra ruta bajo /api responde JSON, no la página HTML por defecto de Express.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    // JSON mal formado en el body: es un error del cliente, no del servidor.
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
      return;
    }
    // No exponemos detalles internos al cliente; quedan en el log del servidor.
    console.error('[api] error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  };
  app.use(errorHandler);

  return app;
}
