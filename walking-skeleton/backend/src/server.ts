// Composition root: el único lugar donde se eligen implementaciones concretas
// y se conectan las capas (Pool -> Repository -> Service -> App).
import { createApp } from './app.js';
import { loadConfig, type AppConfig } from './config/env.js';
import { createPool, pingDatabase } from './db/pool.js';
import { PgItemRepository } from './modules/items/item.repository.js';
import { ItemService } from './modules/items/item.service.js';

let config: AppConfig;
try {
  config = loadConfig();
} catch (err) {
  console.error(`[config] ${(err as Error).message}`);
  process.exit(1);
}

const pool = createPool(config.databaseUrl);
const itemService = new ItemService(new PgItemRepository(pool));
const app = createApp({ itemService, checkDatabase: () => pingDatabase(pool) });

const server = app.listen(config.port, () => {
  console.log(`[api] escuchando en http://localhost:${config.port}`);
});

// Apagado ordenado: dejamos terminar las peticiones en curso y cerramos el pool,
// en vez de cortar conexiones a la base de datos a la mitad.
function shutdown(signal: string): void {
  console.log(`[api] ${signal} recibido, cerrando...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  // Red de seguridad por si alguna conexión queda abierta.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
