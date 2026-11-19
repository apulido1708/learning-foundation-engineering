import pg from 'pg';

// Un único Pool por proceso: reutiliza conexiones en lugar de abrir una por petición.
export function createPool(databaseUrl: string): pg.Pool {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    // Si la base de datos no responde, preferimos un error rápido a una petición colgada.
    connectionTimeoutMillis: 3000,
  });

  // Sin este listener, el error de una conexión inactiva (p. ej. si Postgres se reinicia)
  // tumbaría todo el proceso de Node.
  pool.on('error', (err) => {
    console.error('[db] error en una conexión inactiva:', err.message);
  });

  return pool;
}

// Comprobación mínima de vida: si SELECT 1 responde, la base está disponible.
export async function pingDatabase(pool: pg.Pool): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
