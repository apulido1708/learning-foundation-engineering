import type pg from 'pg';
import type { Item, NewItem } from './item.model.js';

// Patrón Repository: el resto del sistema depende de esta interfaz, no de Postgres.
// Así se puede reemplazar por una implementación en memoria en los tests.
export interface ItemRepository {
  findAll(): Promise<Item[]>;
  create(data: NewItem): Promise<Item>;
}

// Forma de una fila tal como la devuelve Postgres (snake_case).
interface ItemRow {
  id: number;
  title: string;
  created_at: Date;
}

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at.toISOString(),
  };
}

export class PgItemRepository implements ItemRepository {
  constructor(private readonly pool: pg.Pool) {}

  async findAll(): Promise<Item[]> {
    const result = await this.pool.query<ItemRow>(
      'SELECT id, title, created_at FROM items ORDER BY id DESC',
    );
    return result.rows.map(toItem);
  }

  async create(data: NewItem): Promise<Item> {
    // $1 = consulta parametrizada: el driver escapa el valor y evita inyección SQL.
    const result = await this.pool.query<ItemRow>(
      'INSERT INTO items (title) VALUES ($1) RETURNING id, title, created_at',
      [data.title],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('INSERT no devolvió ninguna fila');
    }
    return toItem(row);
  }
}
