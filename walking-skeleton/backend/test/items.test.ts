import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Item, NewItem } from '../src/modules/items/item.model.js';
import type { ItemRepository } from '../src/modules/items/item.repository.js';
import { ItemService } from '../src/modules/items/item.service.js';

// Implementación en memoria de la MISMA interfaz: los tests no necesitan Postgres.
class InMemoryItemRepository implements ItemRepository {
  private items: Item[] = [];
  private nextId = 1;

  async findAll(): Promise<Item[]> {
    return [...this.items].reverse();
  }

  async create(data: NewItem): Promise<Item> {
    const item: Item = { id: this.nextId++, title: data.title, createdAt: new Date().toISOString() };
    this.items.push(item);
    return item;
  }
}

function buildApp(databaseUp = true) {
  const itemService = new ItemService(new InMemoryItemRepository());
  return createApp({ itemService, checkDatabase: async () => databaseUp });
}

describe('GET /api/health', () => {
  it('responde 200 cuando la base de datos está arriba', async () => {
    const res = await request(buildApp(true)).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', api: 'up', database: 'up' });
  });

  it('responde 503 cuando la base de datos está caída', async () => {
    const res = await request(buildApp(false)).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ api: 'up', database: 'down' });
  });
});

describe('/api/items', () => {
  it('crea un item y luego lo lista', async () => {
    const app = buildApp();

    const created = await request(app).post('/api/items').send({ title: '  Mi item  ' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ id: 1, title: 'Mi item' });

    const list = await request(app).get('/api/items');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe('Mi item');
  });

  it('rechaza un título vacío con 400', async () => {
    const res = await request(buildApp()).post('/api/items').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
