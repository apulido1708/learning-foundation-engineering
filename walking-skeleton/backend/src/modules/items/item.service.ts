import type { Item } from './item.model.js';
import type { ItemRepository } from './item.repository.js';

export const MAX_TITLE_LENGTH = 120;

// Error de dominio: la capa HTTP decide traducirlo a 400; el servicio no sabe de HTTP.
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// El servicio concentra las reglas. Depende de la interfaz ItemRepository,
// no de PgItemRepository, por eso se puede probar sin base de datos.
export class ItemService {
  constructor(private readonly repository: ItemRepository) {}

  list(): Promise<Item[]> {
    return this.repository.findAll();
  }

  // Recibe `unknown` porque los datos vienen de fuera y no hay que confiar en ellos.
  async create(input: unknown): Promise<Item> {
    const rawTitle =
      typeof input === 'object' && input !== null && 'title' in input
        ? (input as { title: unknown }).title
        : undefined;

    if (typeof rawTitle !== 'string' || rawTitle.trim() === '') {
      throw new ValidationError('El título es obligatorio');
    }

    const title = rawTitle.trim();
    if (title.length > MAX_TITLE_LENGTH) {
      throw new ValidationError(`El título no puede superar ${MAX_TITLE_LENGTH} caracteres`);
    }

    return this.repository.create({ title });
  }
}
