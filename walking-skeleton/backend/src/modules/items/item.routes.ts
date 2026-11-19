import { Router } from 'express';
import type { ItemService } from './item.service.js';

// Las rutas solo traducen HTTP <-> servicio: sin reglas de negocio ni SQL.
// Express 5 propaga solo los errores de funciones async al error handler.
export function createItemRouter(service: ItemService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await service.list());
  });

  router.post('/', async (req, res) => {
    const item = await service.create(req.body);
    res.status(201).json(item);
  });

  return router;
}
