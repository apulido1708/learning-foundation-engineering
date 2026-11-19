// Toda la configuración entra por variables de entorno: así no hay credenciales en el código
// y el mismo build sirve en local, en Docker o en otro entorno.

export interface AppConfig {
  port: number;
  databaseUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    // Fallar al arrancar es mejor que fallar en la primera consulta con un error críptico.
    throw new Error(
      'Falta la variable de entorno DATABASE_URL ' +
        '(ejemplo: postgres://app:app_password@localhost:5432/walking_skeleton)',
    );
  }

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT inválido: "${env.PORT}"`);
  }

  return { port, databaseUrl };
}
