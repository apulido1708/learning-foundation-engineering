import { Router } from 'express';

// Recibe la comprobación como función para no acoplar la ruta a Postgres
// (en los tests se reemplaza por una función falsa).
export type DatabaseCheck = () => Promise<boolean>;

export function createHealthRouter(checkDatabase: DatabaseCheck): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const databaseUp = await checkDatabase();

    // 503 permite que Docker, un balanceador o la UI detecten que el sistema no está listo.
    res.status(databaseUp ? 200 : 503).json({
      status: databaseUp ? 'ok' : 'degraded',
      api: 'up',
      database: databaseUp ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
