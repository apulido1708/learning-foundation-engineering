// Único punto de contacto con el backend. Los componentes nunca llaman a fetch directamente:
// si la API cambia, solo se toca este archivo.
// Las rutas son relativas (/api/...) para que pasen por el proxy de Vite.

export interface Item {
  id: number;
  title: string;
  createdAt: string;
}

export interface Health {
  status: string;
  api: 'up' | 'down';
  database: 'up' | 'down';
  timestamp: string;
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null; // p. ej. el proxy devolvió HTML/texto porque la API no responde
  }
}

function errorMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    return String((body as { error: unknown }).error);
  }
  return `Error ${status}`;
}

// /api/health responde 503 CON cuerpo útil cuando la base está caída,
// así que aquí no tratamos 503 como fallo: lo que importa es el JSON.
export async function getHealth(): Promise<Health> {
  const res = await fetch('/api/health');
  const body = await readJson(res);
  if (typeof body === 'object' && body !== null && 'api' in body) {
    return body as Health;
  }
  throw new Error(`La API no respondió (HTTP ${res.status})`);
}

export async function listItems(): Promise<Item[]> {
  const res = await fetch('/api/items');
  const body = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(body, res.status));
  return body as Item[];
}

export async function createItem(title: string): Promise<Item> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(body, res.status));
  return body as Item;
}
