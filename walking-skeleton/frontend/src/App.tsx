import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createItem, getHealth, listItems, type Item } from './api';

type LayerStatus = 'checking' | 'up' | 'down';

const STATUS_LABEL: Record<LayerStatus, string> = {
  checking: 'Verificando…',
  up: 'Conectado',
  down: 'Sin conexión',
};

// Cada cuánto se vuelve a consultar /api/health para reflejar caídas sin recargar.
const HEALTH_INTERVAL_MS = 5000;
const MAX_TITLE_LENGTH = 120;

function StatusRow({ name, status }: { name: string; status: LayerStatus }) {
  return (
    <li className="status-row">
      <span className={`dot dot--${status}`} aria-hidden="true" />
      <span className="status-name">{name}</span>
      <span className="status-label">{STATUS_LABEL[status]}</span>
    </li>
  );
}

export default function App() {
  const [apiStatus, setApiStatus] = useState<LayerStatus>('checking');
  const [dbStatus, setDbStatus] = useState<LayerStatus>('checking');

  const [items, setItems] = useState<Item[]>([]);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(true);

  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const health = await getHealth();
      setApiStatus(health.api);
      setDbStatus(health.database);
    } catch {
      // Si la API no responde, tampoco podemos saber nada de la base de datos.
      setApiStatus('down');
      setDbStatus('down');
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      setItems(await listItems());
      setItemsError(null);
    } catch (err) {
      setItemsError((err as Error).message);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
    void loadItems();
    const timer = setInterval(() => void checkHealth(), HEALTH_INTERVAL_MS);
    return () => clearInterval(timer); // evita intervalos duplicados al desmontar
  }, [checkHealth, loadItems]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      // La validación real está en el backend; aquí solo mostramos su mensaje.
      const created = await createItem(title);
      setItems((current) => [created, ...current]);
      setTitle('');
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <header>
        <h1>Walking Skeleton</h1>
        <p className="subtitle">UI → API → Base de datos, de punta a punta.</p>
      </header>

      <section className="card" aria-labelledby="status-title">
        <h2 id="status-title">Estado del sistema</h2>
        <ul className="status-list">
          {/* Si esta página se ve, el frontend está funcionando. */}
          <StatusRow name="Frontend" status="up" />
          <StatusRow name="API" status={apiStatus} />
          <StatusRow name="Base de datos" status={dbStatus} />
        </ul>
      </section>

      <section className="card" aria-labelledby="form-title">
        <h2 id="form-title">Nuevo item</h2>
        <form className="item-form" onSubmit={handleSubmit}>
          <label htmlFor="title" className="visually-hidden">
            Título
          </label>
          <input
            id="title"
            type="text"
            placeholder="Escribe un título…"
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Agregar'}
          </button>
        </form>
        {formError && <p className="error" role="alert">{formError}</p>}
      </section>

      <section className="card" aria-labelledby="items-title">
        <h2 id="items-title">Items</h2>
        {loadingItems && <p className="muted">Cargando…</p>}
        {itemsError && (
          <p className="error" role="alert">
            No se pudieron cargar los items: {itemsError}{' '}
            <button type="button" className="link" onClick={() => void loadItems()}>
              Reintentar
            </button>
          </p>
        )}
        {!loadingItems && !itemsError && items.length === 0 && (
          <p className="muted">Todavía no hay items.</p>
        )}
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id}>
              <span className="item-title">{item.title}</span>
              <time className="muted" dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleString('es-CO')}
              </time>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
